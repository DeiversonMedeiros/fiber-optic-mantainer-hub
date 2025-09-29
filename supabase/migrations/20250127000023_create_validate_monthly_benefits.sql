-- Função para validar benefícios mensais
CREATE OR REPLACE FUNCTION rh.validate_monthly_benefits(
    p_company_id UUID,
    p_month INTEGER,
    p_year INTEGER
)
RETURNS TABLE(
    validated_count INTEGER,
    error_count INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_validated_count INTEGER := 0;
    v_error_count INTEGER := 0;
BEGIN
    -- Atualizar status para 'validated' dos registros processados
    UPDATE rh.monthly_benefit_processing 
    SET status = 'validated', 
        updated_at = NOW()
    WHERE company_id = p_company_id 
      AND month_reference = p_month 
      AND year_reference = p_year 
      AND status = 'calculated';
    
    -- Contar registros validados
    GET DIAGNOSTICS v_validated_count = ROW_COUNT;
    
    -- Retornar contadores
    RETURN QUERY SELECT v_validated_count, v_error_count;
END;
$$;
