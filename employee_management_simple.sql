-- =====================================================
-- SCRIPT SIMPLIFICADO DE EXPANSÃO DO CADASTRO DE FUNCIONÁRIOS
-- Sistema: Fiber Optic Maintainer Hub - RH Module
-- Data: 2024
-- Descrição: Expansão das informações de cadastro de funcionários
-- =====================================================

-- 1. CRIAR TABELA DE DOCUMENTOS PESSOAIS DOS FUNCIONÁRIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS rh.employee_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  company_id uuid NOT NULL,
  
  -- Documentos pessoais
  carteira_trabalho_numero text NULL,
  carteira_trabalho_serie text NULL,
  carteira_trabalho_uf text NULL,
  carteira_trabalho_data_emissao date NULL,
  
  titulo_eleitoral_numero text NULL,
  titulo_eleitoral_zona text NULL,
  titulo_eleitoral_secao text NULL,
  titulo_eleitoral_uf text NULL,
  
  carteira_reservista_numero text NULL,
  carteira_reservista_serie text NULL,
  carteira_reservista_categoria text NULL,
  
  carteira_motorista_numero text NULL,
  carteira_motorista_categoria text NULL,
  carteira_motorista_data_vencimento date NULL,
  
  cartao_pis_numero text NULL,
  cartao_pis_data_emissao date NULL,
  
  -- Campos de auditoria
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL,
  
  CONSTRAINT employee_documents_pkey PRIMARY KEY (id),
  CONSTRAINT employee_documents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES rh.employees (id) ON DELETE CASCADE,
  CONSTRAINT employee_documents_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies (id) ON DELETE CASCADE,
  CONSTRAINT employee_documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES core.users (id),
  CONSTRAINT employee_documents_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES core.users (id)
) TABLESPACE pg_default;

-- Índices para employee_documents
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee ON rh.employee_documents USING btree (employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_company ON rh.employee_documents USING btree (company_id);

-- 2. CRIAR TABELA DE ENDEREÇOS DOS FUNCIONÁRIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS rh.employee_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  company_id uuid NOT NULL,
  
  -- Endereço principal
  cep text NULL,
  logradouro text NULL,
  numero text NULL,
  complemento text NULL,
  bairro text NULL,
  cidade text NULL,
  uf text NULL,
  pais text NULL DEFAULT 'Brasil',
  
  -- Tipo de endereço (residencial, comercial, etc.)
  tipo_endereco text NULL DEFAULT 'residencial',
  
  -- Campos de auditoria
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL,
  
  CONSTRAINT employee_addresses_pkey PRIMARY KEY (id),
  CONSTRAINT employee_addresses_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES rh.employees (id) ON DELETE CASCADE,
  CONSTRAINT employee_addresses_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies (id) ON DELETE CASCADE,
  CONSTRAINT employee_addresses_created_by_fkey FOREIGN KEY (created_by) REFERENCES core.users (id),
  CONSTRAINT employee_addresses_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES core.users (id)
) TABLESPACE pg_default;

-- Índices para employee_addresses
CREATE INDEX IF NOT EXISTS idx_employee_addresses_employee ON rh.employee_addresses USING btree (employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_addresses_company ON rh.employee_addresses USING btree (company_id);

-- 3. CRIAR TABELA DE INFORMAÇÕES DO CÔNJUGE
-- =====================================================
CREATE TABLE IF NOT EXISTS rh.employee_spouses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  company_id uuid NOT NULL,
  
  -- Informações do cônjuge
  nome text NULL,
  cpf text NULL,
  rg text NULL,
  data_nascimento date NULL,
  
  -- Informações de casamento/união estável
  certidao_casamento_numero text NULL,
  certidao_casamento_data date NULL,
  certidao_casamento_cartorio text NULL,
  certidao_casamento_uf text NULL,
  
  uniao_estavel_data date NULL,
  uniao_estavel_cartorio text NULL,
  uniao_estavel_uf text NULL,
  
  -- Campos de auditoria
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL,
  
  CONSTRAINT employee_spouses_pkey PRIMARY KEY (id),
  CONSTRAINT employee_spouses_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES rh.employees (id) ON DELETE CASCADE,
  CONSTRAINT employee_spouses_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies (id) ON DELETE CASCADE,
  CONSTRAINT employee_spouses_created_by_fkey FOREIGN KEY (created_by) REFERENCES core.users (id),
  CONSTRAINT employee_spouses_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES core.users (id)
) TABLESPACE pg_default;

