-- Correção do sistema de cálculo de benefícios para suportar escalas flexíveis
-- Atualiza funções para considerar tipo_escala, dias_trabalho, dias_folga, ciclo_dias

-- 1. Função auxiliar para calcular dias de trabalho baseado na escala flexível
CREATE OR REPLACE FUNCTION rh.calculate_flexible_work_days(
  p_work_shift_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_shift_record RECORD;
  v_month_start DATE;
  v_month_end DATE;
  v_current_date DATE;
  v_day_of_week INTEGER;
  v_cycle_day INTEGER;
  v_work_days INTEGER := 0;
  v_total_days INTEGER;
  v_days_in_cycle INTEGER;
BEGIN
  -- Definir início e fim do mês
  v_month_start := make_date(p_year, p_month, 1);
  v_month_end := (v_month_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  v_total_days := EXTRACT(DAY FROM v_month_end);
  
  -- Buscar dados da escala
  SELECT * INTO v_shift_record
  FROM rh.work_shifts
  WHERE id = p_work_shift_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calcular dias de trabalho baseado no tipo de escala
  CASE v_shift_record.tipo_escala
    WHEN 'fixa' THEN
      -- Escala fixa: usar dias_semana
      v_current_date := v_month_start;
      WHILE v_current_date <= v_month_end LOOP
        v_day_of_week := EXTRACT(DOW FROM v_current_date);
        IF v_day_of_week = ANY(v_shift_record.dias_semana) THEN
          v_work_days := v_work_days + 1;
        END IF;
        v_current_date := v_current_date + INTERVAL '1 day';
      END LOOP;
      
    WHEN 'flexivel_6x1', 'flexivel_5x2', 'flexivel_4x3' THEN
      -- Escalas flexíveis: usar padrão de trabalho/folga
      v_days_in_cycle := v_shift_record.ciclo_dias;
      v_current_date := v_month_start;
      
      WHILE v_current_date <= v_month_end LOOP
        -- Calcular dia do ciclo (1, 2, 3, ...)
        v_cycle_day := ((EXTRACT(DAY FROM v_current_date) - 1) % v_days_in_cycle) + 1;
        
        -- Se está dentro dos dias de trabalho do ciclo
        IF v_cycle_day <= v_shift_record.dias_trabalho THEN
          v_work_days := v_work_days + 1;
        END IF;
        
        v_current_date := v_current_date + INTERVAL '1 day';
      END LOOP;
      
    WHEN 'escala_12x36', 'escala_24x48' THEN
      -- Escalas de plantão: calcular baseado no ciclo
      v_days_in_cycle := v_shift_record.ciclo_dias;
      v_current_date := v_month_start;
      
      WHILE v_current_date <= v_month_end LOOP
        v_cycle_day := ((EXTRACT(DAY FROM v_current_date) - 1) % v_days_in_cycle) + 1;
        
        -- No ciclo de 3 dias (12x36 ou 24x48), apenas o primeiro dia é trabalho
        IF v_cycle_day = 1 THEN
          v_work_days := v_work_days + 1;
        END IF;
        
        v_current_date := v_current_date + INTERVAL '1 day';
      END LOOP;
      
    WHEN 'personalizada' THEN
      -- Escala personalizada: usar configuração específica
      v_days_in_cycle := v_shift_record.ciclo_dias;
      v_current_date := v_month_start;
      
      WHILE v_current_date <= v_month_end LOOP
        v_cycle_day := ((EXTRACT(DAY FROM v_current_date) - 1) % v_days_in_cycle) + 1;
        
        IF v_cycle_day <= v_shift_record.dias_trabalho THEN
          v_work_days := v_work_days + 1;
        END IF;
        
        v_current_date := v_current_date + INTERVAL '1 day';
      END LOOP;
      
    ELSE
      -- Fallback: usar dias úteis padrão (seg-sex)
      v_current_date := v_month_start;
      WHILE v_current_date <= v_month_end LOOP
        v_day_of_week := EXTRACT(DOW FROM v_current_date);
        IF v_day_of_week BETWEEN 1 AND 5 THEN
          v_work_days := v_work_days + 1;
        END IF;
        v_current_date := v_current_date + INTERVAL '1 day';
      END LOOP;
  END CASE;
  
  RETURN v_work_days;
END;
$$ LANGUAGE plpgsql;

-- 2. Função atualizada para calcular dias úteis considerando escalas flexíveis
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
  v_employee_record RECORD;
  v_shift_record RECORD;
  v_current_date DATE;
  v_month_start DATE;
  v_month_end DATE;
  v_day_of_week INTEGER;
  v_cycle_day INTEGER;
  v_is_holiday BOOLEAN;
  v_is_absence BOOLEAN;
  v_is_vacation BOOLEAN;
  v_is_sick_leave BOOLEAN;
  v_total_days INTEGER := 0;
  v_work_days INTEGER := 0;
  v_holidays_count INTEGER := 0;
  v_absences_count INTEGER := 0;
  v_vacation_days INTEGER := 0;
  v_sick_leave_days INTEGER := 0;
  v_effective_work_days INTEGER := 0;
  v_days_in_cycle INTEGER;
BEGIN
  -- Definir início e fim do mês
  v_month_start := make_date(p_year, p_month, 1);
  v_month_end := (v_month_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Buscar dados do funcionário
  SELECT * INTO v_employee_record
  FROM rh.employees
  WHERE id = p_employee_id AND company_id = p_company_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Funcionário não encontrado: %', p_employee_id;
  END IF;
  
  -- Buscar turno ativo do funcionário
  SELECT ws.* INTO v_shift_record
  FROM rh.employee_shifts es
  JOIN rh.work_shifts ws ON es.shift_id = ws.id
  WHERE es.employee_id = p_employee_id
    AND es.is_active = true
    AND (es.data_fim IS NULL OR es.data_fim >= v_month_start)
    AND es.data_inicio <= v_month_end
    AND ws.is_active = true
  ORDER BY es.data_inicio DESC
  LIMIT 1;
  
  -- Se não tem turno definido, usar dias úteis padrão (seg-sex)
  IF NOT FOUND THEN
    -- Loop pelos dias do mês
    v_current_date := v_month_start;
    WHILE v_current_date <= v_month_end LOOP
      v_total_days := v_total_days + 1;
      v_day_of_week := EXTRACT(DOW FROM v_current_date);
      
      -- Verificar se é dia útil (seg-sex, onde 0=domingo)
      IF v_day_of_week BETWEEN 1 AND 5 THEN
        v_work_days := v_work_days + 1;
        
        -- Verificar se é feriado
        SELECT EXISTS(
          SELECT 1 FROM rh.holidays 
          WHERE company_id = p_company_id 
            AND data = v_current_date 
            AND is_active = true
        ) INTO v_is_holiday;
        
        -- Verificar ausências (medical_certificates)
        SELECT EXISTS(
          SELECT 1 FROM rh.medical_certificates 
          WHERE employee_id = p_employee_id 
            AND data_inicio <= v_current_date 
            AND (data_fim IS NULL OR data_fim >= v_current_date)
            AND status = 'aprovado'
        ) INTO v_is_absence;
        
        -- Verificar férias
        SELECT EXISTS(
          SELECT 1 FROM rh.vacations 
          WHERE employee_id = p_employee_id 
            AND data_inicio <= v_current_date 
            AND (data_fim IS NULL OR data_fim >= v_current_date)
            AND status = 'aprovado'
        ) INTO v_is_vacation;
        
        -- Verificar licença médica
        SELECT EXISTS(
          SELECT 1 FROM rh.medical_certificates 
          WHERE employee_id = p_employee_id 
            AND data_inicio <= v_current_date 
            AND (data_fim IS NULL OR data_fim >= v_current_date)
            AND status = 'aprovado'
        ) INTO v_is_sick_leave;
        
        -- Contar tipos de ausência
        IF v_is_holiday THEN
          v_holidays_count := v_holidays_count + 1;
        ELSIF v_is_vacation THEN
          v_vacation_days := v_vacation_days + 1;
        ELSIF v_is_sick_leave THEN
          v_sick_leave_days := v_sick_leave_days + 1;
        ELSIF v_is_absence THEN
          v_absences_count := v_absences_count + 1;
        ELSE
          -- Dia efetivo de trabalho
          v_effective_work_days := v_effective_work_days + 1;
        END IF;
      END IF;
      
      v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
  ELSE
    -- Usar escala específica do funcionário
    v_days_in_cycle := COALESCE(v_shift_record.ciclo_dias, 7);
    
    v_current_date := v_month_start;
    WHILE v_current_date <= v_month_end LOOP
      v_total_days := v_total_days + 1;
      v_day_of_week := EXTRACT(DOW FROM v_current_date);
      
      -- Verificar se é dia de trabalho baseado na escala
      CASE v_shift_record.tipo_escala
        WHEN 'fixa' THEN
          -- Escala fixa: usar dias_semana
          IF v_day_of_week = ANY(v_shift_record.dias_semana) THEN
            v_work_days := v_work_days + 1;
          END IF;
          
        WHEN 'flexivel_6x1', 'flexivel_5x2', 'flexivel_4x3', 'personalizada' THEN
          -- Escalas flexíveis: usar padrão de trabalho/folga
          v_cycle_day := ((EXTRACT(DAY FROM v_current_date) - 1) % v_days_in_cycle) + 1;
          IF v_cycle_day <= v_shift_record.dias_trabalho THEN
            v_work_days := v_work_days + 1;
          END IF;
          
        WHEN 'escala_12x36', 'escala_24x48' THEN
          -- Escalas de plantão: apenas o primeiro dia do ciclo é trabalho
          v_cycle_day := ((EXTRACT(DAY FROM v_current_date) - 1) % v_days_in_cycle) + 1;
          IF v_cycle_day = 1 THEN
            v_work_days := v_work_days + 1;
          END IF;
          
        ELSE
          -- Fallback: dias úteis padrão
          IF v_day_of_week BETWEEN 1 AND 5 THEN
            v_work_days := v_work_days + 1;
          END IF;
      END CASE;
      
      -- Se é dia de trabalho, verificar ausências
      IF v_work_days > 0 AND v_current_date <= v_month_end THEN
        -- Verificar se é feriado
        SELECT EXISTS(
          SELECT 1 FROM rh.holidays 
          WHERE company_id = p_company_id 
            AND data = v_current_date 
            AND is_active = true
        ) INTO v_is_holiday;
        
        -- Verificar ausências
        SELECT EXISTS(
          SELECT 1 FROM rh.medical_certificates 
          WHERE employee_id = p_employee_id 
            AND data_inicio <= v_current_date 
            AND (data_fim IS NULL OR data_fim >= v_current_date)
            AND status = 'aprovado'
        ) INTO v_is_absence;
        
        -- Verificar férias
        SELECT EXISTS(
          SELECT 1 FROM rh.vacations 
          WHERE employee_id = p_employee_id 
            AND data_inicio <= v_current_date 
            AND (data_fim IS NULL OR data_fim >= v_current_date)
            AND status = 'aprovado'
        ) INTO v_is_vacation;
        
        -- Verificar licença médica
        SELECT EXISTS(
          SELECT 1 FROM rh.medical_certificates 
          WHERE employee_id = p_employee_id 
            AND data_inicio <= v_current_date 
            AND (data_fim IS NULL OR data_fim >= v_current_date)
            AND status = 'aprovado'
        ) INTO v_is_sick_leave;
        
        -- Contar tipos de ausência
        IF v_is_holiday THEN
          v_holidays_count := v_holidays_count + 1;
        ELSIF v_is_vacation THEN
          v_vacation_days := v_vacation_days + 1;
        ELSIF v_is_sick_leave THEN
          v_sick_leave_days := v_sick_leave_days + 1;
        ELSIF v_is_absence THEN
          v_absences_count := v_absences_count + 1;
        ELSE
          -- Dia efetivo de trabalho
          v_effective_work_days := v_effective_work_days + 1;
        END IF;
      END IF;
      
      v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
  END IF;
  
  -- Retornar resultado
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

-- 3. Função para calcular valor diário de locação baseado na escala
CREATE OR REPLACE FUNCTION rh.calculate_equipment_rental_daily_value(
  p_employee_id UUID,
  p_company_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS NUMERIC(10,2) AS $$
DECLARE
  v_shift_record RECORD;
  v_work_days INTEGER;
  v_monthly_value NUMERIC(10,2);
  v_daily_value NUMERIC(10,2);
BEGIN
  -- Buscar turno ativo do funcionário
  SELECT ws.* INTO v_shift_record
  FROM rh.employee_shifts es
  JOIN rh.work_shifts ws ON es.shift_id = ws.id
  WHERE es.employee_id = p_employee_id
    AND es.is_active = true
    AND ws.is_active = true
  ORDER BY es.data_inicio DESC
  LIMIT 1;
  
  -- Se não tem turno definido, usar 22 dias úteis padrão
  IF NOT FOUND THEN
    v_work_days := 22;
  ELSE
    -- Calcular dias de trabalho baseado na escala
    v_work_days := rh.calculate_flexible_work_days(
      v_shift_record.id, 
      p_year, 
      p_month
    );
  END IF;
  
  -- Buscar valor mensal da locação
  SELECT monthly_value INTO v_monthly_value
  FROM rh.equipment_rentals
  WHERE employee_id = p_employee_id
    AND company_id = p_company_id
    AND is_active = true
  LIMIT 1;
  
  -- Calcular valor diário baseado nos dias de trabalho da escala
  IF v_work_days > 0 THEN
    v_daily_value := v_monthly_value / v_work_days;
  ELSE
    v_daily_value := 0;
  END IF;
  
  RETURN v_daily_value;
END;
$$ LANGUAGE plpgsql;

-- 4. Função atualizada para calcular descontos de locação considerando escala
CREATE OR REPLACE FUNCTION rh.calculate_equipment_rental_absence_discount(
  p_employee_id UUID,
  p_company_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  monthly_value NUMERIC(10,2),
  daily_value NUMERIC(10,2),
  work_days INTEGER,
  absence_days INTEGER,
  total_discount NUMERIC(10,2),
  final_value NUMERIC(10,2)
) AS $$
DECLARE
  v_rental_record RECORD;
  v_work_days_result RECORD;
  v_monthly_value NUMERIC(10,2);
  v_daily_value NUMERIC(10,2);
  v_work_days INTEGER;
  v_absence_days INTEGER;
  v_total_discount NUMERIC(10,2);
  v_final_value NUMERIC(10,2);
BEGIN
  -- Buscar locação ativa
  SELECT * INTO v_rental_record
  FROM rh.equipment_rentals
  WHERE employee_id = p_employee_id
    AND company_id = p_company_id
    AND is_active = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Locação de equipamento não encontrada para o funcionário: %', p_employee_id;
  END IF;
  
  v_monthly_value := v_rental_record.monthly_value;
  
  -- Calcular dias úteis baseado na escala do funcionário
  SELECT * INTO v_work_days_result
  FROM rh.calculate_employee_work_days(p_employee_id, p_company_id, p_year, p_month);
  
  v_work_days := v_work_days_result.work_days;
  v_absence_days := v_work_days_result.absences_count + 
                   v_work_days_result.vacation_days + 
                   v_work_days_result.sick_leave_days;
  
  -- Calcular valor diário baseado na escala
  IF v_work_days > 0 THEN
    v_daily_value := v_monthly_value / v_work_days;
  ELSE
    v_daily_value := 0;
  END IF;
  
  -- Calcular desconto total
  v_total_discount := v_absence_days * v_daily_value;
  
  -- Valor final
  v_final_value := v_monthly_value - v_total_discount;
  
  -- Retornar resultado
  RETURN QUERY SELECT 
    v_monthly_value,
    v_daily_value,
    v_work_days,
    v_absence_days,
    v_total_discount,
    v_final_value;
END;
$$ LANGUAGE plpgsql;

-- 5. Comentários das funções
COMMENT ON FUNCTION rh.calculate_flexible_work_days(UUID, INTEGER, INTEGER) IS 
'Calcula dias de trabalho baseado na escala flexível do funcionário';

COMMENT ON FUNCTION rh.calculate_equipment_rental_daily_value(UUID, UUID, INTEGER, INTEGER) IS 
'Calcula valor diário de locação baseado na escala de trabalho do funcionário';

COMMENT ON FUNCTION rh.calculate_equipment_rental_absence_discount(UUID, UUID, INTEGER, INTEGER) IS 
'Calcula descontos de locação considerando a escala de trabalho do funcionário';

-- 6. Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_work_shifts_tipo_escala_active 
ON rh.work_shifts(tipo_escala, is_active) 
WHERE is_active = true;

-- Verificar se a coluna is_active existe na tabela equipment_rentals antes de criar o índice
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'rh' 
        AND table_name = 'equipment_rentals' 
        AND column_name = 'is_active'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_equipment_rentals_employee_active 
        ON rh.equipment_rentals(employee_id, company_id, is_active) 
        WHERE is_active = true;
    END IF;
END $$;
