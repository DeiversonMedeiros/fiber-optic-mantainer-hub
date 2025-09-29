-- =====================================================
-- MIGRAÇÃO: RPCs UNIFICADAS PARA PROCESSAMENTO DE BENEFÍCIOS
-- =====================================================
-- Esta migração cria as funções RPC unificadas para processamento de benefícios

-- 1. FUNÇÃO PARA PROCESSAR BENEFÍCIOS MENSALMENTE
-- =====================================================

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
    v_work_days_result RECORD;
    v_employee RECORD;
    v_benefit_config RECORD;
    v_employee_benefit RECORD;
    v_calculated_value NUMERIC;
    v_discount_value NUMERIC;
    v_final_value NUMERIC;
    v_work_days INTEGER;
    v_absence_days INTEGER;
    v_processing_id UUID;
BEGIN
    -- Limpar processamentos existentes para o mês/ano
    DELETE FROM rh.monthly_benefit_processing 
    WHERE company_id = p_company_id 
    AND month_reference = p_month 
    AND year_reference = p_year;

    -- Processar cada funcionário ativo da empresa
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
                    v_calculated_value := COALESCE(v_employee_benefit.custom_value, v_benefit_config.base_value, 0);
                    
                WHEN 'daily_value' THEN
                    -- Para equipamentos, usar base fixa de 30 dias
                    IF v_benefit_config.benefit_type = 'equipment_rental' THEN
                        v_calculated_value := (COALESCE(v_employee_benefit.custom_value, v_benefit_config.base_value, 0) / 30) * v_work_days;
                    ELSE
                        -- Para outros benefícios, usar base de dias úteis
                        v_calculated_value := (COALESCE(v_employee_benefit.custom_value, v_benefit_config.base_value, 0) / v_benefit_config.daily_calculation_base) * v_work_days;
                    END IF;
                    
                WHEN 'percentage' THEN
                    -- Buscar salário do funcionário
                    SELECT COALESCE(salario_base, 0) INTO v_calculated_value
                    FROM rh.employees 
                    WHERE id = v_employee.id;
                    
                    v_calculated_value := v_calculated_value * (COALESCE(v_employee_benefit.custom_percentage, v_benefit_config.percentage_value, 0) / 100);
                    
                WHEN 'production_based' THEN
                    -- Para premiação por produção, usar valor de produção (se disponível)
                    v_calculated_value := COALESCE(v_employee_benefit.custom_value, 0) * (v_benefit_config.production_percentage / 100);
                    
                WHEN 'goal_based' THEN
                    -- Para premiação por meta, usar valor fixo (metas serão implementadas futuramente)
                    v_calculated_value := COALESCE(v_employee_benefit.custom_value, v_benefit_config.base_value, 0);
                    
                ELSE
                    v_calculated_value := 0;
            END CASE;
            
            -- Aplicar limites para benefícios variáveis
            IF v_benefit_config.benefit_type = 'premiacao' AND v_benefit_config.calculation_type = 'fixed_value' THEN
                IF v_benefit_config.min_value IS NOT NULL AND v_calculated_value < v_benefit_config.min_value THEN
                    v_calculated_value := v_benefit_config.min_value;
                END IF;
                IF v_benefit_config.max_value IS NOT NULL AND v_calculated_value > v_benefit_config.max_value THEN
                    v_calculated_value := v_benefit_config.max_value;
                END IF;
            END IF;
            
            -- Calcular desconto por ausência
            v_discount_value := 0;
            IF v_benefit_config.apply_absence_discount AND v_absence_days > 0 THEN
                IF v_benefit_config.benefit_type = 'equipment_rental' THEN
                    -- Para equipamentos, desconto proporcional aos dias de ausência
                    v_discount_value := (v_benefit_config.base_value / 30) * v_absence_days;
                ELSE
                    -- Para outros benefícios, desconto por percentual configurado
                    v_discount_value := v_calculated_value * (v_benefit_config.absence_discount_percentage / 100);
                END IF;
            END IF;
            
            -- Calcular valor final
            v_final_value := GREATEST(0, v_calculated_value - v_discount_value);
            
            -- Inserir processamento
            INSERT INTO rh.monthly_benefit_processing (
                employee_id,
                benefit_config_id,
                company_id,
                month_reference,
                year_reference,
                base_value,
                work_days,
                absence_days,
                discount_value,
                final_value,
                production_value,
                production_percentage,
                status,
                calculation_details,
                processed_at
            ) VALUES (
                v_employee.id,
                v_benefit_config.id,
                p_company_id,
                p_month,
                p_year,
                v_calculated_value,
                v_work_days,
                v_absence_days,
                v_discount_value,
                v_final_value,
                CASE WHEN v_benefit_config.calculation_type = 'production_based' THEN COALESCE(v_employee_benefit.custom_value, 0) ELSE NULL END,
                CASE WHEN v_benefit_config.calculation_type = 'production_based' THEN v_benefit_config.production_percentage ELSE NULL END,
                'calculated',
                jsonb_build_object(
                    'calculation_type', v_benefit_config.calculation_type,
                    'base_value', v_benefit_config.base_value,
                    'custom_value', v_employee_benefit.custom_value,
                    'custom_percentage', v_employee_benefit.custom_percentage,
                    'work_days', v_work_days,
                    'absence_days', v_absence_days,
                    'absence_discount_percentage', v_benefit_config.absence_discount_percentage
                ),
                CURRENT_TIMESTAMP
            ) RETURNING id INTO v_processing_id;
            
            -- Retornar resultado
            RETURN QUERY SELECT
                v_employee.id,
                v_employee.nome,
                v_benefit_config.benefit_type,
                v_benefit_config.name,
                v_calculated_value,
                v_work_days,
                v_absence_days,
                v_discount_value,
                v_final_value,
                'calculated'::rh.processing_status_enum;
        END LOOP;
    END LOOP;
