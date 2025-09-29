-- ===== FUNÇÕES RPC PARA CÁLCULO DE DESCONTOS POR AUSÊNCIA =====

-- Função para buscar dias de ausência de um funcionário em um período
CREATE OR REPLACE FUNCTION rh.get_employee_absence_days(
  p_employee_id UUID,
  p_company_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  absence_date DATE,
  absence_type TEXT,
  description TEXT,
  is_justified BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH work_days AS (
    -- Gerar todos os dias úteis do período (excluindo fins de semana)
    SELECT gs::date AS work_day
    FROM generate_series(
      p_start_date::timestamp,
      p_end_date::timestamp,
      '1 day'::interval
    ) AS gs
    WHERE EXTRACT(dow FROM gs) NOT IN (0, 6) -- Excluir domingo (0) e sábado (6)
  ),
  recorded_days AS (
    -- Dias com registro de ponto
    SELECT DISTINCT tr.data
    FROM rh.time_records tr
    WHERE tr.employee_id = p_employee_id
      AND tr.company_id = p_company_id
      AND tr.data >= p_start_date
      AND tr.data <= p_end_date
  ),
  medical_certificate_days AS (
    -- Dias com atestado médico aprovado
    SELECT DISTINCT generate_series(
      GREATEST(mc.data_inicio, p_start_date),
      LEAST(mc.data_fim, p_end_date),
      '1 day'::interval
    )::date as absence_date
    FROM rh.medical_certificates mc
    WHERE mc.employee_id = p_employee_id
      AND mc.company_id = p_company_id
      AND mc.status = 'aprovado'
      AND mc.data_inicio <= p_end_date
      AND mc.data_fim >= p_start_date
  ),
  vacation_days AS (
    -- Dias de férias aprovadas
    SELECT DISTINCT generate_series(
      GREATEST(v.data_inicio, p_start_date),
      LEAST(v.data_fim, p_end_date),
      '1 day'::interval
    )::date as absence_date
    FROM rh.vacations v
    WHERE v.employee_id = p_employee_id
      AND v.company_id = p_company_id
      AND v.status = 'aprovado'
      AND v.data_inicio <= p_end_date
      AND v.data_fim >= p_start_date
  )
  SELECT 
    wd.work_day as absence_date,
    'no_time_record'::TEXT as absence_type,
    'Sem registro de ponto'::TEXT as description,
    false as is_justified
  FROM work_days wd
  LEFT JOIN recorded_days rd ON wd.work_day = rd.data
  WHERE rd.data IS NULL
  
  UNION ALL
  
  SELECT 
    mcd.absence_date,
    'medical_certificate'::TEXT as absence_type,
    'Atestado médico'::TEXT as description,
    true as is_justified
  FROM medical_certificate_days mcd
  
  UNION ALL
  
  SELECT 
    vd.absence_date,
    'vacation'::TEXT as absence_type,
    'Férias'::TEXT as description,
    true as is_justified
  FROM vacation_days vd
  
  ORDER BY absence_date;
END;
$$;

-- Função para calcular desconto por ausência para um equipamento
CREATE OR REPLACE FUNCTION rh.calculate_equipment_absence_discount(
  p_equipment_rental_id UUID,
  p_company_id UUID,
  p_period TEXT -- Formato: YYYY-MM
)
RETURNS TABLE (
  equipment_rental_id UUID,
  employee_id UUID,
  period TEXT,
  monthly_value NUMERIC,
  daily_value NUMERIC,
  total_absence_days INTEGER,
  total_discount NUMERIC,
  final_value NUMERIC,
  absence_details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_equipment_data RECORD;
  v_absence_days INTEGER;
  v_daily_value NUMERIC;
  v_total_discount NUMERIC;
  v_absence_details JSONB;
BEGIN
  -- Converter período para datas
  v_start_date := (p_period || '-01')::DATE;
  v_end_date := (p_period || '-01')::DATE + INTERVAL '1 month' - INTERVAL '1 day';
  
  -- Buscar dados do equipamento
  SELECT 
    er.id,
    er.employee_id,
    er.monthly_value
  INTO v_equipment_data
  FROM rh.equipment_rentals er
  WHERE er.id = p_equipment_rental_id
    AND er.company_id = p_company_id
    AND er.status = 'active';
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Calcular valor diário (valor mensal / 30 dias)
  v_daily_value := v_equipment_data.monthly_value / 30;
  
  -- Buscar dias de ausência
  SELECT 
    COUNT(*)::INTEGER,
    COALESCE(
      json_agg(
        json_build_object(
          'date', absence_date,
          'type', absence_type,
          'description', description,
          'is_justified', is_justified
        )
      ) FILTER (WHERE absence_date IS NOT NULL),
      '[]'::json
    )
  INTO v_absence_days, v_absence_details
  FROM rh.get_employee_absence_days(
    v_equipment_data.employee_id,
    p_company_id,
    v_start_date,
    v_end_date
  );
  
  -- Calcular desconto total
  v_total_discount := v_absence_days * v_daily_value;
  
  -- Retornar resultado
  RETURN QUERY
  SELECT 
    v_equipment_data.id,
    v_equipment_data.employee_id,
    p_period,
    v_equipment_data.monthly_value,
    v_daily_value,
    v_absence_days,
    v_total_discount,
    v_equipment_data.monthly_value - v_total_discount,
    v_absence_details;
END;
$$;

-- Função para calcular descontos por ausência para todos os equipamentos de um período
CREATE OR REPLACE FUNCTION rh.calculate_all_equipment_absence_discounts(
  p_company_id UUID,
  p_period TEXT -- Formato: YYYY-MM
)
RETURNS TABLE (
  equipment_rental_id UUID,
  employee_id UUID,
  employee_name TEXT,
  equipment_name TEXT,
  equipment_type TEXT,
  period TEXT,
  monthly_value NUMERIC,
  daily_value NUMERIC,
  total_absence_days INTEGER,
  total_discount NUMERIC,
  final_value NUMERIC,
  absence_details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_equipment RECORD;
BEGIN
  -- Converter período para datas
  v_start_date := (p_period || '-01')::DATE;
  v_end_date := (p_period || '-01')::DATE + INTERVAL '1 month' - INTERVAL '1 day';
  
  -- Para cada equipamento ativo, calcular desconto
  FOR v_equipment IN
    SELECT 
      er.id,
      er.employee_id,
      e.nome as employee_name,
      (er.equipment_name)::text as equipment_name,
      (er.equipment_type)::text as equipment_type,
      er.monthly_value
    FROM rh.equipment_rentals er
    JOIN rh.employees e ON er.employee_id = e.id
    WHERE er.company_id = p_company_id
      AND er.status = 'active'
  LOOP
    -- Calcular desconto para este equipamento
    RETURN QUERY
    SELECT 
      cad.equipment_rental_id,
      cad.employee_id,
      v_equipment.employee_name,
      v_equipment.equipment_name,
      v_equipment.equipment_type,
      cad.period,
      cad.monthly_value,
      cad.daily_value,
      cad.total_absence_days,
      cad.total_discount,
      cad.final_value,
      cad.absence_details
    FROM rh.calculate_equipment_absence_discount(
      v_equipment.id,
      p_company_id,
      p_period
    ) cad;
  END LOOP;
END;
$$;

-- Função para gerar relatório de descontos por ausência
CREATE OR REPLACE FUNCTION rh.generate_absence_discount_report(
  p_company_id UUID,
  p_period TEXT -- Formato: YYYY-MM
)
RETURNS TABLE (
  period TEXT,
  total_equipments INTEGER,
  total_original_value NUMERIC,
  total_discount NUMERIC,
  total_final_value NUMERIC,
  average_discount_per_equipment NUMERIC,
  equipment_with_discounts INTEGER,
  summary_by_equipment_type JSONB,
  summary_by_absence_type JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_equipments INTEGER;
  v_total_original_value NUMERIC;
  v_total_discount NUMERIC;
  v_total_final_value NUMERIC;
  v_equipment_with_discounts INTEGER;
  v_summary_by_type JSONB;
  v_summary_by_absence JSONB;
BEGIN
  -- Calcular totais
  SELECT 
    COUNT(*)::INTEGER,
    COALESCE(SUM(monthly_value), 0),
    COALESCE(SUM(total_discount), 0),
    COALESCE(SUM(final_value), 0),
    COUNT(*) FILTER (WHERE total_discount > 0)::INTEGER
  INTO 
    v_total_equipments,
    v_total_original_value,
    v_total_discount,
    v_total_final_value,
    v_equipment_with_discounts
  FROM rh.calculate_all_equipment_absence_discounts(p_company_id, p_period);
  
  -- Resumo por tipo de equipamento
  SELECT json_object_agg(
    equipment_type,
    json_build_object(
      'count', count,
      'total_original_value', total_original_value,
      'total_discount', total_discount,
      'total_final_value', total_final_value
    )
  )
  INTO v_summary_by_type
  FROM (
    SELECT 
      equipment_type,
      COUNT(*) as count,
      SUM(monthly_value) as total_original_value,
      SUM(total_discount) as total_discount,
      SUM(final_value) as total_final_value
    FROM rh.calculate_all_equipment_absence_discounts(p_company_id, p_period)
    GROUP BY equipment_type
  ) t;
  
  -- Resumo por tipo de ausência
  SELECT json_object_agg(
    absence_type,
    json_build_object(
      'count', count,
      'total_days', total_days
    )
  )
  INTO v_summary_by_absence
  FROM (
    SELECT 
      (absence_details->>'type') as absence_type,
      COUNT(*) as count,
      SUM((absence_details->>'is_justified')::boolean::int) as total_days
    FROM rh.calculate_all_equipment_absence_discounts(p_company_id, p_period),
         jsonb_array_elements(absence_details) as absence_details
    GROUP BY (absence_details->>'type')
  ) t;
  
  -- Retornar relatório
  RETURN QUERY
  SELECT 
    p_period,
    v_total_equipments,
    v_total_original_value,
    v_total_discount,
    v_total_final_value,
    CASE 
      WHEN v_total_equipments > 0 THEN v_total_discount / v_total_equipments
      ELSE 0
    END,
    v_equipment_with_discounts,
    COALESCE(v_summary_by_type, '{}'::jsonb),
    COALESCE(v_summary_by_absence, '{}'::jsonb);
END;
$$;

-- Conceder permissões para as funções
GRANT EXECUTE ON FUNCTION rh.get_employee_absence_days(UUID, UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION rh.calculate_equipment_absence_discount(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rh.calculate_all_equipment_absence_discounts(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rh.generate_absence_discount_report(UUID, TEXT) TO authenticated;

-- Comentários das funções
COMMENT ON FUNCTION rh.get_employee_absence_days(UUID, UUID, DATE, DATE) IS 
'Busca todos os dias de ausência de um funcionário em um período específico, incluindo dias sem registro de ponto, atestados médicos e férias';

COMMENT ON FUNCTION rh.calculate_equipment_absence_discount(UUID, UUID, TEXT) IS 
'Calcula o desconto por ausência para um equipamento específico em um período, retornando valor original, desconto e valor final';

COMMENT ON FUNCTION rh.calculate_all_equipment_absence_discounts(UUID, TEXT) IS 
'Calcula descontos por ausência para todos os equipamentos ativos de uma empresa em um período';

COMMENT ON FUNCTION rh.generate_absence_discount_report(UUID, TEXT) IS 
'Gera relatório completo de descontos por ausência com resumos por tipo de equipamento e ausência';
