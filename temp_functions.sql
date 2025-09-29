-- Função para calcular horas trabalhadas
CREATE OR REPLACE FUNCTION rh.calcular_horas_trabalhadas(
    p_employee_id UUID, 
    p_data DATE
) RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_horas_trabalhadas DECIMAL(4,2) := 0;
    v_record RECORD;
BEGIN
    SELECT * INTO v_record
    FROM rh.time_records
    WHERE employee_id = p_employee_id AND data = p_data
    LIMIT 1;

    IF v_record.hora_entrada IS NOT NULL AND v_record.hora_saida IS NOT NULL THEN
        -- Calcula horas trabalhadas
        v_horas_trabalhadas := EXTRACT(EPOCH FROM (v_record.hora_saida - v_record.hora_entrada)) / 3600;
        
        -- Subtrai intervalo se existir
        IF v_record.intervalo_inicio IS NOT NULL AND v_record.intervalo_fim IS NOT NULL THEN
            v_horas_trabalhadas := v_horas_trabalhadas - 
                (EXTRACT(EPOCH FROM (v_record.intervalo_fim - v_record.intervalo_inicio)) / 3600);
        END IF;
    END IF;

    RETURN ROUND(v_horas_trabalhadas, 2);
END;
$$;

-- Função para calcular banco de horas
CREATE OR REPLACE FUNCTION rh.calcular_banco_horas(
    p_employee_id UUID, 
    p_data_inicio DATE DEFAULT NULL, 
    p_data_fim DATE DEFAULT NULL
) RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_banco_horas DECIMAL(8,2) := 0;
    v_data_inicio DATE;
    v_data_fim DATE;
BEGIN
    -- Define período padrão se não informado
    IF p_data_inicio IS NULL THEN
        v_data_inicio := CURRENT_DATE - INTERVAL '12 months';
    ELSE
        v_data_inicio := p_data_inicio;
    END IF;

    IF p_data_fim IS NULL THEN
        v_data_fim := CURRENT_DATE;
    ELSE
        v_data_fim := p_data_fim;
    END IF;

    -- Calcula saldo do banco de horas
    SELECT COALESCE(SUM(
        CASE 
            WHEN tipo = 'entrada' THEN quantidade
            WHEN tipo = 'saida' THEN -quantidade
            ELSE 0
        END
    ), 0) INTO v_banco_horas
    FROM rh.time_bank
    WHERE employee_id = p_employee_id
    AND data_registro BETWEEN v_data_inicio AND v_data_fim
    AND status = 'aprovado';

    RETURN v_banco_horas;
END;
$$;

-- Função para calcular direito a férias
CREATE OR REPLACE FUNCTION rh.calcular_direito_ferias(employee_id_param UUID) 
RETURNS TABLE(tem_direito BOOLEAN, dias_trabalhados INTEGER, data_direito DATE, dias_restantes INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
    hire_date_val DATE;
    current_date_val DATE := CURRENT_DATE;
    days_worked INTEGER;
    right_date DATE;
BEGIN
    -- Buscar data de admissão do funcionário
    SELECT data_admissao INTO hire_date_val
    FROM rh.employees 
    WHERE id = employee_id_param AND status = 'ativo';
    
    IF hire_date_val IS NULL THEN
        RETURN QUERY SELECT FALSE, 0, NULL::date, 0;
        RETURN;
    END IF;
    
    -- Calcular dias trabalhados
    days_worked := current_date_val - hire_date_val;
    
    -- Data em que terá direito a férias (1 ano após admissão)
    right_date := hire_date_val + INTERVAL '1 year';
    
    -- Verificar se já tem direito (mais de 365 dias trabalhados)
    IF days_worked >= 365 THEN
        RETURN QUERY SELECT TRUE, days_worked, right_date, 0;
    ELSE
        RETURN QUERY SELECT FALSE, days_worked, right_date, 365 - days_worked;
    END IF;
END;
$$;

-- Função para calcular salário líquido
CREATE OR REPLACE FUNCTION rh.calcular_salario_liquido(
    p_employee_id UUID, 
    p_competencia TEXT
) RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_salario_base DECIMAL(10,2);
    v_total_proventos DECIMAL(12,2) := 0;
    v_total_descontos DECIMAL(12,2) := 0;
    v_salario_liquido DECIMAL(12,2);
BEGIN
    -- Busca salário base
    SELECT salario_base INTO v_salario_base
    FROM rh.employment_contracts ec
    JOIN rh.employees e ON e.id = ec.employee_id
    WHERE e.id = p_employee_id AND ec.is_active = true
    LIMIT 1;

    -- Calcula proventos
    SELECT COALESCE(SUM(valor), 0) INTO v_total_proventos
    FROM rh.payroll_items
    WHERE employee_id = p_employee_id 
    AND competencia = p_competencia 
    AND tipo = 'provento';

    -- Calcula descontos
    SELECT COALESCE(SUM(valor), 0) INTO v_total_descontos
    FROM rh.payroll_items
    WHERE employee_id = p_employee_id 
    AND competencia = p_competencia 
    AND tipo = 'desconto';

    -- Calcula salário líquido
    v_salario_liquido := v_salario_base + v_total_proventos - v_total_descontos;

    RETURN v_salario_liquido;
END;
$$;