END;
$$;

-- 2. FUNÇÃO PARA VALIDAR PROCESSAMENTO MENSAL
-- =====================================================

CREATE OR REPLACE FUNCTION rh.validate_monthly_benefits_processing(
    p_company_id UUID,
    p_month INTEGER,
    p_year INTEGER,
    p_employee_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    processing_id UUID,
    employee_name VARCHAR,
    benefit_name VARCHAR,
    final_value NUMERIC,
    status rh.processing_status_enum
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Atualizar status para validado
    UPDATE rh.monthly_benefit_processing 
    SET 
        status = 'validated',
        validated_at = CURRENT_TIMESTAMP,
        validated_by = auth.uid()
    WHERE company_id = p_company_id 
    AND month_reference = p_month 
    AND year_reference = p_year
    AND (p_employee_ids IS NULL OR employee_id = ANY(p_employee_ids))
    AND status = 'calculated';
    
    -- Retornar resultados validados
    RETURN QUERY
    SELECT 
        mbp.id,
        e.nome,
        bc.name,
        mbp.final_value,
        mbp.status
    FROM rh.monthly_benefit_processing mbp
    JOIN rh.employees e ON e.id = mbp.employee_id
    JOIN rh.benefit_configurations bc ON bc.id = mbp.benefit_config_id
    WHERE mbp.company_id = p_company_id 
    AND mbp.month_reference = p_month 
    AND mbp.year_reference = p_year
    AND (p_employee_ids IS NULL OR mbp.employee_id = ANY(p_employee_ids))
    AND mbp.status = 'validated';
END;
$$;

-- 3. FUNÇÃO PARA CRIAR PAGAMENTOS EM MASSA
-- =====================================================

CREATE OR REPLACE FUNCTION rh.create_bulk_benefit_payments(
    p_company_id UUID,
    p_month INTEGER,
    p_year INTEGER,
    p_payment_method rh.payment_method_enum,
    p_employee_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
    payment_id UUID,
    employee_name VARCHAR,
    benefit_name VARCHAR,
    payment_value NUMERIC,
    payment_status VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_processing RECORD;
    v_payment_id UUID;
    v_employee_name VARCHAR;
    v_benefit_name VARCHAR;
BEGIN
    -- Criar pagamentos para processamentos validados
    FOR v_processing IN
        SELECT 
            mbp.id as processing_id,
            mbp.employee_id,
            mbp.final_value,
            e.nome as employee_name,
            bc.name as benefit_name,
            bc.flash_category
        FROM rh.monthly_benefit_processing mbp
        JOIN rh.employees e ON e.id = mbp.employee_id
        JOIN rh.benefit_configurations bc ON bc.id = mbp.benefit_config_id
        WHERE mbp.company_id = p_company_id 
        AND mbp.month_reference = p_month 
        AND mbp.year_reference = p_year
        AND mbp.status = 'validated'
        AND (p_employee_ids IS NULL OR mbp.employee_id = ANY(p_employee_ids))
        AND mbp.final_value > 0
    LOOP
        -- Inserir pagamento
        INSERT INTO rh.benefit_payments (
            processing_id,
            company_id,
            payment_method,
            payment_status,
            payment_value,
            employee_name,
            employee_document,
            created_by
        ) VALUES (
            v_processing.processing_id,
            p_company_id,
            p_payment_method,
            'pending',
            v_processing.final_value,
            v_processing.employee_name,
            (SELECT cpf FROM rh.employees WHERE id = v_processing.employee_id),
            auth.uid()
        ) RETURNING id INTO v_payment_id;
        
        -- Atualizar status do processamento
        UPDATE rh.monthly_benefit_processing 
        SET status = 'paid'
        WHERE id = v_processing.processing_id;
        
        -- Retornar resultado
        RETURN QUERY SELECT
            v_payment_id,
            v_processing.employee_name,
            v_processing.benefit_name,
            v_processing.final_value,
            'pending'::VARCHAR;
    END LOOP;
END;
$$;

-- 4. FUNÇÃO PARA ESTATÍSTICAS DE BENEFÍCIOS
-- =====================================================

CREATE OR REPLACE FUNCTION rh.get_benefits_statistics(
    p_company_id UUID,
    p_month INTEGER DEFAULT NULL,
    p_year INTEGER DEFAULT NULL
)
RETURNS TABLE (
    benefit_type rh.benefit_type_enum,
    total_configurations INTEGER,
    active_configurations INTEGER,
    total_assignments INTEGER,
    active_assignments INTEGER,
    total_processed_value NUMERIC,
    total_paid_value NUMERIC,
    pending_value NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bc.benefit_type,
        COUNT(DISTINCT bc.id)::INTEGER as total_configurations,
        COUNT(DISTINCT CASE WHEN bc.is_active THEN bc.id END)::INTEGER as active_configurations,
        COUNT(DISTINCT eba.id)::INTEGER as total_assignments,
        COUNT(DISTINCT CASE WHEN eba.is_active THEN eba.id END)::INTEGER as active_assignments,
        COALESCE(SUM(mbp.final_value), 0) as total_processed_value,
        COALESCE(SUM(CASE WHEN mbp.status = 'paid' THEN mbp.final_value ELSE 0 END), 0) as total_paid_value,
        COALESCE(SUM(CASE WHEN mbp.status IN ('calculated', 'validated') THEN mbp.final_value ELSE 0 END), 0) as pending_value
    FROM rh.benefit_configurations bc
    LEFT JOIN rh.employee_benefit_assignments eba ON eba.benefit_config_id = bc.id
    LEFT JOIN rh.monthly_benefit_processing mbp ON (
        mbp.benefit_config_id = bc.id 
        AND (p_month IS NULL OR mbp.month_reference = p_month)
        AND (p_year IS NULL OR mbp.year_reference = p_year)
    )
    WHERE bc.company_id = p_company_id
    GROUP BY bc.benefit_type
    ORDER BY bc.benefit_type;
END;
$$;

-- 5. FUNÇÃO PARA IMPORTAR PREMIAÇÕES EM MASSA
-- =====================================================

CREATE OR REPLACE FUNCTION rh.import_bulk_premiacoes(
    p_company_id UUID,
    p_premiacoes JSONB
)
RETURNS TABLE (
    employee_id UUID,
    employee_name VARCHAR,
    benefit_config_id UUID,
    benefit_name VARCHAR,
    value NUMERIC,
    success BOOLEAN,
    error_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_premiacao JSONB;
    v_employee_id UUID;
    v_benefit_config_id UUID;
    v_value NUMERIC;
    v_success BOOLEAN;
    v_error_message TEXT;
    v_employee_name VARCHAR;
    v_benefit_name VARCHAR;
BEGIN
    -- Processar cada premiação do JSON
    FOR v_premiacao IN SELECT * FROM jsonb_array_elements(p_premiacoes)
    LOOP
        v_success := false;
        v_error_message := NULL;
        
        BEGIN
            -- Extrair dados da premiação
            v_employee_id := (v_premiacao->>'employee_id')::UUID;
            v_value := (v_premiacao->>'value')::NUMERIC;
            
            -- Buscar funcionário
            SELECT nome INTO v_employee_name
            FROM rh.employees 
            WHERE id = v_employee_id AND company_id = p_company_id;
            
            IF v_employee_name IS NULL THEN
                v_error_message := 'Funcionário não encontrado';
                CONTINUE;
            END IF;
            
            -- Buscar configuração de premiação padrão ou criar uma
            SELECT id, name INTO v_benefit_config_id, v_benefit_name
            FROM rh.benefit_configurations 
            WHERE company_id = p_company_id 
            AND benefit_type = 'premiacao'
            AND is_active = true
            LIMIT 1;
            
            IF v_benefit_config_id IS NULL THEN
                -- Criar configuração padrão de premiação
                INSERT INTO rh.benefit_configurations (
                    company_id,
                    benefit_type,
                    name,
                    description,
                    calculation_type,
                    base_value,
                    is_active,
                    flash_category
                ) VALUES (
                    p_company_id,
                    'premiacao',
                    'Premiação Importada',
                    'Configuração criada automaticamente para importação',
                    'fixed_value',
                    0,
                    true,
                    'PREMIACAO VIRTUAL'
                ) RETURNING id, name INTO v_benefit_config_id, v_benefit_name;
            END IF;
            
            -- Criar vínculo temporário para o mês atual
            INSERT INTO rh.employee_benefit_assignments (
                employee_id,
                benefit_config_id,
                company_id,
                start_date,
                end_date,
                custom_value,
                is_active
            ) VALUES (
                v_employee_id,
                v_benefit_config_id,
                p_company_id,
                DATE_TRUNC('month', CURRENT_DATE),
                LAST_DAY(CURRENT_DATE),
                v_value,
                true
            ) ON CONFLICT (employee_id, benefit_config_id, start_date) 
            DO UPDATE SET 
                custom_value = v_value,
                updated_at = CURRENT_TIMESTAMP;
            
            v_success := true;
            
        EXCEPTION WHEN OTHERS THEN
            v_error_message := SQLERRM;
        END;
        
        -- Retornar resultado
        RETURN QUERY SELECT
            v_employee_id,
            v_employee_name,
            v_benefit_config_id,
            v_benefit_name,
            v_value,
            v_success,
            v_error_message;
    END LOOP;
END;
$$;

-- 6. COMENTÁRIOS DAS FUNÇÕES
-- =====================================================

COMMENT ON FUNCTION rh.process_monthly_benefits_unified IS 'Processa todos os benefícios de uma empresa para um mês/ano específico';
COMMENT ON FUNCTION rh.validate_monthly_benefits_processing IS 'Valida processamentos de benefícios calculados';
COMMENT ON FUNCTION rh.create_bulk_benefit_payments IS 'Cria pagamentos em massa para benefícios validados';
COMMENT ON FUNCTION rh.get_benefits_statistics IS 'Retorna estatísticas de benefícios por tipo';
COMMENT ON FUNCTION rh.import_bulk_premiacoes IS 'Importa premiações em massa via JSON';
