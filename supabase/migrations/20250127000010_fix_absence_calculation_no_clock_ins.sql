-- ============================================================================
-- MIGRAÇÃO: CORRIGIR CÁLCULO DE AUSÊNCIAS PARA FUNCIONÁRIOS SEM MARCAÇÕES DE PONTO
-- ============================================================================
--
-- Data: 2025-01-27
-- Descrição: Corrige o cálculo de ausências para considerar funcionários que não
--           registraram nenhuma marcação de ponto no mês de referência
--
-- ============================================================================

-- 1. Corrigir função para calcular desconto por ausência para um equipamento específico
DROP FUNCTION IF EXISTS rh.calculate_equipment_rental_absence_discount(UUID, UUID, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION rh.calculate_equipment_rental_absence_discount(
    p_equipment_rental_id UUID,
    p_company_id UUID,
    p_year INTEGER,
    p_month INTEGER
) RETURNS TABLE(
    equipment_rental_id UUID,
    employee_id UUID,
    employee_name TEXT,
    equipment_name CHARACTER VARYING(255),
    equipment_type CHARACTER VARYING(20),
    period TEXT,
    monthly_value NUMERIC,
    daily_value NUMERIC,
    work_days INTEGER,
    absence_days INTEGER,
    total_discount NUMERIC,
    final_value NUMERIC,
    absence_details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_equipment_record RECORD;
    v_work_days_result RECORD;
    v_absence_days INTEGER := 0;
    v_total_discount NUMERIC := 0;
    v_absence_details JSONB := '[]';
    v_absence_item JSONB;
    v_daily_value NUMERIC;
    v_original_monthly_value NUMERIC;
    v_clock_in_days INTEGER := 0;
    v_total_days_in_month INTEGER;
BEGIN
    -- Buscar dados do equipamento
    SELECT 
        er.id,
        er.employee_id,
        e.nome as employee_name,
        er.equipment_name,
        er.equipment_type,
        er.monthly_value
    INTO v_equipment_record
    FROM rh.equipment_rentals er
    JOIN rh.employees e ON e.id = er.employee_id
    WHERE er.id = p_equipment_rental_id
        AND er.company_id = p_company_id
        AND er.status = 'active';

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Guardar o valor original mensal
    v_original_monthly_value := v_equipment_record.monthly_value;
    
    -- Calcular valor diário fixo (valor mensal / 30 dias)
    v_daily_value := v_original_monthly_value / 30;

    -- Calcular dias de trabalho usando a função existente
    SELECT * INTO v_work_days_result
    FROM rh.calculate_employee_work_days(
        v_equipment_record.employee_id,
        p_company_id,
        p_year,
        p_month
    );

    -- Contar dias com marcação de ponto no mês
    SELECT COUNT(DISTINCT tr.data) INTO v_clock_in_days
    FROM rh.time_records tr
    WHERE tr.employee_id = v_equipment_record.employee_id
        AND tr.company_id = p_company_id
        AND EXTRACT(YEAR FROM tr.data) = p_year
        AND EXTRACT(MONTH FROM tr.data) = p_month;

    -- Calcular total de dias no mês
    v_total_days_in_month := EXTRACT(DAY FROM (make_date(p_year, p_month, 1) + INTERVAL '1 month' - INTERVAL '1 day'));

    -- Se não há marcações de ponto, considerar todos os dias úteis como ausência
    IF v_clock_in_days = 0 THEN
        -- Usar dias efetivos de trabalho da escala como base para ausências
        v_absence_days := v_work_days_result.effective_work_days;
        
        -- Adicionar detalhe da ausência
        v_absence_item := json_build_object(
            'date_range', 'Todo o mês',
            'days', v_absence_days,
            'absence_type', 'Sem marcações de ponto',
            'reason', 'Funcionário não registrou nenhuma marcação de ponto no mês',
            'is_billable', true
        );
        v_absence_details := v_absence_details || v_absence_item;
    ELSE
        -- Buscar dias de ausência aprovadas (férias, licenças, etc.)
        SELECT COUNT(*) INTO v_absence_days
        FROM rh.employee_absences ea
        WHERE ea.employee_id = v_equipment_record.employee_id
            AND ea.company_id = p_company_id
            AND ea.is_active = true
            AND ea.status = 'approved'
            AND (
                (ea.start_date <= make_date(p_year, p_month, 1) + INTERVAL '1 month' - INTERVAL '1 day'
                 AND ea.end_date >= make_date(p_year, p_month, 1))
                OR (ea.start_date BETWEEN make_date(p_year, p_month, 1) 
                    AND make_date(p_year, p_month, 1) + INTERVAL '1 month' - INTERVAL '1 day')
                OR (ea.end_date BETWEEN make_date(p_year, p_month, 1) 
                    AND make_date(p_year, p_month, 1) + INTERVAL '1 month' - INTERVAL '1 day')
            );
    END IF;

    -- Calcular desconto: dias de ausência * valor diário
    v_total_discount := v_absence_days * v_daily_value;
    
    -- Calcular valor final: valor original - desconto
    v_equipment_record.monthly_value := v_original_monthly_value - v_total_discount;

    -- Retornar resultado
    RETURN QUERY
    SELECT 
        v_equipment_record.id,
        v_equipment_record.employee_id,
        v_equipment_record.employee_name,
        v_equipment_record.equipment_name,
        v_equipment_record.equipment_type,
        p_year || '-' || LPAD(p_month::TEXT, 2, '0') as period,
        v_original_monthly_value,  -- Valor original mensal
        v_daily_value,             -- Valor diário
        v_work_days_result.effective_work_days,
        v_absence_days,
        v_total_discount,
        v_equipment_record.monthly_value,  -- Valor final após desconto
        v_absence_details;
END;
$$;

-- 2. Corrigir função para calcular descontos para todos os equipamentos de uma empresa
DROP FUNCTION IF EXISTS rh.calculate_all_equipment_rental_absence_discounts(UUID, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION rh.calculate_all_equipment_rental_absence_discounts(
    p_company_id UUID,
    p_year INTEGER,
    p_month INTEGER
) RETURNS TABLE(
    equipment_rental_id UUID,
    employee_id UUID,
    employee_name TEXT,
    equipment_name CHARACTER VARYING(255),
    equipment_type CHARACTER VARYING(20),
    period TEXT,
    monthly_value NUMERIC,
    daily_value NUMERIC,
    work_days INTEGER,
    absence_days INTEGER,
    total_discount NUMERIC,
    final_value NUMERIC,
    absence_details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_equipment_record RECORD;
BEGIN
    -- Loop por todos os equipamentos ativos da empresa
    FOR v_equipment_record IN
        SELECT id
        FROM rh.equipment_rentals
        WHERE company_id = p_company_id
            AND status = 'active'
    LOOP
        -- Retornar resultado para cada equipamento
        RETURN QUERY
        SELECT * FROM rh.calculate_equipment_rental_absence_discount(
            v_equipment_record.id,
            p_company_id,
            p_year,
            p_month
        );
    END LOOP;
END;
$$;

-- 3. Comentários das funções
COMMENT ON FUNCTION rh.calculate_equipment_rental_absence_discount(UUID, UUID, INTEGER, INTEGER) IS 
'Calcula desconto por ausência para um equipamento específico, considerando funcionários sem marcações de ponto';

COMMENT ON FUNCTION rh.calculate_all_equipment_rental_absence_discounts(UUID, INTEGER, INTEGER) IS 
'Calcula descontos por ausência para todos os equipamentos ativos de uma empresa, considerando funcionários sem marcações de ponto';
