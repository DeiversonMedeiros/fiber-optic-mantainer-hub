-- Função para calcular valor mensal de transporte
CREATE OR REPLACE FUNCTION rh.calculate_transporte_monthly_value(
    p_employee_id UUID, 
    p_company_id UUID, 
    p_transporte_config_id UUID, 
    p_year INTEGER, 
    p_month INTEGER
) RETURNS TABLE(
    valor_passagem NUMERIC, 
    quantidade_passagens INTEGER, 
    dias_uteis_mes INTEGER, 
    dias_feriados INTEGER, 
    dias_ausencia INTEGER, 
    dias_ferias INTEGER, 
    dias_licenca INTEGER, 
    dias_efetivos_trabalho INTEGER, 
    valor_bruto NUMERIC, 
    valor_desconto_ausencia NUMERIC, 
    valor_desconto_ferias NUMERIC, 
    valor_desconto_licenca NUMERIC, 
    valor_total_desconto NUMERIC, 
    valor_final NUMERIC
) LANGUAGE plpgsql AS $$
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
$$;

-- Função para calcular valor mensal de VR/VA
CREATE OR REPLACE FUNCTION rh.calculate_vr_va_monthly_value(
    p_employee_id UUID, 
    p_company_id UUID, 
    p_vr_va_config_id UUID, 
    p_year INTEGER, 
    p_month INTEGER
) RETURNS TABLE(
    valor_diario NUMERIC, 
    dias_uteis_mes INTEGER, 
    dias_feriados INTEGER, 
    dias_ausencia INTEGER, 
    dias_ferias INTEGER, 
    dias_licenca INTEGER, 
    dias_efetivos_trabalho INTEGER, 
    valor_bruto NUMERIC, 
    valor_desconto_ausencia NUMERIC, 
    valor_desconto_ferias NUMERIC, 
    valor_desconto_licenca NUMERIC, 
    valor_total_desconto NUMERIC, 
    valor_final NUMERIC
) LANGUAGE plpgsql AS $$
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
$$;