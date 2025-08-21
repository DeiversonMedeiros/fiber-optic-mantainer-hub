-- Migração para criar views materializadas de estatísticas do sistema
-- Data: 2025-01-16
-- Descrição: Views para SLA, relatórios por gestor, status, pendências

-- View para SLA de Validação (tempo entre envio e validação)
CREATE MATERIALIZED VIEW public.sla_validation_stats AS
SELECT 
  DATE_TRUNC('month', r.created_at) as month_year,
  AVG(EXTRACT(EPOCH FROM (a.created_at - r.created_at)) / 3600) as avg_sla_hours,
  MIN(EXTRACT(EPOCH FROM (a.created_at - r.created_at)) / 3600) as min_sla_hours,
  MAX(EXTRACT(EPOCH FROM (a.created_at - r.created_at)) / 3600) as max_sla_hours,
  COUNT(*) as total_validated_reports
FROM public.reports r
JOIN public.activities a ON a.entity_id = r.id 
WHERE a.action = 'validated' 
  AND a.entity_type = 'report'
  AND r.validated_at IS NOT NULL
GROUP BY DATE_TRUNC('month', r.created_at)
ORDER BY month_year;

-- View para Relatórios por Gestor
CREATE MATERIALIZED VIEW public.reports_by_manager_stats AS
SELECT 
  DATE_TRUNC('month', r.created_at) as month_year,
  m.id as manager_id,
  m.name as manager_name,
  COUNT(*) as total_reports,
  COUNT(CASE WHEN r.status = 'validado' THEN 1 END) as validated_reports,
  COUNT(CASE WHEN r.pending_reason IS NOT NULL THEN 1 END) as pending_reports
FROM public.reports r
JOIN public.profiles m ON m.id = r.manager_id
JOIN public.access_profiles ap ON ap.id = m.access_profile_id
WHERE ap.name IN ('Gestor', 'Gestor Preventiva')
  AND m.is_active = true
GROUP BY DATE_TRUNC('month', r.created_at), m.id, m.name
ORDER BY month_year, total_reports DESC;

-- View para Quantidade de Relatórios por Status
CREATE MATERIALIZED VIEW public.reports_by_status_stats AS
SELECT 
  DATE_TRUNC('month', created_at) as month_year,
  status,
  COUNT(*) as total_reports
FROM public.reports
GROUP BY DATE_TRUNC('month', created_at), status
ORDER BY month_year, status;

-- View para Quantidade de Relatórios por Pendência
CREATE MATERIALIZED VIEW public.reports_by_pending_reason_stats AS
SELECT 
  DATE_TRUNC('month', created_at) as month_year,
  COALESCE(pending_reason, 'Sem Pendência') as pending_reason,
  COUNT(*) as total_reports
FROM public.reports
GROUP BY DATE_TRUNC('month', created_at), pending_reason
ORDER BY month_year, total_reports DESC;

-- View para Pendências por Gestor
CREATE MATERIALIZED VIEW public.pending_by_manager_stats AS
SELECT 
  DATE_TRUNC('month', r.created_at) as month_year,
  m.id as manager_id,
  m.name as manager_name,
  r.pending_reason,
  COUNT(*) as total_pending_reports
FROM public.reports r
JOIN public.profiles m ON m.id = r.manager_id
JOIN public.access_profiles ap ON ap.id = m.access_profile_id
WHERE r.pending_reason IS NOT NULL
  AND ap.name IN ('Gestor', 'Gestor Preventiva')
  AND m.is_active = true
GROUP BY DATE_TRUNC('month', r.created_at), m.id, m.name, r.pending_reason
ORDER BY month_year, total_pending_reports DESC;

-- View consolidada para Top 10 Pendências por Gestor
CREATE MATERIALIZED VIEW public.top_pending_managers_stats AS
SELECT 
  DATE_TRUNC('month', r.created_at) as month_year,
  m.id as manager_id,
  m.name as manager_name,
  COUNT(*) as total_pending_reports,
  ARRAY_AGG(DISTINCT r.pending_reason) as pending_reasons
FROM public.reports r
JOIN public.profiles m ON m.id = r.manager_id
JOIN public.access_profiles ap ON ap.id = m.access_profile_id
WHERE r.pending_reason IS NOT NULL
  AND ap.name IN ('Gestor', 'Gestor Preventiva')
  AND m.is_active = true
GROUP BY DATE_TRUNC('month', r.created_at), m.id, m.name
ORDER BY month_year, total_pending_reports DESC;

-- Criar índices para otimização
CREATE INDEX idx_sla_validation_stats_month ON public.sla_validation_stats(month_year);
CREATE INDEX idx_reports_by_manager_stats_month ON public.reports_by_manager_stats(month_year);
CREATE INDEX idx_reports_by_status_stats_month ON public.reports_by_status_stats(month_year);
CREATE INDEX idx_reports_by_pending_reason_stats_month ON public.reports_by_pending_reason_stats(month_year);
CREATE INDEX idx_pending_by_manager_stats_month ON public.pending_by_manager_stats(month_year);
CREATE INDEX idx_top_pending_managers_stats_month ON public.top_pending_managers_stats(month_year);

-- Função para refresh das views de estatísticas
CREATE OR REPLACE FUNCTION public.refresh_statistics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.sla_validation_stats;
  REFRESH MATERIALIZED VIEW public.reports_by_manager_stats;
  REFRESH MATERIALIZED VIEW public.reports_by_status_stats;
  REFRESH MATERIALIZED VIEW public.reports_by_pending_reason_stats;
  REFRESH MATERIALIZED VIEW public.pending_by_manager_stats;
  REFRESH MATERIALIZED VIEW public.top_pending_managers_stats;
END;
$$ LANGUAGE plpgsql;

-- Trigger para refresh automático quando reports ou activities mudam
CREATE OR REPLACE FUNCTION public.trigger_refresh_statistics_views()
RETURNS trigger AS $$
BEGIN
  -- Execute refresh de forma assíncrona
  PERFORM pg_notify('refresh_statistics_views', '');
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas relevantes
CREATE TRIGGER refresh_statistics_views_reports_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reports
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_refresh_statistics_views();

CREATE TRIGGER refresh_statistics_views_activities_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.activities
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_refresh_statistics_views();

-- Executar refresh inicial das views
SELECT public.refresh_statistics_views();