-- Índices para employee_spouses
CREATE INDEX IF NOT EXISTS idx_employee_spouses_employee ON rh.employee_spouses USING btree (employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_spouses_company ON rh.employee_spouses USING btree (company_id);

-- 4. CRIAR TABELA DE DADOS BANCÁRIOS DOS FUNCIONÁRIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS rh.employee_bank_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  company_id uuid NOT NULL,
  
  -- Dados bancários
  banco_codigo text NULL,
  banco_nome text NULL,
  agencia_numero text NULL,
  agencia_digito text NULL,
  conta_numero text NULL,
  conta_digito text NULL,
  tipo_conta text NULL, -- poupança, corrente, etc.
  
  -- Informações adicionais
  titular_nome text NULL,
  titular_cpf text NULL,
  conta_principal boolean NULL DEFAULT true,
  
  -- Campos de auditoria
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL,
  
  CONSTRAINT employee_bank_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT employee_bank_accounts_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES rh.employees (id) ON DELETE CASCADE,
  CONSTRAINT employee_bank_accounts_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies (id) ON DELETE CASCADE,
  CONSTRAINT employee_bank_accounts_created_by_fkey FOREIGN KEY (created_by) REFERENCES core.users (id),
  CONSTRAINT employee_bank_accounts_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES core.users (id)
) TABLESPACE pg_default;

-- Índices para employee_bank_accounts
CREATE INDEX IF NOT EXISTS idx_employee_bank_accounts_employee ON rh.employee_bank_accounts USING btree (employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_bank_accounts_company ON rh.employee_bank_accounts USING btree (company_id);

-- 5. CRIAR TABELA DE INFORMAÇÕES DE ESCOLARIDADE
-- =====================================================
CREATE TABLE IF NOT EXISTS rh.employee_education (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  company_id uuid NOT NULL,
  
  -- Informações de escolaridade
  nivel_escolaridade text NULL, -- fundamental, medio, superior, pos_graduacao, mestrado, doutorado
  curso text NULL,
  instituicao text NULL,
  ano_conclusao integer NULL,
  status_curso text NULL, -- concluido, cursando, trancado
  
  -- Campos de auditoria
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL,
  
  CONSTRAINT employee_education_pkey PRIMARY KEY (id),
  CONSTRAINT employee_education_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES rh.employees (id) ON DELETE CASCADE,
  CONSTRAINT employee_education_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies (id) ON DELETE CASCADE,
  CONSTRAINT employee_education_created_by_fkey FOREIGN KEY (created_by) REFERENCES core.users (id),
  CONSTRAINT employee_education_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES core.users (id)
) TABLESPACE pg_default;

-- Índices para employee_education
CREATE INDEX IF NOT EXISTS idx_employee_education_employee ON rh.employee_education USING btree (employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_education_company ON rh.employee_education USING btree (company_id);

-- 6. EXPANDIR TABELA EMPLOYEES COM CAMPOS ADICIONAIS
-- =====================================================
ALTER TABLE rh.employees 
ADD COLUMN IF NOT EXISTS position_id uuid NULL,
ADD COLUMN IF NOT EXISTS work_schedule_id uuid NULL,
ADD COLUMN IF NOT EXISTS department_id uuid NULL,
ADD COLUMN IF NOT EXISTS manager_id uuid NULL,
ADD COLUMN IF NOT EXISTS salario_base numeric(10,2) NULL,
ADD COLUMN IF NOT EXISTS nivel_escolaridade text NULL,
ADD COLUMN IF NOT EXISTS telefone text NULL,
ADD COLUMN IF NOT EXISTS email text NULL,
ADD COLUMN IF NOT EXISTS estado_civil text NULL,
ADD COLUMN IF NOT EXISTS nacionalidade text NULL DEFAULT 'Brasileira',
ADD COLUMN IF NOT EXISTS naturalidade text NULL,
ADD COLUMN IF NOT EXISTS nome_mae text NULL,
ADD COLUMN IF NOT EXISTS nome_pai text NULL;

-- Adicionar foreign keys para os novos campos
DO $$
BEGIN
  -- Adicionar constraint para position_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'employees_position_id_fkey' 
    AND table_name = 'employees' 
    AND table_schema = 'rh'
  ) THEN
    ALTER TABLE rh.employees 
    ADD CONSTRAINT employees_position_id_fkey FOREIGN KEY (position_id) REFERENCES rh.positions (id);
  END IF;

  -- Adicionar constraint para work_schedule_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'employees_work_schedule_id_fkey' 
    AND table_name = 'employees' 
    AND table_schema = 'rh'
  ) THEN
    ALTER TABLE rh.employees 
    ADD CONSTRAINT employees_work_schedule_id_fkey FOREIGN KEY (work_schedule_id) REFERENCES rh.work_schedules (id);
  END IF;

  -- Adicionar constraint para department_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'employees_department_id_fkey' 
    AND table_name = 'employees' 
    AND table_schema = 'rh'
  ) THEN
    ALTER TABLE rh.employees 
    ADD CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES core.departments (id);
  END IF;

  -- Adicionar constraint para manager_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'employees_manager_id_fkey' 
    AND table_name = 'employees' 
    AND table_schema = 'rh'
  ) THEN
    ALTER TABLE rh.employees 
    ADD CONSTRAINT employees_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES rh.employees (id);
  END IF;
