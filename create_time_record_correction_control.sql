-- Criar tabela para controlar liberação de correção do ponto eletrônico
CREATE TABLE IF NOT EXISTS rh.time_record_correction_control (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL,
  correction_enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT time_record_correction_control_pkey PRIMARY KEY (id),
  CONSTRAINT time_record_correction_control_company_id_fkey FOREIGN KEY (company_id) REFERENCES core.companies (id),
  CONSTRAINT time_record_correction_control_created_by_fkey FOREIGN KEY (created_by) REFERENCES core.users (id),
  CONSTRAINT time_record_correction_control_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES core.users (id),
  CONSTRAINT time_record_correction_control_unique_company_year_month UNIQUE (company_id, year, month)
) TABLESPACE pg_default;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_time_record_correction_control_company 
ON rh.time_record_correction_control USING btree (company_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_time_record_correction_control_year_month 
ON rh.time_record_correction_control USING btree (year, month) TABLESPACE pg_default;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION rh.update_time_record_correction_control_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_time_record_correction_control_updated_at
  BEFORE UPDATE ON rh.time_record_correction_control
  FOR EACH ROW
  EXECUTE FUNCTION rh.update_time_record_correction_control_updated_at();

-- Trigger de auditoria
CREATE TRIGGER audit_time_record_correction_control
  AFTER INSERT OR DELETE OR UPDATE ON rh.time_record_correction_control
  FOR EACH ROW
  EXECUTE FUNCTION core.audit_trigger_function();

-- RLS Policies
ALTER TABLE rh.time_record_correction_control ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados da empresa
CREATE POLICY "time_record_correction_control_select_policy" ON rh.time_record_correction_control
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id 
      FROM core.user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- Política para permitir inserção/atualização para administradores da empresa
CREATE POLICY "time_record_correction_control_insert_policy" ON rh.time_record_correction_control
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM core.user_companies 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "time_record_correction_control_update_policy" ON rh.time_record_correction_control
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id 
      FROM core.user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- Função para obter status de liberação de correção
CREATE OR REPLACE FUNCTION rh.get_correction_status(company_uuid uuid, target_year integer, target_month integer)
RETURNS boolean AS $$
DECLARE
  correction_enabled boolean;
BEGIN
  SELECT trcc.correction_enabled INTO correction_enabled
  FROM rh.time_record_correction_control trcc
  WHERE trcc.company_id = company_uuid
    AND trcc.year = target_year
    AND trcc.month = target_month;
  
  -- Se não encontrar registro, retorna false (correção bloqueada por padrão)
  RETURN COALESCE(correction_enabled, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para definir status de liberação de correção
CREATE OR REPLACE FUNCTION rh.set_correction_status(
  company_uuid uuid, 
  target_year integer, 
  target_month integer, 
  enabled boolean,
  user_uuid uuid
)
RETURNS void AS $$
BEGIN
  INSERT INTO rh.time_record_correction_control (company_id, year, month, correction_enabled, created_by, updated_by)
  VALUES (company_uuid, target_year, target_month, enabled, user_uuid, user_uuid)
  ON CONFLICT (company_id, year, month)
  DO UPDATE SET 
    correction_enabled = enabled,
    updated_by = user_uuid,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON TABLE rh.time_record_correction_control IS 'Controla a liberação de correção de ponto eletrônico por empresa, ano e mês';
COMMENT ON COLUMN rh.time_record_correction_control.company_id IS 'ID da empresa';
COMMENT ON COLUMN rh.time_record_correction_control.year IS 'Ano de referência';
COMMENT ON COLUMN rh.time_record_correction_control.month IS 'Mês de referência (1-12)';
COMMENT ON COLUMN rh.time_record_correction_control.correction_enabled IS 'Se true, permite correção de ponto no Portal do Funcionário';
COMMENT ON FUNCTION rh.get_correction_status(uuid, integer, integer) IS 'Retorna se a correção de ponto está liberada para a empresa/ano/mês';
COMMENT ON FUNCTION rh.set_correction_status(uuid, integer, integer, boolean, uuid) IS 'Define o status de liberação de correção de ponto';
