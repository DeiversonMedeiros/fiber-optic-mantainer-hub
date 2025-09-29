-- =====================================================
-- ATUALIZAÇÃO DAS FUNÇÕES DE CÁLCULO PARA USAR VINCULAÇÕES
-- =====================================================

-- Função atualizada para calcular VR/VA usando vinculações
CREATE OR REPLACE FUNCTION rh.calculate_vr_va_monthly_value_with_assignment(
  p_employee_id UUID,
  p_company_id UUID,
  p_year INTEGER,
  p_month INTEGER,
  p_date DATE DEFAULT NULL
)
RETURNS TABLE (
  config_id UUID,
  config_tipo VARCHAR(10),
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
  valor_final NUMERIC(10,2),
  criteria_type VARCHAR(50),
  criteria_value VARCHAR(100)
) AS $$
DECLARE
  v_config_record RECORD;
  v_work_days_result RECORD;
  v_assignment_record RECORD;
  v_calculation_date DATE;
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
  -- Definir data de cálculo
  v_calculation_date := COALESCE(p_date, make_date(p_year, p_month, 1));
  
  -- Buscar vinculação ativa do funcionário
  SELECT * INTO v_assignment_record
  FROM rh.employee_benefit_assignments
  WHERE employee_id = p_employee_id
    AND benefit_type = 'vr-va'
    AND is_active = true
    AND data_inicio <= v_calculation_date
    AND (data_fim IS NULL OR data_fim >= v_calculation_date)
  ORDER BY data_inicio DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nenhuma configuração VR/VA vinculada ao funcionário % para a data %', p_employee_id, v_calculation_date;
  END IF;
  
  -- Buscar configuração VR/VA vinculada
  SELECT * INTO v_config_record
  FROM rh.vr_va_configs
  WHERE id = v_assignment_record.vr_va_config_id 
    AND company_id = p_company_id 
    AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configuração VR/VA não encontrada: %', v_assignment_record.vr_va_config_id;
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
    v_config_record.id as config_id,
    v_config_record.tipo as config_tipo,
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
    v_valor_final,
    v_assignment_record.criteria_type,
    v_assignment_record.criteria_value;
END;
$$ LANGUAGE plpgsql;

-- Função atualizada para calcular transporte usando vinculações
CREATE OR REPLACE FUNCTION rh.calculate_transporte_monthly_value_with_assignment(
  p_employee_id UUID,
  p_company_id UUID,
  p_year INTEGER,
  p_month INTEGER,
  p_date DATE DEFAULT NULL
)
RETURNS TABLE (
  config_id UUID,
  config_tipo VARCHAR(20),
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
  valor_final NUMERIC(10,2),
  criteria_type VARCHAR(50),
  criteria_value VARCHAR(100)
) AS $$
DECLARE
  v_config_record RECORD;
  v_work_days_result RECORD;
  v_assignment_record RECORD;
  v_calculation_date DATE;
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
  -- Definir data de cálculo
  v_calculation_date := COALESCE(p_date, make_date(p_year, p_month, 1));
  
  -- Buscar vinculação ativa do funcionário
  SELECT * INTO v_assignment_record
  FROM rh.employee_benefit_assignments
  WHERE employee_id = p_employee_id
    AND benefit_type = 'transporte'
    AND is_active = true
    AND data_inicio <= v_calculation_date
    AND (data_fim IS NULL OR data_fim >= v_calculation_date)
  ORDER BY data_inicio DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nenhuma configuração de transporte vinculada ao funcionário % para a data %', p_employee_id, v_calculation_date;
  END IF;
  
  -- Buscar configuração de transporte vinculada
  SELECT * INTO v_config_record
  FROM rh.transporte_configs
  WHERE id = v_assignment_record.transporte_config_id 
    AND company_id = p_company_id 
    AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configuração de transporte não encontrada: %', v_assignment_record.transporte_config_id;
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
    v_config_record.id as config_id,
    v_config_record.tipo as config_tipo,
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
    v_valor_final,
    v_assignment_record.criteria_type,
    v_assignment_record.criteria_value;
END;
$$ LANGUAGE plpgsql;

-- Função atualizada para processamento em lote usando vinculações
CREATE OR REPLACE FUNCTION rh.process_monthly_benefits_with_assignments(
  p_company_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_employee_record RECORD;
  v_assignment_record RECORD;
  v_vr_va_result RECORD;
  v_transporte_result RECORD;
  v_processed_count INTEGER := 0;
BEGIN
  -- Loop pelos funcionários ativos da empresa que têm vinculações
  FOR v_employee_record IN 
    SELECT DISTINCT e.*
    FROM rh.employees e
    INNER JOIN rh.employee_benefit_assignments eba ON e.id = eba.employee_id
    WHERE e.company_id = p_company_id 
      AND e.status = 'ativo'
      AND eba.is_active = true
      AND eba.data_inicio <= make_date(p_year, p_month, 1)
      AND (eba.data_fim IS NULL OR eba.data_fim >= make_date(p_year, p_month, 1))
  LOOP
    -- Processar VR/VA se tiver vinculação
    BEGIN
      SELECT * INTO v_vr_va_result
      FROM rh.calculate_vr_va_monthly_value_with_assignment(
        v_employee_record.id, 
        p_company_id, 
        p_year, 
        p_month
      );
      
      -- Verificar se já existe registro para este mês/ano
      IF NOT EXISTS(
        SELECT 1 FROM rh.funcionario_beneficios_historico 
        WHERE employee_id = v_employee_record.id 
          AND vr_va_config_id = v_vr_va_result.config_id
          AND mes_referencia = p_month 
          AND ano_referencia = p_year
      ) THEN
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
          v_vr_va_result.config_id,
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
    EXCEPTION
      WHEN OTHERS THEN
        -- Funcionário não tem vinculação VR/VA ativa, continuar
        NULL;
    END;
    
    -- Processar Transporte se tiver vinculação
    BEGIN
      SELECT * INTO v_transporte_result
      FROM rh.calculate_transporte_monthly_value_with_assignment(
        v_employee_record.id, 
        p_company_id, 
        p_year, 
        p_month
      );
      
      -- Verificar se já existe registro para este mês/ano
      IF NOT EXISTS(
        SELECT 1 FROM rh.funcionario_beneficios_historico 
        WHERE employee_id = v_employee_record.id 
          AND transporte_config_id = v_transporte_result.config_id
          AND mes_referencia = p_month 
          AND ano_referencia = p_year
      ) THEN
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
          v_transporte_result.config_id,
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
    EXCEPTION
      WHEN OTHERS THEN
        -- Funcionário não tem vinculação de transporte ativa, continuar
        NULL;
    END;
  END LOOP;
  
  RETURN v_processed_count;
END;
$$ LANGUAGE plpgsql;

-- Comentários das funções
COMMENT ON FUNCTION rh.calculate_vr_va_monthly_value_with_assignment(UUID, UUID, INTEGER, INTEGER, DATE) IS 
'Calcula valor mensal de VR/VA usando vinculações automáticas baseadas em critérios';

COMMENT ON FUNCTION rh.calculate_transporte_monthly_value_with_assignment(UUID, UUID, INTEGER, INTEGER, DATE) IS 
'Calcula valor mensal de transporte usando vinculações automáticas baseadas em critérios';

COMMENT ON FUNCTION rh.process_monthly_benefits_with_assignments(UUID, INTEGER, INTEGER) IS 
'Processa benefícios mensais usando vinculações automáticas de funcionários a configurações';
