END $$;

-- 7. HABILITAR RLS (ROW LEVEL SECURITY) PARA AS NOVAS TABELAS
-- =====================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE rh.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.employee_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.employee_spouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.employee_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.employee_education ENABLE ROW LEVEL SECURITY;

-- 8. CRIAR TRIGGERS DE AUDITORIA PARA AS NOVAS TABELAS
-- =====================================================

-- Trigger para employee_documents
CREATE TRIGGER audit_employee_documents
  AFTER INSERT OR DELETE OR UPDATE ON rh.employee_documents
  FOR EACH ROW
  EXECUTE FUNCTION core.audit_trigger_function();

-- Trigger para employee_addresses
CREATE TRIGGER audit_employee_addresses
  AFTER INSERT OR DELETE OR UPDATE ON rh.employee_addresses
  FOR EACH ROW
  EXECUTE FUNCTION core.audit_trigger_function();

-- Trigger para employee_spouses
CREATE TRIGGER audit_employee_spouses
  AFTER INSERT OR DELETE OR UPDATE ON rh.employee_spouses
  FOR EACH ROW
  EXECUTE FUNCTION core.audit_trigger_function();

-- Trigger para employee_bank_accounts
CREATE TRIGGER audit_employee_bank_accounts
  AFTER INSERT OR DELETE OR UPDATE ON rh.employee_bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION core.audit_trigger_function();

-- Trigger para employee_education
CREATE TRIGGER audit_employee_education
  AFTER INSERT OR DELETE OR UPDATE ON rh.employee_education
  FOR EACH ROW
  EXECUTE FUNCTION core.audit_trigger_function();

-- 9. CRIAR VIEWS PARA FACILITAR CONSULTAS
-- =====================================================

-- View completa do funcionário com todas as informações
CREATE OR REPLACE VIEW rh.employee_complete_view AS
SELECT 
  e.*,
  p.nome as cargo_nome,
  p.descricao as cargo_descricao,
  ws.nome as escala_trabalho,
  ws.hora_entrada,
  ws.hora_saida,
  ws.carga_horaria_semanal,
  d.nome as departamento_nome,
  d.codigo as departamento_codigo,
  cc.nome as centro_custo_nome,
  cc.codigo as centro_custo_codigo,
  m.nome as gestor_nome,
  ed.cep,
  ed.logradouro,
  ed.numero as endereco_numero,
  ed.complemento,
  ed.bairro,
  ed.cidade,
  ed.uf as endereco_uf,
  esp.nome as conjuge_nome,
  esp.cpf as conjuge_cpf,
  esp.rg as conjuge_rg,
  edu.nivel_escolaridade,
  edu.curso,
  edu.instituicao,
  edu.ano_conclusao,
  eb.banco_nome,
  eb.agencia_numero,
  eb.conta_numero,
  eb.tipo_conta
