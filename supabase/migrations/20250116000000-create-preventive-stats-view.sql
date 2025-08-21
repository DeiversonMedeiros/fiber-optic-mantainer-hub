-- Migração para criar view materializada de estatísticas preventivas
-- Data: 2025-01-16
-- Descrição: View para estatísticas de agendamentos e execuções preventivas

-- View para Estatísticas Preventivas
CREATE MATERIALIZED VIEW public.preventive_stats AS
SELECT 
  DATE_TRUNC('month', 
    CASE 
      WHEN ps.scheduled_month IS NOT NULL AND ps.scheduled_year IS NOT NULL 
      THEN make_date(ps.scheduled_year, ps.scheduled_month, 1)
      ELSE ps.created_at
    END
  ) as month_year,
  COUNT(*) as total_schedules,
  COUNT(CASE WHEN r.status = 'concluido' THEN 1 END) as executed_schedules
FROM public.preventive_schedule ps
LEFT JOIN public.risks r ON r.cable_client_site = ps.cable_number 
  AND r.client_site = ps.client_site
  AND r.risk_type = 'preventiva'
GROUP BY DATE_TRUNC('month', 
  CASE 
    WHEN ps.scheduled_month IS NOT NULL AND ps.scheduled_year IS NOT NULL 
    THEN make_date(ps.scheduled_year, ps.scheduled_month, 1)
    ELSE ps.created_at
  END
)
ORDER BY month_year;

-- Criar índice para otimização
CREATE INDEX idx_preventive_stats_month ON public.preventive_stats(month_year);

-- Adicionar refresh da view preventiva_stats na função existente
CREATE OR REPLACE FUNCTION public.refresh_statistics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.sla_validation_stats;
  REFRESH MATERIALIZED VIEW public.reports_by_manager_stats;
  REFRESH MATERIALIZED VIEW public.reports_by_status_stats;
  REFRESH MATERIALIZED VIEW public.reports_by_pending_reason_stats;
  REFRESH MATERIALIZED VIEW public.pending_by_manager_stats;
  REFRESH MATERIALIZED VIEW public.top_pending_managers_stats;
  REFRESH MATERIALIZED VIEW public.preventive_stats;
END;
$$ LANGUAGE plpgsql;

-- Executar refresh inicial da view
SELECT public.refresh_statistics_views();
