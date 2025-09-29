-- ============================================================================
-- MIGRAÇÃO: CORRIGIR ERRO DE TIPO CHARACTER VARYING(20) VS TEXT NA COLUNA 5
-- ============================================================================
--
-- Data: 2025-01-27
-- Descrição: Corrige o erro de tipo na coluna 5 (equipment_type) que é
--           character varying(20) na tabela mas TEXT na função
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

    -- Calcular dias de trabalho usando a função existente
    SELECT * INTO v_work_days_result
    FROM rh.calculate_employee_work_days(
        v_equipment_record.employee_id,
        p_company_id,
        p_year,
        p_month
    );

    -- Calcular valor diário baseado nos dias de trabalho reais
    -- Se não há dias de trabalho, usar 30 como fallback
    IF v_work_days_result.effective_work_days > 0 THEN
        v_equipment_record.monthly_value := v_equipment_record.monthly_value / 30 * v_work_days_result.effective_work_days;
    END IF;

    -- Buscar dias de ausência
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

    -- Calcular desconto
    v_total_discount := v_absence_days * (v_equipment_record.monthly_value / 30);

    -- Retornar resultado
    RETURN QUERY
    SELECT 
        v_equipment_record.id,
        v_equipment_record.employee_id,
        v_equipment_record.employee_name,
        v_equipment_record.equipment_name,
        v_equipment_record.equipment_type,
        p_year || '-' || LPAD(p_month::TEXT, 2, '0') as period,
        v_equipment_record.monthly_value,
        v_equipment_record.monthly_value / 30 as daily_value,
        v_work_days_result.effective_work_days,
        v_absence_days,
        v_total_discount,
        v_equipment_record.monthly_value - v_total_discount,
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
'Calcula desconto por ausência para um equipamento específico considerando a escala de trabalho do funcionário';

COMMENT ON FUNCTION rh.calculate_all_equipment_rental_absence_discounts(UUID, INTEGER, INTEGER) IS 
'Calcula descontos por ausência para todos os equipamentos ativos de uma empresa considerando escalas flexíveis';
