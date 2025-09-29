-- =====================================================
-- MELHORIAS PARA O SISTEMA DE EXAMES PERIÓDICOS
-- =====================================================

-- Este arquivo contém as alterações necessárias no banco de dados
-- para suportar as novas funcionalidades do sistema de exames periódicos.

-- =====================================================
-- 1. VERIFICAÇÃO DA ESTRUTURA ATUAL
-- =====================================================

-- A tabela rh.periodic_exams já existe com a seguinte estrutura:
/*
CREATE TABLE rh.periodic_exams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NULL,
  employee_id uuid NULL,
  tipo_exame text NOT NULL,
  data_agendada date NOT NULL,
  data_realizacao date NULL,
  resultado text NULL,
  arquivo_anexo text NULL,
  status core.status_geral NULL DEFAULT 'agendado'::core.status_geral,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT periodic_exams_pkey PRIMARY KEY (id),
  CONSTRAINT periodic_exams_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies (id),
  CONSTRAINT periodic_exams_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES rh.employees (id)
) TABLESPACE pg_default;
*/

-- =====================================================
-- 2. ALTERAÇÕES RECOMENDADAS (OPCIONAIS)
-- =====================================================

-- Adicionar campos para melhor controle e auditoria
ALTER TABLE rh.periodic_exams 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS medico_responsavel text,
ADD COLUMN IF NOT EXISTS observacoes text;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_periodic_exams_employee_id ON rh.periodic_exams(employee_id);
CREATE INDEX IF NOT EXISTS idx_periodic_exams_company_id ON rh.periodic_exams(company_id);
CREATE INDEX IF NOT EXISTS idx_periodic_exams_data_agendada ON rh.periodic_exams(data_agendada);
CREATE INDEX IF NOT EXISTS idx_periodic_exams_status ON rh.periodic_exams(status);
CREATE INDEX IF NOT EXISTS idx_periodic_exams_tipo_exame ON rh.periodic_exams(tipo_exame);

-- =====================================================
-- 3. FUNÇÃO PARA AGENDAMENTO AUTOMÁTICO
-- =====================================================

-- Função para agendar exames periódicos automaticamente
CREATE OR REPLACE FUNCTION rh.schedule_annual_exams(
  p_company_id uuid,
  p_exam_type text DEFAULT 'periodico',
  p_days_before_notification integer DEFAULT 30
)
RETURNS TABLE (
  employee_id uuid,
  employee_name text,
  exam_date date,
  notification_date date,
  created boolean,
  reason text
) 
LANGUAGE plpgsql
AS $$
DECLARE
  emp_record RECORD;
  next_exam_date date;
  notification_date date;
  existing_exam_count integer;
BEGIN
  -- Iterar sobre funcionários ativos da empresa
  FOR emp_record IN 
    SELECT e.id, e.nome, e.data_admissao
    FROM rh.employees e
    WHERE e.company_id = p_company_id
      AND e.status = 'ativo'
      AND e.data_admissao IS NOT NULL
  LOOP
    -- Verificar se já existe exame agendado deste tipo
    SELECT COUNT(*) INTO existing_exam_count
    FROM rh.periodic_exams
    WHERE employee_id = emp_record.id
      AND tipo_exame = p_exam_type
      AND status = 'agendado';
    
    IF existing_exam_count = 0 THEN
      -- Calcular próxima data de exame (1 ano após admissão ou último exame)
      SELECT COALESCE(
        (SELECT pe.data_realizacao + INTERVAL '1 year'
         FROM rh.periodic_exams pe
         WHERE pe.employee_id = emp_record.id
           AND pe.tipo_exame = p_exam_type
           AND pe.status = 'realizado'
         ORDER BY pe.data_realizacao DESC
         LIMIT 1),
        emp_record.data_admissao + INTERVAL '1 year'
      ) INTO next_exam_date;
      
      -- Se a data calculada está no passado, agendar para 30 dias no futuro
      IF next_exam_date < CURRENT_DATE THEN
        next_exam_date := CURRENT_DATE + INTERVAL '30 days';
      END IF;
      
      notification_date := next_exam_date - INTERVAL '1 day' * p_days_before_notification;
      
      -- Criar o exame
      INSERT INTO rh.periodic_exams (
        company_id,
        employee_id,
        tipo_exame,
        data_agendada,
        status
      ) VALUES (
        p_company_id,
        emp_record.id,
        p_exam_type,
        next_exam_date,
        'agendado'
      );
      
      -- Retornar resultado
      employee_id := emp_record.id;
      employee_name := emp_record.nome;
      exam_date := next_exam_date;
      notification_date := notification_date;
      created := true;
      reason := NULL;
      RETURN NEXT;
    ELSE
      -- Exame já existe
      employee_id := emp_record.id;
      employee_name := emp_record.nome;
      exam_date := NULL;
      notification_date := NULL;
      created := false;
      reason := 'Exame já agendado';
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

-- =====================================================
-- 4. FUNÇÃO PARA NOTIFICAÇÕES
-- =====================================================

-- Função para buscar exames que precisam de notificação
CREATE OR REPLACE FUNCTION rh.get_exams_needing_notification(
  p_company_id uuid,
  p_days_before integer DEFAULT 30
)
RETURNS TABLE (
  exam_id uuid,
  employee_id uuid,
  employee_name text,
  exam_type text,
  scheduled_date date,
  days_until_expiry integer,
  is_overdue boolean
)
LANGUAGE plpgsql
AS $$
DECLARE
  cutoff_date date;
