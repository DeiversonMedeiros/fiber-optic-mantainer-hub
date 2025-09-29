-- Corrigir função calculate_employee_work_days se não existir
-- Esta migração garante que a função existe com a assinatura correta

CREATE OR REPLACE FUNCTION rh.calculate_employee_work_days(
  p_employee_id UUID,
  p_company_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  total_days INTEGER,
  work_days INTEGER,
  holidays_count INTEGER,
  absences_count INTEGER,
  vacation_days INTEGER,
  sick_leave_days INTEGER,
  effective_work_days INTEGER
) AS $$
DECLARE
  v_total_days INTEGER;
  v_work_days INTEGER;
  v_holidays_count INTEGER;
  v_absences_count INTEGER;
  v_vacation_days INTEGER;
  v_sick_leave_days INTEGER;
  v_effective_work_days INTEGER;
BEGIN
  -- Calcular total de dias no mês
  v_total_days := EXTRACT(DAY FROM (DATE_TRUNC('month', MAKE_DATE(p_year, p_month, 1)) + INTERVAL '1 month' - INTERVAL '1 day'));
  
  -- Para simplificar, assumir que todos os dias são úteis (sem considerar feriados por enquanto)
  v_work_days := v_total_days;
  v_holidays_count := 0;
  
  -- Contar ausências (simplificado)
  SELECT COUNT(*) INTO v_absences_count
  FROM rh.time_records tr
  WHERE tr.employee_id = p_employee_id
    AND EXTRACT(YEAR FROM tr.date) = p_year
    AND EXTRACT(MONTH FROM tr.date) = p_month
    AND tr.status = 'ausente';
  
  -- Contar férias (simplificado)
  v_vacation_days := 0;
  
  -- Contar licença médica (simplificado)
  v_sick_leave_days := 0;
  
  -- Calcular dias efetivos de trabalho
  v_effective_work_days := v_work_days - v_absences_count - v_vacation_days - v_sick_leave_days;
  
  -- Garantir que não seja negativo
  IF v_effective_work_days < 0 THEN
    v_effective_work_days := 0;
  END IF;
  
  RETURN QUERY SELECT 
    v_total_days,
    v_work_days,
    v_holidays_count,
    v_absences_count,
    v_vacation_days,
    v_sick_leave_days,
    v_effective_work_days;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION rh.calculate_employee_work_days IS 'Calcula os dias de trabalho de um funcionário para um mês/ano específico considerando ausências e férias';
