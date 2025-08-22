-- Migração para otimizar exportação de relatórios
-- Data: 2025-01-20
-- Objetivo: Resolver problemas de timeout na exportação CSV

-- 1. Criar índices para otimizar consultas de exportação
CREATE INDEX IF NOT EXISTS idx_reports_created_at_id 
ON reports(created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_reports_template_id 
ON reports(template_id) WHERE template_id IS NOT NULL;

-- 2. Criar índice GIN para busca em form_data (otimiza consultas JSONB)
CREATE INDEX IF NOT EXISTS idx_reports_form_data_gin 
ON reports USING GIN (form_data);

-- 3. Criar índice para checklist_data
CREATE INDEX IF NOT EXISTS idx_reports_checklist_data_gin 
ON reports USING GIN (checklist_data);

-- 4. Criar view materializada para dados de exportação (atualizada diariamente)
-- Esta view extrai apenas campos essenciais do form_data para evitar timeout
CREATE MATERIALIZED VIEW IF NOT EXISTS reports_export_summary AS
SELECT 
  r.id,
  r.title,
  r.description,
  r.status,
  r.created_at,
  r.updated_at,
  r.numero_servico,
  r.pending_reason,
  r.pending_notes,
  r.assigned_to,
  r.report_number,
  r.parent_report_id,
  r.validated_by,
  r.validated_at,
  r.technician_id,
  r.template_id,
  -- Extrair apenas campos essenciais do form_data para evitar timeout
  jsonb_extract_path_text(r.form_data, 'data_servico') as data_servico,
  jsonb_extract_path_text(r.form_data, 'endereco') as endereco,
  jsonb_extract_path_text(r.form_data, 'bairro') as bairro,
  jsonb_extract_path_text(r.form_data, 'cidade') as cidade,
  jsonb_extract_path_text(r.form_data, 'servico_finalizado') as servico_finalizado,
  jsonb_extract_path_text(r.form_data, 'observacoes') as observacoes,
  jsonb_extract_path_text(r.form_data, 'cliente') as cliente,
  jsonb_extract_path_text(r.form_data, 'tipo_servico') as tipo_servico,
  -- Extrair campos de checklist de forma otimizada
  CASE 
    WHEN r.checklist_data IS NOT NULL AND jsonb_array_length(r.checklist_data) > 0 
    THEN jsonb_array_length(r.checklist_data)::text
    ELSE '0'
  END as checklist_items_count,
  -- Extrair contagem de anexos
  CASE 
    WHEN r.attachments IS NOT NULL AND jsonb_array_length(r.attachments) > 0 
    THEN jsonb_array_length(r.attachments)::text
    ELSE '0'
  END as attachments_count
FROM reports r
WHERE r.template_id != '4b45c601-e5b7-4a33-98f9-1769aad319e9';

-- 5. Criar índices na view materializada
CREATE INDEX IF NOT EXISTS idx_reports_export_summary_created_at 
ON reports_export_summary(created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_reports_export_summary_technician 
ON reports_export_summary(technician_id);

CREATE INDEX IF NOT EXISTS idx_reports_export_summary_status 
ON reports_export_summary(status);

-- 6. Função para atualizar a view materializada
CREATE OR REPLACE FUNCTION refresh_reports_export_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW reports_export_summary;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar função para buscar relatórios otimizada para exportação
CREATE OR REPLACE FUNCTION get_reports_for_export(
  p_start_date DATE,
  p_end_date DATE,
  p_technician_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 500
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  numero_servico TEXT,
  pending_reason TEXT,
  pending_notes TEXT,
  assigned_to TEXT,
  report_number INTEGER,
  parent_report_id UUID,
  validated_by UUID,
  validated_at TIMESTAMPTZ,
  technician_id UUID,
  template_id UUID,
  data_servico TEXT,
  endereco TEXT,
  bairro TEXT,
  cidade TEXT,
  servico_finalizado TEXT,
  observacoes TEXT,
  cliente TEXT,
  tipo_servico TEXT,
  checklist_items_count TEXT,
  attachments_count TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    res.id,
    res.title,
    res.description,
    res.status,
    res.created_at,
    res.updated_at,
    res.numero_servico,
    res.pending_reason,
    res.pending_notes,
    res.assigned_to,
    res.report_number,
    res.parent_report_id,
    res.validated_by,
    res.validated_at,
    res.technician_id,
    res.template_id,
    res.data_servico,
    res.endereco,
    res.bairro,
    res.cidade,
    res.servico_finalizado,
    res.observacoes,
    res.cliente,
    res.tipo_servico,
    res.checklist_items_count,
    res.attachments_count
  FROM reports_export_summary res
  WHERE res.created_at >= p_start_date 
    AND res.created_at <= p_end_date + INTERVAL '1 day'
    AND (p_technician_id IS NULL OR res.technician_id = p_technician_id)
    AND (p_status IS NULL OR res.status = p_status)
  ORDER BY res.created_at DESC, res.id DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar função para buscar dados completos de um relatório específico
CREATE OR REPLACE FUNCTION get_report_complete_data(p_report_id UUID)
RETURNS TABLE(
  id UUID,
  form_data JSONB,
  checklist_data JSONB,
  attachments JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.form_data,
    r.checklist_data,
    r.attachments
  FROM reports r
  WHERE r.id = p_report_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Comentários para documentação
COMMENT ON MATERIALIZED VIEW reports_export_summary IS 
'View materializada para otimizar exportação de relatórios, extraindo campos essenciais do form_data para evitar timeout';

COMMENT ON FUNCTION get_reports_for_export IS 
'Função otimizada para buscar relatórios para exportação, usando view materializada para melhor performance';

COMMENT ON FUNCTION get_report_complete_data IS 
'Função para buscar dados completos de um relatório específico (form_data, checklist_data, attachments)';

-- 10. Atualizar a view materializada pela primeira vez
SELECT refresh_reports_export_summary();

-- 11. Criar trigger para atualizar a view quando relatórios forem modificados
CREATE OR REPLACE FUNCTION update_reports_export_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar a view materializada quando houver mudanças
  -- Nota: Em produção, considere usar um job agendado em vez de trigger para melhor performance
  PERFORM refresh_reports_export_summary();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Aplicar o trigger (opcional - pode ser comentado se preferir atualização manual)
-- CREATE TRIGGER trigger_update_reports_export_summary
--   AFTER INSERT OR UPDATE OR DELETE ON reports
--   FOR EACH STATEMENT
--   EXECUTE FUNCTION update_reports_export_summary();

-- 13. Criar job para atualização automática (executar manualmente se necessário)
-- Para atualizar a view materializada diariamente, execute:
-- SELECT refresh_reports_export_summary();