BEGIN
  cutoff_date := CURRENT_DATE + INTERVAL '1 day' * p_days_before;
  
  RETURN QUERY
  SELECT 
    pe.id,
    pe.employee_id,
    e.nome,
    pe.tipo_exame,
    pe.data_agendada,
    (pe.data_agendada - CURRENT_DATE)::integer,
    (pe.data_agendada < CURRENT_DATE)
  FROM rh.periodic_exams pe
  JOIN rh.employees e ON e.id = pe.employee_id
  WHERE pe.company_id = p_company_id
    AND pe.status = 'agendado'
    AND pe.data_agendada <= cutoff_date
  ORDER BY pe.data_agendada ASC;
END;
$$;

-- =====================================================
-- 5. TRIGGER PARA ATUALIZAR UPDATED_AT
-- =====================================================

-- Trigger para atualizar automaticamente o campo updated_at
CREATE OR REPLACE FUNCTION rh.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_periodic_exams_updated_at
  BEFORE UPDATE ON rh.periodic_exams
  FOR EACH ROW
  EXECUTE FUNCTION rh.update_updated_at_column();

-- =====================================================
-- 6. VIEW PARA RELATÓRIOS
-- =====================================================

-- View para facilitar relatórios de exames
CREATE OR REPLACE VIEW rh.vw_periodic_exams_report AS
SELECT 
  pe.id,
  pe.company_id,
  c.nome_fantasia as empresa_nome,
  pe.employee_id,
  e.nome as funcionario_nome,
  e.matricula,
  pe.tipo_exame,
  pe.data_agendada,
  pe.data_realizacao,
  pe.resultado,
  pe.arquivo_anexo,
  pe.status,
  pe.medico_responsavel,
  pe.observacoes,
  pe.created_at,
  pe.updated_at,
  CASE 
    WHEN pe.data_agendada < CURRENT_DATE AND pe.status = 'agendado' THEN 'Vencido'
    WHEN pe.data_agendada <= CURRENT_DATE + INTERVAL '30 days' AND pe.status = 'agendado' THEN 'Próximo do Vencimento'
    WHEN pe.status = 'realizado' THEN 'Realizado'
    ELSE 'Agendado'
  END as situacao,
  CASE 
    WHEN pe.data_agendada < CURRENT_DATE AND pe.status = 'agendado' THEN (CURRENT_DATE - pe.data_agendada)::integer
    WHEN pe.data_agendada > CURRENT_DATE AND pe.status = 'agendado' THEN (pe.data_agendada - CURRENT_DATE)::integer
    ELSE 0
  END as dias_para_vencimento
FROM rh.periodic_exams pe
JOIN core.companies c ON c.id = pe.company_id
JOIN rh.employees e ON e.id = pe.employee_id;

-- =====================================================
-- 7. CONFIGURAÇÃO DE STORAGE PARA ARQUIVOS
-- =====================================================

-- Para o upload de arquivos PDF, é necessário configurar um bucket no Supabase Storage:
-- 
-- 1. Acesse o painel do Supabase
-- 2. Vá para Storage
-- 3. Crie um bucket chamado "exam-results"
-- 4. Configure as políticas de acesso:
--
-- Política de SELECT (para visualizar arquivos):
-- CREATE POLICY "Permitir visualização de resultados de exames" ON storage.objects
-- FOR SELECT USING (bucket_id = 'exam-results');
--
-- Política de INSERT (para fazer upload):
-- CREATE POLICY "Permitir upload de resultados de exames" ON storage.objects
-- FOR INSERT WITH CHECK (bucket_id = 'exam-results');
--
-- Política de UPDATE (para atualizar arquivos):
-- CREATE POLICY "Permitir atualização de resultados de exames" ON storage.objects
-- FOR UPDATE USING (bucket_id = 'exam-results');
--
-- Política de DELETE (para remover arquivos):
-- CREATE POLICY "Permitir remoção de resultados de exames" ON storage.objects
-- FOR DELETE USING (bucket_id = 'exam-results');

-- =====================================================
-- 8. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

-- Adicionar comentários nas colunas para documentação
COMMENT ON TABLE rh.periodic_exams IS 'Tabela para controle de exames periódicos dos funcionários';
COMMENT ON COLUMN rh.periodic_exams.tipo_exame IS 'Tipo do exame: admissional, periodico, retorno_ao_trabalho, mudanca_de_funcao, demissional';
COMMENT ON COLUMN rh.periodic_exams.data_agendada IS 'Data agendada para realização do exame';
COMMENT ON COLUMN rh.periodic_exams.data_realizacao IS 'Data em que o exame foi efetivamente realizado';
COMMENT ON COLUMN rh.periodic_exams.resultado IS 'Resultado do exame: apto, inapto, apto com restrições';
COMMENT ON COLUMN rh.periodic_exams.arquivo_anexo IS 'URL do arquivo PDF com o resultado do exame';
COMMENT ON COLUMN rh.periodic_exams.status IS 'Status do exame: agendado, realizado, cancelado, pendente';
COMMENT ON COLUMN rh.periodic_exams.medico_responsavel IS 'Nome do médico responsável pelo exame';
COMMENT ON COLUMN rh.periodic_exams.observacoes IS 'Observações adicionais sobre o exame';

-- =====================================================
-- 9. EXEMPLOS DE USO
-- =====================================================

-- Agendar exames automaticamente para uma empresa:
-- SELECT * FROM rh.schedule_annual_exams('uuid-da-empresa');

-- Buscar exames que precisam de notificação:
-- SELECT * FROM rh.get_exams_needing_notification('uuid-da-empresa', 30);

-- Relatório de exames:
-- SELECT * FROM rh.vw_periodic_exams_report WHERE company_id = 'uuid-da-empresa';

-- Buscar exames vencidos:
-- SELECT * FROM rh.vw_periodic_exams_report WHERE situacao = 'Vencido';

-- Buscar exames próximos do vencimento:
-- SELECT * FROM rh.vw_periodic_exams_report WHERE situacao = 'Próximo do Vencimento';