FROM rh.employees e
LEFT JOIN rh.positions p ON e.position_id = p.id
LEFT JOIN rh.work_schedules ws ON e.work_schedule_id = ws.id
LEFT JOIN core.departments d ON e.department_id = d.id
LEFT JOIN core.cost_centers cc ON e.cost_center_id = cc.id
LEFT JOIN rh.employees m ON e.manager_id = m.id
LEFT JOIN rh.employee_addresses ed ON e.id = ed.employee_id AND ed.tipo_endereco = 'residencial'
LEFT JOIN rh.employee_spouses esp ON e.id = esp.employee_id
LEFT JOIN rh.employee_education edu ON e.id = edu.employee_id
LEFT JOIN rh.employee_bank_accounts eb ON e.id = eb.employee_id AND eb.conta_principal = true;

-- Comentário da view
COMMENT ON VIEW rh.employee_complete_view IS 'View completa com todas as informações do funcionário';

-- 10. CRIAR FUNÇÕES RPC PARA OPERAÇÕES COMUNS
-- =====================================================

-- Função para obter funcionário completo por ID
CREATE OR REPLACE FUNCTION rh.get_employee_complete(employee_uuid uuid)
RETURNS TABLE (
  employee_data jsonb,
  documents jsonb,
  address jsonb,
  spouse jsonb,
  bank_accounts jsonb,
  education jsonb,
  dependents jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_jsonb(e.*) as employee_data,
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(ed.*)) 
       FROM rh.employee_documents ed 
       WHERE ed.employee_id = employee_uuid), 
      '[]'::jsonb
    ) as documents,
    COALESCE(
      (SELECT to_jsonb(ea.*) 
       FROM rh.employee_addresses ea 
       WHERE ea.employee_id = employee_uuid 
       AND ea.tipo_endereco = 'residencial' 
       LIMIT 1), 
      '{}'::jsonb
    ) as address,
    COALESCE(
      (SELECT to_jsonb(es.*) 
       FROM rh.employee_spouses es 
       WHERE es.employee_id = employee_uuid 
       LIMIT 1), 
      '{}'::jsonb
    ) as spouse,
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(eba.*)) 
       FROM rh.employee_bank_accounts eba 
       WHERE eba.employee_id = employee_uuid), 
      '[]'::jsonb
    ) as bank_accounts,
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(edu.*)) 
       FROM rh.employee_education edu 
       WHERE edu.employee_id = employee_uuid), 
      '[]'::jsonb
    ) as education,
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(edep.*)) 
       FROM rh.employee_dependents edep 
       WHERE edep.employee_id = employee_uuid 
       AND edep.is_active = true), 
      '[]'::jsonb
    ) as dependents;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário da função
COMMENT ON FUNCTION rh.get_employee_complete(uuid) IS 'Retorna todas as informações completas de um funcionário';

-- 11. CRIAR ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================

-- Índices compostos para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_employees_company_status ON rh.employees (company_id, status);
CREATE INDEX IF NOT EXISTS idx_employees_company_position ON rh.employees (company_id, position_id);
CREATE INDEX IF NOT EXISTS idx_employees_company_department ON rh.employees (company_id, department_id);

