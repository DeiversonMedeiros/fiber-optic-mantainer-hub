-- =====================================================
-- FUNÇÕES PARA CÁLCULO DE DIAS ÚTEIS DINÂMICOS
-- Sistema VR/VA e Transporte com base em turnos de trabalho
-- =====================================================

-- Função para calcular dias úteis de um funcionário em um mês específico
-- Considera turno de trabalho, feriados e ausências
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
            AND status IN ('aprovado')
        ) INTO v_is_vacation;
        
        -- Verificar licença médica
        SELECT EXISTS(
          SELECT 1 FROM rh.medical_certificates 
          WHERE employee_id = p_employee_id 
            AND data_inicio <= v_current_date 
            AND (data_fim IS NULL OR data_fim >= v_current_date)
            AND status = 'aprovado'
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
    -- Usar turno específico do funcionário
    v_current_date := v_month_start;
    WHILE v_current_date <= v_month_end LOOP
      v_total_days := v_total_days + 1;
      v_day_of_week := EXTRACT(DOW FROM v_current_date);
      
      -- Verificar se é dia de trabalho no turno (dias_semana é array de inteiros)
      IF v_day_of_week = ANY(v_shift_record.dias_semana) THEN
        v_work_days := v_work_days + 1;
        
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
            AND status IN ('aprovado')
        ) INTO v_is_vacation;
        
        -- Verificar licença médica
        SELECT EXISTS(
          SELECT 1 FROM rh.medical_certificates 
          WHERE employee_id = p_employee_id 
            AND data_inicio <= v_current_date 
            AND (data_fim IS NULL OR data_fim >= v_current_date)
            AND status = 'aprovado'
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

-- Função para calcular valor mensal de VR/VA baseado em dias úteis
CREATE OR REPLACE FUNCTION rh.calculate_vr_va_monthly_value(
  p_employee_id UUID,
  p_company_id UUID,
  p_vr_va_config_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  valor_diario NUMERIC(10,2),
  dias_uteis_mes INTEGER,
  dias_feriados INTEGER,
  dias_ausencia INTEGER,
  dias_ferias INTEGER,
  dias_licenca INTEGER,
  dias_efetivos_trabalho INTEGER,
  valor_bruto NUMERIC(10,2),
  valor_desconto_ausencia NUMERIC(10,2),
  valor_desconto_ferias NUMERIC(10,2),
  valor_desconto_licenca NUMERIC(10,2),
  valor_total_desconto NUMERIC(10,2),
  valor_final NUMERIC(10,2)
) AS $$
DECLARE
  v_config_record RECORD;
  v_work_days_result RECORD;
  v_valor_diario NUMERIC(10,2);
  v_dias_uteis_mes INTEGER;
  v_dias_feriados INTEGER;
  v_dias_ausencia INTEGER;
  v_dias_ferias INTEGER;
  v_dias_licenca INTEGER;
  v_dias_efetivos_trabalho INTEGER;
  v_valor_bruto NUMERIC(10,2);
  v_valor_desconto_ausencia NUMERIC(10,2) := 0;
  v_valor_desconto_ferias NUMERIC(10,2) := 0;
  v_valor_desconto_licenca NUMERIC(10,2) := 0;
  v_valor_total_desconto NUMERIC(10,2) := 0;
  v_valor_final NUMERIC(10,2);
BEGIN
  -- Buscar configuração VR/VA
  SELECT * INTO v_config_record
  FROM rh.vr_va_configs
  WHERE id = p_vr_va_config_id AND company_id = p_company_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configuração VR/VA não encontrada: %', p_vr_va_config_id;
  END IF;
  
  v_valor_diario := v_config_record.valor_diario;
  
  -- Calcular dias úteis do funcionário
  SELECT * INTO v_work_days_result
  FROM rh.calculate_employee_work_days(p_employee_id, p_company_id, p_year, p_month);
  
  v_dias_uteis_mes := v_work_days_result.work_days;
  v_dias_feriados := v_work_days_result.holidays_count;
  v_dias_ausencia := v_work_days_result.absences_count;
  v_dias_ferias := v_work_days_result.vacation_days;
  v_dias_licenca := v_work_days_result.sick_leave_days;
  v_dias_efetivos_trabalho := v_work_days_result.effective_work_days;
  
  -- Calcular valor bruto (dias úteis * valor diário)
  v_valor_bruto := v_dias_uteis_mes * v_valor_diario;
  
  -- Calcular descontos baseado nas configurações
  IF v_config_record.desconto_por_ausencia THEN
    v_valor_desconto_ausencia := v_dias_ausencia * v_valor_diario;
  END IF;
  
  IF v_config_record.desconto_por_ferias THEN
    v_valor_desconto_ferias := v_dias_ferias * v_valor_diario;
  END IF;
  
  IF v_config_record.desconto_por_licenca THEN
    v_valor_desconto_licenca := v_dias_licenca * v_valor_diario;
  END IF;
  
  -- Total de descontos
  v_valor_total_desconto := v_valor_desconto_ausencia + v_valor_desconto_ferias + v_valor_desconto_licenca;
  
  -- Valor final
  v_valor_final := v_valor_bruto - v_valor_total_desconto;
  
  -- Retornar resultado
  RETURN QUERY SELECT 
    v_valor_diario,
    v_dias_uteis_mes,
    v_dias_feriados,
    v_dias_ausencia,
    v_dias_ferias,
    v_dias_licenca,
    v_dias_efetivos_trabalho,
    v_valor_bruto,
    v_valor_desconto_ausencia,
    v_valor_desconto_ferias,
    v_valor_desconto_licenca,
    v_valor_total_desconto,
    v_valor_final;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular valor mensal de transporte baseado em dias úteis
CREATE OR REPLACE FUNCTION rh.calculate_transporte_monthly_value(
  p_employee_id UUID,
  p_company_id UUID,
  p_transporte_config_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  valor_passagem NUMERIC(10,2),
  quantidade_passagens INTEGER,
  dias_uteis_mes INTEGER,
  dias_feriados INTEGER,
  dias_ausencia INTEGER,
  dias_ferias INTEGER,
  dias_licenca INTEGER,
  dias_efetivos_trabalho INTEGER,
  valor_bruto NUMERIC(10,2),
  valor_desconto_ausencia NUMERIC(10,2),
  valor_desconto_ferias NUMERIC(10,2),
  valor_desconto_licenca NUMERIC(10,2),
  valor_total_desconto NUMERIC(10,2),
  valor_final NUMERIC(10,2)
) AS $$
DECLARE
  v_config_record RECORD;
  v_work_days_result RECORD;
  v_valor_passagem NUMERIC(10,2);
  v_quantidade_passagens INTEGER;
  v_dias_uteis_mes INTEGER;
  v_dias_feriados INTEGER;
  v_dias_ausencia INTEGER;
  v_dias_ferias INTEGER;
  v_dias_licenca INTEGER;
  v_dias_efetivos_trabalho INTEGER;
  v_valor_bruto NUMERIC(10,2);
  v_valor_desconto_ausencia NUMERIC(10,2) := 0;
  v_valor_desconto_ferias NUMERIC(10,2) := 0;
  v_valor_desconto_licenca NUMERIC(10,2) := 0;
  v_valor_total_desconto NUMERIC(10,2) := 0;
  v_valor_final NUMERIC(10,2);
BEGIN
  -- Buscar configuração de transporte
  SELECT * INTO v_config_record
  FROM rh.transporte_configs
  WHERE id = p_transporte_config_id AND company_id = p_company_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configuração de transporte não encontrada: %', p_transporte_config_id;
  END IF;
  
  v_valor_passagem := COALESCE(v_config_record.valor_passagem, 0);
  v_quantidade_passagens := COALESCE(v_config_record.quantidade_passagens, 2); -- 2 passagens por dia (ida e volta)
  
  -- Calcular dias úteis do funcionário
  SELECT * INTO v_work_days_result
  FROM rh.calculate_employee_work_days(p_employee_id, p_company_id, p_year, p_month);
  
  v_dias_uteis_mes := v_work_days_result.work_days;
  v_dias_feriados := v_work_days_result.holidays_count;
  v_dias_ausencia := v_work_days_result.absences_count;
  v_dias_ferias := v_work_days_result.vacation_days;
  v_dias_licenca := v_work_days_result.sick_leave_days;
  v_dias_efetivos_trabalho := v_work_days_result.effective_work_days;
  
  -- Calcular valor bruto (dias úteis * quantidade de passagens * valor da passagem)
  v_valor_bruto := v_dias_uteis_mes * v_quantidade_passagens * v_valor_passagem;
  
  -- Calcular descontos baseado nas configurações
  IF v_config_record.desconto_por_ausencia THEN
    v_valor_desconto_ausencia := v_dias_ausencia * v_quantidade_passagens * v_valor_passagem;
  END IF;
  
  IF v_config_record.desconto_por_ferias THEN
    v_valor_desconto_ferias := v_dias_ferias * v_quantidade_passagens * v_valor_passagem;
  END IF;
  
  IF v_config_record.desconto_por_licenca THEN
    v_valor_desconto_licenca := v_dias_licenca * v_quantidade_passagens * v_valor_passagem;
  END IF;
  
  -- Total de descontos
  v_valor_total_desconto := v_valor_desconto_ausencia + v_valor_desconto_ferias + v_valor_desconto_licenca;
  
  -- Valor final
  v_valor_final := v_valor_bruto - v_valor_total_desconto;
  
  -- Retornar resultado
  RETURN QUERY SELECT 
    v_valor_passagem,
    v_quantidade_passagens,
    v_dias_uteis_mes,
    v_dias_feriados,
    v_dias_ausencia,
    v_dias_ferias,
    v_dias_licenca,
    v_dias_efetivos_trabalho,
    v_valor_bruto,
    v_valor_desconto_ausencia,
    v_valor_desconto_ferias,
    v_valor_desconto_licenca,
    v_valor_total_desconto,
    v_valor_final;
END;
$$ LANGUAGE plpgsql;

-- Função para processar benefícios mensais automaticamente
CREATE OR REPLACE FUNCTION rh.process_monthly_benefits(
  p_company_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_employee_record RECORD;
  v_vr_va_config RECORD;
  v_transporte_config RECORD;
  v_vr_va_result RECORD;
  v_transporte_result RECORD;
  v_processed_count INTEGER := 0;
BEGIN
  -- Loop pelos funcionários ativos da empresa
  FOR v_employee_record IN 
    SELECT * FROM rh.employees 
    WHERE company_id = p_company_id AND status = 'ativo'
  LOOP
    -- Processar VR/VA
    FOR v_vr_va_config IN
      SELECT * FROM rh.vr_va_configs 
      WHERE company_id = p_company_id AND is_active = true
    LOOP
      -- Verificar se já existe registro para este mês/ano
      IF NOT EXISTS(
        SELECT 1 FROM rh.funcionario_beneficios_historico 
        WHERE employee_id = v_employee_record.id 
          AND vr_va_config_id = v_vr_va_config.id
          AND mes_referencia = p_month 
          AND ano_referencia = p_year
      ) THEN
        -- Calcular valores
        SELECT * INTO v_vr_va_result
        FROM rh.calculate_vr_va_monthly_value(
          v_employee_record.id, 
          p_company_id, 
          v_vr_va_config.id, 
          p_year, 
          p_month
        );
        
        -- Inserir no histórico
        INSERT INTO rh.funcionario_beneficios_historico (
          employee_id,
          benefit_id,
          vr_va_config_id,
          valor_beneficio,
          valor_desconto,
          valor_final,
          motivo_desconto,
          mes_referencia,
          ano_referencia,
          data_inicio,
          status
        ) VALUES (
          v_employee_record.id,
          'vr-va',
          v_vr_va_config.id,
          v_vr_va_result.valor_bruto,
          v_vr_va_result.valor_total_desconto,
          v_vr_va_result.valor_final,
          CASE 
            WHEN v_vr_va_result.valor_total_desconto > 0 THEN 
              'Desconto por ' || 
              CASE WHEN v_vr_va_result.dias_ausencia > 0 THEN v_vr_va_result.dias_ausencia || ' ausências' ELSE '' END ||
              CASE WHEN v_vr_va_result.dias_ferias > 0 THEN ' ' || v_vr_va_result.dias_ferias || ' férias' ELSE '' END ||
              CASE WHEN v_vr_va_result.dias_licenca > 0 THEN ' ' || v_vr_va_result.dias_licenca || ' licenças' ELSE '' END
            ELSE NULL
          END,
          p_month,
          p_year,
          make_date(p_year, p_month, 1),
          'ativo'
        );
        
        v_processed_count := v_processed_count + 1;
      END IF;
    END LOOP;
    
    -- Processar Transporte
    FOR v_transporte_config IN
      SELECT * FROM rh.transporte_configs 
      WHERE company_id = p_company_id AND is_active = true
    LOOP
      -- Verificar se já existe registro para este mês/ano
      IF NOT EXISTS(
        SELECT 1 FROM rh.funcionario_beneficios_historico 
        WHERE employee_id = v_employee_record.id 
          AND transporte_config_id = v_transporte_config.id
          AND mes_referencia = p_month 
          AND ano_referencia = p_year
      ) THEN
        -- Calcular valores
        SELECT * INTO v_transporte_result
        FROM rh.calculate_transporte_monthly_value(
          v_employee_record.id, 
          p_company_id, 
          v_transporte_config.id, 
          p_year, 
          p_month
        );
        
        -- Inserir no histórico
        INSERT INTO rh.funcionario_beneficios_historico (
          employee_id,
          benefit_id,
          transporte_config_id,
          valor_beneficio,
          valor_desconto,
          valor_final,
          motivo_desconto,
          mes_referencia,
          ano_referencia,
          data_inicio,
          status
        ) VALUES (
          v_employee_record.id,
          'transporte',
          v_transporte_config.id,
          v_transporte_result.valor_bruto,
          v_transporte_result.valor_total_desconto,
          v_transporte_result.valor_final,
          CASE 
            WHEN v_transporte_result.valor_total_desconto > 0 THEN 
              'Desconto por ' || 
              CASE WHEN v_transporte_result.dias_ausencia > 0 THEN v_transporte_result.dias_ausencia || ' ausências' ELSE '' END ||
              CASE WHEN v_transporte_result.dias_ferias > 0 THEN ' ' || v_transporte_result.dias_ferias || ' férias' ELSE '' END ||
              CASE WHEN v_transporte_result.dias_licenca > 0 THEN ' ' || v_transporte_result.dias_licenca || ' licenças' ELSE '' END
            ELSE NULL
          END,
          p_month,
          p_year,
          make_date(p_year, p_month, 1),
          'ativo'
        );
        
        v_processed_count := v_processed_count + 1;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN v_processed_count;
END;
$$ LANGUAGE plpgsql;

-- Comentários das funções
COMMENT ON FUNCTION rh.calculate_employee_work_days(UUID, UUID, INTEGER, INTEGER) IS 
'Calcula dias úteis de um funcionário em um mês, considerando turno de trabalho, feriados e ausências';

COMMENT ON FUNCTION rh.calculate_vr_va_monthly_value(UUID, UUID, UUID, INTEGER, INTEGER) IS 
'Calcula valor mensal de VR/VA baseado em dias úteis reais do funcionário';

COMMENT ON FUNCTION rh.calculate_transporte_monthly_value(UUID, UUID, UUID, INTEGER, INTEGER) IS 
'Calcula valor mensal de transporte baseado em dias úteis reais do funcionário';

COMMENT ON FUNCTION rh.process_monthly_benefits(UUID, INTEGER, INTEGER) IS 
'Processa automaticamente os benefícios mensais (VR/VA e transporte) para todos os funcionários de uma empresa';

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_employee_shifts_employee_active 
ON rh.employee_shifts(employee_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_holidays_company_date_active 
ON rh.holidays(company_id, data, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_medical_certificates_employee_period 
ON rh.medical_certificates(employee_id, data_inicio, data_fim) 
WHERE status = 'aprovado';

CREATE INDEX IF NOT EXISTS idx_vacations_employee_period 
ON rh.vacations(employee_id, data_inicio, data_fim) 
WHERE status IN ('aprovado', 'em_andamento', 'concluido');
