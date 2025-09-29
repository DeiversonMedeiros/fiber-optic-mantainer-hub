-- =====================================================
-- CONFIGURAÇÃO ALTERNATIVA PARA SCHEMA RH
-- =====================================================

-- Esta abordagem cria funções RPC que encapsulam o acesso às tabelas do schema 'rh'
-- Isso permite que o PostgREST acesse os dados sem problemas de schema

-- 1. Função para buscar funcionários
CREATE OR REPLACE FUNCTION public.get_employees(
  p_company_id uuid DEFAULT NULL,
  p_status text DEFAULT 'ativo'
)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  matricula text,
  nome text,
  cpf text,
  rg text,
  data_nascimento date,
  data_admissao date,
  data_demissao date,
  status core.status_geral,
  cost_center_id uuid,
  project_id uuid,
  created_at timestamptz,
  position_id uuid,
  work_schedule_id uuid,
  department_id uuid,
  manager_id uuid,
  salario_base numeric(10,2),
  telefone text,
  email text,
  estado_civil text,
  nacionalidade text,
  naturalidade text,
  nome_mae text,
  nome_pai text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.company_id,
    e.matricula,
    e.nome,
    e.cpf,
    e.rg,
    e.data_nascimento,
    e.data_admissao,
    e.data_demissao,
    e.status,
    e.cost_center_id,
    e.project_id,
    e.created_at,
    e.position_id,
    e.work_schedule_id,
    e.department_id,
    e.manager_id,
    e.salario_base,
    e.telefone,
    e.email,
    e.estado_civil,
    e.nacionalidade,
    e.naturalidade,
    e.nome_mae,
    e.nome_pai
  FROM rh.employees e
  WHERE (p_company_id IS NULL OR e.company_id = p_company_id)
    AND (p_status IS NULL OR e.status::text = p_status);
END;
$$;

-- 2. Função para buscar exames periódicos
CREATE OR REPLACE FUNCTION public.get_periodic_exams(
  p_company_id uuid DEFAULT NULL,
  p_employee_id uuid DEFAULT NULL,
  p_status text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  employee_id uuid,
  tipo_exame text,
  data_agendada date,
  data_realizacao date,
  resultado text,
  arquivo_anexo text,
  status core.status_geral,
  created_at timestamptz,
  updated_at timestamptz,
  created_by uuid,
  updated_by uuid,
  medico_responsavel text,
  observacoes text,
  employee jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.id,
    pe.company_id,
    pe.employee_id,
    pe.tipo_exame,
    pe.data_agendada,
    pe.data_realizacao,
    pe.resultado,
    pe.arquivo_anexo,
    pe.status,
    pe.created_at,
    pe.updated_at,
    pe.created_by,
    pe.updated_by,
    pe.medico_responsavel,
    pe.observacoes,
    jsonb_build_object(
      'id', e.id,
      'nome', e.nome,
      'matricula', e.matricula
    ) as employee
  FROM rh.periodic_exams pe
  LEFT JOIN rh.employees e ON e.id = pe.employee_id
  WHERE (p_company_id IS NULL OR pe.company_id = p_company_id)
    AND (p_employee_id IS NULL OR pe.employee_id = p_employee_id)
    AND (p_status IS NULL OR pe.status::text = p_status)
  ORDER BY pe.data_agendada DESC;
END;
$$;

-- 3. Função para criar exame periódico
CREATE OR REPLACE FUNCTION public.create_periodic_exam(
  p_company_id uuid,
  p_employee_id uuid,
  p_tipo_exame text,
  p_data_agendada date,
  p_resultado text DEFAULT NULL,
  p_arquivo_anexo text DEFAULT NULL,
  p_medico_responsavel text DEFAULT NULL,
  p_observacoes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_exam_id uuid;
BEGIN
  INSERT INTO rh.periodic_exams (
    company_id,
    employee_id,
    tipo_exame,
    data_agendada,
    resultado,
    arquivo_anexo,
    status,
    medico_responsavel,
    observacoes,
    created_by
  ) VALUES (
    p_company_id,
    p_employee_id,
    p_tipo_exame,
    p_data_agendada,
    p_resultado,
    p_arquivo_anexo,
    CASE WHEN p_resultado IS NOT NULL THEN 'realizado'::core.status_geral ELSE 'agendado'::core.status_geral END,
    p_medico_responsavel,
    p_observacoes,
    auth.uid()
  ) RETURNING id INTO new_exam_id;
  
  RETURN new_exam_id;
END;
$$;

-- 4. Função para atualizar exame periódico
CREATE OR REPLACE FUNCTION public.update_periodic_exam(
  p_exam_id uuid,
  p_data_agendada date DEFAULT NULL,
  p_data_realizacao date DEFAULT NULL,
  p_resultado text DEFAULT NULL,
  p_arquivo_anexo text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_medico_responsavel text DEFAULT NULL,
  p_observacoes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE rh.periodic_exams 
  SET 
    data_agendada = COALESCE(p_data_agendada, data_agendada),
    data_realizacao = COALESCE(p_data_realizacao, data_realizacao),
    resultado = COALESCE(p_resultado, resultado),
    arquivo_anexo = COALESCE(p_arquivo_anexo, arquivo_anexo),
    status = COALESCE(p_status::core.status_geral, status),
    medico_responsavel = COALESCE(p_medico_responsavel, medico_responsavel),
    observacoes = COALESCE(p_observacoes, observacoes),
    updated_by = auth.uid(),
    updated_at = now()
  WHERE id = p_exam_id;
  
  RETURN FOUND;
END;
$$;

-- 5. Função para deletar exame periódico
CREATE OR REPLACE FUNCTION public.delete_periodic_exam(
  p_exam_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rh.periodic_exams WHERE id = p_exam_id;
  RETURN FOUND;
END;
$$;

-- Configurar permissões
GRANT EXECUTE ON FUNCTION public.get_employees TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_periodic_exams TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_periodic_exam TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_periodic_exam TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_periodic_exam TO authenticated;

-- Testar as funções
SELECT 'Funções RPC criadas com sucesso!' as status;
SELECT 'Teste get_employees:' as teste, count(*) as total FROM public.get_employees();
SELECT 'Teste get_periodic_exams:' as teste, count(*) as total FROM public.get_periodic_exams();
