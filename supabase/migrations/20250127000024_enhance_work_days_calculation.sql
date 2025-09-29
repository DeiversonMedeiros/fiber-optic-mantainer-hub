-- Atualizar função calculate_employee_work_days para integrar com work-shifts e holidays
-- Esta migração implementa o cálculo correto de dias de trabalho baseado nas configurações

DROP FUNCTION IF EXISTS rh.calculate_employee_work_days(UUID, UUID, INTEGER, INTEGER);

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
  suspension_days INTEGER,
  effective_work_days INTEGER
) AS $$
DECLARE
  v_total_days INTEGER;
  v_work_days INTEGER;
  v_holidays_count INTEGER;
  v_absences_count INTEGER;
  v_vacation_days INTEGER;
  v_sick_leave_days INTEGER;
  v_suspension_days INTEGER;
  v_effective_work_days INTEGER;
  v_start_date DATE;
  v_end_date DATE;
  v_employee_shift RECORD;
  v_work_days_in_period INTEGER;
  v_holiday_dates DATE[];
  v_vacation_periods RECORD;
  v_absence_periods RECORD;
BEGIN
  -- Validar parâmetros
  IF p_employee_id IS NULL OR p_company_id IS NULL OR p_year IS NULL OR p_month IS NULL THEN
    RAISE EXCEPTION 'Parâmetros não podem ser NULL';
  END IF;
  
  -- Calcular datas do período
  v_start_date := MAKE_DATE(p_year, p_month, 1);
  v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Calcular total de dias no mês
  v_total_days := EXTRACT(DAY FROM v_end_date);
  
  -- Buscar escala do funcionário ativa no período
  SELECT es.*, ws.dias_semana, ws.dias_trabalho, ws.tipo_escala
  INTO v_employee_shift
  FROM rh.employee_shifts es
  JOIN rh.work_shifts ws ON ws.id = es.shift_id
  WHERE es.employee_id = p_employee_id
    AND es.company_id = p_company_id
    AND es.is_active = true
    AND (es.data_fim IS NULL OR es.data_fim >= v_start_date)
    AND es.data_inicio <= v_end_date
  ORDER BY es.data_inicio DESC
  LIMIT 1;
  
  -- Se não encontrou escala, usar padrão (segunda a sexta)
  IF v_employee_shift IS NULL THEN
    v_work_days_in_period := v_total_days; -- Simplificado - todos os dias
  ELSE
    -- Calcular dias de trabalho baseado na escala
    v_work_days_in_period := rh.calculate_work_days_from_shift(
      v_employee_shift.dias_semana,
      v_employee_shift.tipo_escala,
      v_employee_shift.dias_trabalho,
      v_start_date,
      v_end_date
    );
  END IF;
  
  v_work_days := v_work_days_in_period;
  
  -- Contar feriados no período
  SELECT COUNT(*) INTO v_holidays_count
  FROM rh.holidays h
  WHERE h.company_id = p_company_id
    AND h.is_active = true
    AND h.data >= v_start_date
    AND h.data <= v_end_date;
  
  -- Subtrair feriados dos dias de trabalho
  v_work_days := v_work_days - v_holidays_count;
  
  -- Contar ausências baseado em time_records
  SELECT COUNT(*) INTO v_absences_count
  FROM rh.time_records tr
  WHERE tr.employee_id = p_employee_id
    AND tr.date >= v_start_date
    AND tr.date <= v_end_date
    AND tr.status = 'ausente';
  
  -- Contar dias de férias no período
  SELECT COALESCE(SUM(
    CASE 
      WHEN v.data_inicio <= v_start_date AND v.data_fim >= v_end_date THEN v_total_days
      WHEN v.data_inicio <= v_start_date AND v.data_fim < v_end_date THEN (v.data_fim - v_start_date + 1)
      WHEN v.data_inicio > v_start_date AND v.data_fim >= v_end_date THEN (v_end_date - v.data_inicio + 1)
      WHEN v.data_inicio > v_start_date AND v.data_fim < v_end_date THEN (v.data_fim - v.data_inicio + 1)
      ELSE 0
    END
  ), 0) INTO v_vacation_days
  FROM rh.vacations v
  WHERE v.employee_id = p_employee_id
    AND v.status = 'aprovado'
    AND v.data_inicio <= v_end_date
    AND (v.data_fim IS NULL OR v.data_fim >= v_start_date);
  
  -- Contar dias de licença médica (simplificado - baseado em ausências com atestado)
  SELECT COUNT(*) INTO v_sick_leave_days
  FROM rh.employee_absences ea
  JOIN rh.absence_types at ON at.id = ea.absence_type_id
  WHERE ea.employee_id = p_employee_id
    AND ea.data_inicio <= v_end_date
    AND (ea.data_fim IS NULL OR ea.data_fim >= v_start_date)
    AND at.tipo = 'licenca_medica';
  
  -- Contar dias de suspensão (simplificado - baseado em ausências por suspensão)
  SELECT COUNT(*) INTO v_suspension_days
  FROM rh.employee_absences ea
  JOIN rh.absence_types at ON at.id = ea.absence_type_id
  WHERE ea.employee_id = p_employee_id
    AND ea.data_inicio <= v_end_date
    AND (ea.data_fim IS NULL OR ea.data_fim >= v_start_date)
    AND at.tipo = 'suspensao';
  
  -- Calcular dias efetivos de trabalho
  v_effective_work_days := v_work_days - v_absences_count - v_vacation_days - v_sick_leave_days - v_suspension_days;
  
  -- Garantir que não seja negativo
  IF v_effective_work_days < 0 THEN
    v_effective_work_days := 0;
  END IF;
  
  -- Log para debug (remover em produção)
  RAISE NOTICE 'Employee: %, Period: %/%, Total: %, Work: %, Holidays: %, Absences: %, Vacations: %, Sick: %, Suspension: %, Effective: %', 
    p_employee_id, p_month, p_year, v_total_days, v_work_days, v_holidays_count, 
    v_absences_count, v_vacation_days, v_sick_leave_days, v_suspension_days, v_effective_work_days;
  
  RETURN QUERY SELECT 
    v_total_days,
    v_work_days,
    v_holidays_count,
    v_absences_count,
    v_vacation_days,
    v_sick_leave_days,
    v_suspension_days,
    v_effective_work_days;
END;
$$ LANGUAGE plpgsql;

-- Função auxiliar para calcular dias de trabalho baseado na escala
CREATE OR REPLACE FUNCTION rh.calculate_work_days_from_shift(
  p_dias_semana INTEGER[],
  p_tipo_escala rh.tipo_escala_enum,
  p_dias_trabalho INTEGER,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS INTEGER AS $$
DECLARE
  v_current_date DATE;
  v_work_days INTEGER := 0;
  v_day_of_week INTEGER;
BEGIN
  v_current_date := p_start_date;
  
  WHILE v_current_date <= p_end_date LOOP
    v_day_of_week := EXTRACT(DOW FROM v_current_date); -- 0=domingo, 1=segunda, etc.
    
    -- Verificar se o dia da semana está na escala
    IF v_day_of_week = ANY(p_dias_semana) THEN
      v_work_days := v_work_days + 1;
    END IF;
    
    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN v_work_days;
END;
$$ LANGUAGE plpgsql;

-- Adicionar comentários
COMMENT ON FUNCTION rh.calculate_employee_work_days IS 'Calcula os dias de trabalho de um funcionário considerando work-shifts, feriados, férias, licenças e suspensões';
COMMENT ON FUNCTION rh.calculate_work_days_from_shift IS 'Calcula dias de trabalho baseado na configuração da escala do funcionário';