-- Índices para campos de busca
CREATE INDEX IF NOT EXISTS idx_employees_nome_gin ON rh.employees USING gin (to_tsvector('portuguese', nome));
CREATE INDEX IF NOT EXISTS idx_employees_cpf ON rh.employees (cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employees_matricula ON rh.employees (matricula) WHERE matricula IS NOT NULL;

-- 12. COMENTÁRIOS DAS TABELAS E CAMPOS
-- =====================================================

-- Comentários para employee_documents
COMMENT ON TABLE rh.employee_documents IS 'Documentos pessoais dos funcionários (CTPS, título eleitoral, etc.)';
COMMENT ON COLUMN rh.employee_documents.carteira_trabalho_numero IS 'Número da carteira de trabalho';
COMMENT ON COLUMN rh.employee_documents.titulo_eleitoral_numero IS 'Número do título eleitoral';
COMMENT ON COLUMN rh.employee_documents.carteira_reservista_numero IS 'Número da carteira de reservista';
COMMENT ON COLUMN rh.employee_documents.carteira_motorista_numero IS 'Número da carteira de motorista';
COMMENT ON COLUMN rh.employee_documents.cartao_pis_numero IS 'Número do cartão PIS';

-- Comentários para employee_addresses
COMMENT ON TABLE rh.employee_addresses IS 'Endereços dos funcionários';
COMMENT ON COLUMN rh.employee_addresses.cep IS 'CEP do endereço';
COMMENT ON COLUMN rh.employee_addresses.logradouro IS 'Logradouro (rua, avenida, etc.)';
COMMENT ON COLUMN rh.employee_addresses.numero IS 'Número do endereço';
COMMENT ON COLUMN rh.employee_addresses.complemento IS 'Complemento do endereço';
COMMENT ON COLUMN rh.employee_addresses.bairro IS 'Bairro';
COMMENT ON COLUMN rh.employee_addresses.cidade IS 'Cidade';
COMMENT ON COLUMN rh.employee_addresses.uf IS 'Unidade Federativa (estado)';

-- Comentários para employee_spouses
COMMENT ON TABLE rh.employee_spouses IS 'Informações do cônjuge dos funcionários';
COMMENT ON COLUMN rh.employee_spouses.nome IS 'Nome do cônjuge';
COMMENT ON COLUMN rh.employee_spouses.cpf IS 'CPF do cônjuge';
COMMENT ON COLUMN rh.employee_spouses.rg IS 'RG do cônjuge';
COMMENT ON COLUMN rh.employee_spouses.certidao_casamento_numero IS 'Número da certidão de casamento';
COMMENT ON COLUMN rh.employee_spouses.uniao_estavel_data IS 'Data da união estável';

-- Comentários para employee_bank_accounts
COMMENT ON TABLE rh.employee_bank_accounts IS 'Dados bancários dos funcionários';
COMMENT ON COLUMN rh.employee_bank_accounts.banco_codigo IS 'Código do banco';
COMMENT ON COLUMN rh.employee_bank_accounts.banco_nome IS 'Nome do banco';
COMMENT ON COLUMN rh.employee_bank_accounts.agencia_numero IS 'Número da agência';
COMMENT ON COLUMN rh.employee_bank_accounts.conta_numero IS 'Número da conta';
COMMENT ON COLUMN rh.employee_bank_accounts.tipo_conta IS 'Tipo da conta (corrente, poupança, etc.)';

-- Comentários para employee_education
COMMENT ON TABLE rh.employee_education IS 'Informações de escolaridade dos funcionários';
COMMENT ON COLUMN rh.employee_education.nivel_escolaridade IS 'Nível de escolaridade';
COMMENT ON COLUMN rh.employee_education.curso IS 'Nome do curso';
COMMENT ON COLUMN rh.employee_education.instituicao IS 'Nome da instituição de ensino';
COMMENT ON COLUMN rh.employee_education.ano_conclusao IS 'Ano de conclusão do curso';

-- =====================================================
-- FIM DO SCRIPT DE EXPANSÃO DO CADASTRO DE FUNCIONÁRIOS
-- =====================================================

-- RESUMO DAS ALTERAÇÕES:
-- 1. ✅ Tabela de documentos pessoais (CTPS, título eleitoral, etc.)
-- 2. ✅ Tabela de endereços dos funcionários
-- 3. ✅ Tabela de informações do cônjuge
-- 4. ✅ Tabela de dados bancários
-- 5. ✅ Tabela de informações de escolaridade
-- 6. ✅ Expansão da tabela employees com campos adicionais
-- 7. ✅ Triggers de auditoria para todas as tabelas
-- 8. ✅ Views para facilitar consultas
-- 9. ✅ Funções RPC para operações comuns
-- 10. ✅ Índices para performance
-- 11. ✅ Comentários e documentação




