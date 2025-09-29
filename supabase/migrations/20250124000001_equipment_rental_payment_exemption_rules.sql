-- ============================================================================
-- MIGRAÇÃO: REGRAS DE ISENÇÃO PARA PAGAMENTO DE LOCAÇÃO DE EQUIPAMENTOS
-- ============================================================================
-- 
-- Data: 2025-01-24
-- Descrição: Implementa regras para não descontar dias de atestado e 
--           compensação de horas aprovada do pagamento de locação de equipamentos
--
-- Regras implementadas:
-- 1. Dias de atestado médico (medical_certificate_url não nulo) não descontam
-- 2. Dias com compensação de horas aprovada não descontam
--
-- ============================================================================

-- Função para calcular pagamento de locação com as novas regras
CREATE OR REPLACE FUNCTION rh.calculate_equipment_rental_payment_with_exemptions(
    p_equipment_rental_id UUID,
    p_company_id UUID,
    p_period TEXT
)
RETURNS TABLE(
    equipment_rental_id UUID,
    employee_id UUID,
    period TEXT,
    monthly_value NUMERIC,
    daily_value NUMERIC,
    total_absence_days INTEGER,
    exempt_absence_days INTEGER,
    billable_absence_days INTEGER,
    total_discount NUMERIC,
    final_value NUMERIC,
    absence_details JSONB,
    exemption_details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
    v_equipment_data RECORD;
    v_daily_value NUMERIC;
    v_absence_record RECORD;
    v_total_absence_days INTEGER := 0;
    v_exempt_absence_days INTEGER := 0;
    v_billable_absence_days INTEGER := 0;
    v_total_discount NUMERIC := 0;
    v_absence_details JSONB := '[]';
    v_exemption_details JSONB := '[]';
    v_absence_item JSONB;
    v_exemption_item JSONB;
BEGIN
    -- Converter período para datas
    v_start_date := (p_period || '-01')::DATE;
    v_end_date := (p_period || '-01')::DATE + INTERVAL '1 month' - INTERVAL '1 day';

    -- Buscar dados do equipamento
    SELECT 
        er.id,
        er.employee_id,
        er.monthly_value
    INTO v_equipment_data
    FROM rh.equipment_rentals er
    WHERE er.id = p_equipment_rental_id
        AND er.company_id = p_company_id
        AND er.status = 'active';

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Calcular valor diário (valor mensal / 30 dias)
    v_daily_value := v_equipment_data.monthly_value / 30;

    -- Buscar e processar dias de ausência
    FOR v_absence_record IN
        SELECT 
            ea.start_date,
            ea.end_date,
            ea.total_days,
            ea.medical_certificate_url,
            ea.status as absence_status,
            at.descricao as absence_type,
            ea.reason
        FROM rh.employee_absences ea
        JOIN rh.absence_types at ON at.id = ea.absence_type_id
        WHERE ea.employee_id = v_equipment_data.employee_id
            AND ea.company_id = p_company_id
            AND ea.is_active = true
            AND ea.status = 'approved'
            AND (
                (ea.start_date <= v_end_date AND ea.end_date >= v_start_date)
                OR (ea.start_date BETWEEN v_start_date AND v_end_date)
                OR (ea.end_date BETWEEN v_start_date AND v_end_date)
            )
    LOOP
        -- Calcular dias de ausência no período
        DECLARE
            v_absence_start DATE := GREATEST(v_absence_record.start_date, v_start_date);
            v_absence_end DATE := LEAST(v_absence_record.end_date, v_end_date);
            v_days_in_period INTEGER;
            v_is_exempt BOOLEAN := FALSE;
            v_exemption_reason TEXT := '';
        BEGIN
            -- Calcular dias no período
            v_days_in_period := (v_absence_end - v_absence_start + 1);

            -- REGRA 1: Verificar se é atestado médico (medical_certificate_url não nulo)
            IF v_absence_record.medical_certificate_url IS NOT NULL 
                AND TRIM(v_absence_record.medical_certificate_url) != '' THEN
                v_is_exempt := TRUE;
                v_exemption_reason := 'Atestado médico';
            END IF;

            -- REGRA 2: Verificar se há compensação de horas aprovada para os dias
            IF NOT v_is_exempt THEN
                SELECT EXISTS(
                    SELECT 1 
                    FROM rh.compensation_requests cr
                    WHERE cr.employee_id = v_equipment_data.employee_id
                        AND cr.company_id = p_company_id
                        AND cr.status = 'approved'
                        AND cr.data_compensacao BETWEEN v_absence_start AND v_absence_end
                ) INTO v_is_exempt;

                IF v_is_exempt THEN
                    v_exemption_reason := 'Compensação de horas aprovada';
                END IF;
            END IF;

            -- Atualizar contadores
            v_total_absence_days := v_total_absence_days + v_days_in_period;

            IF v_is_exempt THEN
                v_exempt_absence_days := v_exempt_absence_days + v_days_in_period;
                
                -- Adicionar aos detalhes de isenção
                v_exemption_item := json_build_object(
                    'date_range', v_absence_start::text || ' a ' || v_absence_end::text,
                    'days', v_days_in_period,
                    'absence_type', v_absence_record.absence_type,
                    'reason', v_exemption_reason,
                    'original_reason', v_absence_record.reason
                );
                v_exemption_details := v_exemption_details || v_exemption_item;
            ELSE
                v_billable_absence_days := v_billable_absence_days + v_days_in_period;
                
                -- Adicionar aos detalhes de ausência cobrável
                v_absence_item := json_build_object(
                    'date_range', v_absence_start::text || ' a ' || v_absence_end::text,
                    'days', v_days_in_period,
                    'absence_type', v_absence_record.absence_type,
                    'reason', v_absence_record.reason,
                    'is_billable', true
                );
                v_absence_details := v_absence_details || v_absence_item;
            END IF;
        END;
    END LOOP;

    -- Calcular desconto total apenas para dias não isentos
    v_total_discount := v_billable_absence_days * v_daily_value;

    -- Retornar resultado
    RETURN QUERY
    SELECT 
        v_equipment_data.id,
        v_equipment_data.employee_id,
        p_period,
        v_equipment_data.monthly_value,
        v_daily_value,
        v_total_absence_days,
        v_exempt_absence_days,
        v_billable_absence_days,
        v_total_discount,
        v_equipment_data.monthly_value - v_total_discount,
        v_absence_details,
        v_exemption_details;
END;
$function$;

-- ============================================================================
-- FUNÇÃO PARA APLICAR AS NOVAS REGRAS EM LOTE
-- ============================================================================

CREATE OR REPLACE FUNCTION rh.apply_equipment_rental_payment_rules(
    p_company_id UUID,
    p_period TEXT
)
RETURNS TABLE(
    equipment_rental_id UUID,
    employee_id UUID,
    employee_name TEXT,
    equipment_name TEXT,
    monthly_value NUMERIC,
    daily_value NUMERIC,
    total_absence_days INTEGER,
    exempt_absence_days INTEGER,
    billable_absence_days INTEGER,
    total_discount NUMERIC,
    final_value NUMERIC,
    absence_details JSONB,
    exemption_details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        calc.equipment_rental_id,
        calc.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        er.equipment_name,
        calc.monthly_value,
        calc.daily_value,
        calc.total_absence_days,
        calc.exempt_absence_days,
        calc.billable_absence_days,
        calc.total_discount,
        calc.final_value,
        calc.absence_details,
        calc.exemption_details
    FROM rh.calculate_equipment_rental_payment_with_exemptions(
        er.id, 
        p_company_id, 
        p_period
    ) calc
    JOIN rh.equipment_rentals er ON er.id = calc.equipment_rental_id
    JOIN rh.employees e ON e.id = calc.employee_id
    WHERE er.status = 'active';
END;
$function$;

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON FUNCTION rh.calculate_equipment_rental_payment_with_exemptions IS 
'Calcula pagamento de locação de equipamentos aplicando regras de isenção:
- Dias de atestado médico não descontam da locação
- Dias com compensação de horas aprovada não descontam da locação';

COMMENT ON FUNCTION rh.apply_equipment_rental_payment_rules IS 
'Aplica as regras de pagamento de locação para todos os equipamentos ativos da empresa no período especificado';
