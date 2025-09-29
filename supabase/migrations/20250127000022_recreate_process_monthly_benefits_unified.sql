-- Recriar a função process_monthly_benefits_unified com a correção
-- Primeiro, vamos dropar a função existente

DROP FUNCTION IF EXISTS rh.process_monthly_benefits_unified(UUID, INTEGER, INTEGER);

-- Recriar a função com a assinatura correta
CREATE OR REPLACE FUNCTION rh.process_monthly_benefits_unified(
    p_company_id UUID,
    p_month INTEGER,
    p_year INTEGER
)
RETURNS TABLE (
    employee_id UUID,
    employee_name VARCHAR,
    benefit_type rh.benefit_type_enum,
    benefit_name VARCHAR,
    base_value NUMERIC,
    work_days INTEGER,
    absence_days INTEGER,
    discount_value NUMERIC,
    final_value NUMERIC,
    status rh.processing_status_enum
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_employee RECORD;
    v_employee_benefit RECORD;
    v_work_days_result RECORD;
    v_benefit_config RECORD;
    v_work_days INTEGER;
    v_absence_days INTEGER;
    v_base_value NUMERIC;
    v_discount_value NUMERIC;
    v_final_value NUMERIC;
    v_processing_id UUID;
BEGIN
    -- Criar registro de processamento
    INSERT INTO rh.monthly_benefit_processing (
        company_id,
        month_reference,
        year_reference,
        status,
        created_at
    ) VALUES (
        p_company_id,
        p_month,
        p_year,
        'pending',
        NOW()
    ) RETURNING id INTO v_processing_id;
    
    -- Processar cada funcionário ativo
    FOR v_employee IN
        SELECT e.id, e.nome, e.matricula
        FROM rh.employees e
        WHERE e.company_id = p_company_id 
        AND e.status = 'ativo'
    LOOP
        -- Calcular dias trabalhados para o funcionário
        SELECT * INTO v_work_days_result
        FROM rh.calculate_employee_work_days(
            v_employee.id, 
            p_company_id,
            p_year, 
            p_month
        );
        
        v_work_days := COALESCE(v_work_days_result.effective_work_days, 0);
        v_absence_days := COALESCE(v_work_days_result.absences_count, 0);
        
        -- Processar cada benefício ativo do funcionário
        FOR v_employee_benefit IN
            SELECT eba.*, bc.*
            FROM rh.employee_benefit_assignments eba
            JOIN rh.benefit_configurations bc ON bc.id = eba.benefit_config_id
            WHERE eba.employee_id = v_employee.id
            AND eba.is_active = true
            AND bc.is_active = true
            AND (eba.end_date IS NULL OR eba.end_date >= DATE(p_year || '-' || p_month || '-01'))
            AND eba.start_date <= LAST_DAY(DATE(p_year || '-' || p_month || '-01'))
        LOOP
            v_benefit_config := v_employee_benefit;
            
            -- Calcular valor base conforme tipo de cálculo
            CASE v_benefit_config.calculation_type
                WHEN 'fixed_value' THEN
                    v_base_value := COALESCE(v_benefit_config.base_value, 0);
                WHEN 'daily_value' THEN
                    v_base_value := COALESCE(v_benefit_config.base_value, 0) * v_work_days;
                WHEN 'percentage' THEN
                    v_base_value := COALESCE(v_benefit_config.percentage_value, 0) * v_work_days / 100;
                ELSE
                    v_base_value := 0;
            END CASE;
            
            -- Calcular desconto por ausência (simplificado)
            v_discount_value := 0;
            IF v_absence_days > 0 AND v_benefit_config.calculation_type = 'daily_value' THEN
                v_discount_value := COALESCE(v_benefit_config.base_value, 0) * v_absence_days;
            END IF;
            
            -- Calcular valor final
            v_final_value := v_base_value - v_discount_value;
            
            -- Inserir resultado do processamento
            INSERT INTO rh.monthly_benefit_processing (
                company_id,
                employee_id,
                benefit_config_id,
                month_reference,
                year_reference,
                calculated_value,
                work_days,
                absence_days,
                status,
                processing_id,
                created_at
            ) VALUES (
                p_company_id,
                v_employee.id,
                v_employee_benefit.benefit_config_id,
                p_month,
                p_year,
                v_final_value,
                v_work_days,
                v_absence_days,
                'calculated',
                v_processing_id,
                NOW()
            );
            
            -- Retornar resultado
            RETURN QUERY SELECT 
                v_employee.id,
                v_employee.nome::VARCHAR,
                v_benefit_config.benefit_type,
                v_benefit_config.name::VARCHAR,
                v_base_value,
                v_work_days,
                v_absence_days,
                v_discount_value,
                v_final_value,
                'calculated'::rh.processing_status_enum;
        END LOOP;
    END LOOP;
    
    -- Atualizar status do processamento principal
    UPDATE rh.monthly_benefit_processing 
    SET status = 'calculated', updated_at = NOW()
    WHERE id = v_processing_id;
    
    RETURN;
END;
$$;

COMMENT ON FUNCTION rh.process_monthly_benefits_unified IS 'Processa todos os benefícios de uma empresa para um mês/ano específico';
