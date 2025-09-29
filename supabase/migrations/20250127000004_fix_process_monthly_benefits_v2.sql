-- ============================================================================
-- MIGRAÇÃO: CORRIGIR FUNÇÃO process_monthly_benefits V2
-- ============================================================================
--
-- Data: 2025-01-27
-- Descrição: Força a atualização da função process_monthly_benefits com criação
--           automática de benefícios padrão
--
-- ============================================================================

-- 1. Recriar a função process_monthly_benefits com criação automática de benefícios
CREATE OR REPLACE FUNCTION rh.process_monthly_benefits(
    p_company_id UUID,
    p_year INTEGER,
    p_month INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_employee_record RECORD;
  v_vr_va_config RECORD;
  v_transporte_config RECORD;
  v_vr_va_result RECORD;
  v_transporte_result RECORD;
  v_processed_count INTEGER := 0;
  v_vr_benefit_id UUID;
  v_va_benefit_id UUID;
  v_transporte_benefit_id UUID;
BEGIN
  -- Buscar ou criar benefícios padrão
  SELECT id INTO v_vr_benefit_id 
  FROM rh.benefits 
  WHERE company_id = p_company_id AND tipo = 'VR' AND is_active = true
  LIMIT 1;
  
  -- Se não encontrou VR, criar
  IF v_vr_benefit_id IS NULL THEN
    INSERT INTO rh.benefits (company_id, nome, tipo, is_active)
    VALUES (p_company_id, 'Vale Refeição', 'VR', true)
    RETURNING id INTO v_vr_benefit_id;
  END IF;
  
  SELECT id INTO v_va_benefit_id 
  FROM rh.benefits 
  WHERE company_id = p_company_id AND tipo = 'VA' AND is_active = true
  LIMIT 1;
  
  -- Se não encontrou VA, criar
  IF v_va_benefit_id IS NULL THEN
    INSERT INTO rh.benefits (company_id, nome, tipo, is_active)
    VALUES (p_company_id, 'Vale Alimentação', 'VA', true)
    RETURNING id INTO v_va_benefit_id;
  END IF;
  
  SELECT id INTO v_transporte_benefit_id 
  FROM rh.benefits 
  WHERE company_id = p_company_id AND tipo = 'transporte' AND is_active = true
  LIMIT 1;
  
  -- Se não encontrou Transporte, criar
  IF v_transporte_benefit_id IS NULL THEN
    INSERT INTO rh.benefits (company_id, nome, tipo, is_active)
    VALUES (p_company_id, 'Vale Transporte', 'transporte', true)
    RETURNING id INTO v_transporte_benefit_id;
  END IF;

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
          CASE WHEN v_vr_va_config.tipo = 'VR' THEN v_vr_benefit_id ELSE v_va_benefit_id END,
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
          v_transporte_benefit_id,
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
$$;

-- 2. Comentário da função
COMMENT ON FUNCTION rh.process_monthly_benefits(UUID, INTEGER, INTEGER) IS 
'Processa automaticamente os benefícios mensais (VR/VA e transporte) para todos os funcionários de uma empresa';
