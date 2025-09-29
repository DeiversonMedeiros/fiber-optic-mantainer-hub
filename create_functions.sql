-- Funções críticas do sistema

-- Função para calcular dias trabalhados
CREATE OR REPLACE FUNCTION rh.calculate_employee_work_days(
    p_employee_id UUID,
    p_reference_month DATE
) RETURNS INTEGER AS $$
DECLARE
    work_days INTEGER := 0;
    current_date DATE;
    month_start DATE;
    month_end DATE;
    is_work_day BOOLEAN;
    is_holiday BOOLEAN;
    is_absence BOOLEAN;
    is_vacation BOOLEAN;
BEGIN
    -- Definir início e fim do mês
    month_start := DATE_TRUNC('month', p_reference_month)::DATE;
    month_end := (DATE_TRUNC('month', p_reference_month) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    
    current_date := month_start;
    
    WHILE current_date <= month_end LOOP
        -- Verificar se é dia útil (segunda a sexta)
        is_work_day := EXTRACT(DOW FROM current_date) BETWEEN 1 AND 5;
        
        -- Verificar se é feriado
        SELECT EXISTS(
            SELECT 1 FROM rh.holidays 
            WHERE holiday_date = current_date 
            AND company_id = (SELECT company_id FROM rh.employees WHERE id = p_employee_id)
            AND is_active = true
        ) INTO is_holiday;
        
        -- Verificar se é ausência
        SELECT EXISTS(
            SELECT 1 FROM rh.employee_absences 
            WHERE employee_id = p_employee_id 
            AND absence_date = current_date
            AND is_justified = false
        ) INTO is_absence;
        
        -- Verificar se está de férias
        SELECT EXISTS(
            SELECT 1 FROM rh.vacations 
            WHERE employee_id = p_employee_id 
            AND data_inicio <= current_date 
            AND data_fim >= current_date
            AND status = 'aprovado'
        ) INTO is_vacation;
        
        -- Contar como dia trabalhado se for dia útil e não for feriado/ausência/férias
        IF is_work_day AND NOT is_holiday AND NOT is_absence AND NOT is_vacation THEN
            work_days := work_days + 1;
        END IF;
        
        current_date := current_date + INTERVAL '1 day';
    END LOOP;
    
    RETURN work_days;
END;
$$ LANGUAGE plpgsql;

-- Função para processar benefícios mensais
CREATE OR REPLACE FUNCTION rh.process_monthly_benefits_unified(
    p_company_id UUID,
    p_reference_month DATE
) RETURNS TABLE(
    processing_id UUID,
    total_employees INTEGER,
    total_amount NUMERIC
) AS $$
DECLARE
    v_processing_id UUID;
    v_total_employees INTEGER := 0;
    v_total_amount NUMERIC := 0;
    v_employee_record RECORD;
    v_benefit_amount NUMERIC;
    v_work_days INTEGER;
BEGIN
    -- Criar registro de processamento
    INSERT INTO rh.monthly_benefit_processing (
        company_id, reference_month, status, processed_at
    ) VALUES (
        p_company_id, p_reference_month, 'calculated', NOW()
    ) RETURNING id INTO v_processing_id;
    
    -- Processar cada funcionário
    FOR v_employee_record IN 
        SELECT e.id, e.nome, e.company_id
        FROM rh.employees e
        WHERE e.company_id = p_company_id
        AND e.status = 'ativo'
    LOOP
        -- Calcular dias trabalhados
        v_work_days := rh.calculate_employee_work_days(v_employee_record.id, p_reference_month);
        
        -- Calcular benefícios baseado nas configurações
        SELECT COALESCE(SUM(
            CASE bc.calculation_type
                WHEN 'fixed_value' THEN bc.base_value
                WHEN 'daily_value' THEN bc.base_value * v_work_days
                WHEN 'percentage' THEN 0 -- Implementar cálculo de percentual
                ELSE 0
            END
        ), 0)
        INTO v_benefit_amount
        FROM rh.benefit_configurations bc
        JOIN rh.employee_benefit_assignments eba ON eba.benefit_config_id = bc.id
        WHERE eba.employee_id = v_employee_record.id
        AND eba.is_active = true
        AND bc.is_active = true;
        
        -- Inserir no histórico
        INSERT INTO rh.funcionario_beneficios_historico (
            employee_id, company_id, benefit_type, amount, reference_month, status
        ) VALUES (
            v_employee_record.id, p_company_id, 'unified', v_benefit_amount, p_reference_month, 'calculated'
        );
        
        v_total_employees := v_total_employees + 1;
        v_total_amount := v_total_amount + v_benefit_amount;
    END LOOP;
    
    -- Atualizar totalizadores
    UPDATE rh.monthly_benefit_processing 
    SET total_employees = v_total_employees, total_amount = v_total_amount
    WHERE id = v_processing_id;
    
    -- Retornar resultado
    RETURN QUERY SELECT v_processing_id, v_total_employees, v_total_amount;
END;
$$ LANGUAGE plpgsql;

-- Função para validar benefícios
CREATE OR REPLACE FUNCTION rh.validate_monthly_benefits(
    p_processing_id UUID,
    p_validated_by UUID
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE rh.monthly_benefit_processing 
    SET status = 'validated', validated_at = NOW(), validated_by = p_validated_by
    WHERE id = p_processing_id;
    
    -- Atualizar status no histórico
    UPDATE rh.funcionario_beneficios_historico 
    SET status = 'validated'
    WHERE company_id = (SELECT company_id FROM rh.monthly_benefit_processing WHERE id = p_processing_id)
    AND reference_month = (SELECT reference_month FROM rh.monthly_benefit_processing WHERE id = p_processing_id);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Função para trigger de updated_at
CREATE OR REPLACE FUNCTION rh.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;





