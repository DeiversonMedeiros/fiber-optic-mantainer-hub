-- ============================================================================
-- MIGRAÇÃO: CORRIGIR CÁLCULO DE LOCAÇÃO DE EQUIPAMENTOS - LÓGICA SIMPLES
-- ============================================================================
--
-- Data: 2025-01-27
-- Descrição: Corrige o cálculo para usar 30 dias fixos, sem influência da escala de trabalho
--
-- Regras:
-- 1. Se não tem marcação de ponto: (R$ 100,00 / 30) * 0 = R$ 0,00
-- 2. Se ausentou 3 dias: (R$ 100,00 / 30) * 27 = R$ 90,00
-- 3. Escala de trabalho não tem influência
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
    v_absence_days INTEGER := 0;
    v_total_discount NUMERIC := 0;
    v_absence_details JSONB := '[]';
    v_absence_item JSONB;
    v_daily_value NUMERIC;
    v_original_monthly_value NUMERIC;
    v_clock_in_days INTEGER := 0;
    v_days_worked INTEGER := 0;
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

    -- Contar dias com marcação de ponto no mês
    SELECT COUNT(DISTINCT tr.data) INTO v_clock_in_days
    FROM rh.time_records tr
    WHERE tr.employee_id = v_equipment_record.employee_id
        AND tr.company_id = p_company_id
        AND EXTRACT(YEAR FROM tr.data) = p_year
        AND EXTRACT(MONTH FROM tr.data) = p_month;

    -- Calcular dias trabalhados (baseado em marcações de ponto)
    v_days_worked := v_clock_in_days;

    -- Calcular dias de ausência (30 - dias trabalhados)
    v_absence_days := 30 - v_days_worked;

    -- Se não há marcações de ponto, todos os 30 dias são considerados ausência
    IF v_clock_in_days = 0 THEN
        v_absence_days := 30;
        v_days_worked := 0;
        
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
        -- Adicionar detalhe da ausência baseada em dias não trabalhados
        IF v_absence_days > 0 THEN
            v_absence_item := json_build_object(
                'date_range', 'Dias sem marcação',
                'days', v_absence_days,
                'absence_type', 'Dias sem marcação de ponto',
                'reason', 'Dias do mês sem registro de ponto',
                'is_billable', true
            );
            v_absence_details := v_absence_details || v_absence_item;
        END IF;
    END IF;

    -- Calcular valor final: (valor mensal / 30) * dias trabalhados
    v_equipment_record.monthly_value := (v_original_monthly_value / 30) * v_days_worked;
    
    -- Calcular desconto: valor original - valor final
    v_total_discount := v_original_monthly_value - v_equipment_record.monthly_value;

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
        v_days_worked,             -- Dias trabalhados (com marcação de ponto)
        v_absence_days,            -- Dias de ausência (30 - dias trabalhados)
        v_total_discount,          -- Desconto total
        v_equipment_record.monthly_value,  -- Valor final
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
'Calcula desconto por ausência para um equipamento específico usando 30 dias fixos, sem influência da escala de trabalho';

COMMENT ON FUNCTION rh.calculate_all_equipment_rental_absence_discounts(UUID, INTEGER, INTEGER) IS 
'Calcula descontos por ausência para todos os equipamentos ativos de uma empresa usando 30 dias fixos, sem influência da escala de trabalho';
