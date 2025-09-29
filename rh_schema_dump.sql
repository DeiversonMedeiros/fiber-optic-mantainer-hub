

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "rh";


ALTER SCHEMA "rh" OWNER TO "postgres";


CREATE TYPE "rh"."status_desconto_rh" AS ENUM (
    'ativo',
    'suspenso',
    'cancelado',
    'quitado'
);


ALTER TYPE "rh"."status_desconto_rh" OWNER TO "postgres";


CREATE TYPE "rh"."status_ferias" AS ENUM (
    'solicitado',
    'aprovado',
    'reprovado',
    'em_andamento',
    'concluido'
);


ALTER TYPE "rh"."status_ferias" OWNER TO "postgres";


CREATE TYPE "rh"."status_funcionario" AS ENUM (
    'ativo',
    'inativo',
    'ferias',
    'licenca',
    'demitido',
    'aposentado'
);


ALTER TYPE "rh"."status_funcionario" OWNER TO "postgres";


CREATE TYPE "rh"."tipo_beneficio_rh" AS ENUM (
    'VR',
    'VA',
    'transporte',
    'convenio_medico',
    'convenio_odontologico',
    'seguro_vida',
    'PLR',
    'outros'
);


ALTER TYPE "rh"."tipo_beneficio_rh" OWNER TO "postgres";


CREATE TYPE "rh"."tipo_contrato_trabalho" AS ENUM (
    'CLT',
    'PJ',
    'temporario',
    'estagiario',
    'autonomo'
);


ALTER TYPE "rh"."tipo_contrato_trabalho" OWNER TO "postgres";


CREATE TYPE "rh"."tipo_desconto_rh" AS ENUM (
    'multa_transito',
    'emprestimo',
    'avaria_equipamento',
    'perda_equipamento',
    'outros'
);


ALTER TYPE "rh"."tipo_desconto_rh" OWNER TO "postgres";


CREATE TYPE "rh"."tipo_escala_enum" AS ENUM (
    'fixa',
    'flexivel_6x1',
    'flexivel_5x2',
    'flexivel_4x3',
    'escala_12x36',
    'escala_24x48',
    'personalizada'
);


ALTER TYPE "rh"."tipo_escala_enum" OWNER TO "postgres";


CREATE TYPE "rh"."tipo_ponto" AS ENUM (
    'normal',
    'hora_extra',
    'banco_horas',
    'ajuste'
);


ALTER TYPE "rh"."tipo_ponto" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."aplicar_rateio_beneficio"("p_rateio_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    calculo_record RECORD;
BEGIN
    -- Limpar valores calculados anteriores
    UPDATE rh.beneficio_rateio_departamentos 
    SET valor_calculado = 0
    WHERE rateio_id = p_rateio_id;
    
    -- Aplicar novos valores calculados
    FOR calculo_record IN 
        SELECT * FROM rh.calcular_rateio_beneficio(p_rateio_id)
    LOOP
        UPDATE rh.beneficio_rateio_departamentos 
        SET 
            valor_calculado = calculo_record.valor_calculado,
            percentual = calculo_record.percentual_aplicado,
            quantidade_funcionarios = calculo_record.quantidade_funcionarios,
            updated_at = NOW()
        WHERE rateio_id = p_rateio_id 
        AND department_id = calculo_record.department_id;
    END LOOP;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "rh"."aplicar_rateio_beneficio"("p_rateio_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."apply_equipment_rental_payment_rules"("p_company_id" "uuid", "p_period" "text") RETURNS TABLE("equipment_rental_id" "uuid", "employee_id" "uuid", "employee_name" "text", "equipment_name" "text", "monthly_value" numeric, "daily_value" numeric, "total_absence_days" integer, "exempt_absence_days" integer, "billable_absence_days" integer, "total_discount" numeric, "final_value" numeric, "absence_details" "jsonb", "exemption_details" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "rh"."apply_equipment_rental_payment_rules"("p_company_id" "uuid", "p_period" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."apply_equipment_rental_payment_rules"("p_company_id" "uuid", "p_period" "text") IS 'Aplica as regras de pagamento de locação para todos os equipamentos ativos da empresa no período especificado';



CREATE OR REPLACE FUNCTION "rh"."aprovar_ferias_fracionadas"("p_vacation_id" "uuid", "p_aprovado_por" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_vacation RECORD;
BEGIN
    -- Buscar dados da férias
    SELECT * INTO v_vacation 
    FROM rh.vacations 
    WHERE id = p_vacation_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Férias não encontradas';
    END IF;
    
    IF v_vacation.status != 'solicitado' THEN
        RAISE EXCEPTION 'Apenas férias solicitadas podem ser aprovadas';
    END IF;
    
    -- Atualizar status
    UPDATE rh.vacations 
    SET 
        status = 'aprovado',
        aprovado_por = p_aprovado_por,
        data_aprovacao = now()
    WHERE id = p_vacation_id;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "rh"."aprovar_ferias_fracionadas"("p_vacation_id" "uuid", "p_aprovado_por" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."aprovar_ferias_fracionadas"("p_vacation_id" "uuid", "p_aprovado_por" "uuid") IS 'Aprova férias fracionadas e registra dados de aprovação';



CREATE OR REPLACE FUNCTION "rh"."assign_benefit_by_criteria"("p_benefit_type" character varying, "p_criteria_type" character varying, "p_criteria_value" character varying, "p_vr_va_config_id" "uuid" DEFAULT NULL::"uuid", "p_transporte_config_id" "uuid" DEFAULT NULL::"uuid", "p_data_inicio" "date" DEFAULT CURRENT_DATE, "p_data_fim" "date" DEFAULT NULL::"date") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_employee_record RECORD;
    v_assigned_count INTEGER := 0;
BEGIN
    -- Validar parâmetros
    IF p_benefit_type NOT IN ('vr-va', 'transporte') THEN
        RAISE EXCEPTION 'Tipo de benefício inválido: %', p_benefit_type;
    END IF;
    
    IF p_benefit_type = 'vr-va' AND p_vr_va_config_id IS NULL THEN
        RAISE EXCEPTION 'vr_va_config_id é obrigatório para benefício vr-va';
    END IF;
    
    IF p_benefit_type = 'transporte' AND p_transporte_config_id IS NULL THEN
        RAISE EXCEPTION 'transporte_config_id é obrigatório para benefício transporte';
    END IF;
    
    -- Buscar funcionários que atendem ao critério
    FOR v_employee_record IN 
        SELECT e.id, e.nome, ea.uf as estado, p.nome as cargo, d.nome as departamento
        FROM rh.employees e
        LEFT JOIN rh.employee_addresses ea ON e.id = ea.employee_id AND ea.tipo_endereco = 'residencial'
        LEFT JOIN rh.positions p ON e.position_id = p.id
        LEFT JOIN core.departments d ON e.department_id = d.id
        WHERE e.status = 'ativo'
        AND (
            (p_criteria_type = 'estado' AND ea.uf = p_criteria_value) OR
            (p_criteria_type = 'cargo' AND p.nome = p_criteria_value) OR
            (p_criteria_type = 'departamento' AND d.nome = p_criteria_value) OR
            (p_criteria_type = 'todos' AND TRUE)
        )
    LOOP
        -- Desativar vinculações anteriores
        UPDATE rh.employee_benefit_assignments 
        SET is_active = false, updated_at = now()
        WHERE employee_id = v_employee_record.id 
            AND benefit_type = p_benefit_type
            AND is_active = true;
        
        -- Criar nova vinculação
        INSERT INTO rh.employee_benefit_assignments (
            employee_id,
            benefit_type,
            vr_va_config_id,
            transporte_config_id,
            criteria_type,
            criteria_value,
            data_inicio,
            data_fim
        ) VALUES (
            v_employee_record.id,
            p_benefit_type,
            p_vr_va_config_id,
            p_transporte_config_id,
            p_criteria_type,
            p_criteria_value,
            p_data_inicio,
            p_data_fim
        );
        
        v_assigned_count := v_assigned_count + 1;
    END LOOP;
    
    RETURN v_assigned_count;
END;
$$;


ALTER FUNCTION "rh"."assign_benefit_by_criteria"("p_benefit_type" character varying, "p_criteria_type" character varying, "p_criteria_value" character varying, "p_vr_va_config_id" "uuid", "p_transporte_config_id" "uuid", "p_data_inicio" "date", "p_data_fim" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."assign_benefit_to_employee"("p_employee_id" "uuid", "p_benefit_type" character varying, "p_vr_va_config_id" "uuid" DEFAULT NULL::"uuid", "p_transporte_config_id" "uuid" DEFAULT NULL::"uuid", "p_data_inicio" "date" DEFAULT CURRENT_DATE, "p_data_fim" "date" DEFAULT NULL::"date") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Validar parâmetros
    IF p_benefit_type = 'vr-va' AND p_vr_va_config_id IS NULL THEN
        RAISE EXCEPTION 'vr_va_config_id é obrigatório para benefício vr-va';
    END IF;
    
    IF p_benefit_type = 'transporte' AND p_transporte_config_id IS NULL THEN
        RAISE EXCEPTION 'transporte_config_id é obrigatório para benefício transporte';
    END IF;
    
    -- Desativar vinculações anteriores
    UPDATE rh.employee_benefit_assignments 
    SET is_active = false, updated_at = now()
    WHERE employee_id = p_employee_id 
        AND benefit_type = p_benefit_type
        AND is_active = true;
    
    -- Criar nova vinculação
    INSERT INTO rh.employee_benefit_assignments (
        employee_id,
        benefit_type,
        vr_va_config_id,
        transporte_config_id,
        criteria_type,
        criteria_value,
        data_inicio,
        data_fim
    ) VALUES (
        p_employee_id,
        p_benefit_type,
        p_vr_va_config_id,
        p_transporte_config_id,
        'manual',
        'VINCULACAO_MANUAL',
        p_data_inicio,
        p_data_fim
    );
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "rh"."assign_benefit_to_employee"("p_employee_id" "uuid", "p_benefit_type" character varying, "p_vr_va_config_id" "uuid", "p_transporte_config_id" "uuid", "p_data_inicio" "date", "p_data_fim" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."atualizar_banco_horas"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Atualiza banco de horas quando ponto é registrado
    IF TG_OP = 'INSERT' AND NEW.tipo = 'hora_extra' THEN
        INSERT INTO rh.time_bank (
            company_id, employee_id, tipo, quantidade, data_registro, status
        ) VALUES (
            NEW.company_id, NEW.employee_id, 'entrada', 
            EXTRACT(EPOCH FROM (NEW.hora_saida - NEW.hora_entrada)) / 3600,
            NEW.data, 'pendente'
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "rh"."atualizar_banco_horas"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."buscar_anos_ferias_disponiveis"("employee_id_param" "uuid") RETURNS TABLE("ano" integer, "dias_disponiveis" integer, "status" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    hire_date_val DATE;
    current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    year_counter INTEGER;
    days_worked INTEGER;
    vacation_days_taken INTEGER;
BEGIN
    -- Buscar data de admissÃ£o do funcionÃ¡rio
    SELECT data_admissao INTO hire_date_val
    FROM rh.employees 
    WHERE id = employee_id_param AND rh.employees.status = 'ativo';
    
    IF hire_date_val IS NULL THEN
        RETURN;
    END IF;
    
    -- Verificar cada ano desde a admissÃ£o atÃ© o ano atual
    FOR year_counter IN EXTRACT(YEAR FROM hire_date_val)..current_year
    LOOP
        -- Calcular dias trabalhados atÃ© o final do ano
        days_worked := (DATE(year_counter || '-12-31') - hire_date_val) + 1;
        
        -- Se tem pelo menos 1 ano de trabalho
        IF days_worked >= 365 THEN
            -- Contar dias de fÃ©rias jÃ¡ tirados no ano
            SELECT COALESCE(SUM(dias_ferias), 0) INTO vacation_days_taken
            FROM rh.vacations 
            WHERE employee_id = employee_id_param 
            AND ano = year_counter 
            AND rh.vacations.status = 'aprovado';
            
            -- Se ainda tem dias disponÃ­veis
            IF vacation_days_taken < 30 THEN
                RETURN QUERY SELECT 
                    year_counter, 
                    30 - vacation_days_taken,
                    CASE 
                        WHEN vacation_days_taken = 0 THEN 'DisponÃ­vel'
                        ELSE 'Parcial'
                    END;
            END IF;
        END IF;
    END LOOP;
END;
$$;


ALTER FUNCTION "rh"."buscar_anos_ferias_disponiveis"("employee_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."buscar_ferias_com_periodos"("p_vacation_id" "uuid") RETURNS TABLE("vacation_id" "uuid", "company_id" "uuid", "employee_id" "uuid", "ano" integer, "periodo" "text", "tipo_fracionamento" "text", "total_periodos" integer, "status" "text", "observacoes" "text", "created_at" timestamp with time zone, "aprovado_por" "uuid", "data_aprovacao" timestamp with time zone, "periodos" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.company_id,
        v.employee_id,
        v.ano,
        v.periodo,
        v.tipo_fracionamento,
        v.total_periodos,
        v.status::TEXT,
        v.observacoes,
        v.created_at,
        v.aprovado_por,
        v.data_aprovacao,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', vp.id,
                    'data_inicio', vp.data_inicio,
                    'data_fim', vp.data_fim,
                    'dias_ferias', vp.dias_ferias,
                    'dias_abono', vp.dias_abono,
                    'periodo_numero', vp.periodo_numero,
                    'observacoes', vp.observacoes
                ) ORDER BY vp.periodo_numero
            ) FILTER (WHERE vp.id IS NOT NULL),
            '[]'::jsonb
        ) as periodos
    FROM rh.vacations v
    LEFT JOIN rh.vacation_periods vp ON v.id = vp.vacation_id
    WHERE v.id = p_vacation_id
    GROUP BY v.id, v.company_id, v.employee_id, v.ano, v.periodo, 
             v.tipo_fracionamento, v.total_periodos, v.status, 
             v.observacoes, v.created_at, v.aprovado_por, v.data_aprovacao;
END;
$$;


ALTER FUNCTION "rh"."buscar_ferias_com_periodos"("p_vacation_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."buscar_ferias_com_periodos"("p_vacation_id" "uuid") IS 'Busca férias com todos os períodos associados em formato JSON';



CREATE OR REPLACE FUNCTION "rh"."buscar_notificacoes_ferias"("employee_id_param" "uuid", "include_inactive" boolean DEFAULT false) RETURNS TABLE("id" "uuid", "notification_type" "text", "title" "text", "message" "text", "priority" "text", "due_date" "date", "days_remaining" integer, "is_read" boolean, "is_active" boolean, "created_at" timestamp with time zone, "read_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vn.id,
        vn.notification_type,
        vn.title,
        vn.message,
        vn.priority,
        vn.due_date,
        vn.days_remaining,
        vn.is_read,
        vn.is_active,
        vn.created_at,
        vn.read_at
    FROM rh.vacation_notifications vn
    WHERE vn.employee_id = employee_id_param
    AND (include_inactive = TRUE OR vn.is_active = TRUE)
    AND (vn.expires_at IS NULL OR vn.expires_at > NOW())
    ORDER BY 
        CASE vn.priority 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END,
        vn.created_at DESC;
END;
$$;


ALTER FUNCTION "rh"."buscar_notificacoes_ferias"("employee_id_param" "uuid", "include_inactive" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."calcular_adicionais_automaticos"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    hora_inicio time;
    hora_fim time;
    data_trabalho date;
    dia_semana integer;
    horas_trabalhadas numeric(4,2);
    horas_noturnas numeric(4,2) := 0;
    horas_fds numeric(4,2) := 0;
    salario_hora numeric(10,2);
    valor_adicional_noturno numeric(10,2) := 0;
    valor_adicional_final_semana numeric(10,2) := 0;
BEGIN
    -- Verificar se temos os dados necessários
    IF NEW.hora_entrada IS NULL OR NEW.hora_saida IS NULL OR NEW.data IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Obter dados do funcionário para calcular salário por hora
    SELECT salario_base INTO salario_hora
    FROM rh.employees 
    WHERE id = NEW.employee_id;
    
    -- Se não tiver salário base, não calcula adicionais
    IF salario_hora IS NULL OR salario_hora <= 0 THEN
        RETURN NEW;
    END IF;
    
    -- Calcular salário por hora (considerando 220 horas por mês)
    salario_hora := salario_hora / 220;
    
    -- Obter dados do registro
    hora_inicio := NEW.hora_entrada;
    hora_fim := NEW.hora_saida;
    data_trabalho := NEW.data;
    dia_semana := EXTRACT(DOW FROM data_trabalho); -- 0 = domingo, 6 = sábado
    
    -- Calcular horas trabalhadas
    horas_trabalhadas := EXTRACT(EPOCH FROM (hora_fim - hora_inicio)) / 3600;
    
    -- Calcular horas noturnas (22h às 5h)
    IF hora_inicio < '05:00'::time THEN
        -- Trabalho que começa antes das 5h
        IF hora_fim <= '05:00'::time THEN
            -- Trabalho inteiro no período noturno
            horas_noturnas := horas_trabalhadas;
        ELSE
            -- Trabalho que vai até depois das 5h
            horas_noturnas := EXTRACT(EPOCH FROM ('05:00'::time - hora_inicio)) / 3600;
        END IF;
    ELSIF hora_inicio >= '22:00'::time THEN
        -- Trabalho que começa após 22h
        IF hora_fim <= '05:00'::time THEN
            -- Trabalho inteiro no período noturno
            horas_noturnas := horas_trabalhadas;
        ELSE
            -- Trabalho que vai até depois das 5h do dia seguinte
            horas_noturnas := EXTRACT(EPOCH FROM (hora_fim - hora_inicio)) / 3600;
        END IF;
    ELSIF hora_inicio < '22:00'::time AND hora_fim > '22:00'::time THEN
        -- Trabalho que começa antes das 22h e vai até depois das 22h
        horas_noturnas := EXTRACT(EPOCH FROM (hora_fim - '22:00'::time)) / 3600;
    END IF;
    
    -- Calcular horas de final de semana (sábado = 6, domingo = 0)
    IF dia_semana = 0 OR dia_semana = 6 THEN
        horas_fds := horas_trabalhadas;
    END IF;
    
    -- Calcular valores dos adicionais
    -- Adicional noturno: 20% sobre as horas noturnas
    valor_adicional_noturno := horas_noturnas * salario_hora * 0.20;
    
    -- Adicional final de semana: 50% sobre as horas de FDS (pode ser ajustado conforme legislação)
    valor_adicional_final_semana := horas_fds * salario_hora * 0.50;
    
    -- Atualizar os campos calculados
    NEW.horas_noturnas := ROUND(horas_noturnas, 2);
    NEW.horas_final_semana := ROUND(horas_fds, 2);
    NEW.valor_adicional_noturno := ROUND(valor_adicional_noturno, 2);
    NEW.valor_adicional_final_semana := ROUND(valor_adicional_final_semana, 2);
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "rh"."calcular_adicionais_automaticos"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."calcular_banco_horas"("p_employee_id" "uuid", "p_data_inicio" "date" DEFAULT NULL::"date", "p_data_fim" "date" DEFAULT NULL::"date") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "rh"."calcular_banco_horas"("p_employee_id" "uuid", "p_data_inicio" "date", "p_data_fim" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."calcular_beneficios_funcionario"("p_employee_id" "uuid", "p_mes" integer, "p_ano" integer) RETURNS TABLE("benefit_id" "uuid", "benefit_name" character varying, "valor_base" numeric, "valor_desconto" numeric, "valor_final" numeric, "tipo_beneficio" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id as benefit_id,
        b.nome as benefit_name,
        COALESCE(eb.valor, 0) as valor_base,
        COALESCE(fbh.valor_desconto, 0) as valor_desconto,
        COALESCE(fbh.valor_final, 0) as valor_final,
        b.tipo as tipo_beneficio
    FROM rh.benefits b
    JOIN rh.employee_benefits eb ON b.id = eb.benefit_id
    LEFT JOIN rh.funcionario_beneficios_historico fbh ON (
        fbh.employee_id = p_employee_id 
        AND fbh.benefit_id = b.id 
        AND fbh.mes_referencia = p_mes 
        AND fbh.ano_referencia = p_ano
    )
    WHERE eb.employee_id = p_employee_id
    AND eb.is_active = true
    AND b.is_active = true;
END;
$$;


ALTER FUNCTION "rh"."calcular_beneficios_funcionario"("p_employee_id" "uuid", "p_mes" integer, "p_ano" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."calcular_custo_convenio_funcionario"("p_employee_id" "uuid", "p_convenio_plano_id" "uuid") RETURNS TABLE("valor_titular" numeric, "valor_dependentes" numeric, "valor_total" numeric, "quantidade_dependentes" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.valor_titular,
        COALESCE(SUM(fcd.valor_dependente), 0) as valor_dependentes,
        cp.valor_titular + COALESCE(SUM(fcd.valor_dependente), 0) as valor_total,
        COUNT(fcd.id)::INTEGER as quantidade_dependentes
    FROM rh.convenios_planos cp
    LEFT JOIN rh.funcionario_convenios fc ON fc.convenio_plano_id = cp.id AND fc.employee_id = p_employee_id
    LEFT JOIN rh.funcionario_convenio_dependentes fcd ON fcd.funcionario_convenio_id = fc.id
    WHERE cp.id = p_convenio_plano_id
    GROUP BY cp.valor_titular;
END;
$$;


ALTER FUNCTION "rh"."calcular_custo_convenio_funcionario"("p_employee_id" "uuid", "p_convenio_plano_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."calcular_direito_ferias"("employee_id_param" "uuid") RETURNS TABLE("tem_direito" boolean, "dias_trabalhados" integer, "data_direito" "date", "dias_restantes" integer)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    hire_date_val DATE;
    current_date_val DATE := CURRENT_DATE;
    days_worked INTEGER;
    right_date DATE;
BEGIN
    -- Buscar data de admissÃ£o do funcionÃ¡rio
    SELECT data_admissao INTO hire_date_val
    FROM rh.employees 
    WHERE id = employee_id_param AND status = 'ativo';
    
    IF hire_date_val IS NULL THEN
        RETURN QUERY SELECT FALSE, 0, NULL::date, 0;
        RETURN;
    END IF;
    
    -- Calcular dias trabalhados
    days_worked := current_date_val - hire_date_val;
    
    -- Data em que terÃ¡ direito a fÃ©rias (1 ano apÃ³s admissÃ£o)
    right_date := hire_date_val + INTERVAL '1 year';
    
    -- Verificar se jÃ¡ tem direito (mais de 365 dias trabalhados)
    IF days_worked >= 365 THEN
        RETURN QUERY SELECT TRUE, days_worked, right_date, 0;
    ELSE
        RETURN QUERY SELECT FALSE, days_worked, right_date, 365 - days_worked;
    END IF;
END;
$$;


ALTER FUNCTION "rh"."calcular_direito_ferias"("employee_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."calcular_elegibilidade_funcionarios"("p_company_id" "uuid", "p_beneficio_tipo_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("employee_id" "uuid", "elegibilidade_id" "uuid", "is_elegivel" boolean, "regra_aplicada" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    WITH funcionarios_cargos_departamentos AS (
        SELECT
            e.id as employee_id,
            e.position_id,
            e.department_id,
            p.nome as cargo_nome,
            d.nome as departamento_nome
        FROM rh.employees e
        LEFT JOIN rh.positions p ON e.position_id = p.id
        LEFT JOIN core.departments d ON e.department_id = d.id
        WHERE e.company_id = p_company_id
        AND e.is_active = true
    ),
    regras_elegibilidade AS (
        SELECT
            be.id as elegibilidade_id,
            be.nome as regra_nome,
            be.tipo_regra,
            be.criterios,
            be.data_inicio,
            be.data_fim
        FROM rh.beneficio_elegibilidade be
        WHERE be.company_id = p_company_id
        AND be.is_active = true
        AND (p_beneficio_tipo_id IS NULL OR be.beneficio_tipo_id = p_beneficio_tipo_id)
        AND (be.data_fim IS NULL OR be.data_fim >= CURRENT_DATE)
    )
    SELECT
        fcd.employee_id,
        re.elegibilidade_id,
        CASE
            WHEN re.tipo_regra = 'todos' THEN true
            WHEN re.tipo_regra = 'cargo' THEN EXISTS (
                SELECT 1 FROM rh.beneficio_elegibilidade_cargos bec
                WHERE bec.elegibilidade_id = re.elegibilidade_id
                AND bec.position_id = fcd.position_id
            )
            WHEN re.tipo_regra = 'departamento' THEN EXISTS (
                SELECT 1 FROM rh.beneficio_elegibilidade_departamentos bed
                WHERE bed.elegibilidade_id = re.elegibilidade_id
                AND bed.department_id = fcd.department_id
            )
            WHEN re.tipo_regra = 'ambos' THEN EXISTS (
                SELECT 1 FROM rh.beneficio_elegibilidade_cargos bec
                WHERE bec.elegibilidade_id = re.elegibilidade_id
                AND bec.position_id = fcd.position_id
            ) AND EXISTS (
                SELECT 1 FROM rh.beneficio_elegibilidade_departamentos bed
                WHERE bed.elegibilidade_id = re.elegibilidade_id
                AND bed.department_id = fcd.department_id
            )
            ELSE false
        END as is_elegivel,
        re.regra_nome
    FROM funcionarios_cargos_departamentos fcd
    CROSS JOIN regras_elegibilidade re;
END;
$$;


ALTER FUNCTION "rh"."calcular_elegibilidade_funcionarios"("p_company_id" "uuid", "p_beneficio_tipo_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."calcular_horas_trabalhadas"("p_employee_id" "uuid", "p_data" "date") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "rh"."calcular_horas_trabalhadas"("p_employee_id" "uuid", "p_data" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."calcular_rateio_beneficio"("p_rateio_id" "uuid") RETURNS TABLE("department_id" "uuid", "department_nome" character varying, "valor_calculado" numeric, "percentual_aplicado" numeric, "quantidade_funcionarios" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    rateio_record RECORD;
    total_funcionarios INTEGER;
    total_custo DECIMAL(15,2);
BEGIN
    -- Buscar dados do rateio
    SELECT * INTO rateio_record FROM rh.beneficio_rateios WHERE id = p_rateio_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rateio não encontrado';
    END IF;
    
    -- Calcular baseado no tipo de rateio
    CASE rateio_record.tipo_rateio
        WHEN 'proporcional_funcionarios' THEN
            -- Rateio proporcional ao número de funcionários
            SELECT COUNT(*) INTO total_funcionarios
            FROM rh.employees e
            JOIN core.departments d ON e.department_id = d.id
            WHERE e.company_id = rateio_record.company_id
            AND e.is_active = true
            AND e.department_id IN (
                SELECT department_id FROM rh.beneficio_rateio_departamentos 
                WHERE rateio_id = p_rateio_id
            );
            
            RETURN QUERY
            SELECT 
                d.id as department_id,
                d.nome as department_nome,
                CASE 
                    WHEN total_funcionarios > 0 THEN 
                        (rateio_record.valor_total * COUNT(e.id) / total_funcionarios)
                    ELSE 0
                END as valor_calculado,
                CASE 
                    WHEN total_funcionarios > 0 THEN 
                        (COUNT(e.id)::DECIMAL / total_funcionarios * 100)
                    ELSE 0
                END as percentual_aplicado,
                COUNT(e.id) as quantidade_funcionarios
            FROM core.departments d
            LEFT JOIN rh.employees e ON d.id = e.department_id AND e.is_active = true
            WHERE d.id IN (
                SELECT department_id FROM rh.beneficio_rateio_departamentos 
                WHERE rateio_id = p_rateio_id
            )
            GROUP BY d.id, d.nome
            ORDER BY d.nome;
            
        WHEN 'proporcional_custo' THEN
            -- Rateio proporcional ao custo médio dos funcionários
            SELECT COALESCE(SUM(custo_medio_funcionario), 0) INTO total_custo
            FROM rh.beneficio_rateio_departamentos 
            WHERE rateio_id = p_rateio_id;
            
            RETURN QUERY
            SELECT 
                d.id as department_id,
                d.nome as department_nome,
                CASE 
                    WHEN total_custo > 0 THEN 
                        (rateio_record.valor_total * brd.custo_medio_funcionario / total_custo)
                    ELSE 0
                END as valor_calculado,
                CASE 
                    WHEN total_custo > 0 THEN 
                        (brd.custo_medio_funcionario / total_custo * 100)
                    ELSE 0
                END as percentual_aplicado,
                brd.quantidade_funcionarios
            FROM rh.beneficio_rateio_departamentos brd
            JOIN core.departments d ON brd.department_id = d.id
            WHERE brd.rateio_id = p_rateio_id
            ORDER BY d.nome;
            
        ELSE
            -- Para percentual e valor_fixo, retornar valores configurados
            RETURN QUERY
            SELECT 
                d.id as department_id,
                d.nome as department_nome,
                CASE 
                    WHEN rateio_record.tipo_rateio = 'percentual' THEN 
                        (rateio_record.valor_total * brd.percentual / 100)
                    ELSE brd.valor_fixo
                END as valor_calculado,
                brd.percentual as percentual_aplicado,
                brd.quantidade_funcionarios
            FROM rh.beneficio_rateio_departamentos brd
            JOIN core.departments d ON brd.department_id = d.id
            WHERE brd.rateio_id = p_rateio_id
            ORDER BY d.nome;
    END CASE;
END;
$$;


ALTER FUNCTION "rh"."calcular_rateio_beneficio"("p_rateio_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."calcular_salario_liquido"("p_employee_id" "uuid", "p_competencia" "text") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "rh"."calcular_salario_liquido"("p_employee_id" "uuid", "p_competencia" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."calcular_status_ferias"("employee_id_param" "uuid") RETURNS TABLE("status_ferias" "text", "proxima_data_ferias" "date")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    hire_date_val DATE;
    current_date_val DATE := CURRENT_DATE;
    days_worked INTEGER;
    right_date DATE;
    vacation_count INTEGER;
BEGIN
    -- Buscar data de admissÃ£o do funcionÃ¡rio
    SELECT data_admissao INTO hire_date_val
    FROM rh.employees 
    WHERE id = employee_id_param AND status = 'ativo';
    
    IF hire_date_val IS NULL THEN
        RETURN QUERY SELECT 'FuncionÃ¡rio nÃ£o encontrado'::text, NULL::date;
        RETURN;
    END IF;
    
    -- Calcular dias trabalhados
    days_worked := current_date_val - hire_date_val;
    right_date := hire_date_val + INTERVAL '1 year';
    
    -- Contar fÃ©rias jÃ¡ tiradas no ano atual
    SELECT COUNT(*) INTO vacation_count
    FROM rh.vacations 
    WHERE employee_id = employee_id_param 
    AND ano = EXTRACT(YEAR FROM current_date_val)
    AND status = 'aprovado';
    
    -- Determinar status
    IF days_worked < 365 THEN
        RETURN QUERY SELECT 'Sem direito ainda'::text, right_date;
    ELSIF vacation_count = 0 THEN
        RETURN QUERY SELECT 'FÃ©rias pendentes'::text, right_date;
    ELSIF vacation_count = 1 THEN
        RETURN QUERY SELECT 'FÃ©rias em dia'::text, right_date + INTERVAL '1 year';
    ELSE
        RETURN QUERY SELECT 'FÃ©rias em dia'::text, right_date + INTERVAL '1 year';
    END IF;
END;
$$;


ALTER FUNCTION "rh"."calcular_status_ferias"("employee_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."calculate_all_equipment_absence_discounts"("p_company_id" "uuid", "p_period" "text") RETURNS TABLE("equipment_rental_id" "uuid", "employee_id" "uuid", "employee_name" "text", "equipment_name" "text", "equipment_type" "text", "period" "text", "monthly_value" numeric, "daily_value" numeric, "total_absence_days" integer, "total_discount" numeric, "final_value" numeric, "absence_details" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_equipment RECORD;
BEGIN
  -- Converter perÃ­odo para datas
  v_start_date := (p_period || '-01')::DATE;
  v_end_date := (p_period || '-01')::DATE + INTERVAL '1 month' - INTERVAL '1 day';
  
  -- Para cada equipamento ativo, calcular desconto
  FOR v_equipment IN
    SELECT 
      er.id,
      er.employee_id,
      e.nome as employee_name,
      (er.equipment_name)::text as equipment_name,
      (er.equipment_type)::text as equipment_type,
      er.monthly_value
    FROM rh.equipment_rentals er
    JOIN rh.employees e ON er.employee_id = e.id
    WHERE er.company_id = p_company_id
      AND er.status = 'active'
  LOOP
    -- Calcular desconto para este equipamento
    RETURN QUERY
    SELECT 
      cad.equipment_rental_id,
      cad.employee_id,
      v_equipment.employee_name,
      v_equipment.equipment_name,
      v_equipment.equipment_type,
      cad.period,
      cad.monthly_value,
      cad.daily_value,
      cad.total_absence_days,
      cad.total_discount,
      cad.final_value,
      cad.absence_details
    FROM rh.calculate_equipment_absence_discount(
      v_equipment.id,
      p_company_id,
      p_period
    ) cad;
  END LOOP;
END;
$$;


ALTER FUNCTION "rh"."calculate_all_equipment_absence_discounts"("p_company_id" "uuid", "p_period" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."calculate_all_equipment_absence_discounts"("p_company_id" "uuid", "p_period" "text") IS 'Calcula descontos por ausÃªncia para todos os equipamentos ativos de uma empresa em um perÃ­odo';



CREATE OR REPLACE FUNCTION "rh"."calculate_easter"("year" integer) RETURNS "date"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  a INTEGER;
  b INTEGER;
  c INTEGER;
  d INTEGER;
  e INTEGER;
  f INTEGER;
  g INTEGER;
  h INTEGER;
  i INTEGER;
  k INTEGER;
  l INTEGER;
  m INTEGER;
  month INTEGER;
  day INTEGER;
BEGIN
  a := year % 19;
  b := year / 100;
  c := year % 100;
  d := b / 4;
  e := b % 4;
  f := (b + 8) / 25;
  g := (b - f + 1) / 3;
  h := (19 * a + b - d - g + 15) % 30;
  i := c / 4;
  k := c % 4;
  l := (32 + 2 * e + 2 * i - h - k) % 7;
  m := (a + 11 * h + 22 * l) / 451;
  month := (h + l - 7 * m + 114) / 31;
  day := ((h + l - 7 * m + 114) % 31) + 1;
  
  RETURN make_date(year, month, day);
END;
$$;


ALTER FUNCTION "rh"."calculate_easter"("year" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."calculate_employee_work_days"("p_employee_id" "uuid", "p_company_id" "uuid", "p_year" integer, "p_month" integer) RETURNS TABLE("total_days" integer, "work_days" integer, "holidays_count" integer, "absences_count" integer, "vacation_days" integer, "sick_leave_days" integer, "effective_work_days" integer)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_employee_record RECORD;
  v_shift_record RECORD;
  v_current_date DATE;
  v_month_start DATE;
  v_month_end DATE;
  v_day_of_week INTEGER;
  v_cycle_day INTEGER;
  v_is_holiday BOOLEAN;
  v_is_absence BOOLEAN;
  v_is_vacation BOOLEAN;
  v_is_sick_leave BOOLEAN;
  v_total_days INTEGER := 0;
  v_work_days INTEGER := 0;
  v_holidays_count INTEGER := 0;
  v_absences_count INTEGER := 0;
  v_vacation_days INTEGER := 0;
  v_sick_leave_days INTEGER := 0;
  v_effective_work_days INTEGER := 0;
  v_days_in_cycle INTEGER;
BEGIN
  -- Definir início e fim do mês
  v_month_start := make_date(p_year, p_month, 1);
  v_month_end := (v_month_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Buscar dados do funcionário
  SELECT * INTO v_employee_record
  FROM rh.employees
  WHERE id = p_employee_id AND company_id = p_company_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Funcionário não encontrado: %', p_employee_id;
  END IF;
  
  -- Buscar turno ativo do funcionário
  SELECT ws.* INTO v_shift_record
  FROM rh.employee_shifts es
  JOIN rh.work_shifts ws ON es.shift_id = ws.id
  WHERE es.employee_id = p_employee_id
    AND es.is_active = true
    AND (es.data_fim IS NULL OR es.data_fim >= v_month_start)
    AND es.data_inicio <= v_month_end
    AND ws.is_active = true
  ORDER BY es.data_inicio DESC
  LIMIT 1;
  
  -- Se não tem turno definido, usar dias úteis padrão (seg-sex)
  IF NOT FOUND THEN
    -- Loop pelos dias do mês
    v_current_date := v_month_start;
    WHILE v_current_date <= v_month_end LOOP
      v_total_days := v_total_days + 1;
      v_day_of_week := EXTRACT(DOW FROM v_current_date);
      
      -- Verificar se é dia útil (seg-sex, onde 0=domingo)
      IF v_day_of_week BETWEEN 1 AND 5 THEN
        v_work_days := v_work_days + 1;
        
        -- Verificar se é feriado
        SELECT EXISTS(
          SELECT 1 FROM rh.holidays 
          WHERE company_id = p_company_id 
            AND data = v_current_date 
            AND is_active = true
        ) INTO v_is_holiday;
        
        -- Verificar ausências (medical_certificates)
        SELECT EXISTS(
          SELECT 1 FROM rh.medical_certificates 
          WHERE employee_id = p_employee_id 
            AND data_inicio <= v_current_date 
            AND (data_fim IS NULL OR data_fim >= v_current_date)
            AND status = 'aprovado'
        ) INTO v_is_absence;
        
        -- Verificar férias
        SELECT EXISTS(
          SELECT 1 FROM rh.vacations 
          WHERE employee_id = p_employee_id 
            AND data_inicio <= v_current_date 
            AND (data_fim IS NULL OR data_fim >= v_current_date)
            AND status = 'aprovado'
        ) INTO v_is_vacation;
        
        -- Verificar licença médica
        SELECT EXISTS(
          SELECT 1 FROM rh.medical_certificates 
          WHERE employee_id = p_employee_id 
            AND data_inicio <= v_current_date 
            AND (data_fim IS NULL OR data_fim >= v_current_date)
            AND status = 'aprovado'
        ) INTO v_is_sick_leave;
        
        -- Contar tipos de ausência
        IF v_is_holiday THEN
          v_holidays_count := v_holidays_count + 1;
        ELSIF v_is_vacation THEN
          v_vacation_days := v_vacation_days + 1;
        ELSIF v_is_sick_leave THEN
          v_sick_leave_days := v_sick_leave_days + 1;
        ELSIF v_is_absence THEN
          v_absences_count := v_absences_count + 1;
        ELSE
          -- Dia efetivo de trabalho
          v_effective_work_days := v_effective_work_days + 1;
        END IF;
      END IF;
      
      v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
  ELSE
    -- Usar escala específica do funcionário
    v_days_in_cycle := COALESCE(v_shift_record.ciclo_dias, 7);
    
    v_current_date := v_month_start;
    WHILE v_current_date <= v_month_end LOOP
      v_total_days := v_total_days + 1;
      v_day_of_week := EXTRACT(DOW FROM v_current_date);
      
      -- Verificar se é dia de trabalho baseado na escala
      CASE v_shift_record.tipo_escala
        WHEN 'fixa' THEN
          -- Escala fixa: usar dias_semana
          IF v_day_of_week = ANY(v_shift_record.dias_semana) THEN
            v_work_days := v_work_days + 1;
          END IF;
          
        WHEN 'flexivel_6x1', 'flexivel_5x2', 'flexivel_4x3', 'personalizada' THEN
          -- Escalas flexíveis: usar padrão de trabalho/folga
          v_cycle_day := ((EXTRACT(DAY FROM v_current_date) - 1) % v_days_in_cycle) + 1;
          IF v_cycle_day <= v_shift_record.dias_trabalho THEN
            v_work_days := v_work_days + 1;
          END IF;
          
        WHEN 'escala_12x36', 'escala_24x48' THEN
          -- Escalas de plantão: apenas o primeiro dia do ciclo é trabalho
          v_cycle_day := ((EXTRACT(DAY FROM v_current_date) - 1) % v_days_in_cycle) + 1;
          IF v_cycle_day = 1 THEN
            v_work_days := v_work_days + 1;
          END IF;
          
        ELSE
          -- Fallback: dias úteis padrão
          IF v_day_of_week BETWEEN 1 AND 5 THEN
            v_work_days := v_work_days + 1;
          END IF;
      END CASE;
      
      -- Se é dia de trabalho, verificar ausências
      IF v_work_days > 0 AND v_current_date <= v_month_end THEN
        -- Verificar se é feriado
        SELECT EXISTS(
          SELECT 1 FROM rh.holidays 
          WHERE company_id = p_company_id 
            AND data = v_current_date 
            AND is_active = true
        ) INTO v_is_holiday;
        
        -- Verificar ausências
        SELECT EXISTS(
          SELECT 1 FROM rh.medical_certificates 
          WHERE employee_id = p_employee_id 
            AND data_inicio <= v_current_date 
            AND (data_fim IS NULL OR data_fim >= v_current_date)
            AND status = 'aprovado'
        ) INTO v_is_absence;
        
        -- Verificar férias
        SELECT EXISTS(
          SELECT 1 FROM rh.vacations 
          WHERE employee_id = p_employee_id 
            AND data_inicio <= v_current_date 
            AND (data_fim IS NULL OR data_fim >= v_current_date)
            AND status = 'aprovado'
        ) INTO v_is_vacation;
        
        -- Verificar licença médica
        SELECT EXISTS(
          SELECT 1 FROM rh.medical_certificates 
          WHERE employee_id = p_employee_id 
            AND data_inicio <= v_current_date 
            AND (data_fim IS NULL OR data_fim >= v_current_date)
            AND status = 'aprovado'
        ) INTO v_is_sick_leave;
        
        -- Contar tipos de ausência
        IF v_is_holiday THEN
          v_holidays_count := v_holidays_count + 1;
        ELSIF v_is_vacation THEN
          v_vacation_days := v_vacation_days + 1;
        ELSIF v_is_sick_leave THEN
          v_sick_leave_days := v_sick_leave_days + 1;
        ELSIF v_is_absence THEN
          v_absences_count := v_absences_count + 1;
        ELSE
          -- Dia efetivo de trabalho
          v_effective_work_days := v_effective_work_days + 1;
        END IF;
      END IF;
      
      v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
  END IF;
  
  -- Retornar resultado
  RETURN QUERY SELECT 
    v_total_days,
    v_work_days,
    v_holidays_count,
    v_absences_count,
    v_vacation_days,
    v_sick_leave_days,
    v_effective_work_days;
END;
$$;


ALTER FUNCTION "rh"."calculate_employee_work_days"("p_employee_id" "uuid", "p_company_id" "uuid", "p_year" integer, "p_month" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."calculate_employee_work_days"("p_employee_id" "uuid", "p_company_id" "uuid", "p_year" integer, "p_month" integer) IS 'Calcula dias úteis de um funcionário em um mês, considerando turno de trabalho, feriados e ausências';



CREATE OR REPLACE FUNCTION "rh"."calculate_equipment_absence_discount"("p_equipment_rental_id" "uuid", "p_company_id" "uuid", "p_period" "text") RETURNS TABLE("equipment_rental_id" "uuid", "employee_id" "uuid", "period" "text", "monthly_value" numeric, "daily_value" numeric, "total_absence_days" integer, "total_discount" numeric, "final_value" numeric, "absence_details" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_equipment_data RECORD;
  v_absence_days INTEGER;
  v_daily_value NUMERIC;
  v_total_discount NUMERIC;
  v_absence_details JSONB;
BEGIN
  -- Converter perÃ­odo para datas
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
  
  -- Calcular valor diÃ¡rio (valor mensal / 30 dias)
  v_daily_value := v_equipment_data.monthly_value / 30;
  
  -- Buscar dias de ausÃªncia
  SELECT 
    COUNT(*)::INTEGER,
    COALESCE(
      json_agg(
        json_build_object(
          'date', absence_date,
          'type', absence_type,
          'description', description,
          'is_justified', is_justified
        )
      ) FILTER (WHERE absence_date IS NOT NULL),
      '[]'::json
    )
  INTO v_absence_days, v_absence_details
  FROM rh.get_employee_absence_days(
    v_equipment_data.employee_id,
    p_company_id,
    v_start_date,
    v_end_date
  );
  
  -- Calcular desconto total
  v_total_discount := v_absence_days * v_daily_value;
  
  -- Retornar resultado
  RETURN QUERY
  SELECT 
    v_equipment_data.id,
    v_equipment_data.employee_id,
    p_period,
    v_equipment_data.monthly_value,
    v_daily_value,
    v_absence_days,
    v_total_discount,
    v_equipment_data.monthly_value - v_total_discount,
    v_absence_details;
END;
$$;


ALTER FUNCTION "rh"."calculate_equipment_absence_discount"("p_equipment_rental_id" "uuid", "p_company_id" "uuid", "p_period" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."calculate_equipment_absence_discount"("p_equipment_rental_id" "uuid", "p_company_id" "uuid", "p_period" "text") IS 'Calcula o desconto por ausÃªncia para um equipamento especÃ­fico em um perÃ­odo, retornando valor original, desconto e valor final';



CREATE OR REPLACE FUNCTION "rh"."calculate_equipment_rental_absence_discount"("p_employee_id" "uuid", "p_company_id" "uuid", "p_year" integer, "p_month" integer) RETURNS TABLE("monthly_value" numeric, "daily_value" numeric, "work_days" integer, "absence_days" integer, "total_discount" numeric, "final_value" numeric)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_rental_record RECORD;
  v_work_days_result RECORD;
  v_monthly_value NUMERIC(10,2);
  v_daily_value NUMERIC(10,2);
  v_work_days INTEGER;
  v_absence_days INTEGER;
  v_total_discount NUMERIC(10,2);
  v_final_value NUMERIC(10,2);
BEGIN
  -- Buscar locação ativa
  SELECT * INTO v_rental_record
  FROM rh.equipment_rentals
  WHERE employee_id = p_employee_id
    AND company_id = p_company_id
    AND is_active = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Locação de equipamento não encontrada para o funcionário: %', p_employee_id;
  END IF;
  
  v_monthly_value := v_rental_record.monthly_value;
  
  -- Calcular dias úteis baseado na escala do funcionário
  SELECT * INTO v_work_days_result
  FROM rh.calculate_employee_work_days(p_employee_id, p_company_id, p_year, p_month);
  
  v_work_days := v_work_days_result.work_days;
  v_absence_days := v_work_days_result.absences_count + 
                   v_work_days_result.vacation_days + 
                   v_work_days_result.sick_leave_days;
  
  -- Calcular valor diário baseado na escala
  IF v_work_days > 0 THEN
    v_daily_value := v_monthly_value / v_work_days;
  ELSE
    v_daily_value := 0;
  END IF;
  
  -- Calcular desconto total
  v_total_discount := v_absence_days * v_daily_value;
  
  -- Valor final
  v_final_value := v_monthly_value - v_total_discount;
  
  -- Retornar resultado
  RETURN QUERY SELECT 
    v_monthly_value,
    v_daily_value,
    v_work_days,
    v_absence_days,
    v_total_discount,
    v_final_value;
END;
$$;


ALTER FUNCTION "rh"."calculate_equipment_rental_absence_discount"("p_employee_id" "uuid", "p_company_id" "uuid", "p_year" integer, "p_month" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."calculate_equipment_rental_absence_discount"("p_employee_id" "uuid", "p_company_id" "uuid", "p_year" integer, "p_month" integer) IS 'Calcula descontos de locação considerando a escala de trabalho do funcionário';



CREATE OR REPLACE FUNCTION "rh"."calculate_equipment_rental_daily_value"("p_employee_id" "uuid", "p_company_id" "uuid", "p_year" integer, "p_month" integer) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_shift_record RECORD;
  v_work_days INTEGER;
  v_monthly_value NUMERIC(10,2);
  v_daily_value NUMERIC(10,2);
BEGIN
  -- Buscar turno ativo do funcionário
  SELECT ws.* INTO v_shift_record
  FROM rh.employee_shifts es
  JOIN rh.work_shifts ws ON es.shift_id = ws.id
  WHERE es.employee_id = p_employee_id
    AND es.is_active = true
    AND ws.is_active = true
  ORDER BY es.data_inicio DESC
  LIMIT 1;
  
  -- Se não tem turno definido, usar 22 dias úteis padrão
  IF NOT FOUND THEN
    v_work_days := 22;
  ELSE
    -- Calcular dias de trabalho baseado na escala
    v_work_days := rh.calculate_flexible_work_days(
      v_shift_record.id, 
      p_year, 
      p_month
    );
  END IF;
  
  -- Buscar valor mensal da locação
  SELECT monthly_value INTO v_monthly_value
  FROM rh.equipment_rentals
  WHERE employee_id = p_employee_id
    AND company_id = p_company_id
    AND is_active = true
  LIMIT 1;
  
  -- Calcular valor diário baseado nos dias de trabalho da escala
  IF v_work_days > 0 THEN
    v_daily_value := v_monthly_value / v_work_days;
  ELSE
    v_daily_value := 0;
  END IF;
  
  RETURN v_daily_value;
END;
$$;


ALTER FUNCTION "rh"."calculate_equipment_rental_daily_value"("p_employee_id" "uuid", "p_company_id" "uuid", "p_year" integer, "p_month" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."calculate_equipment_rental_daily_value"("p_employee_id" "uuid", "p_company_id" "uuid", "p_year" integer, "p_month" integer) IS 'Calcula valor diário de locação baseado na escala de trabalho do funcionário';



CREATE OR REPLACE FUNCTION "rh"."calculate_equipment_rental_payment_with_exemptions"("p_equipment_rental_id" "uuid", "p_company_id" "uuid", "p_period" "text") RETURNS TABLE("equipment_rental_id" "uuid", "employee_id" "uuid", "period" "text", "monthly_value" numeric, "daily_value" numeric, "total_absence_days" integer, "exempt_absence_days" integer, "billable_absence_days" integer, "total_discount" numeric, "final_value" numeric, "absence_details" "jsonb", "exemption_details" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "rh"."calculate_equipment_rental_payment_with_exemptions"("p_equipment_rental_id" "uuid", "p_company_id" "uuid", "p_period" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."calculate_equipment_rental_payment_with_exemptions"("p_equipment_rental_id" "uuid", "p_company_id" "uuid", "p_period" "text") IS 'Calcula pagamento de locação de equipamentos aplicando regras de isenção:
- Dias de atestado médico não descontam da locação
- Dias com compensação de horas aprovada não descontam da locação';



CREATE OR REPLACE FUNCTION "rh"."calculate_flexible_work_days"("p_work_shift_id" "uuid", "p_year" integer, "p_month" integer) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_shift_record RECORD;
  v_month_start DATE;
  v_month_end DATE;
  v_current_date DATE;
  v_day_of_week INTEGER;
  v_cycle_day INTEGER;
  v_work_days INTEGER := 0;
  v_total_days INTEGER;
  v_days_in_cycle INTEGER;
BEGIN
  -- Definir início e fim do mês
  v_month_start := make_date(p_year, p_month, 1);
  v_month_end := (v_month_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  v_total_days := EXTRACT(DAY FROM v_month_end);
  
  -- Buscar dados da escala
  SELECT * INTO v_shift_record
  FROM rh.work_shifts
  WHERE id = p_work_shift_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calcular dias de trabalho baseado no tipo de escala
  CASE v_shift_record.tipo_escala
    WHEN 'fixa' THEN
      -- Escala fixa: usar dias_semana
      v_current_date := v_month_start;
      WHILE v_current_date <= v_month_end LOOP
        v_day_of_week := EXTRACT(DOW FROM v_current_date);
        IF v_day_of_week = ANY(v_shift_record.dias_semana) THEN
          v_work_days := v_work_days + 1;
        END IF;
        v_current_date := v_current_date + INTERVAL '1 day';
      END LOOP;
      
    WHEN 'flexivel_6x1', 'flexivel_5x2', 'flexivel_4x3' THEN
      -- Escalas flexíveis: usar padrão de trabalho/folga
      v_days_in_cycle := v_shift_record.ciclo_dias;
      v_current_date := v_month_start;
      
      WHILE v_current_date <= v_month_end LOOP
        -- Calcular dia do ciclo (1, 2, 3, ...)
        v_cycle_day := ((EXTRACT(DAY FROM v_current_date) - 1) % v_days_in_cycle) + 1;
        
        -- Se está dentro dos dias de trabalho do ciclo
        IF v_cycle_day <= v_shift_record.dias_trabalho THEN
          v_work_days := v_work_days + 1;
        END IF;
        
        v_current_date := v_current_date + INTERVAL '1 day';
      END LOOP;
      
    WHEN 'escala_12x36', 'escala_24x48' THEN
      -- Escalas de plantão: calcular baseado no ciclo
      v_days_in_cycle := v_shift_record.ciclo_dias;
      v_current_date := v_month_start;
      
      WHILE v_current_date <= v_month_end LOOP
        v_cycle_day := ((EXTRACT(DAY FROM v_current_date) - 1) % v_days_in_cycle) + 1;
        
        -- No ciclo de 3 dias (12x36 ou 24x48), apenas o primeiro dia é trabalho
        IF v_cycle_day = 1 THEN
          v_work_days := v_work_days + 1;
        END IF;
        
        v_current_date := v_current_date + INTERVAL '1 day';
      END LOOP;
      
    WHEN 'personalizada' THEN
      -- Escala personalizada: usar configuração específica
      v_days_in_cycle := v_shift_record.ciclo_dias;
      v_current_date := v_month_start;
      
      WHILE v_current_date <= v_month_end LOOP
        v_cycle_day := ((EXTRACT(DAY FROM v_current_date) - 1) % v_days_in_cycle) + 1;
        
        IF v_cycle_day <= v_shift_record.dias_trabalho THEN
          v_work_days := v_work_days + 1;
        END IF;
        
        v_current_date := v_current_date + INTERVAL '1 day';
      END LOOP;
      
    ELSE
      -- Fallback: usar dias úteis padrão (seg-sex)
      v_current_date := v_month_start;
      WHILE v_current_date <= v_month_end LOOP
        v_day_of_week := EXTRACT(DOW FROM v_current_date);
        IF v_day_of_week BETWEEN 1 AND 5 THEN
          v_work_days := v_work_days + 1;
        END IF;
        v_current_date := v_current_date + INTERVAL '1 day';
      END LOOP;
  END CASE;
  
  RETURN v_work_days;
END;
$$;


ALTER FUNCTION "rh"."calculate_flexible_work_days"("p_work_shift_id" "uuid", "p_year" integer, "p_month" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."calculate_flexible_work_days"("p_work_shift_id" "uuid", "p_year" integer, "p_month" integer) IS 'Calcula dias de trabalho baseado na escala flexível do funcionário';



CREATE OR REPLACE FUNCTION "rh"."calculate_max_discount_installment"("emp_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  salario_base NUMERIC(10,2);
BEGIN
  SELECT salario_base INTO salario_base
  FROM rh.employees
  WHERE id = emp_id;
  
  IF salario_base IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN salario_base * 0.30;
END;
$$;


ALTER FUNCTION "rh"."calculate_max_discount_installment"("emp_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."calculate_transporte_monthly_value"("p_employee_id" "uuid", "p_company_id" "uuid", "p_transporte_config_id" "uuid", "p_year" integer, "p_month" integer) RETURNS TABLE("valor_passagem" numeric, "quantidade_passagens" integer, "dias_uteis_mes" integer, "dias_feriados" integer, "dias_ausencia" integer, "dias_ferias" integer, "dias_licenca" integer, "dias_efetivos_trabalho" integer, "valor_bruto" numeric, "valor_desconto_ausencia" numeric, "valor_desconto_ferias" numeric, "valor_desconto_licenca" numeric, "valor_total_desconto" numeric, "valor_final" numeric)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_config_record RECORD;
  v_work_days_result RECORD;
  v_valor_passagem NUMERIC(10,2);
  v_quantidade_passagens INTEGER;
  v_dias_uteis_mes INTEGER;
  v_dias_feriados INTEGER;
  v_dias_ausencia INTEGER;
  v_dias_ferias INTEGER;
  v_dias_licenca INTEGER;
  v_dias_efetivos_trabalho INTEGER;
  v_valor_bruto NUMERIC(10,2);
  v_valor_desconto_ausencia NUMERIC(10,2) := 0;
  v_valor_desconto_ferias NUMERIC(10,2) := 0;
  v_valor_desconto_licenca NUMERIC(10,2) := 0;
  v_valor_total_desconto NUMERIC(10,2) := 0;
  v_valor_final NUMERIC(10,2);
BEGIN
  -- Buscar configuração de transporte
  SELECT * INTO v_config_record
  FROM rh.transporte_configs
  WHERE id = p_transporte_config_id AND company_id = p_company_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configuração de transporte não encontrada: %', p_transporte_config_id;
  END IF;
  
  v_valor_passagem := COALESCE(v_config_record.valor_passagem, 0);
  v_quantidade_passagens := COALESCE(v_config_record.quantidade_passagens, 2); -- 2 passagens por dia (ida e volta)
  
  -- Calcular dias úteis do funcionário
  SELECT * INTO v_work_days_result
  FROM rh.calculate_employee_work_days(p_employee_id, p_company_id, p_year, p_month);
  
  v_dias_uteis_mes := v_work_days_result.work_days;
  v_dias_feriados := v_work_days_result.holidays_count;
  v_dias_ausencia := v_work_days_result.absences_count;
  v_dias_ferias := v_work_days_result.vacation_days;
  v_dias_licenca := v_work_days_result.sick_leave_days;
  v_dias_efetivos_trabalho := v_work_days_result.effective_work_days;
  
  -- Calcular valor bruto (dias úteis * quantidade de passagens * valor da passagem)
  v_valor_bruto := v_dias_uteis_mes * v_quantidade_passagens * v_valor_passagem;
  
  -- Calcular descontos baseado nas configurações
  IF v_config_record.desconto_por_ausencia THEN
    v_valor_desconto_ausencia := v_dias_ausencia * v_quantidade_passagens * v_valor_passagem;
  END IF;
  
  IF v_config_record.desconto_por_ferias THEN
    v_valor_desconto_ferias := v_dias_ferias * v_quantidade_passagens * v_valor_passagem;
  END IF;
  
  IF v_config_record.desconto_por_licenca THEN
    v_valor_desconto_licenca := v_dias_licenca * v_quantidade_passagens * v_valor_passagem;
  END IF;
  
  -- Total de descontos
  v_valor_total_desconto := v_valor_desconto_ausencia + v_valor_desconto_ferias + v_valor_desconto_licenca;
  
  -- Valor final
  v_valor_final := v_valor_bruto - v_valor_total_desconto;
  
  -- Retornar resultado
  RETURN QUERY SELECT 
    v_valor_passagem,
    v_quantidade_passagens,
    v_dias_uteis_mes,
    v_dias_feriados,
    v_dias_ausencia,
    v_dias_ferias,
    v_dias_licenca,
    v_dias_efetivos_trabalho,
    v_valor_bruto,
    v_valor_desconto_ausencia,
    v_valor_desconto_ferias,
    v_valor_desconto_licenca,
    v_valor_total_desconto,
    v_valor_final;
END;
$$;


ALTER FUNCTION "rh"."calculate_transporte_monthly_value"("p_employee_id" "uuid", "p_company_id" "uuid", "p_transporte_config_id" "uuid", "p_year" integer, "p_month" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."calculate_transporte_monthly_value"("p_employee_id" "uuid", "p_company_id" "uuid", "p_transporte_config_id" "uuid", "p_year" integer, "p_month" integer) IS 'Calcula valor mensal de transporte baseado em dias úteis reais do funcionário';



CREATE OR REPLACE FUNCTION "rh"."calculate_vr_va_monthly_value"("p_employee_id" "uuid", "p_company_id" "uuid", "p_vr_va_config_id" "uuid", "p_year" integer, "p_month" integer) RETURNS TABLE("valor_diario" numeric, "dias_uteis_mes" integer, "dias_feriados" integer, "dias_ausencia" integer, "dias_ferias" integer, "dias_licenca" integer, "dias_efetivos_trabalho" integer, "valor_bruto" numeric, "valor_desconto_ausencia" numeric, "valor_desconto_ferias" numeric, "valor_desconto_licenca" numeric, "valor_total_desconto" numeric, "valor_final" numeric)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_config_record RECORD;
  v_work_days_result RECORD;
  v_valor_diario NUMERIC(10,2);
  v_dias_uteis_mes INTEGER;
  v_dias_feriados INTEGER;
  v_dias_ausencia INTEGER;
  v_dias_ferias INTEGER;
  v_dias_licenca INTEGER;
  v_dias_efetivos_trabalho INTEGER;
  v_valor_bruto NUMERIC(10,2);
  v_valor_desconto_ausencia NUMERIC(10,2) := 0;
  v_valor_desconto_ferias NUMERIC(10,2) := 0;
  v_valor_desconto_licenca NUMERIC(10,2) := 0;
  v_valor_total_desconto NUMERIC(10,2) := 0;
  v_valor_final NUMERIC(10,2);
BEGIN
  -- Buscar configuração VR/VA
  SELECT * INTO v_config_record
  FROM rh.vr_va_configs
  WHERE id = p_vr_va_config_id AND company_id = p_company_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configuração VR/VA não encontrada: %', p_vr_va_config_id;
  END IF;
  
  v_valor_diario := v_config_record.valor_diario;
  
  -- Calcular dias úteis do funcionário
  SELECT * INTO v_work_days_result
  FROM rh.calculate_employee_work_days(p_employee_id, p_company_id, p_year, p_month);
  
  v_dias_uteis_mes := v_work_days_result.work_days;
  v_dias_feriados := v_work_days_result.holidays_count;
  v_dias_ausencia := v_work_days_result.absences_count;
  v_dias_ferias := v_work_days_result.vacation_days;
  v_dias_licenca := v_work_days_result.sick_leave_days;
  v_dias_efetivos_trabalho := v_work_days_result.effective_work_days;
  
  -- Calcular valor bruto (dias úteis * valor diário)
  v_valor_bruto := v_dias_uteis_mes * v_valor_diario;
  
  -- Calcular descontos baseado nas configurações
  IF v_config_record.desconto_por_ausencia THEN
    v_valor_desconto_ausencia := v_dias_ausencia * v_valor_diario;
  END IF;
  
  IF v_config_record.desconto_por_ferias THEN
    v_valor_desconto_ferias := v_dias_ferias * v_valor_diario;
  END IF;
  
  IF v_config_record.desconto_por_licenca THEN
    v_valor_desconto_licenca := v_dias_licenca * v_valor_diario;
  END IF;
  
  -- Total de descontos
  v_valor_total_desconto := v_valor_desconto_ausencia + v_valor_desconto_ferias + v_valor_desconto_licenca;
  
  -- Valor final
  v_valor_final := v_valor_bruto - v_valor_total_desconto;
  
  -- Retornar resultado
  RETURN QUERY SELECT 
    v_valor_diario,
    v_dias_uteis_mes,
    v_dias_feriados,
    v_dias_ausencia,
    v_dias_ferias,
    v_dias_licenca,
    v_dias_efetivos_trabalho,
    v_valor_bruto,
    v_valor_desconto_ausencia,
    v_valor_desconto_ferias,
    v_valor_desconto_licenca,
    v_valor_total_desconto,
    v_valor_final;
END;
$$;


ALTER FUNCTION "rh"."calculate_vr_va_monthly_value"("p_employee_id" "uuid", "p_company_id" "uuid", "p_vr_va_config_id" "uuid", "p_year" integer, "p_month" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."calculate_vr_va_monthly_value"("p_employee_id" "uuid", "p_company_id" "uuid", "p_vr_va_config_id" "uuid", "p_year" integer, "p_month" integer) IS 'Calcula valor mensal de VR/VA baseado em dias úteis reais do funcionário';



CREATE OR REPLACE FUNCTION "rh"."criar_ferias_fracionadas"("p_company_id" "uuid", "p_employee_id" "uuid", "p_ano" integer, "p_periodos" "jsonb", "p_observacoes" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_vacation_id UUID;
    v_validation RECORD;
    periodo JSONB;
    i INTEGER;
    num_periodos INTEGER;
BEGIN
    -- Validar férias fracionadas
    SELECT * INTO v_validation 
    FROM rh.validar_ferias_fracionadas(p_employee_id, p_periodos);
    
    IF NOT v_validation.valido THEN
        RAISE EXCEPTION 'Erro de validação: %', v_validation.mensagem;
    END IF;
    
    num_periodos := jsonb_array_length(p_periodos);
    
    -- Criar registro principal de férias
    INSERT INTO rh.vacations (
        company_id,
        employee_id,
        ano,
        periodo,
        tipo_fracionamento,
        total_periodos,
        observacoes,
        status
    ) VALUES (
        p_company_id,
        p_employee_id,
        p_ano,
        'Férias Fracionadas',
        'fracionado',
        num_periodos,
        p_observacoes,
        'solicitado'
    ) RETURNING id INTO v_vacation_id;
    
    -- Criar períodos individuais
    FOR i IN 0..num_periodos-1
    LOOP
        periodo := p_periodos->i;
        
        INSERT INTO rh.vacation_periods (
            vacation_id,
            data_inicio,
            data_fim,
            dias_ferias,
            dias_abono,
            periodo_numero,
            observacoes
        ) VALUES (
            v_vacation_id,
            (periodo->>'data_inicio')::DATE,
            (periodo->>'data_fim')::DATE,
            (periodo->>'dias_ferias')::INTEGER,
            COALESCE((periodo->>'dias_abono')::INTEGER, 0),
            i + 1,
            periodo->>'observacoes'
        );
    END LOOP;
    
    RETURN v_vacation_id;
END;
$$;


ALTER FUNCTION "rh"."criar_ferias_fracionadas"("p_company_id" "uuid", "p_employee_id" "uuid", "p_ano" integer, "p_periodos" "jsonb", "p_observacoes" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."criar_ferias_fracionadas"("p_company_id" "uuid", "p_employee_id" "uuid", "p_ano" integer, "p_periodos" "jsonb", "p_observacoes" "text") IS 'Cria férias fracionadas com validação automática';



CREATE OR REPLACE FUNCTION "rh"."executar_verificacoes_ferias_completa"() RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    notifications_created INTEGER;
    notifications_cleaned INTEGER;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    execution_time INTERVAL;
    result JSON;
BEGIN
    start_time := NOW();
    
    -- 1. Limpar notificações expiradas
    SELECT rh.limpar_notificacoes_expiradas() INTO notifications_cleaned;
    
    -- 2. Gerar novas notificações
    SELECT rh.gerar_notificacoes_ferias() INTO notifications_created;
    
    end_time := NOW();
    execution_time := end_time - start_time;
    
    -- Montar resultado
    result := json_build_object(
        'execution_time', execution_time,
        'start_time', start_time,
        'end_time', end_time,
        'notifications_created', notifications_created,
        'notifications_cleaned', notifications_cleaned,
        'status', 'success'
    );
    
    -- Log da execução
    INSERT INTO rh.vacation_notifications (
        employee_id, notification_type, title, message, 
        priority, is_active, expires_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000'::UUID, -- UUID especial para logs do sistema
        'system_log',
        'Verificação de Férias Executada',
        FORMAT('Criadas: %s notificações | Limpas: %s notificações | Tempo: %s', 
               notifications_created, notifications_cleaned, execution_time),
        'low',
        TRUE,
        NOW() + INTERVAL '1 day'
    );
    
    RETURN result;
END;
$$;


ALTER FUNCTION "rh"."executar_verificacoes_ferias_completa"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."generate_absence_discount_report"("p_company_id" "uuid", "p_period" "text") RETURNS TABLE("period" "text", "total_equipments" integer, "total_original_value" numeric, "total_discount" numeric, "total_final_value" numeric, "average_discount_per_equipment" numeric, "equipment_with_discounts" integer, "summary_by_equipment_type" "jsonb", "summary_by_absence_type" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_total_equipments INTEGER;
  v_total_original_value NUMERIC;
  v_total_discount NUMERIC;
  v_total_final_value NUMERIC;
  v_equipment_with_discounts INTEGER;
  v_summary_by_type JSONB;
  v_summary_by_absence JSONB;
BEGIN
  -- Calcular totais
  SELECT 
    COUNT(*)::INTEGER,
    COALESCE(SUM(monthly_value), 0),
    COALESCE(SUM(total_discount), 0),
    COALESCE(SUM(final_value), 0),
    COUNT(*) FILTER (WHERE total_discount > 0)::INTEGER
  INTO 
    v_total_equipments,
    v_total_original_value,
    v_total_discount,
    v_total_final_value,
    v_equipment_with_discounts
  FROM rh.calculate_all_equipment_absence_discounts(p_company_id, p_period);
  
  -- Resumo por tipo de equipamento
  SELECT json_object_agg(
    equipment_type,
    json_build_object(
      'count', count,
      'total_original_value', total_original_value,
      'total_discount', total_discount,
      'total_final_value', total_final_value
    )
  )
  INTO v_summary_by_type
  FROM (
    SELECT 
      equipment_type,
      COUNT(*) as count,
      SUM(monthly_value) as total_original_value,
      SUM(total_discount) as total_discount,
      SUM(final_value) as total_final_value
    FROM rh.calculate_all_equipment_absence_discounts(p_company_id, p_period)
    GROUP BY equipment_type
  ) t;
  
  -- Resumo por tipo de ausÃªncia
  SELECT json_object_agg(
    absence_type,
    json_build_object(
      'count', count,
      'total_days', total_days
    )
  )
  INTO v_summary_by_absence
  FROM (
    SELECT 
      (absence_details->>'type') as absence_type,
      COUNT(*) as count,
      SUM((absence_details->>'is_justified')::boolean::int) as total_days
    FROM rh.calculate_all_equipment_absence_discounts(p_company_id, p_period),
         jsonb_array_elements(absence_details) as absence_details
    GROUP BY (absence_details->>'type')
  ) t;
  
  -- Retornar relatÃ³rio
  RETURN QUERY
  SELECT 
    p_period,
    v_total_equipments,
    v_total_original_value,
    v_total_discount,
    v_total_final_value,
    CASE 
      WHEN v_total_equipments > 0 THEN v_total_discount / v_total_equipments
      ELSE 0
    END,
    v_equipment_with_discounts,
    COALESCE(v_summary_by_type, '{}'::jsonb),
    COALESCE(v_summary_by_absence, '{}'::jsonb);
END;
$$;


ALTER FUNCTION "rh"."generate_absence_discount_report"("p_company_id" "uuid", "p_period" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."generate_absence_discount_report"("p_company_id" "uuid", "p_period" "text") IS 'Gera relatÃ³rio completo de descontos por ausÃªncia com resumos por tipo de equipamento e ausÃªncia';



CREATE OR REPLACE FUNCTION "rh"."generate_candidate_upload_token"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;


ALTER FUNCTION "rh"."generate_candidate_upload_token"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."generate_employee_matricula"("company_id_param" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    company_code TEXT;
    next_sequence INTEGER;
    generated_matricula TEXT;
BEGIN
    -- Obter o cÃ³digo da empresa do campo codigo_empresa
    SELECT codigo_empresa
    INTO company_code
    FROM core.companies
    WHERE id = company_id_param;
    
    -- Se a empresa nÃ£o for encontrada ou nÃ£o tiver cÃ³digo, usar cÃ³digo padrÃ£o
    IF company_code IS NULL THEN
        company_code := '99';
    END IF;
    
    -- Obter o prÃ³ximo nÃºmero da sequÃªncia para esta empresa
    SELECT 
        COALESCE(MAX(
            CAST(SUBSTRING(matricula FROM 3 FOR 4) AS INTEGER)
        ), 0) + 1
    INTO next_sequence
    FROM rh.employees
    WHERE matricula ~ ('^' || company_code || '[0-9]{4}$')
    AND company_id = company_id_param;
    
    -- Gerar a matrÃ­cula no formato: [cÃ³digo_empresa][sequÃªncia_4_dÃ­gitos]
    generated_matricula := company_code || LPAD(next_sequence::TEXT, 4, '0');
    
    RETURN generated_matricula;
END;
$_$;


ALTER FUNCTION "rh"."generate_employee_matricula"("company_id_param" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."generate_employee_matricula"("company_id_param" "uuid") IS 'Gera matrÃ­cula automÃ¡tica para funcionÃ¡rio baseada no cÃ³digo da empresa e sequÃªncia';



CREATE OR REPLACE FUNCTION "rh"."generate_flexible_schedule_pattern"("p_work_shift_id" "uuid", "p_dias_trabalho" integer, "p_dias_folga" integer, "p_ciclo_dias" integer, "p_hora_inicio" time without time zone, "p_hora_fim" time without time zone) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    dia_ciclo INTEGER;
    tipo_dia VARCHAR(20);
BEGIN
    -- Limpar padrões existentes
    DELETE FROM rh.work_shift_patterns WHERE work_shift_id = p_work_shift_id;
    
    -- Gerar padrão do ciclo
    FOR dia_ciclo IN 1..p_ciclo_dias LOOP
        IF dia_ciclo <= p_dias_trabalho THEN
            tipo_dia := 'trabalho';
        ELSE
            tipo_dia := 'folga';
        END IF;
        
        INSERT INTO rh.work_shift_patterns (
            work_shift_id,
            dia_ciclo,
            tipo_dia,
            hora_inicio,
            hora_fim
        ) VALUES (
            p_work_shift_id,
            dia_ciclo,
            tipo_dia,
            CASE WHEN tipo_dia = 'trabalho' THEN p_hora_inicio ELSE NULL END,
            CASE WHEN tipo_dia = 'trabalho' THEN p_hora_fim ELSE NULL END
        );
    END LOOP;
END;
$$;


ALTER FUNCTION "rh"."generate_flexible_schedule_pattern"("p_work_shift_id" "uuid", "p_dias_trabalho" integer, "p_dias_folga" integer, "p_ciclo_dias" integer, "p_hora_inicio" time without time zone, "p_hora_fim" time without time zone) OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."generate_flexible_schedule_pattern"("p_work_shift_id" "uuid", "p_dias_trabalho" integer, "p_dias_folga" integer, "p_ciclo_dias" integer, "p_hora_inicio" time without time zone, "p_hora_fim" time without time zone) IS 'Gera padrão de escala flexível';



CREATE OR REPLACE FUNCTION "rh"."gerar_notificacoes_ferias"("employee_id_param" "uuid" DEFAULT NULL::"uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    emp_record RECORD;
    vacation_status RECORD;
    vacation_right RECORD;
    notifications_created INTEGER := 0;
    notification_title TEXT;
    notification_message TEXT;
    notification_priority TEXT;
    due_date_val DATE;
BEGIN
    -- Se employee_id_param for NULL, processar todos os funcionários ativos
    FOR emp_record IN 
        SELECT e.id, e.nome, e.data_admissao, e.company_id
        FROM rh.employees e
        WHERE e.status = 'ativo' 
        AND (employee_id_param IS NULL OR e.id = employee_id_param)
    LOOP
        -- Verificar direito a férias
        SELECT * INTO vacation_right 
        FROM rh.calcular_direito_ferias(emp_record.id);
        
        -- Verificar status das férias
        SELECT * INTO vacation_status 
        FROM rh.calcular_status_ferias(emp_record.id);
        
        -- Gerar notificação se tem direito a férias mas ainda não notificou
        IF vacation_right.tem_direito THEN
            -- Verificar se já existe notificação ativa para férias disponível
            IF NOT EXISTS (
                SELECT 1 FROM rh.vacation_notifications 
                WHERE employee_id = emp_record.id 
                AND notification_type = 'ferias_disponivel'
                AND is_active = TRUE
                AND created_at >= CURRENT_DATE - INTERVAL '30 days' -- Renovar a cada 30 dias
            ) THEN
                notification_title := 'Férias Disponíveis';
                notification_message := 'Você já possui direito a férias. Entre em contato com o RH para agendar suas férias.';
                notification_priority := 'medium';
                due_date_val := vacation_status.data_vencimento;
                
                INSERT INTO rh.vacation_notifications (
                    company_id, employee_id, notification_type, title, message, 
                    priority, due_date, days_remaining, expires_at
                ) VALUES (
                    emp_record.company_id, emp_record.id, 'ferias_disponivel',
                    notification_title, notification_message, notification_priority,
                    due_date_val, vacation_status.dias_restantes,
                    CURRENT_DATE + INTERVAL '30 days'
                );
                notifications_created := notifications_created + 1;
            END IF;
        END IF;
        
        -- Gerar notificação de férias vencendo (3 meses antes)
        IF vacation_status.dias_restantes <= 90 AND vacation_status.dias_restantes > 0 THEN
            -- Verificar se já existe notificação ativa
            IF NOT EXISTS (
                SELECT 1 FROM rh.vacation_notifications 
                WHERE employee_id = emp_record.id 
                AND notification_type = 'ferias_vencendo'
                AND is_active = TRUE
                AND created_at >= CURRENT_DATE - INTERVAL '7 days' -- Renovar semanalmente
            ) THEN
                notification_title := 'Férias Vencendo - Atenção!';
                notification_message := FORMAT(
                    'Suas férias vencem em %s dias (%s). É obrigatório tirar férias antes desta data.',
                    vacation_status.dias_restantes,
                    vacation_status.data_vencimento
                );
                notification_priority := vacation_status.nivel_criticidade;
                due_date_val := vacation_status.data_vencimento;
                
                INSERT INTO rh.vacation_notifications (
                    company_id, employee_id, notification_type, title, message, 
                    priority, due_date, days_remaining, expires_at
                ) VALUES (
                    emp_record.company_id, emp_record.id, 'ferias_vencendo',
                    notification_title, notification_message, notification_priority,
                    due_date_val, vacation_status.dias_restantes,
                    due_date_val
                );
                notifications_created := notifications_created + 1;
            END IF;
        END IF;
        
        -- Gerar notificação de férias vencida
        IF vacation_status.dias_restantes <= 0 THEN
            -- Verificar se já existe notificação ativa
            IF NOT EXISTS (
                SELECT 1 FROM rh.vacation_notifications 
                WHERE employee_id = emp_record.id 
                AND notification_type = 'ferias_vencida'
                AND is_active = TRUE
                AND created_at >= CURRENT_DATE - INTERVAL '1 day' -- Renovar diariamente
            ) THEN
                notification_title := 'FÉRIAS VENCIDAS - URGENTE!';
                notification_message := FORMAT(
                    'ATENÇÃO: Suas férias estão VENCIDAS desde %s. Você deve tirar férias IMEDIATAMENTE. Entre em contato com o RH urgentemente.',
                    vacation_status.data_vencimento
                );
                notification_priority := 'critical';
                due_date_val := vacation_status.data_vencimento;
                
                INSERT INTO rh.vacation_notifications (
                    company_id, employee_id, notification_type, title, message, 
                    priority, due_date, days_restantes, expires_at
                ) VALUES (
                    emp_record.company_id, emp_record.id, 'ferias_vencida',
                    notification_title, notification_message, notification_priority,
                    due_date_val, vacation_status.dias_restantes,
                    CURRENT_DATE + INTERVAL '7 days'
                );
                notifications_created := notifications_created + 1;
            END IF;
        END IF;
    END LOOP;
    
    RETURN notifications_created;
END;
$$;


ALTER FUNCTION "rh"."gerar_notificacoes_ferias"("employee_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."get_beneficios_elegiveis"("p_employee_id" "uuid") RETURNS TABLE("benefit_id" "uuid", "benefit_name" character varying, "tipo_elegibilidade" character varying, "valor_especifico" numeric, "percentual_especifico" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id as benefit_id,
        b.nome as benefit_name,
        be.tipo_elegibilidade,
        be.valor_especifico,
        be.percentual_especifico
    FROM rh.benefits b
    JOIN rh.beneficios_elegibilidade be ON b.id = be.benefit_id
    JOIN rh.employees e ON e.id = p_employee_id
    WHERE be.is_active = true
    AND b.is_active = true
    AND (
        be.tipo_elegibilidade = 'todos'
        OR (be.tipo_elegibilidade = 'cargo' AND be.position_id = e.position_id)
        OR (be.tipo_elegibilidade = 'departamento' AND be.department_id = e.department_id)
        OR (be.tipo_elegibilidade = 'funcionario' AND be.employee_id = p_employee_id)
    );
END;
$$;


ALTER FUNCTION "rh"."get_beneficios_elegiveis"("p_employee_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."get_convenios_com_planos"("p_company_id" "uuid") RETURNS TABLE("convenio_id" "uuid", "convenio_nome" character varying, "convenio_tipo" character varying, "prestador" character varying, "plano_id" "uuid", "plano_nome" character varying, "plano_tipo" character varying, "valor_titular" numeric, "valor_dependente" numeric, "cobertura" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.id as convenio_id,
        ce.nome as convenio_nome,
        ce.tipo as convenio_tipo,
        ce.prestador,
        cp.id as plano_id,
        cp.nome as plano_nome,
        cp.tipo_plano as plano_tipo,
        cp.valor_titular,
        cp.valor_dependente,
        cp.cobertura
    FROM rh.convenios_empresas ce
    LEFT JOIN rh.convenios_planos cp ON ce.id = cp.convenio_empresa_id
    WHERE ce.company_id = p_company_id
    AND ce.is_active = true
    AND (cp.id IS NULL OR cp.is_active = true)
    ORDER BY ce.nome, cp.nome;
END;
$$;


ALTER FUNCTION "rh"."get_convenios_com_planos"("p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."get_correction_status"("company_uuid" "uuid", "target_year" integer, "target_month" integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  correction_enabled boolean;
BEGIN
  SELECT trcc.correction_enabled INTO correction_enabled
  FROM rh.time_record_correction_control trcc
  WHERE trcc.company_id = company_uuid
    AND trcc.year = target_year
    AND trcc.month = target_month;
  
  -- Se não encontrar registro, retorna false (correção bloqueada por padrão)
  RETURN COALESCE(correction_enabled, false);
END;
$$;


ALTER FUNCTION "rh"."get_correction_status"("company_uuid" "uuid", "target_year" integer, "target_month" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."get_correction_status"("company_uuid" "uuid", "target_year" integer, "target_month" integer) IS 'Retorna se a correção de ponto está liberada para a empresa/ano/mês';



CREATE OR REPLACE FUNCTION "rh"."get_dependentes_para_convenio"("p_employee_id" "uuid") RETURNS TABLE("dependent_id" "uuid", "nome" character varying, "cpf" character varying, "parentesco" character varying, "is_health_plan_dependent" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ed.id as dependent_id,
        ed.name as nome,
        ed.cpf,
        kd.descricao as parentesco,
        ed.is_health_plan_dependent
    FROM rh.employee_dependents ed
    JOIN rh.kinship_degrees kd ON ed.kinship_degree_id = kd.id
    WHERE ed.employee_id = p_employee_id
    AND ed.is_active = true
    AND ed.is_health_plan_dependent = true
    ORDER BY ed.name;
END;
$$;


ALTER FUNCTION "rh"."get_dependentes_para_convenio"("p_employee_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."get_employee_absence_days"("p_employee_id" "uuid", "p_company_id" "uuid", "p_start_date" "date", "p_end_date" "date") RETURNS TABLE("absence_date" "date", "absence_type" "text", "description" "text", "is_justified" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  WITH work_days AS (
    -- Gerar todos os dias Ãºteis do perÃ­odo (excluindo fins de semana)
    SELECT gs::date AS work_day
    FROM generate_series(
      p_start_date::timestamp,
      p_end_date::timestamp,
      '1 day'::interval
    ) AS gs
    WHERE EXTRACT(dow FROM gs) NOT IN (0, 6) -- Excluir domingo (0) e sÃ¡bado (6)
  ),
  recorded_days AS (
    -- Dias com registro de ponto
    SELECT DISTINCT tr.data
    FROM rh.time_records tr
    WHERE tr.employee_id = p_employee_id
      AND tr.company_id = p_company_id
      AND tr.data >= p_start_date
      AND tr.data <= p_end_date
  ),
  medical_certificate_days AS (
    -- Dias com atestado mÃ©dico aprovado
    SELECT DISTINCT generate_series(
      GREATEST(mc.data_inicio, p_start_date),
      LEAST(mc.data_fim, p_end_date),
      '1 day'::interval
    )::date as absence_date
    FROM rh.medical_certificates mc
    WHERE mc.employee_id = p_employee_id
      AND mc.company_id = p_company_id
      AND mc.status = 'aprovado'
      AND mc.data_inicio <= p_end_date
      AND mc.data_fim >= p_start_date
  ),
  vacation_days AS (
    -- Dias de fÃ©rias aprovadas
    SELECT DISTINCT generate_series(
      GREATEST(v.data_inicio, p_start_date),
      LEAST(v.data_fim, p_end_date),
      '1 day'::interval
    )::date as absence_date
    FROM rh.vacations v
    WHERE v.employee_id = p_employee_id
      AND v.company_id = p_company_id
      AND v.status = 'aprovado'
      AND v.data_inicio <= p_end_date
      AND v.data_fim >= p_start_date
  )
  SELECT 
    wd.work_day as absence_date,
    'no_time_record'::TEXT as absence_type,
    'Sem registro de ponto'::TEXT as description,
    false as is_justified
  FROM work_days wd
  LEFT JOIN recorded_days rd ON wd.work_day = rd.data
  WHERE rd.data IS NULL
  
  UNION ALL
  
  SELECT 
    mcd.absence_date,
    'medical_certificate'::TEXT as absence_type,
    'Atestado mÃ©dico'::TEXT as description,
    true as is_justified
  FROM medical_certificate_days mcd
  
  UNION ALL
  
  SELECT 
    vd.absence_date,
    'vacation'::TEXT as absence_type,
    'FÃ©rias'::TEXT as description,
    true as is_justified
  FROM vacation_days vd
  
  ORDER BY absence_date;
END;
$$;


ALTER FUNCTION "rh"."get_employee_absence_days"("p_employee_id" "uuid", "p_company_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."get_employee_absence_days"("p_employee_id" "uuid", "p_company_id" "uuid", "p_start_date" "date", "p_end_date" "date") IS 'Busca todos os dias de ausÃªncia de um funcionÃ¡rio em um perÃ­odo especÃ­fico, incluindo dias sem registro de ponto, atestados mÃ©dicos e fÃ©rias';



CREATE OR REPLACE FUNCTION "rh"."get_employee_agreements"("employee_uuid" "uuid") RETURNS TABLE("agreements" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', fc.id,
          'convenio_plano_id', fc.convenio_plano_id,
          'data_inicio', fc.data_inicio,
          'data_fim', fc.data_fim,
          'valor_titular', fc.valor_titular,
          'valor_dependentes', fc.valor_dependentes,
          'valor_total', fc.valor_total,
          'status', fc.status,
          'observacoes', fc.observacoes,
          'created_at', fc.created_at,
          'updated_at', fc.updated_at
        )
      ) 
       FROM rh.funcionario_convenios fc 
       WHERE fc.employee_id = employee_uuid 
       AND fc.status = 'ativo'), 
      '[]'::jsonb
    ) as agreements;
END;
$$;


ALTER FUNCTION "rh"."get_employee_agreements"("employee_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."get_employee_agreements"("employee_uuid" "uuid") IS 'Retorna os convênios de um funcionário';



CREATE OR REPLACE FUNCTION "rh"."get_employee_benefit_config"("p_employee_id" "uuid", "p_benefit_type" character varying, "p_date" "date" DEFAULT CURRENT_DATE) RETURNS TABLE("config_id" "uuid", "config_type" character varying)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN p_benefit_type = 'vr-va' THEN eba.vr_va_config_id
            WHEN p_benefit_type = 'transporte' THEN eba.transporte_config_id
        END as config_id,
        eba.benefit_type as config_type
    FROM rh.employee_benefit_assignments eba
    WHERE eba.employee_id = p_employee_id
        AND eba.benefit_type = p_benefit_type
        AND eba.is_active = true
        AND eba.data_inicio <= p_date
        AND (eba.data_fim IS NULL OR eba.data_fim >= p_date)
    ORDER BY eba.data_inicio DESC
    LIMIT 1;
END;
$$;


ALTER FUNCTION "rh"."get_employee_benefit_config"("p_employee_id" "uuid", "p_benefit_type" character varying, "p_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."get_employee_complete"("employee_uuid" "uuid") RETURNS TABLE("employee_data" "jsonb", "documents" "jsonb", "address" "jsonb", "spouse" "jsonb", "bank_accounts" "jsonb", "education" "jsonb", "dependents" "jsonb", "benefits" "jsonb", "contracts" "jsonb", "agreements" "jsonb", "pcd_info" "jsonb", "tax_calculations" "jsonb", "elegibilidade" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_jsonb(e.*) as employee_data,
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(ed.*)) 
       FROM rh.employee_documents ed 
       WHERE ed.employee_id = employee_uuid), 
      '[]'::jsonb
    ) as documents,
    COALESCE(
      (SELECT to_jsonb(ea.*) 
       FROM rh.employee_addresses ea 
       WHERE ea.employee_id = employee_uuid 
       AND ea.tipo_endereco = 'residencial' 
       LIMIT 1), 
      '{}'::jsonb
    ) as address,
    COALESCE(
      (SELECT to_jsonb(es.*) 
       FROM rh.employee_spouses es 
       WHERE es.employee_id = employee_uuid 
       LIMIT 1), 
      '{}'::jsonb
    ) as spouse,
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(eba.*)) 
       FROM rh.employee_bank_accounts eba 
       WHERE eba.employee_id = employee_uuid), 
      '[]'::jsonb
    ) as bank_accounts,
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(edu.*)) 
       FROM rh.employee_education edu 
       WHERE edu.employee_id = employee_uuid), 
      '[]'::jsonb
    ) as education,
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(edep.*)) 
       FROM rh.employee_dependents edep 
       WHERE edep.employee_id = employee_uuid 
       AND edep.is_active = true), 
      '[]'::jsonb
    ) as dependents,
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(eb.*)) 
       FROM rh.employee_benefits eb 
       WHERE eb.employee_id = employee_uuid 
       AND eb.is_active = true), 
      '[]'::jsonb
    ) as benefits,
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(ec.*)) 
       FROM rh.employment_contracts ec 
       WHERE ec.employee_id = employee_uuid 
       AND ec.is_active = true), 
      '[]'::jsonb
    ) as contracts,
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(fc.*)) 
       FROM rh.funcionario_convenios fc 
       WHERE fc.employee_id = employee_uuid 
       AND fc.status = 'ativo'), 
      '[]'::jsonb
    ) as agreements,
    COALESCE(
      (SELECT to_jsonb(epcd.*) 
       FROM rh.employee_pcd_info epcd 
       WHERE epcd.employee_id = employee_uuid 
       AND epcd.is_active = true
       LIMIT 1), 
      '{}'::jsonb
    ) as pcd_info,
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(etc.*)) 
       FROM rh.employee_tax_calculations etc 
       WHERE etc.employee_id = employee_uuid 
       AND etc.is_active = true), 
      '[]'::jsonb
    ) as tax_calculations,
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(fe.*)) 
       FROM rh.funcionario_elegibilidade fe 
       WHERE fe.employee_id = employee_uuid), 
      '[]'::jsonb
    ) as elegibilidade;
END;
$$;


ALTER FUNCTION "rh"."get_employee_complete"("employee_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."get_employee_complete"("employee_uuid" "uuid") IS 'Retorna todas as informações completas de um funcionário incluindo dependentes, convênios, PCD e elegibilidade';



CREATE OR REPLACE FUNCTION "rh"."get_employee_dependents"("employee_uuid" "uuid") RETURNS TABLE("dependents" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', ed.id,
          'name', ed.name,
          'cpf', ed.cpf,
          'birth_date', ed.birth_date,
          'dependent_type_id', ed.dependent_type_id,
          'kinship_degree_id', ed.kinship_degree_id,
          'is_pcd', ed.is_pcd,
          'deficiency_type_id', ed.deficiency_type_id,
          'deficiency_degree_id', ed.deficiency_degree_id,
          'cid_code', ed.cid_code,
          'cid_description', ed.cid_description,
          'needs_special_care', ed.needs_special_care,
          'special_care_description', ed.special_care_description,
          'is_ir_dependent', ed.is_ir_dependent,
          'is_health_plan_dependent', ed.is_health_plan_dependent,
          'is_school_allowance_dependent', ed.is_school_allowance_dependent,
          'is_active', ed.is_active,
          'created_at', ed.created_at,
          'updated_at', ed.updated_at
        )
      ) 
       FROM rh.employee_dependents ed 
       WHERE ed.employee_id = employee_uuid 
       AND ed.is_active = true), 
      '[]'::jsonb
    ) as dependents;
END;
$$;


ALTER FUNCTION "rh"."get_employee_dependents"("employee_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."get_employee_dependents"("employee_uuid" "uuid") IS 'Retorna os dependentes de um funcionário';



CREATE OR REPLACE FUNCTION "rh"."get_employee_history"("employee_uuid" "uuid") RETURNS TABLE("id" "uuid", "movement_type_codigo" "text", "movement_type_nome" "text", "previous_data" "jsonb", "new_data" "jsonb", "effective_date" "date", "reason" "text", "description" "text", "attachment_url" "text", "created_at" timestamp with time zone, "created_by_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        eh.id,
        emt.codigo,
        emt.nome,
        jsonb_build_object(
            'position_id', eh.previous_position_id,
            'cost_center_id', eh.previous_cost_center_id,
            'project_id', eh.previous_project_id,
            'work_shift_id', eh.previous_work_shift_id,
            'manager_id', eh.previous_manager_id,
            'salario_base', eh.previous_salario_base,
            'status', eh.previous_status
        ),
        jsonb_build_object(
            'position_id', eh.new_position_id,
            'cost_center_id', eh.new_cost_center_id,
            'project_id', eh.new_project_id,
            'work_shift_id', eh.new_work_shift_id,
            'manager_id', eh.new_manager_id,
            'salario_base', eh.new_salario_base,
            'status', eh.new_status
        ),
        eh.effective_date,
        eh.reason,
        eh.description,
        eh.attachment_url,
        eh.created_at,
        COALESCE(au.email, 'Sistema') as created_by_name
    FROM rh.employee_history eh
    JOIN rh.employee_movement_types emt ON eh.movement_type_id = emt.id
    LEFT JOIN auth.users au ON eh.created_by = au.id
    WHERE eh.employee_id = employee_uuid
    ORDER BY eh.effective_date DESC, eh.created_at DESC;
END;
$$;


ALTER FUNCTION "rh"."get_employee_history"("employee_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."get_employee_history"("employee_uuid" "uuid") IS 'Retorna o histÃ³rico completo de movimentaÃ§Ãµes de um funcionÃ¡rio';



CREATE OR REPLACE FUNCTION "rh"."get_employee_history_stats"("employee_uuid" "uuid") RETURNS TABLE("total_movements" bigint, "last_movement_date" "date", "average_days_between_movements" numeric, "movements_by_type" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    total_count BIGINT;
    last_date DATE;
    avg_days NUMERIC;
    type_stats JSONB;
BEGIN
    -- Total de movimentaÃ§Ãµes
    SELECT COUNT(*) INTO total_count
    FROM rh.employee_history
    WHERE employee_id = employee_uuid;
    
    -- Data da Ãºltima movimentaÃ§Ã£o
    SELECT effective_date INTO last_date
    FROM rh.employee_history
    WHERE employee_id = employee_uuid
    ORDER BY effective_date DESC
    LIMIT 1;
    
    -- Calcular mÃ©dia de dias entre movimentaÃ§Ãµes
    SELECT COALESCE(AVG(days_diff), 0) INTO avg_days
    FROM (
        SELECT EXTRACT(DAY FROM (effective_date - LAG(effective_date) OVER (ORDER BY effective_date))) as days_diff
        FROM rh.employee_history
        WHERE employee_id = employee_uuid
        ORDER BY effective_date
    ) subquery
    WHERE days_diff IS NOT NULL;
    
    -- MovimentaÃ§Ãµes por tipo
    SELECT jsonb_agg(
        jsonb_build_object(
            'type', emt.nome,
            'count', type_count
        )
    ) INTO type_stats
    FROM (
        SELECT emt.nome, COUNT(*) as type_count
        FROM rh.employee_history eh
        JOIN rh.employee_movement_types emt ON eh.movement_type_id = emt.id
        WHERE eh.employee_id = employee_uuid
        GROUP BY emt.nome
    ) type_counts;
    
    RETURN QUERY SELECT total_count, last_date, avg_days, COALESCE(type_stats, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "rh"."get_employee_history_stats"("employee_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."get_employee_history_stats"("employee_uuid" "uuid") IS 'Retorna estatÃ­sticas do histÃ³rico de movimentaÃ§Ãµes de um funcionÃ¡rio';



CREATE OR REPLACE FUNCTION "rh"."get_exams_needing_notification"("p_company_id" "uuid", "p_days_before" integer DEFAULT 30) RETURNS TABLE("exam_id" "uuid", "employee_id" "uuid", "employee_name" "text", "exam_type" "text", "scheduled_date" "date", "days_until_expiry" integer, "is_overdue" boolean)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  cutoff_date date;
BEGIN
  cutoff_date := CURRENT_DATE + INTERVAL '1 day' * p_days_before;
  
  RETURN QUERY
  SELECT 
    pe.id,
    pe.employee_id,
    e.nome,
    pe.tipo_exame,
    pe.data_agendada,
    (pe.data_agendada - CURRENT_DATE)::integer,
    (pe.data_agendada < CURRENT_DATE)
  FROM rh.periodic_exams pe
  JOIN rh.employees e ON e.id = pe.employee_id
  WHERE pe.company_id = p_company_id
    AND pe.status = 'agendado'
    AND pe.data_agendada <= cutoff_date
  ORDER BY pe.data_agendada ASC;
END;
$$;


ALTER FUNCTION "rh"."get_exams_needing_notification"("p_company_id" "uuid", "p_days_before" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."get_funcionarios_elegiveis"("p_company_id" "uuid", "p_beneficio_tipo_id" "uuid") RETURNS TABLE("employee_id" "uuid", "nome" character varying, "cargo" character varying, "departamento" character varying, "is_elegivel" boolean, "regra_aplicada" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id as employee_id,
        e.name as nome,
        p.nome as cargo,
        d.nome as departamento,
        fe.is_elegivel,
        be.nome as regra_aplicada
    FROM rh.employees e
    LEFT JOIN rh.positions p ON e.position_id = p.id
    LEFT JOIN core.departments d ON e.department_id = d.id
    LEFT JOIN rh.funcionario_elegibilidade fe ON e.id = fe.employee_id
    LEFT JOIN rh.beneficio_elegibilidade be ON fe.elegibilidade_id = be.id
    WHERE e.company_id = p_company_id
    AND e.is_active = true
    AND be.beneficio_tipo_id = p_beneficio_tipo_id
    AND be.is_active = true
    AND (be.data_fim IS NULL OR be.data_fim >= CURRENT_DATE)
    ORDER BY e.name;
END;
$$;


ALTER FUNCTION "rh"."get_funcionarios_elegiveis"("p_company_id" "uuid", "p_beneficio_tipo_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."get_notification_stats"("p_user_id" "uuid", "p_days" integer DEFAULT 30) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_sent', COUNT(*),
        'delivered', COUNT(*) FILTER (WHERE was_delivered = true),
        'clicked', COUNT(*) FILTER (WHERE was_clicked = true),
        'by_type', jsonb_object_agg(
            notification_type, 
            jsonb_build_object(
                'count', type_count,
                'delivered', delivered_count,
                'clicked', clicked_count
            )
        )
    )
    INTO result
    FROM (
        SELECT 
            notification_type,
            COUNT(*) as type_count,
            COUNT(*) FILTER (WHERE was_delivered = true) as delivered_count,
            COUNT(*) FILTER (WHERE was_clicked = true) as clicked_count
        FROM rh.notification_history
        WHERE user_id = p_user_id
        AND sent_at >= now() - INTERVAL '1 day' * p_days
        GROUP BY notification_type
    ) stats;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$;


ALTER FUNCTION "rh"."get_notification_stats"("p_user_id" "uuid", "p_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."get_resumo_rateios"("p_company_id" "uuid", "p_beneficio_tipo_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("rateio_id" "uuid", "rateio_nome" character varying, "beneficio_tipo_nome" character varying, "tipo_rateio" character varying, "valor_total" numeric, "total_departamentos" integer, "valor_distribuido" numeric, "percentual_distribuido" numeric, "periodo_inicio" "date", "periodo_fim" "date", "is_active" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        br.id as rateio_id,
        br.nome as rateio_nome,
        bt.nome as beneficio_tipo_nome,
        br.tipo_rateio,
        br.valor_total,
        COUNT(brd.department_id) as total_departamentos,
        COALESCE(SUM(brd.valor_calculado), 0) as valor_distribuido,
        CASE 
            WHEN br.valor_total > 0 THEN 
                (COALESCE(SUM(brd.valor_calculado), 0) / br.valor_total * 100)
            ELSE 0
        END as percentual_distribuido,
        br.periodo_inicio,
        br.periodo_fim,
        br.is_active
    FROM rh.beneficio_rateios br
    JOIN rh.beneficio_tipos bt ON br.beneficio_tipo_id = bt.id
    LEFT JOIN rh.beneficio_rateio_departamentos brd ON br.id = brd.rateio_id
    WHERE br.company_id = p_company_id
    AND (p_beneficio_tipo_id IS NULL OR br.beneficio_tipo_id = p_beneficio_tipo_id)
    GROUP BY br.id, br.nome, bt.nome, br.tipo_rateio, br.valor_total, 
             br.periodo_inicio, br.periodo_fim, br.is_active
    ORDER BY br.created_at DESC;
END;
$$;


ALTER FUNCTION "rh"."get_resumo_rateios"("p_company_id" "uuid", "p_beneficio_tipo_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."get_user_reminder_settings"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT time_reminder_settings 
    INTO result
    FROM rh.user_settings 
    WHERE user_id = p_user_id 
    AND setting_type = 'time_reminders';
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$;


ALTER FUNCTION "rh"."get_user_reminder_settings"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."limpar_notificacoes_apos_ferias"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Quando uma férias é aprovada, marcar notificações relacionadas como inativas
    IF NEW.status = 'aprovado' AND (OLD.status IS NULL OR OLD.status != 'aprovado') THEN
        UPDATE rh.vacation_notifications 
        SET is_active = FALSE, expires_at = NOW()
        WHERE employee_id = NEW.employee_id 
        AND notification_type IN ('ferias_disponivel', 'ferias_vencendo', 'ferias_vencida')
        AND is_active = TRUE;
        
        -- Gerar nova notificação de férias aprovada
        INSERT INTO rh.vacation_notifications (
            company_id, employee_id, notification_type, title, message, 
            priority, due_date, days_remaining, expires_at
        ) VALUES (
            NEW.company_id, NEW.employee_id, 'ferias_aprovada',
            'Férias Aprovadas',
            FORMAT('Suas férias foram aprovadas para o período de %s a %s.', 
                   NEW.data_inicio, NEW.data_fim),
            'low', NEW.data_inicio, 0,
            NEW.data_fim + INTERVAL '30 days'
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "rh"."limpar_notificacoes_apos_ferias"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."limpar_notificacoes_expiradas"() RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Marcar como inativas notificações expiradas
    UPDATE rh.vacation_notifications 
    SET is_active = FALSE
    WHERE is_active = TRUE 
    AND (expires_at IS NOT NULL AND expires_at < NOW())
    OR (created_at < NOW() - INTERVAL '1 year'); -- Notificações muito antigas
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Deletar notificações muito antigas (mais de 2 anos)
    DELETE FROM rh.vacation_notifications 
    WHERE created_at < NOW() - INTERVAL '2 years';
    
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "rh"."limpar_notificacoes_expiradas"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."log_employee_admission"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    movement_type_id UUID;
BEGIN
    -- Obter o ID do tipo de movimentaÃ§Ã£o "ADMISSAO"
    SELECT id INTO movement_type_id FROM rh.employee_movement_types WHERE codigo = 'ADMISSAO';
    
    -- Registrar a admissÃ£o no histÃ³rico
    INSERT INTO rh.employee_history (
        employee_id,
        company_id,
        movement_type_id,
        new_position_id,
        new_cost_center_id,
        new_project_id,
        new_department_id,
        new_work_shift_id,
        new_manager_id,
        new_salario_base,
        new_status,
        effective_date,
        description,
        created_by
    ) VALUES (
        NEW.id,
        NEW.company_id,
        movement_type_id,
        NEW.position_id,
        NEW.cost_center_id,
        NEW.project_id,
        NEW.department_id,
        NEW.work_shift_id,
        NEW.manager_id,
        NEW.salario_base,
        NEW.status,
        NEW.data_admissao::DATE,
        'AdmissÃ£o do funcionÃ¡rio',
        auth.uid()
    );
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "rh"."log_employee_admission"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."log_employee_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    movement_type_id UUID;
    change_detected BOOLEAN := FALSE;
    movement_description TEXT := '';
BEGIN
    -- Verificar se Ã© uma atualizaÃ§Ã£o (nÃ£o inserÃ§Ã£o)
    IF TG_OP = 'UPDATE' THEN
        -- Determinar o tipo de movimentaÃ§Ã£o baseado nas mudanÃ§as
        change_detected := FALSE;
        
        -- Verificar mudanÃ§a de cargo/posiÃ§Ã£o
        IF OLD.position_id IS DISTINCT FROM NEW.position_id THEN
            SELECT id INTO movement_type_id FROM rh.employee_movement_types WHERE codigo = 'MUDANCA_FUNCAO';
            movement_description := COALESCE(movement_description || '; ', '') || 'MudanÃ§a de cargo';
            change_detected := TRUE;
        END IF;
        
        -- Verificar mudanÃ§a de centro de custo
        IF OLD.cost_center_id IS DISTINCT FROM NEW.cost_center_id THEN
            SELECT id INTO movement_type_id FROM rh.employee_movement_types WHERE codigo = 'MUDANCA_CC';
            movement_description := COALESCE(movement_description || '; ', '') || 'MudanÃ§a de centro de custo';
            change_detected := TRUE;
        END IF;
        
        -- Verificar mudanÃ§a de projeto
        IF OLD.project_id IS DISTINCT FROM NEW.project_id THEN
            SELECT id INTO movement_type_id FROM rh.employee_movement_types WHERE codigo = 'MUDANCA_PROJETO';
            movement_description := COALESCE(movement_description || '; ', '') || 'MudanÃ§a de projeto';
            change_detected := TRUE;
        END IF;
        
        -- Verificar mudanÃ§a de departamento
        IF OLD.department_id IS DISTINCT FROM NEW.department_id THEN
            SELECT id INTO movement_type_id FROM rh.employee_movement_types WHERE codigo = 'MUDANCA_DEPARTAMENTO';
            movement_description := COALESCE(movement_description || '; ', '') || 'MudanÃ§a de departamento';
            change_detected := TRUE;
        END IF;
        
        -- Verificar mudanÃ§a de turno
        IF OLD.work_shift_id IS DISTINCT FROM NEW.work_shift_id THEN
            SELECT id INTO movement_type_id FROM rh.employee_movement_types WHERE codigo = 'MUDANCA_TURNO';
            movement_description := COALESCE(movement_description || '; ', '') || 'MudanÃ§a de turno';
            change_detected := TRUE;
        END IF;
        
        -- Verificar mudanÃ§a de salÃ¡rio
        IF OLD.salario_base IS DISTINCT FROM NEW.salario_base THEN
            SELECT id INTO movement_type_id FROM rh.employee_movement_types WHERE codigo = 'MUDANCA_SALARIO';
            movement_description := COALESCE(movement_description || '; ', '') || 'MudanÃ§a de salÃ¡rio';
            change_detected := TRUE;
        END IF;
        
        -- Verificar mudanÃ§a de status
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            SELECT id INTO movement_type_id FROM rh.employee_movement_types WHERE codigo = 'MUDANCA_STATUS';
            movement_description := COALESCE(movement_description || '; ', '') || 'MudanÃ§a de status';
            change_detected := TRUE;
        END IF;
        
        -- Se houve mudanÃ§as, registrar no histÃ³rico
        IF change_detected THEN
            INSERT INTO rh.employee_history (
                employee_id,
                company_id,
                movement_type_id,
                previous_position_id,
                previous_cost_center_id,
                previous_project_id,
                previous_department_id,
                previous_work_shift_id,
                previous_manager_id,
                previous_salario_base,
                previous_status,
                new_position_id,
                new_cost_center_id,
                new_project_id,
                new_department_id,
                new_work_shift_id,
                new_manager_id,
                new_salario_base,
                new_status,
                effective_date,
                description,
                created_by
            ) VALUES (
                NEW.id,
                NEW.company_id,
                movement_type_id,
                OLD.position_id,
                OLD.cost_center_id,
                OLD.project_id,
                OLD.department_id,
                OLD.work_shift_id,
                OLD.manager_id,
                OLD.salario_base,
                OLD.status,
                NEW.position_id,
                NEW.cost_center_id,
                NEW.project_id,
                NEW.department_id,
                NEW.work_shift_id,
                NEW.manager_id,
                NEW.salario_base,
                NEW.status,
                CURRENT_DATE,
                movement_description,
                auth.uid()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "rh"."log_employee_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."log_notification"("p_user_id" "uuid", "p_notification_type" character varying, "p_title" character varying, "p_message" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO rh.notification_history (
        user_id, 
        notification_type, 
        title, 
        message, 
        metadata
    )
    VALUES (
        p_user_id, 
        p_notification_type, 
        p_title, 
        p_message, 
        p_metadata
    )
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;


ALTER FUNCTION "rh"."log_notification"("p_user_id" "uuid", "p_notification_type" character varying, "p_title" character varying, "p_message" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."marcar_notificacao_lida"("notification_id_param" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE rh.vacation_notifications 
    SET is_read = TRUE, read_at = NOW()
    WHERE id = notification_id_param;
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION "rh"."marcar_notificacao_lida"("notification_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."populate_mobile_holidays"("company_uuid" "uuid", "year_val" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  easter_date DATE;
  carnival_date DATE;
  corpus_christi_date DATE;
  good_friday_date DATE;
BEGIN
  easter_date := rh.calculate_easter(year_val);
  carnival_date := easter_date - INTERVAL '47 days';
  corpus_christi_date := easter_date + INTERVAL '60 days';
  good_friday_date := easter_date - INTERVAL '2 days';
  
  -- Carnaval (segunda-feira)
  INSERT INTO rh.holidays (company_id, data, nome, tipo, is_active) VALUES
  (company_uuid, carnival_date, 'Carnaval', 'nacional', true),
  (company_uuid, carnival_date + INTERVAL '1 day', 'Carnaval', 'nacional', true)
  ON CONFLICT (id) DO NOTHING;
  
  -- Sexta-feira Santa
  INSERT INTO rh.holidays (company_id, data, nome, tipo, is_active) VALUES
  (company_uuid, good_friday_date, 'Sexta-feira Santa', 'nacional', true)
  ON CONFLICT (id) DO NOTHING;
  
  -- Corpus Christi
  INSERT INTO rh.holidays (company_id, data, nome, tipo, is_active) VALUES
  (company_uuid, corpus_christi_date, 'Corpus Christi', 'nacional', true)
  ON CONFLICT (id) DO NOTHING;
END;
$$;


ALTER FUNCTION "rh"."populate_mobile_holidays"("company_uuid" "uuid", "year_val" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."populate_national_holidays"("company_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Feriados nacionais fixos
  INSERT INTO rh.holidays (company_id, data, nome, tipo, is_active) VALUES
  (company_uuid, '2024-01-01', 'Confraternização Universal', 'nacional', true),
  (company_uuid, '2024-04-21', 'Tiradentes', 'nacional', true),
  (company_uuid, '2024-05-01', 'Dia do Trabalhador', 'nacional', true),
  (company_uuid, '2024-09-07', 'Independência do Brasil', 'nacional', true),
  (company_uuid, '2024-10-12', 'Nossa Senhora Aparecida', 'nacional', true),
  (company_uuid, '2024-11-02', 'Finados', 'nacional', true),
  (company_uuid, '2024-11-15', 'Proclamação da República', 'nacional', true),
  (company_uuid, '2024-12-25', 'Natal', 'nacional', true),
  
  -- 2025
  (company_uuid, '2025-01-01', 'Confraternização Universal', 'nacional', true),
  (company_uuid, '2025-04-21', 'Tiradentes', 'nacional', true),
  (company_uuid, '2025-05-01', 'Dia do Trabalhador', 'nacional', true),
  (company_uuid, '2025-09-07', 'Independência do Brasil', 'nacional', true),
  (company_uuid, '2025-10-12', 'Nossa Senhora Aparecida', 'nacional', true),
  (company_uuid, '2025-11-02', 'Finados', 'nacional', true),
  (company_uuid, '2025-11-15', 'Proclamação da República', 'nacional', true),
  (company_uuid, '2025-12-25', 'Natal', 'nacional', true)
  
  ON CONFLICT (id) DO NOTHING;
END;
$$;


ALTER FUNCTION "rh"."populate_national_holidays"("company_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."process_monthly_benefits"("p_company_id" "uuid", "p_year" integer, "p_month" integer) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_employee_record RECORD;
  v_vr_va_config RECORD;
  v_transporte_config RECORD;
  v_vr_va_result RECORD;
  v_transporte_result RECORD;
  v_processed_count INTEGER := 0;
BEGIN
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
          'vr-va',
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
          'transporte',
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


ALTER FUNCTION "rh"."process_monthly_benefits"("p_company_id" "uuid", "p_year" integer, "p_month" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."process_monthly_benefits"("p_company_id" "uuid", "p_year" integer, "p_month" integer) IS 'Processa automaticamente os benefícios mensais (VR/VA e transporte) para todos os funcionários de uma empresa';



CREATE OR REPLACE FUNCTION "rh"."recalcular_adicionais_periodo"("p_employee_id" "uuid", "p_data_inicio" "date", "p_data_fim" "date") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Recalcular adicionais para todos os registros do período
    UPDATE rh.time_records 
    SET 
        horas_noturnas = 0,
        horas_final_semana = 0,
        valor_adicional_noturno = 0,
        valor_adicional_final_semana = 0
    WHERE employee_id = p_employee_id
    AND data BETWEEN p_data_inicio AND p_data_fim;
    
    -- Disparar o trigger para recalcular
    UPDATE rh.time_records 
    SET hora_entrada = hora_entrada
    WHERE employee_id = p_employee_id
    AND data BETWEEN p_data_inicio AND p_data_fim
    AND hora_entrada IS NOT NULL;
END;
$$;


ALTER FUNCTION "rh"."recalcular_adicionais_periodo"("p_employee_id" "uuid", "p_data_inicio" "date", "p_data_fim" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."relatorio_ferias_empresa"("company_id_param" "uuid") RETURNS TABLE("employee_id" "uuid", "employee_name" "text", "hire_date" "date", "ultima_feria" "date", "dias_sem_ferias" integer, "data_vencimento" "date", "status_ferias" "text", "dias_restantes" integer, "nivel_criticidade" "text", "tem_direito" boolean)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.nome,
        e.data_admissao,
        vs.ultima_feria,
        vs.dias_sem_ferias,
        vs.data_vencimento,
        vs.status_ferias,
        vs.dias_restantes,
        vs.nivel_criticidade,
        vr.tem_direito
    FROM rh.employees e
    LEFT JOIN rh.calcular_status_ferias(e.id) vs ON TRUE
    LEFT JOIN rh.calcular_direito_ferias(e.id) vr ON TRUE
    WHERE e.company_id = company_id_param
    AND e.status = 'ativo'
    ORDER BY 
        CASE vs.nivel_criticidade 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END,
        vs.dias_restantes ASC;
END;
$$;


ALTER FUNCTION "rh"."relatorio_ferias_empresa"("company_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."relatorio_headcount"("p_company_id" "uuid", "p_data_inicio" "date" DEFAULT NULL::"date", "p_data_fim" "date" DEFAULT NULL::"date") RETURNS TABLE("total_colaboradores" bigint, "admissoes" bigint, "desligamentos" bigint, "afastamentos_ativos" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF p_data_inicio IS NULL THEN
        p_data_inicio := CURRENT_DATE - INTERVAL '30 days';
    END IF;
    
    IF p_data_fim IS NULL THEN
        p_data_fim := CURRENT_DATE;
    END IF;

    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_colaboradores,
        COUNT(CASE WHEN data_admissao BETWEEN p_data_inicio AND p_data_fim THEN 1 END)::BIGINT as admissoes,
        COUNT(CASE WHEN data_demissao BETWEEN p_data_inicio AND p_data_fim THEN 1 END)::BIGINT as desligamentos,
        COUNT(CASE WHEN EXISTS (
            SELECT 1 FROM rh.medical_certificates mc 
            WHERE mc.employee_id = e.id 
            AND mc.data_fim >= CURRENT_DATE
        ) THEN 1 END)::BIGINT as afastamentos_ativos
    FROM rh.employees e
    WHERE e.company_id = p_company_id
    AND e.status = 'ativo';
END;
$$;


ALTER FUNCTION "rh"."relatorio_headcount"("p_company_id" "uuid", "p_data_inicio" "date", "p_data_fim" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."reorganize_employee_matriculas"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    company_record RECORD;
    employee_record RECORD;
    sequence_counter INTEGER;
BEGIN
    -- Para cada empresa
    FOR company_record IN 
        SELECT DISTINCT company_id FROM rh.employees ORDER BY company_id
    LOOP
        sequence_counter := 1;
        
        -- Para cada funcionÃ¡rio da empresa, ordenado por data de criaÃ§Ã£o
        FOR employee_record IN
            SELECT id FROM rh.employees 
            WHERE company_id = company_record.company_id 
            ORDER BY created_at ASC
        LOOP
            -- Atualizar a matrÃ­cula
            UPDATE rh.employees 
            SET matricula = rh.generate_employee_matricula(company_record.company_id)
            WHERE id = employee_record.id;
            
            sequence_counter := sequence_counter + 1;
        END LOOP;
    END LOOP;
END;
$$;


ALTER FUNCTION "rh"."reorganize_employee_matriculas"() OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."reorganize_employee_matriculas"() IS 'Reorganiza matrÃ­culas existentes seguindo o novo padrÃ£o';



CREATE OR REPLACE FUNCTION "rh"."save_user_reminder_settings"("p_user_id" "uuid", "p_settings" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO rh.user_settings (user_id, setting_type, time_reminder_settings)
    VALUES (p_user_id, 'time_reminders', p_settings)
    ON CONFLICT (user_id, setting_type)
    DO UPDATE SET 
        time_reminder_settings = p_settings,
        updated_at = now();
END;
$$;


ALTER FUNCTION "rh"."save_user_reminder_settings"("p_user_id" "uuid", "p_settings" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."schedule_annual_exams"("p_company_id" "uuid", "p_exam_type" "text" DEFAULT 'periodico'::"text", "p_days_before_notification" integer DEFAULT 30) RETURNS TABLE("employee_id" "uuid", "employee_name" "text", "exam_date" "date", "notification_date" "date", "created" boolean, "reason" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  emp_record RECORD;
  next_exam_date date;
  notification_date date;
  existing_exam_count integer;
BEGIN
  -- Iterar sobre funcionários ativos da empresa
  FOR emp_record IN 
    SELECT e.id, e.nome, e.data_admissao
    FROM rh.employees e
    WHERE e.company_id = p_company_id
      AND e.status = 'ativo'
      AND e.data_admissao IS NOT NULL
  LOOP
    -- Verificar se já existe exame agendado deste tipo
    SELECT COUNT(*) INTO existing_exam_count
    FROM rh.periodic_exams
    WHERE employee_id = emp_record.id
      AND tipo_exame = p_exam_type
      AND status = 'agendado';
    
    IF existing_exam_count = 0 THEN
      -- Calcular próxima data de exame (1 ano após admissão ou último exame)
      SELECT COALESCE(
        (SELECT pe.data_realizacao + INTERVAL '1 year'
         FROM rh.periodic_exams pe
         WHERE pe.employee_id = emp_record.id
           AND pe.tipo_exame = p_exam_type
           AND pe.status = 'realizado'
         ORDER BY pe.data_realizacao DESC
         LIMIT 1),
        emp_record.data_admissao + INTERVAL '1 year'
      ) INTO next_exam_date;
      
      -- Se a data calculada está no passado, agendar para 30 dias no futuro
      IF next_exam_date < CURRENT_DATE THEN
        next_exam_date := CURRENT_DATE + INTERVAL '30 days';
      END IF;
      
      notification_date := next_exam_date - INTERVAL '1 day' * p_days_before_notification;
      
      -- Criar o exame
      INSERT INTO rh.periodic_exams (
        company_id,
        employee_id,
        tipo_exame,
        data_agendada,
        status
      ) VALUES (
        p_company_id,
        emp_record.id,
        p_exam_type,
        next_exam_date,
        'agendado'
      );
      
      -- Retornar resultado
      employee_id := emp_record.id;
      employee_name := emp_record.nome;
      exam_date := next_exam_date;
      notification_date := notification_date;
      created := true;
      reason := NULL;
      RETURN NEXT;
    ELSE
      -- Exame já existe
      employee_id := emp_record.id;
      employee_name := emp_record.nome;
      exam_date := NULL;
      notification_date := NULL;
      created := false;
      reason := 'Exame já agendado';
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "rh"."schedule_annual_exams"("p_company_id" "uuid", "p_exam_type" "text", "p_days_before_notification" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."set_correction_status"("company_uuid" "uuid", "target_year" integer, "target_month" integer, "enabled" boolean, "user_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO rh.time_record_correction_control (company_id, year, month, correction_enabled, created_by, updated_by)
  VALUES (company_uuid, target_year, target_month, enabled, user_uuid, user_uuid)
  ON CONFLICT (company_id, year, month)
  DO UPDATE SET 
    correction_enabled = enabled,
    updated_by = user_uuid,
    updated_at = now();
END;
$$;


ALTER FUNCTION "rh"."set_correction_status"("company_uuid" "uuid", "target_year" integer, "target_month" integer, "enabled" boolean, "user_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."set_correction_status"("company_uuid" "uuid", "target_year" integer, "target_month" integer, "enabled" boolean, "user_uuid" "uuid") IS 'Define o status de liberação de correção de ponto';



CREATE OR REPLACE FUNCTION "rh"."set_employee_matricula"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Se a matrÃ­cula nÃ£o foi fornecida ou estÃ¡ vazia, gerar automaticamente
    IF NEW.matricula IS NULL OR NEW.matricula = '' THEN
        NEW.matricula := rh.generate_employee_matricula(NEW.company_id);
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "rh"."set_employee_matricula"() OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."set_employee_matricula"() IS 'Trigger function para definir matrÃ­cula automaticamente ao inserir funcionÃ¡rio';



CREATE OR REPLACE FUNCTION "rh"."status_sistema_notificacoes"() RETURNS TABLE("total_funcionarios" integer, "funcionarios_com_direito" integer, "notificacoes_ativas" integer, "notificacoes_criticas" integer, "notificacoes_altas" integer, "notificacoes_medias" integer, "ultima_execucao" timestamp with time zone, "proxima_verificacao" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    total_emp INTEGER;
    com_direito INTEGER;
    ativas INTEGER;
    criticas INTEGER;
    altas INTEGER;
    medias INTEGER;
    ultima_exec TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Contar funcionários ativos
    SELECT COUNT(*) INTO total_emp
    FROM rh.employees 
    WHERE status = 'ativo';
    
    -- Contar funcionários com direito a férias
    SELECT COUNT(*) INTO com_direito
    FROM rh.employees e
    WHERE e.status = 'ativo' 
    AND EXISTS (
        SELECT 1 FROM rh.calcular_direito_ferias(e.id) 
        WHERE tem_direito = TRUE
    );
    
    -- Contar notificações ativas por prioridade
    SELECT 
        COUNT(*) FILTER (WHERE is_active = TRUE),
        COUNT(*) FILTER (WHERE priority = 'critical' AND is_active = TRUE),
        COUNT(*) FILTER (WHERE priority = 'high' AND is_active = TRUE),
        COUNT(*) FILTER (WHERE priority = 'medium' AND is_active = TRUE)
    INTO ativas, criticas, altas, medias
    FROM rh.vacation_notifications;
    
    -- Buscar última execução
    SELECT MAX(created_at) INTO ultima_exec
    FROM rh.vacation_notifications
    WHERE notification_type = 'system_log';
    
    RETURN QUERY SELECT 
        total_emp,
        com_direito,
        ativas,
        criticas,
        altas,
        medias,
        ultima_exec,
        COALESCE(ultima_exec + INTERVAL '1 day', NOW()) as proxima_verificacao;
END;
$$;


ALTER FUNCTION "rh"."status_sistema_notificacoes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."testar_sistema_notificacoes"() RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    test_result JSON;
    test_employee_id UUID;
    vacation_right RECORD;
    vacation_status RECORD;
BEGIN
    -- Buscar um funcionário para teste
    SELECT id INTO test_employee_id
    FROM rh.employees 
    WHERE status = 'ativo' 
    LIMIT 1;
    
    IF test_employee_id IS NULL THEN
        RETURN json_build_object(
            'status', 'error',
            'message', 'Nenhum funcionário ativo encontrado para teste'
        );
    END IF;
    
    -- Testar cálculos
    SELECT * INTO vacation_right 
    FROM rh.calcular_direito_ferias(test_employee_id);
    
    SELECT * INTO vacation_status 
    FROM rh.calcular_status_ferias(test_employee_id);
    
    -- Testar geração de notificações
    PERFORM rh.gerar_notificacoes_ferias(test_employee_id);
    
    -- Montar resultado do teste
    test_result := json_build_object(
        'employee_id', test_employee_id,
        'direito_ferias', vacation_right,
        'status_ferias', vacation_status,
        'notificacoes_geradas', (
            SELECT COUNT(*) FROM rh.vacation_notifications 
            WHERE employee_id = test_employee_id 
            AND created_at >= NOW() - INTERVAL '1 minute'
        ),
        'status', 'success'
    );
    
    RETURN test_result;
END;
$$;


ALTER FUNCTION "rh"."testar_sistema_notificacoes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."trigger_historico_rateio"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO rh.beneficio_rateio_historico (
            rateio_id,
            department_id,
            valor_anterior,
            valor_novo,
            percentual_anterior,
            percentual_novo,
            motivo_alteracao,
            usuario_alteracao
        ) VALUES (
            NEW.rateio_id,
            NEW.department_id,
            OLD.valor_calculado,
            NEW.valor_calculado,
            OLD.percentual,
            NEW.percentual,
            'Alteração automática',
            auth.uid()
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "rh"."trigger_historico_rateio"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."trigger_validate_clt_compliance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Validar conformidade CLT apenas para escalas flexíveis
    IF NEW.tipo_escala != 'fixa' THEN
        IF NOT rh.validate_clt_compliance(NEW.dias_trabalho, NEW.dias_folga, NEW.ciclo_dias) THEN
            RAISE EXCEPTION 'Escala não está em conformidade com a CLT. Máximo 6 dias consecutivos de trabalho e mínimo 1 dia de folga por semana.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "rh"."trigger_validate_clt_compliance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."update_time_record_correction_control_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "rh"."update_time_record_correction_control_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "rh"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."update_vacation_periods_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "rh"."update_vacation_periods_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."validar_ferias_fracionadas"("p_employee_id" "uuid", "p_periodos" "jsonb") RETURNS TABLE("valido" boolean, "mensagem" "text", "total_dias" integer, "tem_periodo_14_dias" boolean)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    total_dias INTEGER := 0;
    periodo JSONB;
    dias_periodo INTEGER;
    tem_periodo_14_dias BOOLEAN := FALSE;
    num_periodos INTEGER;
    i INTEGER;
BEGIN
    -- Validar entrada
    IF p_periodos IS NULL OR jsonb_array_length(p_periodos) = 0 THEN
        RETURN QUERY SELECT FALSE, 'Nenhum período fornecido', 0, FALSE;
        RETURN;
    END IF;
    
    num_periodos := jsonb_array_length(p_periodos);
    
    -- Validar máximo 3 períodos
    IF num_periodos > 3 THEN
        RETURN QUERY SELECT FALSE, 'Máximo de 3 períodos permitidos', 0, FALSE;
        RETURN;
    END IF;
    
    -- Validar cada período
    FOR i IN 0..num_periodos-1
    LOOP
        periodo := p_periodos->i;
        dias_periodo := COALESCE((periodo->>'dias_ferias')::INTEGER, 0);
        
        -- Validar dias do período
        IF dias_periodo < 5 THEN
            RETURN QUERY SELECT FALSE, 'Cada período deve ter no mínimo 5 dias', 0, FALSE;
            RETURN;
        END IF;
        
        total_dias := total_dias + dias_periodo;
        
        -- Verificar se tem pelo menos um período com 14+ dias
        IF dias_periodo >= 14 THEN
            tem_periodo_14_dias := TRUE;
        END IF;
    END LOOP;
    
    -- Validar total de dias (máximo 30)
    IF total_dias > 30 THEN
        RETURN QUERY SELECT FALSE, 'Total de dias não pode exceder 30', total_dias, tem_periodo_14_dias;
        RETURN;
    END IF;
    
    -- Deve ter pelo menos um período com 14+ dias
    IF NOT tem_periodo_14_dias THEN
        RETURN QUERY SELECT FALSE, 'Pelo menos um período deve ter 14 dias ou mais', total_dias, FALSE;
        RETURN;
    END IF;
    
    -- Validar se funcionário tem direito a férias
    IF NOT EXISTS (
        SELECT 1 FROM rh.calcular_direito_ferias(p_employee_id) 
        WHERE tem_direito = TRUE
    ) THEN
        RETURN QUERY SELECT FALSE, 'Funcionário não tem direito a férias no momento', total_dias, tem_periodo_14_dias;
        RETURN;
    END IF;
    
    -- Tudo válido
    RETURN QUERY SELECT TRUE, 'Férias fracionadas válidas', total_dias, tem_periodo_14_dias;
END;
$$;


ALTER FUNCTION "rh"."validar_ferias_fracionadas"("p_employee_id" "uuid", "p_periodos" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."validar_ferias_fracionadas"("p_employee_id" "uuid", "p_periodos" "jsonb") IS 'Valida férias fracionadas conforme legislação brasileira (máximo 3 períodos, um com 14+ dias, demais com 5+ dias)';



CREATE OR REPLACE FUNCTION "rh"."validar_ponto"("p_employee_id" "uuid", "p_data" "date", "p_hora_entrada" time without time zone, "p_hora_saida" time without time zone) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_escala_id UUID;
    v_hora_inicio_escala TIME;
    v_hora_fim_escala TIME;
    v_tolerancia_minutos INTEGER := 30;
BEGIN
    -- Busca escala do funcionário
    SELECT ws.id, ws.hora_entrada, ws.hora_saida
    INTO v_escala_id, v_hora_inicio_escala, v_hora_fim_escala
    FROM rh.work_schedules ws
    JOIN rh.employment_contracts ec ON ec.work_schedule_id = ws.id
    WHERE ec.employee_id = p_employee_id AND ec.is_active = true
    LIMIT 1;

    -- Se não encontrou escala, retorna true
    IF v_escala_id IS NULL THEN
        RETURN true;
    END IF;

    -- Valida horários com tolerância
    IF ABS(EXTRACT(EPOCH FROM (p_hora_entrada - v_hora_inicio_escala)) / 60) <= v_tolerancia_minutos
       AND ABS(EXTRACT(EPOCH FROM (p_hora_saida - v_hora_fim_escala)) / 60) <= v_tolerancia_minutos THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$;


ALTER FUNCTION "rh"."validar_ponto"("p_employee_id" "uuid", "p_data" "date", "p_hora_entrada" time without time zone, "p_hora_saida" time without time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."validar_ponto_automatico"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Validar se o funcionário existe
    IF NOT EXISTS (SELECT 1 FROM rh.employees WHERE id = NEW.employee_id) THEN
        RAISE EXCEPTION 'Funcionário não encontrado';
    END IF;
    
    -- Validar se a empresa existe
    IF NOT EXISTS (SELECT 1 FROM core.companies WHERE id = NEW.company_id) THEN
        RAISE EXCEPTION 'Empresa não encontrada';
    END IF;
    
    -- Validar horários
    IF NEW.hora_entrada IS NOT NULL AND NEW.hora_saida IS NOT NULL THEN
        IF NEW.hora_entrada >= NEW.hora_saida THEN
            RAISE EXCEPTION 'Hora de entrada deve ser anterior à hora de saída';
        END IF;
    END IF;
    
    -- Definir tipo padrão se não especificado
    IF NEW.tipo IS NULL THEN
        NEW.tipo := 'normal';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "rh"."validar_ponto_automatico"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."validate_clt_compliance"("p_dias_trabalho" integer, "p_dias_folga" integer, "p_ciclo_dias" integer) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Validar se não excede 6 dias consecutivos de trabalho
    IF p_dias_trabalho > 6 THEN
        RETURN FALSE;
    END IF;
    
    -- Validar se tem pelo menos 1 dia de folga por semana
    IF p_dias_folga < 1 THEN
        RETURN FALSE;
    END IF;
    
    -- Validar se o ciclo é válido
    IF p_ciclo_dias < (p_dias_trabalho + p_dias_folga) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "rh"."validate_clt_compliance"("p_dias_trabalho" integer, "p_dias_folga" integer, "p_ciclo_dias" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "rh"."validate_clt_compliance"("p_dias_trabalho" integer, "p_dias_folga" integer, "p_ciclo_dias" integer) IS 'Valida se a escala está em conformidade com a CLT';



CREATE OR REPLACE FUNCTION "rh"."validate_discount_installment"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  max_installment NUMERIC(10,2);
  current_salary NUMERIC(10,2);
BEGIN
  -- Obter salário atual do funcionário
  SELECT salario_base INTO current_salary
  FROM rh.employees
  WHERE id = NEW.employee_id;
  
  -- Calcular valor máximo da parcela (30% do salário)
  max_installment := current_salary * 0.30;
  
  -- Atualizar o valor máximo calculado
  NEW.valor_maximo_parcela := max_installment;
  NEW.salario_base_funcionario := current_salary;
  
  -- Verificar se o valor da parcela excede o limite (apenas aviso, não bloqueia)
  IF NEW.valor_parcela > max_installment THEN
    RAISE WARNING 'Valor da parcela (R$ %) excede 30%% do salário base (R$ %). Valor máximo recomendado: R$ %', 
      NEW.valor_parcela, current_salary, max_installment;
  END IF;
  
  RETURN NEW;
END;
$_$;


ALTER FUNCTION "rh"."validate_discount_installment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."verificar_elegibilidade_funcionario"("p_employee_id" "uuid", "p_beneficio_tipo_id" "uuid") RETURNS TABLE("is_elegivel" boolean, "elegibilidade_id" "uuid", "regra_nome" character varying, "tipo_regra" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        fe.is_elegivel,
        fe.elegibilidade_id,
        be.nome as regra_nome,
        be.tipo_regra
    FROM rh.funcionario_elegibilidade fe
    JOIN rh.beneficio_elegibilidade be ON fe.elegibilidade_id = be.id
    WHERE fe.employee_id = p_employee_id
    AND be.beneficio_tipo_id = p_beneficio_tipo_id
    AND be.is_active = true
    AND (be.data_fim IS NULL OR be.data_fim >= CURRENT_DATE)
    ORDER BY fe.data_calculo DESC
    LIMIT 1;
END;
$$;


ALTER FUNCTION "rh"."verificar_elegibilidade_funcionario"("p_employee_id" "uuid", "p_beneficio_tipo_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "rh"."verificar_ferias_solicitadas"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_ferias_existentes INTEGER;
BEGIN
    -- Verifica se já existem férias solicitadas para o mesmo ano e período
    IF TG_OP = 'INSERT' THEN
        SELECT COUNT(*) INTO v_ferias_existentes
        FROM rh.vacations
        WHERE employee_id = NEW.employee_id
        AND ano = NEW.ano
        AND periodo = NEW.periodo
        AND status IN ('solicitado', 'aprovado');

        IF v_ferias_existentes > 0 THEN
            RAISE EXCEPTION 'Já existem férias solicitadas para este ano e período';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "rh"."verificar_ferias_solicitadas"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "rh"."employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "matricula" "text",
    "nome" "text" NOT NULL,
    "cpf" "text",
    "rg" "text",
    "data_nascimento" "date",
    "data_admissao" "date",
    "data_demissao" "date",
    "status" "core"."status_geral" DEFAULT 'ativo'::"core"."status_geral",
    "cost_center_id" "uuid",
    "project_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "position_id" "uuid",
    "work_schedule_id" "uuid",
    "department_id" "uuid",
    "manager_id" "uuid",
    "salario_base" numeric(10,2),
    "telefone" "text",
    "email" "text",
    "estado_civil" "text",
    "nacionalidade" "text" DEFAULT 'Brasileira'::"text",
    "naturalidade" "text",
    "nome_mae" "text",
    "nome_pai" "text",
    "precisa_registrar_ponto" boolean DEFAULT true NOT NULL,
    "tipo_banco_horas" "text" DEFAULT 'compensatorio'::"text",
    "is_pcd" boolean DEFAULT false NOT NULL,
    "deficiency_type" "text",
    "deficiency_degree" "text",
    "periculosidade" boolean DEFAULT false NOT NULL,
    "insalubridade" boolean DEFAULT false NOT NULL,
    CONSTRAINT "check_deficiency_degree" CHECK ((("deficiency_degree" = ANY (ARRAY['leve'::"text", 'moderada'::"text", 'severa'::"text", 'profunda'::"text"])) OR ("deficiency_degree" IS NULL))),
    CONSTRAINT "check_deficiency_type" CHECK ((("deficiency_type" = ANY (ARRAY['fisica'::"text", 'visual'::"text", 'auditiva'::"text", 'intelectual'::"text", 'mental'::"text", 'multipla'::"text"])) OR ("deficiency_type" IS NULL))),
    CONSTRAINT "check_tipo_banco_horas" CHECK (("tipo_banco_horas" = ANY (ARRAY['compensatorio'::"text", 'banco_horas'::"text", 'horas_extras'::"text", 'nao_aplicavel'::"text"])))
);


ALTER TABLE "rh"."employees" OWNER TO "postgres";


COMMENT ON COLUMN "rh"."employees"."precisa_registrar_ponto" IS 'Indica se o funcionário precisa registrar ponto. Funções de liderança podem ter este campo como false.';



COMMENT ON COLUMN "rh"."employees"."tipo_banco_horas" IS 'Tipo de banco de horas: compensatorio, banco_horas, horas_extras, nao_aplicavel';



COMMENT ON COLUMN "rh"."employees"."is_pcd" IS 'Indica se o funcionário é pessoa com deficiência (PCD)';



COMMENT ON COLUMN "rh"."employees"."deficiency_type" IS 'Tipo de deficiência: fisica, visual, auditiva, intelectual, mental, multipla';



COMMENT ON COLUMN "rh"."employees"."deficiency_degree" IS 'Grau de deficiência: leve, moderada, severa, profunda';



COMMENT ON COLUMN "rh"."employees"."periculosidade" IS 'Indica se o funcionário trabalha em ambiente de periculosidade (adicional obrigatório)';



COMMENT ON COLUMN "rh"."employees"."insalubridade" IS 'Indica se o funcionário trabalha em ambiente insalubre (adicional obrigatório)';



CREATE TABLE IF NOT EXISTS "rh"."periodic_exams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "employee_id" "uuid",
    "tipo_exame" "text" NOT NULL,
    "data_agendada" "date" NOT NULL,
    "data_realizacao" "date",
    "resultado" "text",
    "arquivo_anexo" "text",
    "status" "core"."status_geral" DEFAULT 'agendado'::"core"."status_geral",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    "medico_responsavel" "text",
    "observacoes" "text"
);


ALTER TABLE "rh"."periodic_exams" OWNER TO "postgres";


COMMENT ON TABLE "rh"."periodic_exams" IS 'Tabela para controle de exames periódicos dos funcionários';



COMMENT ON COLUMN "rh"."periodic_exams"."tipo_exame" IS 'Tipo do exame: admissional, periodico, retorno_ao_trabalho, mudanca_de_funcao, demissional';



COMMENT ON COLUMN "rh"."periodic_exams"."data_agendada" IS 'Data agendada para realização do exame';



COMMENT ON COLUMN "rh"."periodic_exams"."data_realizacao" IS 'Data em que o exame foi efetivamente realizado';



COMMENT ON COLUMN "rh"."periodic_exams"."resultado" IS 'Resultado do exame: apto, inapto, apto com restrições';



COMMENT ON COLUMN "rh"."periodic_exams"."arquivo_anexo" IS 'URL do arquivo PDF com o resultado do exame';



COMMENT ON COLUMN "rh"."periodic_exams"."status" IS 'Status do exame: agendado, realizado, cancelado, pendente';



COMMENT ON COLUMN "rh"."periodic_exams"."medico_responsavel" IS 'Nome do médico responsável pelo exame';



COMMENT ON COLUMN "rh"."periodic_exams"."observacoes" IS 'Observações adicionais sobre o exame';



CREATE TABLE IF NOT EXISTS "rh"."absence_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "codigo" character varying(10) NOT NULL,
    "descricao" character varying(255) NOT NULL,
    "categoria" character varying(50) NOT NULL,
    "is_paid" boolean DEFAULT true NOT NULL,
    "requires_medical_certificate" boolean DEFAULT false NOT NULL,
    "requires_approval" boolean DEFAULT true NOT NULL,
    "max_days" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."absence_types" OWNER TO "postgres";


COMMENT ON TABLE "rh"."absence_types" IS 'Tipos de afastamento dos funcionários';



CREATE TABLE IF NOT EXISTS "rh"."vacation_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "employee_id" "uuid" NOT NULL,
    "notification_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text" NOT NULL,
    "due_date" "date",
    "days_remaining" integer,
    "is_read" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "read_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    CONSTRAINT "vacation_notifications_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "vacation_notifications_type_check" CHECK (("notification_type" = ANY (ARRAY['ferias_disponivel'::"text", 'ferias_vencendo'::"text", 'ferias_vencida'::"text"])))
);


ALTER TABLE "rh"."vacation_notifications" OWNER TO "postgres";


CREATE OR REPLACE VIEW "rh"."alertas_ferias_criticos" AS
 SELECT "e"."nome" AS "funcionario",
    "e"."email",
    "e"."company_id",
    "vn"."title",
    "vn"."message",
    "vn"."priority",
    "vn"."due_date",
    "vn"."days_remaining",
    "vn"."created_at"
   FROM ("rh"."vacation_notifications" "vn"
     JOIN "rh"."employees" "e" ON (("e"."id" = "vn"."employee_id")))
  WHERE (("vn"."is_active" = true) AND ("vn"."priority" = ANY (ARRAY['critical'::"text", 'high'::"text"])) AND (("vn"."expires_at" IS NULL) OR ("vn"."expires_at" > "now"())))
  ORDER BY
        CASE "vn"."priority"
            WHEN 'critical'::"text" THEN 1
            WHEN 'high'::"text" THEN 2
            ELSE NULL::integer
        END, "vn"."days_remaining";


ALTER VIEW "rh"."alertas_ferias_criticos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."allowance_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "codigo" character varying(10) NOT NULL,
    "descricao" character varying(255) NOT NULL,
    "tipo" character varying(50) NOT NULL,
    "valor" numeric(10,4) NOT NULL,
    "unidade" character varying(20) NOT NULL,
    "base_calculo" character varying(50) NOT NULL,
    "is_cumulative" boolean DEFAULT false NOT NULL,
    "requires_approval" boolean DEFAULT true NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."allowance_types" OWNER TO "postgres";


COMMENT ON TABLE "rh"."allowance_types" IS 'Tipos de adicionais salariais';



CREATE TABLE IF NOT EXISTS "rh"."analytics_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "cache_key" character varying(255) NOT NULL,
    "data_type" character varying(100) NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "cached_data" "jsonb" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."analytics_cache" OWNER TO "postgres";


COMMENT ON TABLE "rh"."analytics_cache" IS 'Cache de dados de analytics para performance';



CREATE TABLE IF NOT EXISTS "rh"."attendance_corrections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "employee_id" "uuid",
    "time_record_id" "uuid",
    "data_original" "date" NOT NULL,
    "hora_entrada_original" time without time zone,
    "hora_saida_original" time without time zone,
    "hora_entrada_corrigida" time without time zone,
    "hora_saida_corrigida" time without time zone,
    "justificativa" "text" NOT NULL,
    "status" "core"."status_aprovacao" DEFAULT 'pendente'::"core"."status_aprovacao",
    "aprovado_por" "uuid",
    "data_aprovacao" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "horario_correcao" timestamp with time zone
);


ALTER TABLE "rh"."attendance_corrections" OWNER TO "postgres";


COMMENT ON COLUMN "rh"."attendance_corrections"."horario_correcao" IS 'HorÃ¡rio em que o funcionÃ¡rio fez a solicitaÃ§Ã£o de correÃ§Ã£o de ponto';



CREATE TABLE IF NOT EXISTS "rh"."beneficio_elegibilidade" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "beneficio_tipo_id" "uuid" NOT NULL,
    "nome" character varying(100) NOT NULL,
    "descricao" "text",
    "tipo_regra" character varying(20) NOT NULL,
    "criterios" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "data_inicio" "date" NOT NULL,
    "data_fim" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "beneficio_elegibilidade_tipo_regra_check" CHECK ((("tipo_regra")::"text" = ANY ((ARRAY['cargo'::character varying, 'departamento'::character varying, 'ambos'::character varying, 'todos'::character varying])::"text"[])))
);


ALTER TABLE "rh"."beneficio_elegibilidade" OWNER TO "postgres";


COMMENT ON TABLE "rh"."beneficio_elegibilidade" IS 'Regras de elegibilidade para benefícios por cargo/departamento';



CREATE TABLE IF NOT EXISTS "rh"."beneficio_elegibilidade_cargos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "elegibilidade_id" "uuid" NOT NULL,
    "position_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."beneficio_elegibilidade_cargos" OWNER TO "postgres";


COMMENT ON TABLE "rh"."beneficio_elegibilidade_cargos" IS 'Vinculação de cargos elegíveis para cada regra';



CREATE TABLE IF NOT EXISTS "rh"."beneficio_elegibilidade_departamentos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "elegibilidade_id" "uuid" NOT NULL,
    "department_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."beneficio_elegibilidade_departamentos" OWNER TO "postgres";


COMMENT ON TABLE "rh"."beneficio_elegibilidade_departamentos" IS 'Vinculação de departamentos elegíveis para cada regra';



CREATE TABLE IF NOT EXISTS "rh"."beneficio_rateio_departamentos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rateio_id" "uuid" NOT NULL,
    "department_id" "uuid" NOT NULL,
    "percentual" numeric(5,2) DEFAULT 0 NOT NULL,
    "valor_fixo" numeric(15,2) DEFAULT 0,
    "quantidade_funcionarios" integer DEFAULT 0,
    "custo_medio_funcionario" numeric(15,2) DEFAULT 0,
    "valor_calculado" numeric(15,2) DEFAULT 0,
    "observacoes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "beneficio_rateio_departamentos_percentual_check" CHECK ((("percentual" >= (0)::numeric) AND ("percentual" <= (100)::numeric)))
);


ALTER TABLE "rh"."beneficio_rateio_departamentos" OWNER TO "postgres";


COMMENT ON TABLE "rh"."beneficio_rateio_departamentos" IS 'Distribuição de rateios por departamento';



COMMENT ON COLUMN "rh"."beneficio_rateio_departamentos"."percentual" IS 'Percentual do rateio para este departamento (0-100)';



COMMENT ON COLUMN "rh"."beneficio_rateio_departamentos"."valor_fixo" IS 'Valor fixo para este departamento';



COMMENT ON COLUMN "rh"."beneficio_rateio_departamentos"."valor_calculado" IS 'Valor calculado automaticamente baseado no tipo de rateio';



CREATE TABLE IF NOT EXISTS "rh"."beneficio_rateio_historico" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rateio_id" "uuid" NOT NULL,
    "department_id" "uuid" NOT NULL,
    "valor_anterior" numeric(15,2) DEFAULT 0,
    "valor_novo" numeric(15,2) DEFAULT 0,
    "percentual_anterior" numeric(5,2) DEFAULT 0,
    "percentual_novo" numeric(5,2) DEFAULT 0,
    "motivo_alteracao" character varying(200),
    "usuario_alteracao" "uuid",
    "data_alteracao" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."beneficio_rateio_historico" OWNER TO "postgres";


COMMENT ON TABLE "rh"."beneficio_rateio_historico" IS 'Histórico de alterações nos rateios para auditoria';



CREATE TABLE IF NOT EXISTS "rh"."beneficio_rateios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "beneficio_tipo_id" "uuid" NOT NULL,
    "nome" character varying(100) NOT NULL,
    "descricao" "text",
    "tipo_rateio" character varying(20) NOT NULL,
    "valor_total" numeric(15,2) DEFAULT 0 NOT NULL,
    "periodo_inicio" "date" NOT NULL,
    "periodo_fim" "date",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "beneficio_rateios_tipo_rateio_check" CHECK ((("tipo_rateio")::"text" = ANY ((ARRAY['percentual'::character varying, 'valor_fixo'::character varying, 'proporcional_funcionarios'::character varying, 'proporcional_custo'::character varying])::"text"[])))
);


ALTER TABLE "rh"."beneficio_rateios" OWNER TO "postgres";


COMMENT ON TABLE "rh"."beneficio_rateios" IS 'Configurações de rateios de benefícios entre departamentos';



COMMENT ON COLUMN "rh"."beneficio_rateios"."tipo_rateio" IS 'Tipo de rateio: percentual, valor_fixo, proporcional_funcionarios, proporcional_custo';



CREATE TABLE IF NOT EXISTS "rh"."beneficio_tipos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "nome" character varying(100) NOT NULL,
    "descricao" "text",
    "categoria" character varying(50) NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "beneficio_tipos_categoria_check" CHECK ((("categoria")::"text" = ANY ((ARRAY['convenio'::character varying, 'vr_va'::character varying, 'transporte'::character varying, 'outros'::character varying])::"text"[])))
);


ALTER TABLE "rh"."beneficio_tipos" OWNER TO "postgres";


COMMENT ON TABLE "rh"."beneficio_tipos" IS 'Tipos de benefícios que podem ter regras de elegibilidade';



CREATE TABLE IF NOT EXISTS "rh"."beneficios_descontos_afastamento" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "benefit_id" "uuid" NOT NULL,
    "tipo_afastamento" character varying(30) NOT NULL,
    "desconto_percentual" numeric(5,2) DEFAULT 0,
    "desconto_valor" numeric(10,2) DEFAULT 0,
    "tipo_desconto" character varying(20) NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "beneficios_descontos_afastamento_tipo_afastamento_check" CHECK ((("tipo_afastamento")::"text" = ANY ((ARRAY['ferias'::character varying, 'licenca_medica'::character varying, 'licenca_maternidade'::character varying, 'licenca_paternidade'::character varying, 'ausencia_justificada'::character varying, 'ausencia_injustificada'::character varying])::"text"[]))),
    CONSTRAINT "beneficios_descontos_afastamento_tipo_desconto_check" CHECK ((("tipo_desconto")::"text" = ANY ((ARRAY['percentual'::character varying, 'valor_fixo'::character varying])::"text"[])))
);


ALTER TABLE "rh"."beneficios_descontos_afastamento" OWNER TO "postgres";


COMMENT ON TABLE "rh"."beneficios_descontos_afastamento" IS 'Descontos de benefícios por tipo de afastamento';



CREATE TABLE IF NOT EXISTS "rh"."beneficios_elegibilidade" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "benefit_id" "uuid" NOT NULL,
    "position_id" "uuid",
    "department_id" "uuid",
    "employee_id" "uuid",
    "tipo_elegibilidade" character varying(20) NOT NULL,
    "valor_especifico" numeric(10,2),
    "percentual_especifico" numeric(5,2),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "beneficios_elegibilidade_tipo_elegibilidade_check" CHECK ((("tipo_elegibilidade")::"text" = ANY ((ARRAY['todos'::character varying, 'cargo'::character varying, 'departamento'::character varying, 'funcionario'::character varying])::"text"[])))
);


ALTER TABLE "rh"."beneficios_elegibilidade" OWNER TO "postgres";


COMMENT ON TABLE "rh"."beneficios_elegibilidade" IS 'Elegibilidade de benefícios por cargo, departamento ou funcionário';



CREATE TABLE IF NOT EXISTS "rh"."beneficios_rateios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "benefit_id" "uuid" NOT NULL,
    "department_id" "uuid" NOT NULL,
    "percentual_rateio" numeric(5,2) DEFAULT 0 NOT NULL,
    "valor_fixo" numeric(10,2) DEFAULT 0,
    "tipo_rateio" character varying(20) NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "beneficios_rateios_tipo_rateio_check" CHECK ((("tipo_rateio")::"text" = ANY ((ARRAY['percentual'::character varying, 'valor_fixo'::character varying])::"text"[])))
);


ALTER TABLE "rh"."beneficios_rateios" OWNER TO "postgres";


COMMENT ON TABLE "rh"."beneficios_rateios" IS 'Rateios de benefícios entre departamentos';



CREATE TABLE IF NOT EXISTS "rh"."benefits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "nome" "text" NOT NULL,
    "tipo" "rh"."tipo_beneficio_rh" NOT NULL,
    "valor" numeric(10,2),
    "percentual" numeric(5,2),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."benefits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."candidate_upload_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "job_application_id" "uuid" NOT NULL,
    "candidate_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "is_active" boolean DEFAULT true,
    "access_count" integer DEFAULT 0,
    "last_accessed_at" timestamp with time zone,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."candidate_upload_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."candidates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "cpf" "text",
    "birth_date" "date",
    "address" "text",
    "city" "text",
    "state" "text",
    "zip_code" "text",
    "resume_file_path" "text",
    "linkedin_url" "text",
    "portfolio_url" "text",
    "source" "text",
    "status" "text" DEFAULT 'ativo'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "candidates_source_check" CHECK (("source" = ANY (ARRAY['site'::"text", 'linkedin'::"text", 'indicaÃ§Ã£o'::"text", 'agencia'::"text", 'outro'::"text"]))),
    CONSTRAINT "candidates_status_check" CHECK (("status" = ANY (ARRAY['ativo'::"text", 'inativo'::"text", 'contratado'::"text", 'descartado'::"text"])))
);


ALTER TABLE "rh"."candidates" OWNER TO "postgres";


COMMENT ON TABLE "rh"."candidates" IS 'Cadastro de candidatos';



CREATE TABLE IF NOT EXISTS "rh"."cid_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "codigo" character varying(10) NOT NULL,
    "descricao" "text" NOT NULL,
    "categoria" character varying(100),
    "is_active" boolean DEFAULT true NOT NULL,
    "requires_work_restriction" boolean DEFAULT false,
    "max_absence_days" integer,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."cid_codes" OWNER TO "postgres";


COMMENT ON TABLE "rh"."cid_codes" IS 'Códigos CID para atestados médicos';



CREATE TABLE IF NOT EXISTS "rh"."compensation_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "employee_id" "uuid",
    "data_solicitacao" "date" NOT NULL,
    "data_compensacao" "date" NOT NULL,
    "quantidade_horas" numeric(8,2) NOT NULL,
    "justificativa" "text",
    "aprovado_por" "uuid",
    "status" "core"."status_aprovacao" DEFAULT 'pendente'::"core"."status_aprovacao",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "data_aprovacao" timestamp with time zone
);


ALTER TABLE "rh"."compensation_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."convenios_empresas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "nome" character varying(100) NOT NULL,
    "tipo" character varying(20) NOT NULL,
    "prestador" character varying(200) NOT NULL,
    "cnpj" character varying(18),
    "contato" character varying(100),
    "telefone" character varying(20),
    "email" character varying(100),
    "endereco" "text",
    "cobertura" "text",
    "valor_mensal" numeric(10,2) DEFAULT 0,
    "valor_por_funcionario" numeric(10,2) DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "convenios_tipo_check" CHECK ((("tipo")::"text" = ANY ((ARRAY['medico'::character varying, 'odontologico'::character varying, 'ambos'::character varying])::"text"[])))
);


ALTER TABLE "rh"."convenios_empresas" OWNER TO "postgres";


COMMENT ON TABLE "rh"."convenios_empresas" IS 'Empresas prestadoras de convênios médicos e odontológicos';



CREATE TABLE IF NOT EXISTS "rh"."convenios_planos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "convenio_empresa_id" "uuid" NOT NULL,
    "nome" character varying(100) NOT NULL,
    "descricao" "text",
    "tipo_plano" character varying(20) NOT NULL,
    "valor_titular" numeric(10,2) DEFAULT 0 NOT NULL,
    "valor_dependente" numeric(10,2) DEFAULT 0 NOT NULL,
    "valor_coparticipacao" numeric(10,2) DEFAULT 0,
    "cobertura" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "convenios_planos_tipo_plano_check" CHECK ((("tipo_plano")::"text" = ANY ((ARRAY['basico'::character varying, 'intermediario'::character varying, 'master'::character varying, 'premium'::character varying, 'executivo'::character varying])::"text"[])))
);


ALTER TABLE "rh"."convenios_planos" OWNER TO "postgres";


COMMENT ON TABLE "rh"."convenios_planos" IS 'Planos oferecidos pelos convênios (Básico, Intermediário, Master, etc.)';



CREATE TABLE IF NOT EXISTS "rh"."dashboard_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "alert_type" character varying(100) NOT NULL,
    "title" character varying(255) NOT NULL,
    "message" "text" NOT NULL,
    "severity" character varying(20) NOT NULL,
    "is_read" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "read_at" timestamp with time zone
);


ALTER TABLE "rh"."dashboard_alerts" OWNER TO "postgres";


COMMENT ON TABLE "rh"."dashboard_alerts" IS 'Sistema de alertas e notificações do dashboard';



CREATE TABLE IF NOT EXISTS "rh"."dashboard_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "layout_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "filters_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_public" boolean DEFAULT false,
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."dashboard_configs" OWNER TO "postgres";


COMMENT ON TABLE "rh"."dashboard_configs" IS 'Configurações personalizáveis de dashboards para usuários';



CREATE TABLE IF NOT EXISTS "rh"."vacations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "employee_id" "uuid",
    "ano" integer NOT NULL,
    "periodo" "text" NOT NULL,
    "data_inicio" "date",
    "data_fim" "date",
    "dias_ferias" integer,
    "dias_abono" integer,
    "status" "core"."status_aprovacao" DEFAULT 'solicitado'::"core"."status_aprovacao",
    "aprovado_por" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "data_aprovacao" timestamp with time zone,
    "total_periodos" integer DEFAULT 1,
    "tipo_fracionamento" "text" DEFAULT 'integral'::"text",
    "observacoes" "text",
    CONSTRAINT "vacations_tipo_fracionamento_check" CHECK (("tipo_fracionamento" = ANY (ARRAY['integral'::"text", 'fracionado'::"text"]))),
    CONSTRAINT "vacations_total_periodos_check" CHECK ((("total_periodos" >= 1) AND ("total_periodos" <= 3)))
);


ALTER TABLE "rh"."vacations" OWNER TO "postgres";


CREATE OR REPLACE VIEW "rh"."dashboard_ferias" AS
 SELECT "company_id",
    "count"(*) AS "total_funcionarios",
    "count"(
        CASE
            WHEN ("status" = 'aprovado'::"core"."status_aprovacao") THEN 1
            ELSE NULL::integer
        END) AS "ferias_aprovadas",
    "count"(
        CASE
            WHEN ("status" = 'solicitado'::"core"."status_aprovacao") THEN 1
            ELSE NULL::integer
        END) AS "ferias_pendentes"
   FROM "rh"."vacations"
  GROUP BY "company_id";


ALTER VIEW "rh"."dashboard_ferias" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."deficiency_degrees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "codigo" character varying(10) NOT NULL,
    "descricao" character varying(255) NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."deficiency_degrees" OWNER TO "postgres";


COMMENT ON TABLE "rh"."deficiency_degrees" IS 'Graus de deficiência';



CREATE TABLE IF NOT EXISTS "rh"."deficiency_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "codigo" character varying(10) NOT NULL,
    "descricao" character varying(255) NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."deficiency_types" OWNER TO "postgres";


COMMENT ON TABLE "rh"."deficiency_types" IS 'Tipos de deficiência para PCD';



CREATE TABLE IF NOT EXISTS "rh"."delay_reasons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "codigo" character varying(10) NOT NULL,
    "descricao" character varying(255) NOT NULL,
    "categoria" character varying(50) NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "requires_justification" boolean DEFAULT true NOT NULL,
    "requires_medical_certificate" boolean DEFAULT false NOT NULL,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."delay_reasons" OWNER TO "postgres";


COMMENT ON TABLE "rh"."delay_reasons" IS 'Motivos de atraso dos funcionários';



CREATE TABLE IF NOT EXISTS "rh"."dependent_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "codigo" character varying(10) NOT NULL,
    "descricao" character varying(255) NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."dependent_types" OWNER TO "postgres";


COMMENT ON TABLE "rh"."dependent_types" IS 'Tipos de dependentes';



CREATE TABLE IF NOT EXISTS "rh"."employee_absences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "absence_type_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "total_days" integer NOT NULL,
    "reason" "text",
    "medical_certificate_url" "text",
    "cid_code_id" "uuid",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "status" character varying(20) DEFAULT 'PENDENTE'::character varying NOT NULL,
    "rejection_reason" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "employee_absences_dates_check" CHECK (("end_date" >= "start_date"))
);


ALTER TABLE "rh"."employee_absences" OWNER TO "postgres";


COMMENT ON TABLE "rh"."employee_absences" IS 'Afastamentos dos funcionários';



CREATE TABLE IF NOT EXISTS "rh"."employee_addresses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "cep" "text",
    "logradouro" "text",
    "numero" "text",
    "complemento" "text",
    "bairro" "text",
    "cidade" "text",
    "uf" "text",
    "pais" "text" DEFAULT 'Brasil'::"text",
    "tipo_endereco" "text" DEFAULT 'residencial'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."employee_addresses" OWNER TO "postgres";


COMMENT ON TABLE "rh"."employee_addresses" IS 'Endereços dos funcionários';



COMMENT ON COLUMN "rh"."employee_addresses"."cep" IS 'CEP do endereço';



COMMENT ON COLUMN "rh"."employee_addresses"."logradouro" IS 'Logradouro (rua, avenida, etc.)';



COMMENT ON COLUMN "rh"."employee_addresses"."numero" IS 'Número do endereço';



COMMENT ON COLUMN "rh"."employee_addresses"."complemento" IS 'Complemento do endereço';



COMMENT ON COLUMN "rh"."employee_addresses"."bairro" IS 'Bairro';



COMMENT ON COLUMN "rh"."employee_addresses"."cidade" IS 'Cidade';



COMMENT ON COLUMN "rh"."employee_addresses"."uf" IS 'Unidade Federativa (estado)';



CREATE TABLE IF NOT EXISTS "rh"."employee_allowances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "allowance_type_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "valor" numeric(10,4) NOT NULL,
    "observacoes" "text",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "status" character varying(20) DEFAULT 'PENDENTE'::character varying NOT NULL,
    "rejection_reason" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "employee_allowances_dates_check" CHECK ((("end_date" IS NULL) OR ("end_date" >= "start_date")))
);


ALTER TABLE "rh"."employee_allowances" OWNER TO "postgres";


COMMENT ON TABLE "rh"."employee_allowances" IS 'Adicionais dos funcionários';



CREATE TABLE IF NOT EXISTS "rh"."employee_bank_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "banco_codigo" "text",
    "banco_nome" "text",
    "agencia_numero" "text",
    "agencia_digito" "text",
    "conta_numero" "text",
    "conta_digito" "text",
    "tipo_conta" "text",
    "titular_nome" "text",
    "titular_cpf" "text",
    "conta_principal" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."employee_bank_accounts" OWNER TO "postgres";


COMMENT ON TABLE "rh"."employee_bank_accounts" IS 'Dados bancários dos funcionários';



COMMENT ON COLUMN "rh"."employee_bank_accounts"."banco_codigo" IS 'Código do banco';



COMMENT ON COLUMN "rh"."employee_bank_accounts"."banco_nome" IS 'Nome do banco';



COMMENT ON COLUMN "rh"."employee_bank_accounts"."agencia_numero" IS 'Número da agência';



COMMENT ON COLUMN "rh"."employee_bank_accounts"."conta_numero" IS 'Número da conta';



COMMENT ON COLUMN "rh"."employee_bank_accounts"."tipo_conta" IS 'Tipo da conta (corrente, poupança, etc.)';



CREATE TABLE IF NOT EXISTS "rh"."employee_benefit_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "benefit_type" character varying(20) NOT NULL,
    "vr_va_config_id" "uuid",
    "transporte_config_id" "uuid",
    "criteria_type" character varying(50) NOT NULL,
    "criteria_value" character varying(100),
    "data_inicio" "date" DEFAULT CURRENT_DATE NOT NULL,
    "data_fim" "date",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "employee_benefit_assignments_benefit_check" CHECK ((((("benefit_type")::"text" = 'vr-va'::"text") AND ("vr_va_config_id" IS NOT NULL) AND ("transporte_config_id" IS NULL)) OR ((("benefit_type")::"text" = 'transporte'::"text") AND ("transporte_config_id" IS NOT NULL) AND ("vr_va_config_id" IS NULL)))),
    CONSTRAINT "employee_benefit_assignments_benefit_type_check" CHECK ((("benefit_type")::"text" = ANY ((ARRAY['vr-va'::character varying, 'transporte'::character varying])::"text"[])))
);


ALTER TABLE "rh"."employee_benefit_assignments" OWNER TO "postgres";


COMMENT ON TABLE "rh"."employee_benefit_assignments" IS 'Vincula funcionários a configurações específicas de benefícios baseado em critérios';



COMMENT ON COLUMN "rh"."employee_benefit_assignments"."criteria_type" IS 'Tipo de critério: estado, cargo, sindicato, manual';



COMMENT ON COLUMN "rh"."employee_benefit_assignments"."criteria_value" IS 'Valor do critério: BA, PE, GERENTE, SINDICATO_X, etc.';



CREATE TABLE IF NOT EXISTS "rh"."employee_benefits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "employee_id" "uuid",
    "benefit_id" "uuid",
    "valor_beneficio" numeric(10,2),
    "data_inicio" "date",
    "data_fim" "date",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."employee_benefits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."employee_delay_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "delay_reason_id" "uuid" NOT NULL,
    "delay_date" "date" NOT NULL,
    "delay_time" time without time zone NOT NULL,
    "justification" "text",
    "medical_certificate_url" "text",
    "cid_code_id" "uuid",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "status" character varying(20) DEFAULT 'PENDENTE'::character varying NOT NULL,
    "rejection_reason" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."employee_delay_records" OWNER TO "postgres";


COMMENT ON TABLE "rh"."employee_delay_records" IS 'Registro de atrasos dos funcionários';



CREATE TABLE IF NOT EXISTS "rh"."employee_dependents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "cpf" character varying(14) NOT NULL,
    "birth_date" "date" NOT NULL,
    "dependent_type_id" "uuid" NOT NULL,
    "kinship_degree_id" "uuid" NOT NULL,
    "is_pcd" boolean DEFAULT false,
    "deficiency_type_id" "uuid",
    "deficiency_degree_id" "uuid",
    "cid_code" character varying(10),
    "cid_description" "text",
    "needs_special_care" boolean DEFAULT false,
    "special_care_description" "text",
    "is_ir_dependent" boolean DEFAULT true,
    "is_health_plan_dependent" boolean DEFAULT true,
    "is_school_allowance_dependent" boolean DEFAULT false,
    "is_active" boolean DEFAULT true NOT NULL,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."employee_dependents" OWNER TO "postgres";


COMMENT ON TABLE "rh"."employee_dependents" IS 'Dependentes dos funcionários';



CREATE TABLE IF NOT EXISTS "rh"."employee_discounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "tipo_desconto" "rh"."tipo_desconto_rh" NOT NULL,
    "descricao" "text" NOT NULL,
    "valor_total" numeric(10,2) NOT NULL,
    "valor_parcela" numeric(10,2) NOT NULL,
    "quantidade_parcelas" integer NOT NULL,
    "parcela_atual" integer DEFAULT 1 NOT NULL,
    "data_inicio" "date" NOT NULL,
    "data_vencimento" "date" NOT NULL,
    "status" "rh"."status_desconto_rh" DEFAULT 'ativo'::"rh"."status_desconto_rh" NOT NULL,
    "observacoes" "text",
    "valor_maximo_parcela" numeric(10,2),
    "salario_base_funcionario" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "employee_discounts_parcela_atual_check" CHECK (("parcela_atual" > 0)),
    CONSTRAINT "employee_discounts_quantidade_parcelas_check" CHECK (("quantidade_parcelas" > 0)),
    CONSTRAINT "employee_discounts_valor_parcela_check" CHECK (("valor_parcela" > (0)::numeric)),
    CONSTRAINT "employee_discounts_valor_total_check" CHECK (("valor_total" > (0)::numeric))
);


ALTER TABLE "rh"."employee_discounts" OWNER TO "postgres";


COMMENT ON TABLE "rh"."employee_discounts" IS 'Tabela para controle de descontos de funcionários (multas, empréstimos, avarias, etc.)';



COMMENT ON COLUMN "rh"."employee_discounts"."tipo_desconto" IS 'Tipo do desconto: multa_transito, emprestimo, avaria_equipamento, perda_equipamento, outros';



COMMENT ON COLUMN "rh"."employee_discounts"."valor_total" IS 'Valor total do desconto';



COMMENT ON COLUMN "rh"."employee_discounts"."valor_parcela" IS 'Valor de cada parcela';



COMMENT ON COLUMN "rh"."employee_discounts"."quantidade_parcelas" IS 'Quantidade total de parcelas';



COMMENT ON COLUMN "rh"."employee_discounts"."parcela_atual" IS 'Parcela atual sendo processada';



COMMENT ON COLUMN "rh"."employee_discounts"."valor_maximo_parcela" IS 'Valor máximo da parcela baseado em 30% do salário base';



COMMENT ON COLUMN "rh"."employee_discounts"."salario_base_funcionario" IS 'Salário base do funcionário no momento da criação do desconto';



CREATE TABLE IF NOT EXISTS "rh"."employee_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "carteira_trabalho_numero" "text",
    "carteira_trabalho_serie" "text",
    "carteira_trabalho_uf" "text",
    "carteira_trabalho_data_emissao" "date",
    "titulo_eleitoral_numero" "text",
    "titulo_eleitoral_zona" "text",
    "titulo_eleitoral_secao" "text",
    "titulo_eleitoral_uf" "text",
    "carteira_reservista_numero" "text",
    "carteira_reservista_serie" "text",
    "carteira_reservista_categoria" "text",
    "carteira_motorista_numero" "text",
    "carteira_motorista_categoria" "text",
    "carteira_motorista_data_vencimento" "date",
    "cartao_pis_numero" "text",
    "cartao_pis_data_emissao" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."employee_documents" OWNER TO "postgres";


COMMENT ON TABLE "rh"."employee_documents" IS 'Documentos pessoais dos funcionários (CTPS, título eleitoral, etc.)';



COMMENT ON COLUMN "rh"."employee_documents"."carteira_trabalho_numero" IS 'Número da carteira de trabalho';



COMMENT ON COLUMN "rh"."employee_documents"."titulo_eleitoral_numero" IS 'Número do título eleitoral';



COMMENT ON COLUMN "rh"."employee_documents"."carteira_reservista_numero" IS 'Número da carteira de reservista';



COMMENT ON COLUMN "rh"."employee_documents"."carteira_motorista_numero" IS 'Número da carteira de motorista';



COMMENT ON COLUMN "rh"."employee_documents"."cartao_pis_numero" IS 'Número do cartão PIS';



CREATE TABLE IF NOT EXISTS "rh"."employee_education" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "nivel_escolaridade" "text",
    "curso" "text",
    "instituicao" "text",
    "ano_conclusao" integer,
    "status_curso" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."employee_education" OWNER TO "postgres";


COMMENT ON TABLE "rh"."employee_education" IS 'Informações de escolaridade dos funcionários';



COMMENT ON COLUMN "rh"."employee_education"."nivel_escolaridade" IS 'Nível de escolaridade';



COMMENT ON COLUMN "rh"."employee_education"."curso" IS 'Nome do curso';



COMMENT ON COLUMN "rh"."employee_education"."instituicao" IS 'Nome da instituição de ensino';



COMMENT ON COLUMN "rh"."employee_education"."ano_conclusao" IS 'Ano de conclusão do curso';



CREATE TABLE IF NOT EXISTS "rh"."employee_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "movement_type_id" "uuid" NOT NULL,
    "previous_position_id" "uuid",
    "previous_cost_center_id" "uuid",
    "previous_project_id" "uuid",
    "previous_work_shift_id" "uuid",
    "previous_manager_id" "uuid",
    "previous_salario_base" numeric(10,2),
    "previous_status" "text",
    "new_position_id" "uuid",
    "new_cost_center_id" "uuid",
    "new_project_id" "uuid",
    "new_work_shift_id" "uuid",
    "new_manager_id" "uuid",
    "new_salario_base" numeric(10,2),
    "new_status" "text",
    "effective_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "reason" "text",
    "description" "text",
    "attachment_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "rh"."employee_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."employee_movement_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "codigo" "text" NOT NULL,
    "nome" "text" NOT NULL,
    "descricao" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."employee_movement_types" OWNER TO "postgres";


COMMENT ON TABLE "rh"."employee_movement_types" IS 'Tipos de movimentaÃ§Ã£o de funcionÃ¡rios';



CREATE TABLE IF NOT EXISTS "rh"."employee_pcd_info" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "is_pcd" boolean DEFAULT false NOT NULL,
    "deficiency_type_id" "uuid",
    "deficiency_degree_id" "uuid",
    "cid_code" character varying(10),
    "cid_description" "text",
    "needs_accommodation" boolean DEFAULT false,
    "accommodation_description" "text",
    "medical_certificate_url" "text",
    "certificate_validity" "date",
    "is_active" boolean DEFAULT true NOT NULL,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."employee_pcd_info" OWNER TO "postgres";


COMMENT ON TABLE "rh"."employee_pcd_info" IS 'Informações de PCD dos funcionários';



CREATE TABLE IF NOT EXISTS "rh"."employee_shifts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "employee_id" "uuid",
    "shift_id" "uuid",
    "data_inicio" "date" NOT NULL,
    "data_fim" "date",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."employee_shifts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."employee_spouses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "nome" "text",
    "cpf" "text",
    "rg" "text",
    "data_nascimento" "date",
    "certidao_casamento_numero" "text",
    "certidao_casamento_data" "date",
    "certidao_casamento_cartorio" "text",
    "certidao_casamento_uf" "text",
    "uniao_estavel_data" "date",
    "uniao_estavel_cartorio" "text",
    "uniao_estavel_uf" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."employee_spouses" OWNER TO "postgres";


COMMENT ON TABLE "rh"."employee_spouses" IS 'Informações do cônjuge dos funcionários';



COMMENT ON COLUMN "rh"."employee_spouses"."nome" IS 'Nome do cônjuge';



COMMENT ON COLUMN "rh"."employee_spouses"."cpf" IS 'CPF do cônjuge';



COMMENT ON COLUMN "rh"."employee_spouses"."rg" IS 'RG do cônjuge';



COMMENT ON COLUMN "rh"."employee_spouses"."certidao_casamento_numero" IS 'Número da certidão de casamento';



COMMENT ON COLUMN "rh"."employee_spouses"."uniao_estavel_data" IS 'Data da união estável';



CREATE TABLE IF NOT EXISTS "rh"."employee_tax_calculations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "reference_month" "date" NOT NULL,
    "salario_bruto" numeric(10,2) NOT NULL,
    "inss_bracket_id" "uuid",
    "inss_valor" numeric(10,2) DEFAULT 0 NOT NULL,
    "irrf_bracket_id" "uuid",
    "irrf_valor" numeric(10,2) DEFAULT 0 NOT NULL,
    "fgts_config_id" "uuid",
    "fgts_valor" numeric(10,2) DEFAULT 0 NOT NULL,
    "dependentes_irrf" integer DEFAULT 0,
    "outros_descontos" numeric(10,2) DEFAULT 0,
    "salario_liquido" numeric(10,2) NOT NULL,
    "observacoes" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."employee_tax_calculations" OWNER TO "postgres";


COMMENT ON TABLE "rh"."employee_tax_calculations" IS 'Histórico de cálculos de impostos dos funcionários';



CREATE TABLE IF NOT EXISTS "rh"."employment_contracts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "employee_id" "uuid",
    "position_id" "uuid",
    "work_schedule_id" "uuid",
    "tipo_contrato" "core"."tipo_contrato" NOT NULL,
    "data_inicio" "date",
    "data_fim" "date",
    "salario_base" numeric(10,2),
    "sindicato_id" "uuid",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."employment_contracts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."equipment_rental_approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "employee_id" "uuid",
    "equipment_rental_id" "uuid",
    "mes_referencia" integer NOT NULL,
    "ano_referencia" integer NOT NULL,
    "valor_aprovado" numeric(10,2) NOT NULL,
    "status" "core"."status_aprovacao" DEFAULT 'pendente'::"core"."status_aprovacao",
    "aprovado_por" "uuid",
    "data_aprovacao" timestamp with time zone,
    "observacoes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."equipment_rental_approvals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."equipment_rental_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "equipment_rental_id" "uuid" NOT NULL,
    "payment_month" character varying(7) NOT NULL,
    "payment_year" integer NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "payment_date" "date",
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "payment_method" character varying(20),
    "payment_reference" character varying(255),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid" NOT NULL,
    "updated_by" "uuid",
    CONSTRAINT "equipment_rental_payments_amount_check" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "equipment_rental_payments_payment_method_check" CHECK ((("payment_method")::"text" = ANY ((ARRAY['bank_transfer'::character varying, 'pix'::character varying, 'cash'::character varying, 'check'::character varying])::"text"[]))),
    CONSTRAINT "equipment_rental_payments_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "rh"."equipment_rental_payments" OWNER TO "postgres";


COMMENT ON TABLE "rh"."equipment_rental_payments" IS 'Tabela para controle de pagamentos de locação de equipamentos';



COMMENT ON COLUMN "rh"."equipment_rental_payments"."payment_month" IS 'Mês do pagamento no formato YYYY-MM';



COMMENT ON COLUMN "rh"."equipment_rental_payments"."payment_method" IS 'Método de pagamento: bank_transfer, pix, cash, check';



COMMENT ON COLUMN "rh"."equipment_rental_payments"."payment_reference" IS 'Referência do pagamento (chave PIX, número da transferência, etc.)';



CREATE TABLE IF NOT EXISTS "rh"."equipment_rentals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "equipment_type" character varying(20) NOT NULL,
    "equipment_name" character varying(255) NOT NULL,
    "equipment_description" "text",
    "brand" character varying(100),
    "model" character varying(100),
    "serial_number" character varying(100),
    "license_plate" character varying(20),
    "monthly_value" numeric(10,2) NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid" NOT NULL,
    "updated_by" "uuid",
    CONSTRAINT "equipment_rentals_equipment_type_check" CHECK ((("equipment_type")::"text" = ANY ((ARRAY['vehicle'::character varying, 'computer'::character varying, 'phone'::character varying, 'other'::character varying])::"text"[]))),
    CONSTRAINT "equipment_rentals_monthly_value_check" CHECK (("monthly_value" >= (0)::numeric)),
    CONSTRAINT "equipment_rentals_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'terminated'::character varying])::"text"[])))
);


ALTER TABLE "rh"."equipment_rentals" OWNER TO "postgres";


COMMENT ON TABLE "rh"."equipment_rentals" IS 'Tabela para controle de equipamentos locados pelos funcionários';



COMMENT ON COLUMN "rh"."equipment_rentals"."equipment_type" IS 'Tipo do equipamento: vehicle, computer, phone, other';



COMMENT ON COLUMN "rh"."equipment_rentals"."license_plate" IS 'Placa do veículo (apenas para tipo vehicle)';



COMMENT ON COLUMN "rh"."equipment_rentals"."monthly_value" IS 'Valor mensal da locação em reais';



CREATE TABLE IF NOT EXISTS "rh"."esocial_batches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "batch_number" character varying(50) NOT NULL,
    "period" character varying(7) NOT NULL,
    "total_events" integer DEFAULT 0,
    "sent_events" integer DEFAULT 0,
    "accepted_events" integer DEFAULT 0,
    "rejected_events" integer DEFAULT 0,
    "error_events" integer DEFAULT 0,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "sent_at" timestamp with time zone,
    "response_data" "jsonb",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."esocial_batches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."esocial_benefit_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "codigo" "text" NOT NULL,
    "descricao" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."esocial_benefit_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."esocial_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "codigo" "text" NOT NULL,
    "descricao" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."esocial_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."esocial_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "tipo_evento" "text" NOT NULL,
    "numero_recibo" "text",
    "xml_evento" "text",
    "status" "core"."status_geral" DEFAULT 'pendente'::"core"."status_geral",
    "data_envio" timestamp with time zone,
    "data_retorno" timestamp with time zone,
    "retorno_xml" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."esocial_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."esocial_integration_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "config_name" character varying(100) NOT NULL,
    "config_type" character varying(50) NOT NULL,
    "config_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."esocial_integration_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."esocial_leave_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "codigo" "text" NOT NULL,
    "descricao" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."esocial_leave_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."esocial_naturezas_rubricas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "codigo" "text" NOT NULL,
    "descricao" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."esocial_naturezas_rubricas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."esocial_processed_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "event_type" character varying(50) NOT NULL,
    "period" character varying(7) NOT NULL,
    "event_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "sent_at" timestamp with time zone,
    "response_data" "jsonb",
    "error_message" "text",
    "retry_count" integer DEFAULT 0,
    "max_retries" integer DEFAULT 3,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."esocial_processed_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."esocial_validation_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "processed_event_id" "uuid" NOT NULL,
    "validation_id" "uuid" NOT NULL,
    "validation_result" character varying(20) NOT NULL,
    "validation_message" "text",
    "validated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "validated_by" "uuid"
);


ALTER TABLE "rh"."esocial_validation_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."esocial_validations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "validation_name" character varying(100) NOT NULL,
    "event_type" character varying(50) NOT NULL,
    "validation_rule" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "error_message" "text" NOT NULL,
    "warning_message" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."esocial_validations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."fgts_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "codigo" character varying(10) NOT NULL,
    "descricao" character varying(255) NOT NULL,
    "aliquota" numeric(5,4) NOT NULL,
    "valor_maximo" numeric(10,2),
    "valor_minimo" numeric(10,2) DEFAULT 0,
    "is_active" boolean DEFAULT true NOT NULL,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."fgts_config" OWNER TO "postgres";


COMMENT ON TABLE "rh"."fgts_config" IS 'Configurações de FGTS';



CREATE TABLE IF NOT EXISTS "rh"."funcionario_beneficios_historico" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "benefit_id" "uuid" NOT NULL,
    "convenio_id" "uuid",
    "vr_va_config_id" "uuid",
    "transporte_config_id" "uuid",
    "valor_beneficio" numeric(10,2) DEFAULT 0 NOT NULL,
    "valor_desconto" numeric(10,2) DEFAULT 0,
    "valor_final" numeric(10,2) DEFAULT 0 NOT NULL,
    "motivo_desconto" "text",
    "mes_referencia" integer NOT NULL,
    "ano_referencia" integer NOT NULL,
    "status" character varying(20) DEFAULT 'ativo'::character varying,
    "data_inicio" "date" NOT NULL,
    "data_fim" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "funcionario_beneficios_historico_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['ativo'::character varying, 'suspenso'::character varying, 'cancelado'::character varying])::"text"[])))
);


ALTER TABLE "rh"."funcionario_beneficios_historico" OWNER TO "postgres";


COMMENT ON TABLE "rh"."funcionario_beneficios_historico" IS 'Histórico de benefícios por funcionário';



CREATE TABLE IF NOT EXISTS "rh"."funcionario_convenio_dependentes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "funcionario_convenio_id" "uuid" NOT NULL,
    "employee_dependent_id" "uuid" NOT NULL,
    "valor_dependente" numeric(10,2) DEFAULT 0 NOT NULL,
    "is_ativo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."funcionario_convenio_dependentes" OWNER TO "postgres";


COMMENT ON TABLE "rh"."funcionario_convenio_dependentes" IS 'Vinculação de dependentes aos convênios dos funcionários (usa tabela existente employee_dependents)';



CREATE TABLE IF NOT EXISTS "rh"."funcionario_convenios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "convenio_plano_id" "uuid" NOT NULL,
    "data_inicio" "date" NOT NULL,
    "data_fim" "date",
    "valor_titular" numeric(10,2) DEFAULT 0 NOT NULL,
    "valor_dependentes" numeric(10,2) DEFAULT 0 NOT NULL,
    "valor_total" numeric(10,2) DEFAULT 0 NOT NULL,
    "status" character varying(20) DEFAULT 'ativo'::character varying,
    "observacoes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "funcionario_convenios_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['ativo'::character varying, 'suspenso'::character varying, 'cancelado'::character varying])::"text"[])))
);


ALTER TABLE "rh"."funcionario_convenios" OWNER TO "postgres";


COMMENT ON TABLE "rh"."funcionario_convenios" IS 'Adesões dos funcionários aos planos de convênios';



CREATE TABLE IF NOT EXISTS "rh"."funcionario_elegibilidade" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "elegibilidade_id" "uuid" NOT NULL,
    "is_elegivel" boolean DEFAULT true NOT NULL,
    "data_calculo" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."funcionario_elegibilidade" OWNER TO "postgres";


COMMENT ON TABLE "rh"."funcionario_elegibilidade" IS 'Cache de elegibilidade dos funcionários para performance';



CREATE TABLE IF NOT EXISTS "rh"."hiring_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "job_application_id" "uuid" NOT NULL,
    "candidate_id" "uuid" NOT NULL,
    "document_type" "text" NOT NULL,
    "document_name" "text" NOT NULL,
    "file_path" "text",
    "file_size" integer,
    "mime_type" "text",
    "status" "text" DEFAULT 'pendente'::"text",
    "uploaded_at" timestamp with time zone,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "rejection_reason" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "hiring_documents_document_type_check" CHECK (("document_type" = ANY (ARRAY['ctps_digital'::"text", 'rg_cnh'::"text", 'cpf'::"text", 'titulo_eleitor'::"text", 'comprovante_votacao'::"text", 'certificado_reservista'::"text", 'pis_pasep'::"text", 'certidao_nascimento'::"text", 'certidao_casamento'::"text", 'comprovante_residencia'::"text", 'comprovante_escolaridade'::"text", 'foto_3x4'::"text", 'cnh'::"text", 'registro_profissional'::"text", 'certidao_nascimento_filhos'::"text", 'cpf_filhos'::"text", 'caderneta_vacinacao'::"text", 'comprovante_frequencia_escolar'::"text", 'exame_admissional'::"text", 'declaracao_dependentes'::"text", 'dados_bancarios'::"text"]))),
    CONSTRAINT "hiring_documents_status_check" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'aprovado'::"text", 'reprovado'::"text", 'rejeitado'::"text"])))
);


ALTER TABLE "rh"."hiring_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."holidays" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "data" "date" NOT NULL,
    "nome" "text" NOT NULL,
    "tipo" "text" NOT NULL,
    "estado" "text",
    "cidade" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "holidays_tipo_check" CHECK (("tipo" = ANY (ARRAY['nacional'::"text", 'estadual'::"text", 'municipal'::"text"])))
);


ALTER TABLE "rh"."holidays" OWNER TO "postgres";


COMMENT ON TABLE "rh"."holidays" IS 'Tabela para gerenciar feriados nacionais, estaduais e municipais';



COMMENT ON COLUMN "rh"."holidays"."tipo" IS 'Tipo de feriado: nacional, estadual, municipal';



CREATE TABLE IF NOT EXISTS "rh"."income_statements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "employee_id" "uuid",
    "ano_referencia" integer NOT NULL,
    "arquivo_pdf" "text",
    "status" "core"."status_geral" DEFAULT 'ativo'::"core"."status_geral",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."income_statements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."inss_brackets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "codigo" character varying(10) NOT NULL,
    "descricao" character varying(255) NOT NULL,
    "salario_minimo" numeric(10,2) NOT NULL,
    "salario_maximo" numeric(10,2) NOT NULL,
    "aliquota" numeric(5,4) NOT NULL,
    "valor_deducao" numeric(10,2) DEFAULT 0,
    "is_active" boolean DEFAULT true NOT NULL,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "inss_brackets_salario_check" CHECK (("salario_maximo" >= "salario_minimo"))
);


ALTER TABLE "rh"."inss_brackets" OWNER TO "postgres";


COMMENT ON TABLE "rh"."inss_brackets" IS 'Faixas de contribuição INSS';



CREATE TABLE IF NOT EXISTS "rh"."irrf_brackets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "codigo" character varying(10) NOT NULL,
    "descricao" character varying(255) NOT NULL,
    "salario_minimo" numeric(10,2) NOT NULL,
    "salario_maximo" numeric(10,2) NOT NULL,
    "aliquota" numeric(5,4) NOT NULL,
    "valor_deducao" numeric(10,2) NOT NULL,
    "dependentes_deducao" numeric(10,2) DEFAULT 0,
    "is_active" boolean DEFAULT true NOT NULL,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "irrf_brackets_salario_check" CHECK (("salario_maximo" >= "salario_minimo"))
);


ALTER TABLE "rh"."irrf_brackets" OWNER TO "postgres";


COMMENT ON TABLE "rh"."irrf_brackets" IS 'Faixas de Imposto de Renda Retido na Fonte';



CREATE TABLE IF NOT EXISTS "rh"."job_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "job_opening_id" "uuid" NOT NULL,
    "candidate_id" "uuid" NOT NULL,
    "selection_process_id" "uuid" NOT NULL,
    "current_stage_id" "uuid",
    "status" "text" DEFAULT 'inscrito'::"text",
    "application_date" "date" DEFAULT CURRENT_DATE,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "job_applications_status_check" CHECK (("status" = ANY (ARRAY['inscrito'::"text", 'em_andamento'::"text", 'aprovado'::"text", 'reprovado'::"text", 'desistiu'::"text"])))
);


ALTER TABLE "rh"."job_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."job_openings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "job_request_id" "uuid",
    "position_name" "text" NOT NULL,
    "department_name" "text",
    "job_description" "text" NOT NULL,
    "requirements" "text",
    "benefits" "text",
    "salary_range" "text",
    "status" "text" DEFAULT 'aberta'::"text",
    "open_date" "date" DEFAULT CURRENT_DATE,
    "close_date" "date",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "job_openings_status_check" CHECK (("status" = ANY (ARRAY['aberta'::"text", 'pausada'::"text", 'fechada'::"text", 'preenchida'::"text"])))
);


ALTER TABLE "rh"."job_openings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."job_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "position_name" "text" NOT NULL,
    "department_name" "text",
    "job_description" "text" NOT NULL,
    "requirements" "text",
    "benefits" "text",
    "salary_range" "text",
    "urgency_level" "text",
    "expected_start_date" "date",
    "status" "text" DEFAULT 'solicitado'::"text",
    "approved_by" "uuid",
    "approval_date" timestamp with time zone,
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "job_requests_status_check" CHECK (("status" = ANY (ARRAY['solicitado'::"text", 'em_analise'::"text", 'aprovado'::"text", 'reprovado'::"text", 'pausado'::"text"]))),
    CONSTRAINT "job_requests_urgency_level_check" CHECK (("urgency_level" = ANY (ARRAY['baixa'::"text", 'media'::"text", 'alta'::"text", 'critica'::"text"])))
);


ALTER TABLE "rh"."job_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."kinship_degrees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "codigo" character varying(10) NOT NULL,
    "descricao" character varying(255) NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "company_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."kinship_degrees" OWNER TO "postgres";


COMMENT ON TABLE "rh"."kinship_degrees" IS 'Graus de parentesco';



CREATE TABLE IF NOT EXISTS "rh"."medical_certificates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "employee_id" "uuid",
    "data_inicio" "date",
    "data_fim" "date",
    "dias_afastamento" integer,
    "cid" "text",
    "tipo" "text",
    "arquivo_anexo" "text",
    "aprovado_por" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "status" "core"."status_aprovacao" DEFAULT 'pendente'::"core"."status_aprovacao",
    "data_aprovacao" timestamp with time zone
);


ALTER TABLE "rh"."medical_certificates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."notification_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "notification_type" character varying(50) NOT NULL,
    "title" character varying(255) NOT NULL,
    "message" "text",
    "sent_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "was_delivered" boolean DEFAULT false,
    "was_clicked" boolean DEFAULT false,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "rh"."notification_history" OWNER TO "postgres";


COMMENT ON TABLE "rh"."notification_history" IS 'Histórico de notificações enviadas para usuários';



COMMENT ON COLUMN "rh"."notification_history"."notification_type" IS 'Tipo de notificação (ex: time_reminder, system_alert)';



COMMENT ON COLUMN "rh"."notification_history"."was_delivered" IS 'Se a notificação foi entregue com sucesso';



COMMENT ON COLUMN "rh"."notification_history"."was_clicked" IS 'Se o usuário clicou na notificação';



COMMENT ON COLUMN "rh"."notification_history"."metadata" IS 'Dados adicionais da notificação em formato JSON';



CREATE TABLE IF NOT EXISTS "rh"."payroll" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "competencia" "text" NOT NULL,
    "data_processamento" "date",
    "status" "core"."status_geral" DEFAULT 'processando'::"core"."status_geral",
    "total_proventos" numeric(12,2),
    "total_descontos" numeric(12,2),
    "total_liquido" numeric(12,2),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."payroll" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."payroll_accounting_provisions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "payroll_calculation_id" "uuid" NOT NULL,
    "provision_type" character varying(50) NOT NULL,
    "account_id" "uuid" NOT NULL,
    "cost_center_id" "uuid",
    "project_id" "uuid",
    "base_amount" numeric(12,2) NOT NULL,
    "provision_amount" numeric(12,2) NOT NULL,
    "rate" numeric(5,4) NOT NULL,
    "description" "text" NOT NULL,
    "reference_period" character varying(7) NOT NULL,
    "due_date" "date" NOT NULL,
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payroll_accounting_provisions_provision_type_check" CHECK ((("provision_type")::"text" = ANY ((ARRAY['inss_patronal'::character varying, 'fgts'::character varying, 'rat'::character varying, 'third_party'::character varying, 'benefits'::character varying])::"text"[]))),
    CONSTRAINT "payroll_accounting_provisions_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "rh"."payroll_accounting_provisions" OWNER TO "postgres";


COMMENT ON TABLE "rh"."payroll_accounting_provisions" IS 'Provisões contábeis para encargos patronais';



CREATE TABLE IF NOT EXISTS "rh"."payroll_calculation_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "config_name" character varying(100) NOT NULL,
    "config_type" character varying(50) NOT NULL,
    "config_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."payroll_calculation_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."payroll_calculation_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "calculation_id" "uuid" NOT NULL,
    "rubrica_id" "uuid" NOT NULL,
    "codigo" character varying(20) NOT NULL,
    "nome" character varying(100) NOT NULL,
    "tipo" character varying(20) NOT NULL,
    "valor_base" numeric(15,2) DEFAULT 0,
    "percentual" numeric(5,4) DEFAULT 0,
    "valor_calculado" numeric(15,2) DEFAULT 0,
    "quantidade" numeric(10,4) DEFAULT 1,
    "unidade" character varying(20) DEFAULT 'unidade'::character varying,
    "formula_aplicada" "text",
    "ordem_calculo" integer DEFAULT 0,
    "is_manual" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "rh"."payroll_calculation_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."payroll_calculations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "period" character varying(7) NOT NULL,
    "calculation_type" character varying(50) NOT NULL,
    "calculation_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "total_proventos" numeric(15,2) DEFAULT 0,
    "total_descontos" numeric(15,2) DEFAULT 0,
    "salario_bruto" numeric(15,2) DEFAULT 0,
    "salario_liquido" numeric(15,2) DEFAULT 0,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "calculated_at" timestamp with time zone,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "processed_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."payroll_calculations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."payroll_cnab_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "payment_batch_id" "uuid",
    "file_type" character varying(50) NOT NULL,
    "file_name" character varying(255) NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size" integer NOT NULL,
    "cnab_layout" character varying(20) NOT NULL,
    "cnab_sequence" character varying(20) NOT NULL,
    "bank_code" character varying(10) NOT NULL,
    "bank_name" character varying(100) NOT NULL,
    "total_records" integer,
    "total_amount" numeric(15,2),
    "processed_records" integer DEFAULT 0,
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "processed_at" timestamp with time zone,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payroll_cnab_files_file_type_check" CHECK ((("file_type")::"text" = ANY ((ARRAY['remessa'::character varying, 'retorno'::character varying])::"text"[]))),
    CONSTRAINT "payroll_cnab_files_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'processed'::character varying, 'error'::character varying])::"text"[])))
);


ALTER TABLE "rh"."payroll_cnab_files" OWNER TO "postgres";


COMMENT ON TABLE "rh"."payroll_cnab_files" IS 'Arquivos CNAB de remessa e retorno';



CREATE TABLE IF NOT EXISTS "rh"."payroll_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "employee_id" "uuid",
    "regime_hora_extra" "text" DEFAULT 'pagamento_mensal'::"text",
    "vigencia_banco_horas" integer DEFAULT 12,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."payroll_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."payroll_consolidation_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "config_type" character varying(50) NOT NULL,
    "config_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."payroll_consolidation_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."payroll_consolidation_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "period" character varying(7) NOT NULL,
    "consolidation_type" character varying(50) NOT NULL,
    "status" character varying(20) NOT NULL,
    "events_processed" integer DEFAULT 0,
    "events_errors" integer DEFAULT 0,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "error_details" "jsonb",
    "created_by" "uuid"
);


ALTER TABLE "rh"."payroll_consolidation_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."payroll_event_validations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "validation_type" character varying(50) NOT NULL,
    "validation_rule" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "error_message" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."payroll_event_validations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."payroll_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "period" character varying(7) NOT NULL,
    "event_type" character varying(50) NOT NULL,
    "event_source" character varying(50) NOT NULL,
    "event_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "calculated_value" numeric(15,2) DEFAULT 0,
    "base_value" numeric(15,2) DEFAULT 0,
    "multiplier" numeric(5,4) DEFAULT 1.0,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "processed_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."payroll_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."payroll_financial_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "bank_account_id" "uuid",
    "cost_center_id" "uuid",
    "project_id" "uuid",
    "payment_method" character varying(50) DEFAULT 'cnab'::character varying,
    "payment_day" integer DEFAULT 5,
    "advance_payment_days" integer DEFAULT 2,
    "inss_account_id" "uuid",
    "fgts_account_id" "uuid",
    "irrf_account_id" "uuid",
    "union_account_id" "uuid",
    "transport_account_id" "uuid",
    "food_account_id" "uuid",
    "health_account_id" "uuid",
    "cnab_layout" character varying(20) DEFAULT '240'::character varying,
    "cnab_remessa_path" "text",
    "cnab_retorno_path" "text",
    "notify_payment" boolean DEFAULT true,
    "notify_errors" boolean DEFAULT true,
    "notification_emails" "text"[],
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payroll_financial_config_cnab_layout_check" CHECK ((("cnab_layout")::"text" = ANY ((ARRAY['240'::character varying, '400'::character varying])::"text"[]))),
    CONSTRAINT "payroll_financial_config_payment_day_check" CHECK ((("payment_day" >= 1) AND ("payment_day" <= 31))),
    CONSTRAINT "payroll_financial_config_payment_method_check" CHECK ((("payment_method")::"text" = ANY ((ARRAY['cnab'::character varying, 'pix'::character varying, 'transfer'::character varying])::"text"[])))
);


ALTER TABLE "rh"."payroll_financial_config" OWNER TO "postgres";


COMMENT ON TABLE "rh"."payroll_financial_config" IS 'Configurações de integração financeira da folha de pagamento';



CREATE TABLE IF NOT EXISTS "rh"."payroll_generated_titles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "payroll_calculation_id" "uuid" NOT NULL,
    "employee_id" "uuid",
    "title_type" character varying(50) NOT NULL,
    "title_number" character varying(100) NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "due_date" "date" NOT NULL,
    "payment_date" "date",
    "accounts_payable_id" "uuid",
    "bank_transaction_id" "uuid",
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "payment_method" character varying(50),
    "payment_reference" "text",
    "cnab_sequence" character varying(20),
    "cnab_batch_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payroll_generated_titles_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'cancelled'::character varying, 'overdue'::character varying])::"text"[]))),
    CONSTRAINT "payroll_generated_titles_title_type_check" CHECK ((("title_type")::"text" = ANY ((ARRAY['salary'::character varying, 'benefits'::character varying, 'taxes'::character varying, 'union'::character varying, 'advance'::character varying])::"text"[])))
);


ALTER TABLE "rh"."payroll_generated_titles" OWNER TO "postgres";


COMMENT ON TABLE "rh"."payroll_generated_titles" IS 'Títulos a pagar gerados pela folha de pagamento';



CREATE TABLE IF NOT EXISTS "rh"."payroll_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "payroll_id" "uuid",
    "employee_id" "uuid",
    "tipo" "text" NOT NULL,
    "codigo" "text" NOT NULL,
    "descricao" "text" NOT NULL,
    "valor" numeric(10,2),
    "base_calculo" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."payroll_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."payroll_payment_batches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "payroll_calculation_id" "uuid" NOT NULL,
    "batch_number" character varying(100) NOT NULL,
    "batch_type" character varying(50) NOT NULL,
    "description" "text" NOT NULL,
    "total_amount" numeric(15,2) NOT NULL,
    "total_titles" integer NOT NULL,
    "cnab_file_path" "text",
    "cnab_file_name" character varying(255),
    "cnab_file_size" integer,
    "cnab_sequence" character varying(20),
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "sent_at" timestamp with time zone,
    "processed_at" timestamp with time zone,
    "return_file_path" "text",
    "return_file_name" character varying(255),
    "return_processed_at" timestamp with time zone,
    "error_message" "text",
    "error_details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payroll_payment_batches_batch_type_check" CHECK ((("batch_type")::"text" = ANY ((ARRAY['salary'::character varying, 'benefits'::character varying, 'taxes'::character varying, 'mixed'::character varying])::"text"[]))),
    CONSTRAINT "payroll_payment_batches_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'generated'::character varying, 'sent'::character varying, 'processed'::character varying, 'error'::character varying])::"text"[])))
);


ALTER TABLE "rh"."payroll_payment_batches" OWNER TO "postgres";


COMMENT ON TABLE "rh"."payroll_payment_batches" IS 'Lotes de pagamento para processamento bancário';



CREATE TABLE IF NOT EXISTS "rh"."payroll_rubricas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "codigo" character varying(20) NOT NULL,
    "nome" character varying(100) NOT NULL,
    "tipo" character varying(20) NOT NULL,
    "categoria" character varying(50) NOT NULL,
    "formula_calculo" "jsonb",
    "valor_fixo" numeric(15,2),
    "percentual" numeric(5,4),
    "base_calculo" character varying(50),
    "ordem_calculo" integer DEFAULT 0,
    "is_obrigatorio" boolean DEFAULT false,
    "is_visivel" boolean DEFAULT true,
    "is_ativo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."payroll_rubricas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."payroll_slips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "employee_id" "uuid",
    "mes_referencia" integer NOT NULL,
    "ano_referencia" integer NOT NULL,
    "arquivo_pdf" "text",
    "status" "core"."status_geral" DEFAULT 'ativo'::"core"."status_geral",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."payroll_slips" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."payroll_tax_guides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "payroll_calculation_id" "uuid" NOT NULL,
    "guide_type" character varying(50) NOT NULL,
    "guide_number" character varying(100) NOT NULL,
    "reference_period" character varying(7) NOT NULL,
    "due_date" "date" NOT NULL,
    "payment_date" "date",
    "base_amount" numeric(12,2) NOT NULL,
    "tax_amount" numeric(12,2) NOT NULL,
    "fine_amount" numeric(12,2) DEFAULT 0,
    "interest_amount" numeric(12,2) DEFAULT 0,
    "total_amount" numeric(12,2) NOT NULL,
    "bar_code" "text",
    "digitable_line" "text",
    "payment_slip" "text",
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "payment_reference" "text",
    "sefaz_protocol" "text",
    "sefaz_status" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payroll_tax_guides_guide_type_check" CHECK ((("guide_type")::"text" = ANY ((ARRAY['inss'::character varying, 'fgts'::character varying, 'irrf'::character varying, 'union'::character varying, 'rat'::character varying])::"text"[]))),
    CONSTRAINT "payroll_tax_guides_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'cancelled'::character varying, 'overdue'::character varying])::"text"[])))
);


ALTER TABLE "rh"."payroll_tax_guides" OWNER TO "postgres";


COMMENT ON TABLE "rh"."payroll_tax_guides" IS 'Guias de recolhimento de impostos e contribuições';



CREATE TABLE IF NOT EXISTS "rh"."payroll_validation_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "calculation_id" "uuid" NOT NULL,
    "validation_id" "uuid" NOT NULL,
    "validation_result" character varying(20) NOT NULL,
    "validation_message" "text",
    "validated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "validated_by" "uuid"
);


ALTER TABLE "rh"."payroll_validation_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."payroll_validations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "validation_name" character varying(100) NOT NULL,
    "validation_type" character varying(50) NOT NULL,
    "validation_rule" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "error_message" "text" NOT NULL,
    "warning_message" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."payroll_validations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "codigo" "text" NOT NULL,
    "nome" "text" NOT NULL,
    "descricao" "text",
    "nivel_hierarquico" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."positions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."report_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "report_template_id" "uuid",
    "report_name" character varying(255) NOT NULL,
    "report_type" character varying(100) NOT NULL,
    "parameters" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "file_path" character varying(500),
    "file_size" bigint,
    "status" character varying(50) NOT NULL,
    "error_message" "text",
    "generated_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone
);


ALTER TABLE "rh"."report_history" OWNER TO "postgres";


COMMENT ON TABLE "rh"."report_history" IS 'Histórico de relatórios gerados pelos usuários';



CREATE TABLE IF NOT EXISTS "rh"."report_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "category" character varying(100) NOT NULL,
    "template_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "query_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "output_formats" "text"[] DEFAULT ARRAY['pdf'::"text", 'excel'::"text", 'csv'::"text"],
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."report_templates" OWNER TO "postgres";


COMMENT ON TABLE "rh"."report_templates" IS 'Templates de relatórios pré-configurados';



CREATE TABLE IF NOT EXISTS "rh"."rubricas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "codigo" "text" NOT NULL,
    "descricao" "text" NOT NULL,
    "natureza_esocial_id" "uuid",
    "tipo" "text" NOT NULL,
    "incidencias" "jsonb" DEFAULT '{}'::"jsonb",
    "referencia" "text",
    "unidade" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "rubricas_tipo_check" CHECK (("tipo" = ANY (ARRAY['provento'::"text", 'desconto'::"text"])))
);


ALTER TABLE "rh"."rubricas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."schedule_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "data" "date" NOT NULL,
    "tipo" "text" NOT NULL,
    "shift_id" "uuid",
    "observacoes" "text",
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "schedule_entries_tipo_check" CHECK (("tipo" = ANY (ARRAY['turno'::"text", 'folga'::"text", 'ferias'::"text", 'feriado'::"text", 'atestado'::"text", 'falta'::"text"])))
);


ALTER TABLE "rh"."schedule_entries" OWNER TO "postgres";


COMMENT ON TABLE "rh"."schedule_entries" IS 'Tabela para programação visual de escalas (funcionário x dia)';



COMMENT ON COLUMN "rh"."schedule_entries"."tipo" IS 'Tipo de entrada: turno, folga, ferias, feriado, atestado, falta';



CREATE TABLE IF NOT EXISTS "rh"."selection_processes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "job_opening_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'ativo'::"text",
    "start_date" "date" DEFAULT CURRENT_DATE,
    "end_date" "date",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "selection_processes_status_check" CHECK (("status" = ANY (ARRAY['ativo'::"text", 'pausado'::"text", 'finalizado'::"text", 'cancelado'::"text"])))
);


ALTER TABLE "rh"."selection_processes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."selection_stages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "selection_process_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "stage_type" "text" NOT NULL,
    "order_index" integer NOT NULL,
    "is_final_stage" boolean DEFAULT false,
    "passing_criteria" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "selection_stages_stage_type_check" CHECK (("stage_type" = ANY (ARRAY['triagem'::"text", 'entrevista'::"text", 'prova_tecnica'::"text", 'dinamica'::"text", 'entrevista_final'::"text", 'aprovacao'::"text", 'reprovacao'::"text"])))
);


ALTER TABLE "rh"."selection_stages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."stage_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_application_id" "uuid" NOT NULL,
    "stage_id" "uuid" NOT NULL,
    "evaluator_id" "uuid" NOT NULL,
    "result" "text" NOT NULL,
    "score" numeric(5,2),
    "feedback" "text",
    "interview_notes" "text",
    "evaluation_date" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "stage_results_result_check" CHECK (("result" = ANY (ARRAY['aprovado'::"text", 'reprovado'::"text", 'pendente'::"text"])))
);


ALTER TABLE "rh"."stage_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."talent_pool" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "candidate_id" "uuid" NOT NULL,
    "skill_category" "text" NOT NULL,
    "skill_level" "text",
    "experience_years" integer,
    "availability" "text",
    "interest_areas" "text"[],
    "salary_expectation" numeric(10,2),
    "added_by" "uuid" NOT NULL,
    "added_date" "date" DEFAULT CURRENT_DATE,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "talent_pool_availability_check" CHECK (("availability" = ANY (ARRAY['imediata'::"text", '1_mes'::"text", '3_meses'::"text", '6_meses'::"text", 'indisponivel'::"text"]))),
    CONSTRAINT "talent_pool_skill_level_check" CHECK (("skill_level" = ANY (ARRAY['iniciante'::"text", 'intermediario'::"text", 'avancado'::"text", 'especialista'::"text"])))
);


ALTER TABLE "rh"."talent_pool" OWNER TO "postgres";


COMMENT ON TABLE "rh"."talent_pool" IS 'Banco de talentos da empresa';



CREATE TABLE IF NOT EXISTS "rh"."time_bank" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "employee_id" "uuid",
    "tipo" "text" NOT NULL,
    "quantidade" numeric(8,2) NOT NULL,
    "data_registro" "date" NOT NULL,
    "justificativa" "text",
    "aprovado_por" "uuid",
    "status" "core"."status_aprovacao" DEFAULT 'pendente'::"core"."status_aprovacao",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."time_bank" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."time_record_correction_control" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "year" integer NOT NULL,
    "month" integer NOT NULL,
    "correction_enabled" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "rh"."time_record_correction_control" OWNER TO "postgres";


COMMENT ON TABLE "rh"."time_record_correction_control" IS 'Controla a liberação de correção de ponto eletrônico por empresa, ano e mês';



COMMENT ON COLUMN "rh"."time_record_correction_control"."company_id" IS 'ID da empresa';



COMMENT ON COLUMN "rh"."time_record_correction_control"."year" IS 'Ano de referência';



COMMENT ON COLUMN "rh"."time_record_correction_control"."month" IS 'Mês de referência (1-12)';



COMMENT ON COLUMN "rh"."time_record_correction_control"."correction_enabled" IS 'Se true, permite correção de ponto no Portal do Funcionário';



CREATE TABLE IF NOT EXISTS "rh"."time_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "employee_id" "uuid",
    "data" "date" NOT NULL,
    "hora_entrada" time without time zone,
    "hora_saida" time without time zone,
    "intervalo_inicio" time without time zone,
    "intervalo_fim" time without time zone,
    "tipo" "text" DEFAULT 'normal'::"text",
    "justificativa" "text",
    "aprovado_por" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "hora_adicional_inicio" time without time zone,
    "hora_adicional_fim" time without time zone,
    "horas_noturnas" numeric(4,2) DEFAULT 0,
    "horas_final_semana" numeric(4,2) DEFAULT 0,
    "valor_adicional_noturno" numeric(10,2) DEFAULT 0,
    "valor_adicional_final_semana" numeric(10,2) DEFAULT 0
);


ALTER TABLE "rh"."time_records" OWNER TO "postgres";


COMMENT ON COLUMN "rh"."time_records"."horas_noturnas" IS 'Quantidade de horas trabalhadas no período noturno (22h às 5h)';



COMMENT ON COLUMN "rh"."time_records"."horas_final_semana" IS 'Quantidade de horas trabalhadas em final de semana (sábado e domingo)';



COMMENT ON COLUMN "rh"."time_records"."valor_adicional_noturno" IS 'Valor do adicional noturno calculado automaticamente (20% sobre as horas noturnas)';



COMMENT ON COLUMN "rh"."time_records"."valor_adicional_final_semana" IS 'Valor do adicional de final de semana calculado automaticamente (50% ou 100% sobre as horas de FDS)';



CREATE TABLE IF NOT EXISTS "rh"."transporte_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "tipo" character varying(20) NOT NULL,
    "valor_passagem" numeric(10,2) DEFAULT 0,
    "quantidade_passagens" integer DEFAULT 0,
    "valor_combustivel" numeric(10,2) DEFAULT 0,
    "desconto_por_ausencia" boolean DEFAULT true,
    "desconto_por_ferias" boolean DEFAULT true,
    "desconto_por_licenca" boolean DEFAULT true,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "transporte_configs_tipo_check" CHECK ((("tipo")::"text" = ANY ((ARRAY['passagem'::character varying, 'combustivel'::character varying, 'ambos'::character varying])::"text"[])))
);


ALTER TABLE "rh"."transporte_configs" OWNER TO "postgres";


COMMENT ON TABLE "rh"."transporte_configs" IS 'Configurações de transporte (passagens e combustível)';



CREATE TABLE IF NOT EXISTS "rh"."unions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "nome" "text" NOT NULL,
    "cnpj" "text",
    "endereco" "text",
    "contato" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."unions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."units" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "codigo" "text" NOT NULL,
    "nome" "text" NOT NULL,
    "descricao" "text",
    "parent_id" "uuid",
    "nivel_hierarquico" integer DEFAULT 1,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."units" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."user_dashboard_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "preferences" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "theme" character varying(50) DEFAULT 'light'::character varying,
    "language" character varying(10) DEFAULT 'pt-BR'::character varying,
    "timezone" character varying(50) DEFAULT 'America/Sao_Paulo'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."user_dashboard_preferences" OWNER TO "postgres";


COMMENT ON TABLE "rh"."user_dashboard_preferences" IS 'Preferências de interface e tema do usuário';



CREATE TABLE IF NOT EXISTS "rh"."user_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "setting_type" character varying(50) NOT NULL,
    "time_reminder_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "rh"."user_settings" OWNER TO "postgres";


COMMENT ON TABLE "rh"."user_settings" IS 'Configurações personalizadas dos usuários do sistema';



COMMENT ON COLUMN "rh"."user_settings"."setting_type" IS 'Tipo de configuração (ex: time_reminders, preferences)';



COMMENT ON COLUMN "rh"."user_settings"."time_reminder_settings" IS 'Configurações específicas de lembretes de ponto em formato JSON';



CREATE TABLE IF NOT EXISTS "rh"."vacation_periods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vacation_id" "uuid" NOT NULL,
    "data_inicio" "date" NOT NULL,
    "data_fim" "date" NOT NULL,
    "dias_ferias" integer NOT NULL,
    "dias_abono" integer DEFAULT 0,
    "periodo_numero" integer NOT NULL,
    "observacoes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "vacation_periods_dias_abono_check" CHECK (("dias_abono" >= 0)),
    CONSTRAINT "vacation_periods_dias_ferias_check" CHECK (("dias_ferias" > 0)),
    CONSTRAINT "vacation_periods_periodo_numero_check" CHECK ((("periodo_numero" >= 1) AND ("periodo_numero" <= 3)))
);


ALTER TABLE "rh"."vacation_periods" OWNER TO "postgres";


COMMENT ON TABLE "rh"."vacation_periods" IS 'Períodos individuais de férias fracionadas conforme legislação brasileira';



COMMENT ON COLUMN "rh"."vacation_periods"."periodo_numero" IS 'Número do período (1, 2 ou 3)';



CREATE TABLE IF NOT EXISTS "rh"."vr_va_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "tipo" character varying(10) NOT NULL,
    "valor_diario" numeric(10,2) DEFAULT 0 NOT NULL,
    "valor_mensal" numeric(10,2) DEFAULT 0 NOT NULL,
    "dias_uteis_mes" integer DEFAULT 22,
    "desconto_por_ausencia" boolean DEFAULT true,
    "desconto_por_ferias" boolean DEFAULT true,
    "desconto_por_licenca" boolean DEFAULT true,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "vr_va_configs_tipo_check" CHECK ((("tipo")::"text" = ANY ((ARRAY['VR'::character varying, 'VA'::character varying])::"text"[])))
);


ALTER TABLE "rh"."vr_va_configs" OWNER TO "postgres";


COMMENT ON TABLE "rh"."vr_va_configs" IS 'Configurações de Vale Refeição e Vale Alimentação';



CREATE OR REPLACE VIEW "rh"."vw_employee_benefit_assignments" AS
 SELECT "eba"."id",
    "e"."nome" AS "funcionario",
    "e"."cpf",
    "ea"."uf" AS "estado",
    "p"."nome" AS "cargo",
    "d"."nome" AS "departamento",
    "eba"."benefit_type",
    "eba"."criteria_type",
    "eba"."criteria_value",
        CASE
            WHEN (("eba"."benefit_type")::"text" = 'vr-va'::"text") THEN "vvc"."tipo"
            WHEN (("eba"."benefit_type")::"text" = 'transporte'::"text") THEN "tc"."tipo"
            ELSE NULL::character varying
        END AS "config_tipo",
        CASE
            WHEN (("eba"."benefit_type")::"text" = 'vr-va'::"text") THEN "vvc"."valor_diario"
            WHEN (("eba"."benefit_type")::"text" = 'transporte'::"text") THEN "tc"."valor_passagem"
            ELSE NULL::numeric
        END AS "config_valor",
    "eba"."data_inicio",
    "eba"."data_fim",
    "eba"."is_active"
   FROM (((((("rh"."employee_benefit_assignments" "eba"
     LEFT JOIN "rh"."employees" "e" ON (("eba"."employee_id" = "e"."id")))
     LEFT JOIN "rh"."employee_addresses" "ea" ON ((("e"."id" = "ea"."employee_id") AND ("ea"."tipo_endereco" = 'residencial'::"text"))))
     LEFT JOIN "rh"."positions" "p" ON (("e"."position_id" = "p"."id")))
     LEFT JOIN "core"."departments" "d" ON (("e"."department_id" = "d"."id")))
     LEFT JOIN "rh"."vr_va_configs" "vvc" ON (("eba"."vr_va_config_id" = "vvc"."id")))
     LEFT JOIN "rh"."transporte_configs" "tc" ON (("eba"."transporte_config_id" = "tc"."id")))
  WHERE ("eba"."is_active" = true)
  ORDER BY "e"."nome", "eba"."benefit_type";


ALTER VIEW "rh"."vw_employee_benefit_assignments" OWNER TO "postgres";


COMMENT ON VIEW "rh"."vw_employee_benefit_assignments" IS 'Visualização das vinculações ativas de funcionários a configurações de benefícios';



CREATE OR REPLACE VIEW "rh"."vw_periodic_exams_report" AS
 SELECT "pe"."id",
    "pe"."company_id",
    "c"."nome_fantasia" AS "empresa_nome",
    "pe"."employee_id",
    "e"."nome" AS "funcionario_nome",
    "e"."matricula",
    "pe"."tipo_exame",
    "pe"."data_agendada",
    "pe"."data_realizacao",
    "pe"."resultado",
    "pe"."arquivo_anexo",
    "pe"."status",
    "pe"."medico_responsavel",
    "pe"."observacoes",
    "pe"."created_at",
    "pe"."updated_at",
        CASE
            WHEN (("pe"."data_agendada" < CURRENT_DATE) AND ("pe"."status" = 'agendado'::"core"."status_geral")) THEN 'Vencido'::"text"
            WHEN (("pe"."data_agendada" <= (CURRENT_DATE + '30 days'::interval)) AND ("pe"."status" = 'agendado'::"core"."status_geral")) THEN 'Próximo do Vencimento'::"text"
            WHEN ("pe"."status" = 'realizado'::"core"."status_geral") THEN 'Realizado'::"text"
            ELSE 'Agendado'::"text"
        END AS "situacao",
        CASE
            WHEN (("pe"."data_agendada" < CURRENT_DATE) AND ("pe"."status" = 'agendado'::"core"."status_geral")) THEN (CURRENT_DATE - "pe"."data_agendada")
            WHEN (("pe"."data_agendada" > CURRENT_DATE) AND ("pe"."status" = 'agendado'::"core"."status_geral")) THEN ("pe"."data_agendada" - CURRENT_DATE)
            ELSE 0
        END AS "dias_para_vencimento"
   FROM (("rh"."periodic_exams" "pe"
     JOIN "core"."companies" "c" ON (("c"."id" = "pe"."company_id")))
     JOIN "rh"."employees" "e" ON (("e"."id" = "pe"."employee_id")));


ALTER VIEW "rh"."vw_periodic_exams_report" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "rh"."work_shift_patterns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "work_shift_id" "uuid" NOT NULL,
    "dia_ciclo" integer NOT NULL,
    "tipo_dia" character varying(20) NOT NULL,
    "hora_inicio" time without time zone,
    "hora_fim" time without time zone,
    "observacoes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "work_shift_patterns_tipo_dia_check" CHECK ((("tipo_dia")::"text" = ANY ((ARRAY['trabalho'::character varying, 'folga'::character varying])::"text"[])))
);


ALTER TABLE "rh"."work_shift_patterns" OWNER TO "postgres";


COMMENT ON TABLE "rh"."work_shift_patterns" IS 'Padrões de trabalho para escalas flexíveis';



CREATE TABLE IF NOT EXISTS "rh"."work_shift_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "nome" character varying(255) NOT NULL,
    "tipo_escala" "rh"."tipo_escala_enum" NOT NULL,
    "dias_trabalho" integer NOT NULL,
    "dias_folga" integer NOT NULL,
    "ciclo_dias" integer NOT NULL,
    "descricao" "text",
    "regras_clt" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "rh"."work_shift_templates" OWNER TO "postgres";


COMMENT ON TABLE "rh"."work_shift_templates" IS 'Templates de escalas de trabalho';



CREATE TABLE IF NOT EXISTS "rh"."work_shifts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid",
    "nome" "text" NOT NULL,
    "hora_inicio" time without time zone NOT NULL,
    "hora_fim" time without time zone NOT NULL,
    "dias_semana" integer[],
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tipo_escala" "rh"."tipo_escala_enum" DEFAULT 'fixa'::"rh"."tipo_escala_enum",
    "dias_trabalho" integer DEFAULT 5,
    "dias_folga" integer DEFAULT 2,
    "ciclo_dias" integer DEFAULT 7,
    "descricao" "text",
    "regras_clt" "jsonb" DEFAULT '{}'::"jsonb",
    "template_escala" boolean DEFAULT false
);


ALTER TABLE "rh"."work_shifts" OWNER TO "postgres";


ALTER TABLE ONLY "rh"."absence_types"
    ADD CONSTRAINT "absence_types_company_codigo_unique" UNIQUE ("company_id", "codigo");



ALTER TABLE ONLY "rh"."absence_types"
    ADD CONSTRAINT "absence_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."allowance_types"
    ADD CONSTRAINT "allowance_types_company_codigo_unique" UNIQUE ("company_id", "codigo");



ALTER TABLE ONLY "rh"."allowance_types"
    ADD CONSTRAINT "allowance_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."analytics_cache"
    ADD CONSTRAINT "analytics_cache_company_id_cache_key_period_start_period_en_key" UNIQUE ("company_id", "cache_key", "period_start", "period_end");



ALTER TABLE ONLY "rh"."analytics_cache"
    ADD CONSTRAINT "analytics_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."attendance_corrections"
    ADD CONSTRAINT "attendance_corrections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."beneficio_elegibilidade_cargos"
    ADD CONSTRAINT "beneficio_elegibilidade_cargos_elegibilidade_id_position_id_key" UNIQUE ("elegibilidade_id", "position_id");



ALTER TABLE ONLY "rh"."beneficio_elegibilidade_cargos"
    ADD CONSTRAINT "beneficio_elegibilidade_cargos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."beneficio_elegibilidade_departamentos"
    ADD CONSTRAINT "beneficio_elegibilidade_depar_elegibilidade_id_department_i_key" UNIQUE ("elegibilidade_id", "department_id");



ALTER TABLE ONLY "rh"."beneficio_elegibilidade_departamentos"
    ADD CONSTRAINT "beneficio_elegibilidade_departamentos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."beneficio_elegibilidade"
    ADD CONSTRAINT "beneficio_elegibilidade_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."beneficio_rateio_departamentos"
    ADD CONSTRAINT "beneficio_rateio_departamentos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."beneficio_rateio_departamentos"
    ADD CONSTRAINT "beneficio_rateio_departamentos_rateio_id_department_id_key" UNIQUE ("rateio_id", "department_id");



ALTER TABLE ONLY "rh"."beneficio_rateio_historico"
    ADD CONSTRAINT "beneficio_rateio_historico_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."beneficio_rateios"
    ADD CONSTRAINT "beneficio_rateios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."beneficio_tipos"
    ADD CONSTRAINT "beneficio_tipos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."beneficios_descontos_afastamento"
    ADD CONSTRAINT "beneficios_descontos_afastamento_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."beneficios_elegibilidade"
    ADD CONSTRAINT "beneficios_elegibilidade_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."beneficios_rateios"
    ADD CONSTRAINT "beneficios_rateios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."benefits"
    ADD CONSTRAINT "benefits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."candidate_upload_links"
    ADD CONSTRAINT "candidate_upload_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."candidate_upload_links"
    ADD CONSTRAINT "candidate_upload_links_token_key" UNIQUE ("token");



ALTER TABLE ONLY "rh"."candidates"
    ADD CONSTRAINT "candidates_cpf_key" UNIQUE ("cpf");



ALTER TABLE ONLY "rh"."candidates"
    ADD CONSTRAINT "candidates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."cid_codes"
    ADD CONSTRAINT "cid_codes_company_codigo_unique" UNIQUE ("company_id", "codigo");



ALTER TABLE ONLY "rh"."cid_codes"
    ADD CONSTRAINT "cid_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."compensation_requests"
    ADD CONSTRAINT "compensation_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."convenios_empresas"
    ADD CONSTRAINT "convenios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."convenios_planos"
    ADD CONSTRAINT "convenios_planos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."dashboard_alerts"
    ADD CONSTRAINT "dashboard_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."dashboard_configs"
    ADD CONSTRAINT "dashboard_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."deficiency_degrees"
    ADD CONSTRAINT "deficiency_degrees_company_codigo_unique" UNIQUE ("company_id", "codigo");



ALTER TABLE ONLY "rh"."deficiency_degrees"
    ADD CONSTRAINT "deficiency_degrees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."deficiency_types"
    ADD CONSTRAINT "deficiency_types_company_codigo_unique" UNIQUE ("company_id", "codigo");



ALTER TABLE ONLY "rh"."deficiency_types"
    ADD CONSTRAINT "deficiency_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."delay_reasons"
    ADD CONSTRAINT "delay_reasons_company_codigo_unique" UNIQUE ("company_id", "codigo");



ALTER TABLE ONLY "rh"."delay_reasons"
    ADD CONSTRAINT "delay_reasons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."dependent_types"
    ADD CONSTRAINT "dependent_types_company_codigo_unique" UNIQUE ("company_id", "codigo");



ALTER TABLE ONLY "rh"."dependent_types"
    ADD CONSTRAINT "dependent_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."employee_absences"
    ADD CONSTRAINT "employee_absences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."employee_addresses"
    ADD CONSTRAINT "employee_addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."employee_allowances"
    ADD CONSTRAINT "employee_allowances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."employee_bank_accounts"
    ADD CONSTRAINT "employee_bank_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."employee_benefit_assignments"
    ADD CONSTRAINT "employee_benefit_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."employee_benefit_assignments"
    ADD CONSTRAINT "employee_benefit_assignments_unique" UNIQUE ("employee_id", "benefit_type", "data_inicio");



ALTER TABLE ONLY "rh"."employee_benefits"
    ADD CONSTRAINT "employee_benefits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."employee_delay_records"
    ADD CONSTRAINT "employee_delay_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."employee_dependents"
    ADD CONSTRAINT "employee_dependents_cpf_unique" UNIQUE ("cpf");



ALTER TABLE ONLY "rh"."employee_dependents"
    ADD CONSTRAINT "employee_dependents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."employee_discounts"
    ADD CONSTRAINT "employee_discounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."employee_documents"
    ADD CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."employee_education"
    ADD CONSTRAINT "employee_education_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."employee_history"
    ADD CONSTRAINT "employee_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."employee_movement_types"
    ADD CONSTRAINT "employee_movement_types_codigo_key" UNIQUE ("codigo");



ALTER TABLE ONLY "rh"."employee_movement_types"
    ADD CONSTRAINT "employee_movement_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."employee_pcd_info"
    ADD CONSTRAINT "employee_pcd_info_employee_unique" UNIQUE ("employee_id");



ALTER TABLE ONLY "rh"."employee_pcd_info"
    ADD CONSTRAINT "employee_pcd_info_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."employee_shifts"
    ADD CONSTRAINT "employee_shifts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."employee_spouses"
    ADD CONSTRAINT "employee_spouses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."employee_tax_calculations"
    ADD CONSTRAINT "employee_tax_calculations_employee_month_unique" UNIQUE ("employee_id", "reference_month");



ALTER TABLE ONLY "rh"."employee_tax_calculations"
    ADD CONSTRAINT "employee_tax_calculations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."employees"
    ADD CONSTRAINT "employees_cpf_key" UNIQUE ("cpf");



ALTER TABLE ONLY "rh"."employees"
    ADD CONSTRAINT "employees_matricula_key" UNIQUE ("matricula");



ALTER TABLE ONLY "rh"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."employment_contracts"
    ADD CONSTRAINT "employment_contracts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."equipment_rental_approvals"
    ADD CONSTRAINT "equipment_rental_approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."equipment_rental_payments"
    ADD CONSTRAINT "equipment_rental_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."equipment_rentals"
    ADD CONSTRAINT "equipment_rentals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."esocial_batches"
    ADD CONSTRAINT "esocial_batches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."esocial_benefit_types"
    ADD CONSTRAINT "esocial_benefit_types_codigo_unique" UNIQUE ("company_id", "codigo");



ALTER TABLE ONLY "rh"."esocial_benefit_types"
    ADD CONSTRAINT "esocial_benefit_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."esocial_categories"
    ADD CONSTRAINT "esocial_categories_codigo_unique" UNIQUE ("company_id", "codigo");



ALTER TABLE ONLY "rh"."esocial_categories"
    ADD CONSTRAINT "esocial_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."esocial_events"
    ADD CONSTRAINT "esocial_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."esocial_integration_config"
    ADD CONSTRAINT "esocial_integration_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."esocial_leave_types"
    ADD CONSTRAINT "esocial_leave_types_codigo_unique" UNIQUE ("company_id", "codigo");



ALTER TABLE ONLY "rh"."esocial_leave_types"
    ADD CONSTRAINT "esocial_leave_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."esocial_naturezas_rubricas"
    ADD CONSTRAINT "esocial_naturezas_rubricas_codigo_unique" UNIQUE ("company_id", "codigo");



ALTER TABLE ONLY "rh"."esocial_naturezas_rubricas"
    ADD CONSTRAINT "esocial_naturezas_rubricas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."esocial_processed_events"
    ADD CONSTRAINT "esocial_processed_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."esocial_validation_history"
    ADD CONSTRAINT "esocial_validation_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."esocial_validations"
    ADD CONSTRAINT "esocial_validations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."fgts_config"
    ADD CONSTRAINT "fgts_config_company_codigo_unique" UNIQUE ("company_id", "codigo");



ALTER TABLE ONLY "rh"."fgts_config"
    ADD CONSTRAINT "fgts_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."funcionario_beneficios_historico"
    ADD CONSTRAINT "funcionario_beneficios_historico_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."funcionario_convenio_dependentes"
    ADD CONSTRAINT "funcionario_convenio_dependentes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."funcionario_convenios"
    ADD CONSTRAINT "funcionario_convenios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."funcionario_elegibilidade"
    ADD CONSTRAINT "funcionario_elegibilidade_employee_id_elegibilidade_id_key" UNIQUE ("employee_id", "elegibilidade_id");



ALTER TABLE ONLY "rh"."funcionario_elegibilidade"
    ADD CONSTRAINT "funcionario_elegibilidade_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."hiring_documents"
    ADD CONSTRAINT "hiring_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."holidays"
    ADD CONSTRAINT "holidays_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."income_statements"
    ADD CONSTRAINT "income_statements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."inss_brackets"
    ADD CONSTRAINT "inss_brackets_company_codigo_unique" UNIQUE ("company_id", "codigo");



ALTER TABLE ONLY "rh"."inss_brackets"
    ADD CONSTRAINT "inss_brackets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."irrf_brackets"
    ADD CONSTRAINT "irrf_brackets_company_codigo_unique" UNIQUE ("company_id", "codigo");



ALTER TABLE ONLY "rh"."irrf_brackets"
    ADD CONSTRAINT "irrf_brackets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."job_applications"
    ADD CONSTRAINT "job_applications_job_opening_id_candidate_id_key" UNIQUE ("job_opening_id", "candidate_id");



ALTER TABLE ONLY "rh"."job_applications"
    ADD CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."job_openings"
    ADD CONSTRAINT "job_openings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."job_requests"
    ADD CONSTRAINT "job_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."kinship_degrees"
    ADD CONSTRAINT "kinship_degrees_company_codigo_unique" UNIQUE ("company_id", "codigo");



ALTER TABLE ONLY "rh"."kinship_degrees"
    ADD CONSTRAINT "kinship_degrees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."medical_certificates"
    ADD CONSTRAINT "medical_certificates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."notification_history"
    ADD CONSTRAINT "notification_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."payroll_accounting_provisions"
    ADD CONSTRAINT "payroll_accounting_provisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."payroll_calculation_config"
    ADD CONSTRAINT "payroll_calculation_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."payroll_calculation_items"
    ADD CONSTRAINT "payroll_calculation_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."payroll_calculations"
    ADD CONSTRAINT "payroll_calculations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."payroll_cnab_files"
    ADD CONSTRAINT "payroll_cnab_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."payroll_config"
    ADD CONSTRAINT "payroll_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."payroll_consolidation_config"
    ADD CONSTRAINT "payroll_consolidation_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."payroll_consolidation_history"
    ADD CONSTRAINT "payroll_consolidation_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."payroll_event_validations"
    ADD CONSTRAINT "payroll_event_validations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."payroll_events"
    ADD CONSTRAINT "payroll_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."payroll_financial_config"
    ADD CONSTRAINT "payroll_financial_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."payroll_generated_titles"
    ADD CONSTRAINT "payroll_generated_titles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."payroll_items"
    ADD CONSTRAINT "payroll_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."payroll_payment_batches"
    ADD CONSTRAINT "payroll_payment_batches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."payroll"
    ADD CONSTRAINT "payroll_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."payroll_rubricas"
    ADD CONSTRAINT "payroll_rubricas_company_id_codigo_key" UNIQUE ("company_id", "codigo");



ALTER TABLE ONLY "rh"."payroll_rubricas"
    ADD CONSTRAINT "payroll_rubricas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."payroll_slips"
    ADD CONSTRAINT "payroll_slips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."payroll_tax_guides"
    ADD CONSTRAINT "payroll_tax_guides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."payroll_validation_history"
    ADD CONSTRAINT "payroll_validation_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."payroll_validations"
    ADD CONSTRAINT "payroll_validations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."periodic_exams"
    ADD CONSTRAINT "periodic_exams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."positions"
    ADD CONSTRAINT "positions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."report_history"
    ADD CONSTRAINT "report_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."report_templates"
    ADD CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."rubricas"
    ADD CONSTRAINT "rubricas_codigo_unique" UNIQUE ("company_id", "codigo");



ALTER TABLE ONLY "rh"."rubricas"
    ADD CONSTRAINT "rubricas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."schedule_entries"
    ADD CONSTRAINT "schedule_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."schedule_entries"
    ADD CONSTRAINT "schedule_entries_unique_employee_date" UNIQUE ("employee_id", "data");



ALTER TABLE ONLY "rh"."selection_processes"
    ADD CONSTRAINT "selection_processes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."selection_stages"
    ADD CONSTRAINT "selection_stages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."stage_results"
    ADD CONSTRAINT "stage_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."talent_pool"
    ADD CONSTRAINT "talent_pool_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."time_bank"
    ADD CONSTRAINT "time_bank_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."time_record_correction_control"
    ADD CONSTRAINT "time_record_correction_control_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."time_record_correction_control"
    ADD CONSTRAINT "time_record_correction_control_unique_company_year_month" UNIQUE ("company_id", "year", "month");



ALTER TABLE ONLY "rh"."time_records"
    ADD CONSTRAINT "time_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."transporte_configs"
    ADD CONSTRAINT "transporte_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."unions"
    ADD CONSTRAINT "unions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."units"
    ADD CONSTRAINT "units_codigo_unique" UNIQUE ("company_id", "codigo");



ALTER TABLE ONLY "rh"."units"
    ADD CONSTRAINT "units_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."user_dashboard_preferences"
    ADD CONSTRAINT "user_dashboard_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."user_dashboard_preferences"
    ADD CONSTRAINT "user_dashboard_preferences_user_id_company_id_key" UNIQUE ("user_id", "company_id");



ALTER TABLE ONLY "rh"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_setting_type_key" UNIQUE ("user_id", "setting_type");



ALTER TABLE ONLY "rh"."vacation_notifications"
    ADD CONSTRAINT "vacation_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."vacation_periods"
    ADD CONSTRAINT "vacation_periods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."vacations"
    ADD CONSTRAINT "vacations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."vr_va_configs"
    ADD CONSTRAINT "vr_va_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."work_shift_patterns"
    ADD CONSTRAINT "work_shift_patterns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."work_shift_templates"
    ADD CONSTRAINT "work_shift_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "rh"."work_shifts"
    ADD CONSTRAINT "work_shifts_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_absence_types_categoria" ON "rh"."absence_types" USING "btree" ("categoria", "is_active");



CREATE INDEX "idx_absence_types_company" ON "rh"."absence_types" USING "btree" ("company_id", "is_active");



CREATE INDEX "idx_allowance_types_company" ON "rh"."allowance_types" USING "btree" ("company_id", "is_active");



CREATE INDEX "idx_allowance_types_tipo" ON "rh"."allowance_types" USING "btree" ("tipo", "is_active");



CREATE INDEX "idx_analytics_cache_company_key" ON "rh"."analytics_cache" USING "btree" ("company_id", "cache_key");



CREATE INDEX "idx_analytics_cache_expires" ON "rh"."analytics_cache" USING "btree" ("expires_at");



CREATE INDEX "idx_analytics_cache_period" ON "rh"."analytics_cache" USING "btree" ("period_start", "period_end");



CREATE INDEX "idx_attendance_corrections_employee" ON "rh"."attendance_corrections" USING "btree" ("employee_id", "status");



CREATE INDEX "idx_beneficio_elegibilidade_beneficio_tipo_id" ON "rh"."beneficio_elegibilidade" USING "btree" ("beneficio_tipo_id");



CREATE INDEX "idx_beneficio_elegibilidade_cargos_elegibilidade_id" ON "rh"."beneficio_elegibilidade_cargos" USING "btree" ("elegibilidade_id");



CREATE INDEX "idx_beneficio_elegibilidade_cargos_position_id" ON "rh"."beneficio_elegibilidade_cargos" USING "btree" ("position_id");



CREATE INDEX "idx_beneficio_elegibilidade_company_id" ON "rh"."beneficio_elegibilidade" USING "btree" ("company_id");



CREATE INDEX "idx_beneficio_elegibilidade_departamentos_department_id" ON "rh"."beneficio_elegibilidade_departamentos" USING "btree" ("department_id");



CREATE INDEX "idx_beneficio_elegibilidade_departamentos_elegibilidade_id" ON "rh"."beneficio_elegibilidade_departamentos" USING "btree" ("elegibilidade_id");



CREATE INDEX "idx_beneficio_elegibilidade_tipo_regra" ON "rh"."beneficio_elegibilidade" USING "btree" ("tipo_regra");



CREATE INDEX "idx_beneficio_rateio_departamentos_department_id" ON "rh"."beneficio_rateio_departamentos" USING "btree" ("department_id");



CREATE INDEX "idx_beneficio_rateio_departamentos_rateio_id" ON "rh"."beneficio_rateio_departamentos" USING "btree" ("rateio_id");



CREATE INDEX "idx_beneficio_rateio_historico_data_alteracao" ON "rh"."beneficio_rateio_historico" USING "btree" ("data_alteracao");



CREATE INDEX "idx_beneficio_rateio_historico_department_id" ON "rh"."beneficio_rateio_historico" USING "btree" ("department_id");



CREATE INDEX "idx_beneficio_rateio_historico_rateio_id" ON "rh"."beneficio_rateio_historico" USING "btree" ("rateio_id");



CREATE INDEX "idx_beneficio_rateios_beneficio_tipo_id" ON "rh"."beneficio_rateios" USING "btree" ("beneficio_tipo_id");



CREATE INDEX "idx_beneficio_rateios_company_id" ON "rh"."beneficio_rateios" USING "btree" ("company_id");



CREATE INDEX "idx_beneficio_rateios_is_active" ON "rh"."beneficio_rateios" USING "btree" ("is_active");



CREATE INDEX "idx_beneficio_rateios_periodo" ON "rh"."beneficio_rateios" USING "btree" ("periodo_inicio", "periodo_fim");



CREATE INDEX "idx_beneficio_tipos_categoria" ON "rh"."beneficio_tipos" USING "btree" ("categoria");



CREATE INDEX "idx_beneficio_tipos_company_id" ON "rh"."beneficio_tipos" USING "btree" ("company_id");



CREATE INDEX "idx_beneficios_elegibilidade_benefit_id" ON "rh"."beneficios_elegibilidade" USING "btree" ("benefit_id");



CREATE INDEX "idx_beneficios_elegibilidade_company_id" ON "rh"."beneficios_elegibilidade" USING "btree" ("company_id");



CREATE INDEX "idx_beneficios_rateios_benefit_id" ON "rh"."beneficios_rateios" USING "btree" ("benefit_id");



CREATE INDEX "idx_beneficios_rateios_company_id" ON "rh"."beneficios_rateios" USING "btree" ("company_id");



CREATE INDEX "idx_candidates_company_status" ON "rh"."candidates" USING "btree" ("company_id", "status");



CREATE INDEX "idx_cid_codes_codigo" ON "rh"."cid_codes" USING "btree" ("codigo");



CREATE INDEX "idx_cid_codes_company" ON "rh"."cid_codes" USING "btree" ("company_id", "is_active");



CREATE INDEX "idx_convenios_company_id" ON "rh"."convenios_empresas" USING "btree" ("company_id");



CREATE INDEX "idx_convenios_empresas_company_id" ON "rh"."convenios_empresas" USING "btree" ("company_id");



CREATE INDEX "idx_convenios_planos_convenio_empresa_id" ON "rh"."convenios_planos" USING "btree" ("convenio_empresa_id");



CREATE INDEX "idx_convenios_tipo" ON "rh"."convenios_empresas" USING "btree" ("tipo");



CREATE INDEX "idx_dashboard_alerts_active" ON "rh"."dashboard_alerts" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_dashboard_alerts_company" ON "rh"."dashboard_alerts" USING "btree" ("company_id");



CREATE INDEX "idx_dashboard_alerts_unread" ON "rh"."dashboard_alerts" USING "btree" ("is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_dashboard_alerts_user" ON "rh"."dashboard_alerts" USING "btree" ("user_id");



CREATE INDEX "idx_dashboard_configs_company" ON "rh"."dashboard_configs" USING "btree" ("company_id");



CREATE INDEX "idx_dashboard_configs_public" ON "rh"."dashboard_configs" USING "btree" ("is_public") WHERE ("is_public" = true);



CREATE INDEX "idx_dashboard_configs_user" ON "rh"."dashboard_configs" USING "btree" ("user_id");



CREATE INDEX "idx_deficiency_degrees_company" ON "rh"."deficiency_degrees" USING "btree" ("company_id", "is_active");



CREATE INDEX "idx_deficiency_types_company" ON "rh"."deficiency_types" USING "btree" ("company_id", "is_active");



CREATE INDEX "idx_delay_reasons_categoria" ON "rh"."delay_reasons" USING "btree" ("categoria", "is_active");



CREATE INDEX "idx_delay_reasons_company" ON "rh"."delay_reasons" USING "btree" ("company_id", "is_active");



CREATE INDEX "idx_dependent_types_company" ON "rh"."dependent_types" USING "btree" ("company_id", "is_active");



CREATE INDEX "idx_employee_absences_company" ON "rh"."employee_absences" USING "btree" ("company_id", "is_active");



CREATE INDEX "idx_employee_absences_dates" ON "rh"."employee_absences" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_employee_absences_employee" ON "rh"."employee_absences" USING "btree" ("employee_id");



CREATE INDEX "idx_employee_absences_status" ON "rh"."employee_absences" USING "btree" ("status");



CREATE INDEX "idx_employee_addresses_company" ON "rh"."employee_addresses" USING "btree" ("company_id");



CREATE INDEX "idx_employee_addresses_employee" ON "rh"."employee_addresses" USING "btree" ("employee_id");



CREATE INDEX "idx_employee_allowances_company" ON "rh"."employee_allowances" USING "btree" ("company_id", "is_active");



CREATE INDEX "idx_employee_allowances_dates" ON "rh"."employee_allowances" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_employee_allowances_employee" ON "rh"."employee_allowances" USING "btree" ("employee_id");



CREATE INDEX "idx_employee_allowances_status" ON "rh"."employee_allowances" USING "btree" ("status");



CREATE INDEX "idx_employee_bank_accounts_company" ON "rh"."employee_bank_accounts" USING "btree" ("company_id");



CREATE INDEX "idx_employee_bank_accounts_employee" ON "rh"."employee_bank_accounts" USING "btree" ("employee_id");



CREATE INDEX "idx_employee_benefit_assignments_criteria" ON "rh"."employee_benefit_assignments" USING "btree" ("criteria_type", "criteria_value", "is_active");



CREATE INDEX "idx_employee_benefit_assignments_employee" ON "rh"."employee_benefit_assignments" USING "btree" ("employee_id", "benefit_type", "is_active");



CREATE INDEX "idx_employee_benefit_assignments_period" ON "rh"."employee_benefit_assignments" USING "btree" ("data_inicio", "data_fim", "is_active");



CREATE INDEX "idx_employee_delay_records_company" ON "rh"."employee_delay_records" USING "btree" ("company_id", "is_active");



CREATE INDEX "idx_employee_delay_records_date" ON "rh"."employee_delay_records" USING "btree" ("delay_date");



CREATE INDEX "idx_employee_delay_records_employee" ON "rh"."employee_delay_records" USING "btree" ("employee_id");



CREATE INDEX "idx_employee_delay_records_status" ON "rh"."employee_delay_records" USING "btree" ("status");



CREATE INDEX "idx_employee_dependents_company" ON "rh"."employee_dependents" USING "btree" ("company_id", "is_active");



CREATE INDEX "idx_employee_dependents_cpf" ON "rh"."employee_dependents" USING "btree" ("cpf");



CREATE INDEX "idx_employee_dependents_employee" ON "rh"."employee_dependents" USING "btree" ("employee_id");



CREATE INDEX "idx_employee_discounts_company_id" ON "rh"."employee_discounts" USING "btree" ("company_id");



CREATE INDEX "idx_employee_discounts_data_inicio" ON "rh"."employee_discounts" USING "btree" ("data_inicio");



CREATE INDEX "idx_employee_discounts_employee_id" ON "rh"."employee_discounts" USING "btree" ("employee_id");



CREATE INDEX "idx_employee_discounts_status" ON "rh"."employee_discounts" USING "btree" ("status");



CREATE INDEX "idx_employee_documents_company" ON "rh"."employee_documents" USING "btree" ("company_id");



CREATE INDEX "idx_employee_documents_employee" ON "rh"."employee_documents" USING "btree" ("employee_id");



CREATE INDEX "idx_employee_education_company" ON "rh"."employee_education" USING "btree" ("company_id");



CREATE INDEX "idx_employee_education_employee" ON "rh"."employee_education" USING "btree" ("employee_id");



CREATE INDEX "idx_employee_history_company_id" ON "rh"."employee_history" USING "btree" ("company_id");



CREATE INDEX "idx_employee_history_created_at" ON "rh"."employee_history" USING "btree" ("created_at");



CREATE INDEX "idx_employee_history_effective_date" ON "rh"."employee_history" USING "btree" ("effective_date");



CREATE INDEX "idx_employee_history_employee_id" ON "rh"."employee_history" USING "btree" ("employee_id");



CREATE INDEX "idx_employee_history_movement_type" ON "rh"."employee_history" USING "btree" ("movement_type_id");



CREATE INDEX "idx_employee_pcd_info_company" ON "rh"."employee_pcd_info" USING "btree" ("company_id", "is_active");



CREATE INDEX "idx_employee_pcd_info_employee" ON "rh"."employee_pcd_info" USING "btree" ("employee_id");



CREATE INDEX "idx_employee_shifts_employee_active" ON "rh"."employee_shifts" USING "btree" ("employee_id", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_employee_spouses_company" ON "rh"."employee_spouses" USING "btree" ("company_id");



CREATE INDEX "idx_employee_spouses_employee" ON "rh"."employee_spouses" USING "btree" ("employee_id");



CREATE INDEX "idx_employee_tax_calculations_company" ON "rh"."employee_tax_calculations" USING "btree" ("company_id", "is_active");



CREATE INDEX "idx_employee_tax_calculations_employee" ON "rh"."employee_tax_calculations" USING "btree" ("employee_id");



CREATE INDEX "idx_employee_tax_calculations_month" ON "rh"."employee_tax_calculations" USING "btree" ("reference_month");



CREATE INDEX "idx_employees_company_department" ON "rh"."employees" USING "btree" ("company_id", "department_id");



CREATE INDEX "idx_employees_company_position" ON "rh"."employees" USING "btree" ("company_id", "position_id");



CREATE INDEX "idx_employees_company_status" ON "rh"."employees" USING "btree" ("company_id", "status");



CREATE INDEX "idx_employees_cpf" ON "rh"."employees" USING "btree" ("cpf") WHERE ("cpf" IS NOT NULL);



CREATE INDEX "idx_employees_matricula" ON "rh"."employees" USING "btree" ("matricula") WHERE ("matricula" IS NOT NULL);



CREATE INDEX "idx_employees_nome_gin" ON "rh"."employees" USING "gin" ("to_tsvector"('"portuguese"'::"regconfig", "nome"));



CREATE INDEX "idx_equipment_rental_approvals_employee" ON "rh"."equipment_rental_approvals" USING "btree" ("employee_id", "status");



CREATE INDEX "idx_equipment_rental_approvals_equipment" ON "rh"."equipment_rental_approvals" USING "btree" ("equipment_rental_id");



CREATE INDEX "idx_equipment_rental_approvals_manager" ON "rh"."equipment_rental_approvals" USING "btree" ("aprovado_por", "status");



CREATE INDEX "idx_equipment_rental_approvals_period" ON "rh"."equipment_rental_approvals" USING "btree" ("ano_referencia", "mes_referencia");



CREATE INDEX "idx_equipment_rental_payments_company_id" ON "rh"."equipment_rental_payments" USING "btree" ("company_id");



CREATE INDEX "idx_equipment_rental_payments_equipment_rental_id" ON "rh"."equipment_rental_payments" USING "btree" ("equipment_rental_id");



CREATE INDEX "idx_equipment_rental_payments_payment_month" ON "rh"."equipment_rental_payments" USING "btree" ("payment_month");



CREATE INDEX "idx_equipment_rental_payments_payment_year" ON "rh"."equipment_rental_payments" USING "btree" ("payment_year");



CREATE INDEX "idx_equipment_rental_payments_status" ON "rh"."equipment_rental_payments" USING "btree" ("status");



CREATE INDEX "idx_equipment_rentals_company_id" ON "rh"."equipment_rentals" USING "btree" ("company_id");



CREATE INDEX "idx_equipment_rentals_employee_id" ON "rh"."equipment_rentals" USING "btree" ("employee_id");



CREATE INDEX "idx_equipment_rentals_equipment_type" ON "rh"."equipment_rentals" USING "btree" ("equipment_type");



CREATE INDEX "idx_equipment_rentals_start_date" ON "rh"."equipment_rentals" USING "btree" ("start_date");



CREATE INDEX "idx_equipment_rentals_status" ON "rh"."equipment_rentals" USING "btree" ("status");



CREATE INDEX "idx_esocial_batches_company" ON "rh"."esocial_batches" USING "btree" ("company_id");



CREATE INDEX "idx_esocial_batches_period" ON "rh"."esocial_batches" USING "btree" ("period");



CREATE INDEX "idx_esocial_benefit_types_company" ON "rh"."esocial_benefit_types" USING "btree" ("company_id");



CREATE INDEX "idx_esocial_categories_company" ON "rh"."esocial_categories" USING "btree" ("company_id");



CREATE INDEX "idx_esocial_integration_config_company" ON "rh"."esocial_integration_config" USING "btree" ("company_id");



CREATE INDEX "idx_esocial_leave_types_company" ON "rh"."esocial_leave_types" USING "btree" ("company_id");



CREATE INDEX "idx_esocial_naturezas_rubricas_company" ON "rh"."esocial_naturezas_rubricas" USING "btree" ("company_id");



CREATE INDEX "idx_esocial_processed_events_company" ON "rh"."esocial_processed_events" USING "btree" ("company_id");



CREATE INDEX "idx_esocial_processed_events_employee" ON "rh"."esocial_processed_events" USING "btree" ("employee_id");



CREATE INDEX "idx_esocial_processed_events_period" ON "rh"."esocial_processed_events" USING "btree" ("period");



CREATE INDEX "idx_esocial_processed_events_status" ON "rh"."esocial_processed_events" USING "btree" ("status");



CREATE INDEX "idx_esocial_validations_company" ON "rh"."esocial_validations" USING "btree" ("company_id");



CREATE INDEX "idx_fgts_config_company" ON "rh"."fgts_config" USING "btree" ("company_id", "is_active");



CREATE INDEX "idx_funcionario_beneficios_historico_employee_id" ON "rh"."funcionario_beneficios_historico" USING "btree" ("employee_id");



CREATE INDEX "idx_funcionario_beneficios_historico_mes_ano" ON "rh"."funcionario_beneficios_historico" USING "btree" ("mes_referencia", "ano_referencia");



CREATE INDEX "idx_funcionario_convenio_dependentes_employee_dependent_id" ON "rh"."funcionario_convenio_dependentes" USING "btree" ("employee_dependent_id");



CREATE INDEX "idx_funcionario_convenio_dependentes_funcionario_convenio_id" ON "rh"."funcionario_convenio_dependentes" USING "btree" ("funcionario_convenio_id");



CREATE INDEX "idx_funcionario_convenios_convenio_plano_id" ON "rh"."funcionario_convenios" USING "btree" ("convenio_plano_id");



CREATE INDEX "idx_funcionario_convenios_employee_id" ON "rh"."funcionario_convenios" USING "btree" ("employee_id");



CREATE INDEX "idx_funcionario_elegibilidade_elegibilidade_id" ON "rh"."funcionario_elegibilidade" USING "btree" ("elegibilidade_id");



CREATE INDEX "idx_funcionario_elegibilidade_employee_id" ON "rh"."funcionario_elegibilidade" USING "btree" ("employee_id");



CREATE INDEX "idx_funcionario_elegibilidade_is_elegivel" ON "rh"."funcionario_elegibilidade" USING "btree" ("is_elegivel");



CREATE INDEX "idx_hiring_documents_candidate" ON "rh"."hiring_documents" USING "btree" ("candidate_id");



CREATE INDEX "idx_hiring_documents_status" ON "rh"."hiring_documents" USING "btree" ("status");



CREATE INDEX "idx_holidays_company_data" ON "rh"."holidays" USING "btree" ("company_id", "data");



CREATE INDEX "idx_holidays_company_date_active" ON "rh"."holidays" USING "btree" ("company_id", "data", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_holidays_estado_cidade" ON "rh"."holidays" USING "btree" ("estado", "cidade");



CREATE INDEX "idx_holidays_tipo" ON "rh"."holidays" USING "btree" ("tipo");



CREATE INDEX "idx_income_statements_employee" ON "rh"."income_statements" USING "btree" ("employee_id", "ano_referencia");



CREATE INDEX "idx_inss_brackets_company" ON "rh"."inss_brackets" USING "btree" ("company_id", "is_active");



CREATE INDEX "idx_inss_brackets_salario" ON "rh"."inss_brackets" USING "btree" ("salario_minimo", "salario_maximo");



CREATE INDEX "idx_irrf_brackets_company" ON "rh"."irrf_brackets" USING "btree" ("company_id", "is_active");



CREATE INDEX "idx_irrf_brackets_salario" ON "rh"."irrf_brackets" USING "btree" ("salario_minimo", "salario_maximo");



CREATE INDEX "idx_job_applications_candidate" ON "rh"."job_applications" USING "btree" ("candidate_id");



CREATE INDEX "idx_job_applications_job_opening" ON "rh"."job_applications" USING "btree" ("job_opening_id");



CREATE INDEX "idx_job_openings_company_status" ON "rh"."job_openings" USING "btree" ("company_id", "status");



CREATE INDEX "idx_job_requests_company_status" ON "rh"."job_requests" USING "btree" ("company_id", "status");



CREATE INDEX "idx_kinship_degrees_company" ON "rh"."kinship_degrees" USING "btree" ("company_id", "is_active");



CREATE INDEX "idx_medical_certificates_employee_period" ON "rh"."medical_certificates" USING "btree" ("employee_id", "data_inicio", "data_fim") WHERE ("status" = 'aprovado'::"core"."status_aprovacao");



CREATE INDEX "idx_notification_history_sent_at" ON "rh"."notification_history" USING "btree" ("sent_at");



CREATE INDEX "idx_notification_history_type" ON "rh"."notification_history" USING "btree" ("notification_type");



CREATE INDEX "idx_notification_history_user_id" ON "rh"."notification_history" USING "btree" ("user_id");



CREATE INDEX "idx_payroll_accounting_provisions_calculation" ON "rh"."payroll_accounting_provisions" USING "btree" ("payroll_calculation_id");



CREATE INDEX "idx_payroll_accounting_provisions_company" ON "rh"."payroll_accounting_provisions" USING "btree" ("company_id");



CREATE INDEX "idx_payroll_accounting_provisions_status" ON "rh"."payroll_accounting_provisions" USING "btree" ("company_id", "status");



CREATE INDEX "idx_payroll_accounting_provisions_type" ON "rh"."payroll_accounting_provisions" USING "btree" ("company_id", "provision_type");



CREATE INDEX "idx_payroll_calculation_config_company" ON "rh"."payroll_calculation_config" USING "btree" ("company_id");



CREATE INDEX "idx_payroll_calculation_items_calculation" ON "rh"."payroll_calculation_items" USING "btree" ("calculation_id");



CREATE INDEX "idx_payroll_calculations_company_period" ON "rh"."payroll_calculations" USING "btree" ("company_id", "period");



CREATE INDEX "idx_payroll_calculations_employee_period" ON "rh"."payroll_calculations" USING "btree" ("employee_id", "period");



CREATE INDEX "idx_payroll_cnab_files_batch" ON "rh"."payroll_cnab_files" USING "btree" ("payment_batch_id");



CREATE INDEX "idx_payroll_cnab_files_company" ON "rh"."payroll_cnab_files" USING "btree" ("company_id");



CREATE INDEX "idx_payroll_cnab_files_status" ON "rh"."payroll_cnab_files" USING "btree" ("company_id", "status");



CREATE INDEX "idx_payroll_cnab_files_type" ON "rh"."payroll_cnab_files" USING "btree" ("company_id", "file_type");



CREATE INDEX "idx_payroll_consolidation_config_company" ON "rh"."payroll_consolidation_config" USING "btree" ("company_id");



CREATE INDEX "idx_payroll_consolidation_history_company_period" ON "rh"."payroll_consolidation_history" USING "btree" ("company_id", "period");



CREATE INDEX "idx_payroll_events_company_period" ON "rh"."payroll_events" USING "btree" ("company_id", "period");



CREATE INDEX "idx_payroll_events_created_at" ON "rh"."payroll_events" USING "btree" ("created_at");



CREATE INDEX "idx_payroll_events_employee_period" ON "rh"."payroll_events" USING "btree" ("employee_id", "period");



CREATE INDEX "idx_payroll_events_type_status" ON "rh"."payroll_events" USING "btree" ("event_type", "status");



CREATE INDEX "idx_payroll_financial_config_active" ON "rh"."payroll_financial_config" USING "btree" ("company_id", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_payroll_financial_config_company" ON "rh"."payroll_financial_config" USING "btree" ("company_id");



CREATE INDEX "idx_payroll_generated_titles_calculation" ON "rh"."payroll_generated_titles" USING "btree" ("payroll_calculation_id");



CREATE INDEX "idx_payroll_generated_titles_company" ON "rh"."payroll_generated_titles" USING "btree" ("company_id");



CREATE INDEX "idx_payroll_generated_titles_due_date" ON "rh"."payroll_generated_titles" USING "btree" ("due_date");



CREATE INDEX "idx_payroll_generated_titles_employee" ON "rh"."payroll_generated_titles" USING "btree" ("employee_id");



CREATE INDEX "idx_payroll_generated_titles_status" ON "rh"."payroll_generated_titles" USING "btree" ("company_id", "status");



CREATE INDEX "idx_payroll_payment_batches_calculation" ON "rh"."payroll_payment_batches" USING "btree" ("payroll_calculation_id");



CREATE INDEX "idx_payroll_payment_batches_company" ON "rh"."payroll_payment_batches" USING "btree" ("company_id");



CREATE INDEX "idx_payroll_payment_batches_created" ON "rh"."payroll_payment_batches" USING "btree" ("created_at");



CREATE INDEX "idx_payroll_payment_batches_status" ON "rh"."payroll_payment_batches" USING "btree" ("company_id", "status");



CREATE INDEX "idx_payroll_rubricas_codigo" ON "rh"."payroll_rubricas" USING "btree" ("company_id", "codigo");



CREATE INDEX "idx_payroll_rubricas_company" ON "rh"."payroll_rubricas" USING "btree" ("company_id");



CREATE INDEX "idx_payroll_slips_employee" ON "rh"."payroll_slips" USING "btree" ("employee_id", "ano_referencia", "mes_referencia");



CREATE INDEX "idx_payroll_tax_guides_calculation" ON "rh"."payroll_tax_guides" USING "btree" ("payroll_calculation_id");



CREATE INDEX "idx_payroll_tax_guides_company" ON "rh"."payroll_tax_guides" USING "btree" ("company_id");



CREATE INDEX "idx_payroll_tax_guides_due_date" ON "rh"."payroll_tax_guides" USING "btree" ("due_date");



CREATE INDEX "idx_payroll_tax_guides_status" ON "rh"."payroll_tax_guides" USING "btree" ("company_id", "status");



CREATE INDEX "idx_payroll_tax_guides_type" ON "rh"."payroll_tax_guides" USING "btree" ("company_id", "guide_type");



CREATE INDEX "idx_payroll_validations_company" ON "rh"."payroll_validations" USING "btree" ("company_id");



CREATE INDEX "idx_periodic_exams_company_id" ON "rh"."periodic_exams" USING "btree" ("company_id");



CREATE INDEX "idx_periodic_exams_data_agendada" ON "rh"."periodic_exams" USING "btree" ("data_agendada");



CREATE INDEX "idx_periodic_exams_employee_id" ON "rh"."periodic_exams" USING "btree" ("employee_id");



CREATE INDEX "idx_periodic_exams_status" ON "rh"."periodic_exams" USING "btree" ("status");



CREATE INDEX "idx_periodic_exams_tipo_exame" ON "rh"."periodic_exams" USING "btree" ("tipo_exame");



CREATE INDEX "idx_report_history_company" ON "rh"."report_history" USING "btree" ("company_id");



CREATE INDEX "idx_report_history_generated" ON "rh"."report_history" USING "btree" ("generated_at");



CREATE INDEX "idx_report_history_template" ON "rh"."report_history" USING "btree" ("report_template_id");



CREATE INDEX "idx_report_history_user" ON "rh"."report_history" USING "btree" ("user_id");



CREATE INDEX "idx_report_templates_active" ON "rh"."report_templates" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_report_templates_category" ON "rh"."report_templates" USING "btree" ("category");



CREATE INDEX "idx_report_templates_company" ON "rh"."report_templates" USING "btree" ("company_id");



CREATE INDEX "idx_rh_employees_company" ON "rh"."employees" USING "btree" ("company_id");



CREATE INDEX "idx_rh_employees_cost_center" ON "rh"."employees" USING "btree" ("cost_center_id");



CREATE INDEX "idx_rh_employees_cpf" ON "rh"."employees" USING "btree" ("cpf");



CREATE INDEX "idx_rh_employees_matricula" ON "rh"."employees" USING "btree" ("matricula");



CREATE INDEX "idx_rh_employees_project" ON "rh"."employees" USING "btree" ("project_id");



CREATE INDEX "idx_rh_employees_status" ON "rh"."employees" USING "btree" ("status");



CREATE INDEX "idx_rh_payroll_company" ON "rh"."payroll" USING "btree" ("company_id");



CREATE INDEX "idx_rh_payroll_competencia" ON "rh"."payroll" USING "btree" ("competencia");



CREATE INDEX "idx_rh_time_bank_company" ON "rh"."time_bank" USING "btree" ("company_id");



CREATE INDEX "idx_rh_time_bank_employee" ON "rh"."time_bank" USING "btree" ("employee_id");



CREATE INDEX "idx_rh_time_records_company" ON "rh"."time_records" USING "btree" ("company_id");



CREATE INDEX "idx_rh_time_records_data" ON "rh"."time_records" USING "btree" ("data");



CREATE INDEX "idx_rh_time_records_employee" ON "rh"."time_records" USING "btree" ("employee_id");



CREATE INDEX "idx_rubricas_company" ON "rh"."rubricas" USING "btree" ("company_id");



CREATE INDEX "idx_rubricas_natureza" ON "rh"."rubricas" USING "btree" ("natureza_esocial_id");



CREATE INDEX "idx_rubricas_tipo" ON "rh"."rubricas" USING "btree" ("tipo");



CREATE INDEX "idx_schedule_entries_company" ON "rh"."schedule_entries" USING "btree" ("company_id");



CREATE INDEX "idx_schedule_entries_data" ON "rh"."schedule_entries" USING "btree" ("data");



CREATE INDEX "idx_schedule_entries_employee" ON "rh"."schedule_entries" USING "btree" ("employee_id");



CREATE INDEX "idx_schedule_entries_employee_data" ON "rh"."schedule_entries" USING "btree" ("employee_id", "data");



CREATE INDEX "idx_schedule_entries_tipo" ON "rh"."schedule_entries" USING "btree" ("tipo");



CREATE INDEX "idx_stage_results_application" ON "rh"."stage_results" USING "btree" ("job_application_id");



CREATE INDEX "idx_time_record_correction_control_company" ON "rh"."time_record_correction_control" USING "btree" ("company_id");



CREATE INDEX "idx_time_record_correction_control_year_month" ON "rh"."time_record_correction_control" USING "btree" ("year", "month");



CREATE INDEX "idx_time_records_adicional_final_semana" ON "rh"."time_records" USING "btree" ("valor_adicional_final_semana") WHERE ("valor_adicional_final_semana" > (0)::numeric);



CREATE INDEX "idx_time_records_adicional_noturno" ON "rh"."time_records" USING "btree" ("valor_adicional_noturno") WHERE ("valor_adicional_noturno" > (0)::numeric);



CREATE INDEX "idx_time_records_horas_final_semana" ON "rh"."time_records" USING "btree" ("horas_final_semana") WHERE ("horas_final_semana" > (0)::numeric);



CREATE INDEX "idx_time_records_horas_noturnas" ON "rh"."time_records" USING "btree" ("horas_noturnas") WHERE ("horas_noturnas" > (0)::numeric);



CREATE INDEX "idx_transporte_configs_company_id" ON "rh"."transporte_configs" USING "btree" ("company_id");



CREATE INDEX "idx_units_company" ON "rh"."units" USING "btree" ("company_id");



CREATE INDEX "idx_units_nivel" ON "rh"."units" USING "btree" ("nivel_hierarquico");



CREATE INDEX "idx_units_parent" ON "rh"."units" USING "btree" ("parent_id");



CREATE INDEX "idx_upload_links_token" ON "rh"."candidate_upload_links" USING "btree" ("token");



CREATE INDEX "idx_user_preferences_user_company" ON "rh"."user_dashboard_preferences" USING "btree" ("user_id", "company_id");



CREATE INDEX "idx_user_settings_type" ON "rh"."user_settings" USING "btree" ("setting_type");



CREATE INDEX "idx_user_settings_user_id" ON "rh"."user_settings" USING "btree" ("user_id");



CREATE INDEX "idx_vacation_notifications_active" ON "rh"."vacation_notifications" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_vacation_notifications_due_date" ON "rh"."vacation_notifications" USING "btree" ("due_date") WHERE ("due_date" IS NOT NULL);



CREATE INDEX "idx_vacation_notifications_employee_id" ON "rh"."vacation_notifications" USING "btree" ("employee_id");



CREATE INDEX "idx_vacation_notifications_priority" ON "rh"."vacation_notifications" USING "btree" ("priority");



CREATE INDEX "idx_vacation_notifications_type" ON "rh"."vacation_notifications" USING "btree" ("notification_type");



CREATE INDEX "idx_vacation_periods_dates" ON "rh"."vacation_periods" USING "btree" ("data_inicio", "data_fim");



CREATE INDEX "idx_vacation_periods_vacation_id" ON "rh"."vacation_periods" USING "btree" ("vacation_id");



CREATE INDEX "idx_vacations_employee_period" ON "rh"."vacations" USING "btree" ("employee_id", "data_inicio", "data_fim") WHERE ("status" = 'aprovado'::"core"."status_aprovacao");



CREATE INDEX "idx_vacations_fracionamento" ON "rh"."vacations" USING "btree" ("tipo_fracionamento", "total_periodos");



CREATE INDEX "idx_vr_va_configs_company_id" ON "rh"."vr_va_configs" USING "btree" ("company_id");



CREATE INDEX "idx_work_shift_patterns_work_shift_id" ON "rh"."work_shift_patterns" USING "btree" ("work_shift_id");



CREATE INDEX "idx_work_shift_templates_company_id" ON "rh"."work_shift_templates" USING "btree" ("company_id");



CREATE INDEX "idx_work_shift_templates_tipo_escala" ON "rh"."work_shift_templates" USING "btree" ("tipo_escala");



CREATE INDEX "idx_work_shifts_tipo_escala" ON "rh"."work_shifts" USING "btree" ("tipo_escala");



CREATE INDEX "idx_work_shifts_tipo_escala_active" ON "rh"."work_shifts" USING "btree" ("tipo_escala", "is_active") WHERE ("is_active" = true);



CREATE OR REPLACE TRIGGER "audit_dashboard_alerts" AFTER INSERT OR DELETE OR UPDATE ON "rh"."dashboard_alerts" FOR EACH ROW EXECUTE FUNCTION "core"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_dashboard_configs" AFTER INSERT OR DELETE OR UPDATE ON "rh"."dashboard_configs" FOR EACH ROW EXECUTE FUNCTION "core"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_employees" AFTER INSERT OR DELETE OR UPDATE ON "rh"."employees" FOR EACH ROW EXECUTE FUNCTION "core"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_payroll" AFTER INSERT OR DELETE OR UPDATE ON "rh"."payroll" FOR EACH ROW EXECUTE FUNCTION "core"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_payroll_accounting_provisions" AFTER INSERT OR DELETE OR UPDATE ON "rh"."payroll_accounting_provisions" FOR EACH ROW EXECUTE FUNCTION "core"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_payroll_cnab_files" AFTER INSERT OR DELETE OR UPDATE ON "rh"."payroll_cnab_files" FOR EACH ROW EXECUTE FUNCTION "core"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_payroll_financial_config" AFTER INSERT OR DELETE OR UPDATE ON "rh"."payroll_financial_config" FOR EACH ROW EXECUTE FUNCTION "core"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_payroll_generated_titles" AFTER INSERT OR DELETE OR UPDATE ON "rh"."payroll_generated_titles" FOR EACH ROW EXECUTE FUNCTION "core"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_payroll_payment_batches" AFTER INSERT OR DELETE OR UPDATE ON "rh"."payroll_payment_batches" FOR EACH ROW EXECUTE FUNCTION "core"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_payroll_tax_guides" AFTER INSERT OR DELETE OR UPDATE ON "rh"."payroll_tax_guides" FOR EACH ROW EXECUTE FUNCTION "core"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_report_history" AFTER INSERT OR DELETE OR UPDATE ON "rh"."report_history" FOR EACH ROW EXECUTE FUNCTION "core"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_report_templates" AFTER INSERT OR DELETE OR UPDATE ON "rh"."report_templates" FOR EACH ROW EXECUTE FUNCTION "core"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_time_record_correction_control" AFTER INSERT OR DELETE OR UPDATE ON "rh"."time_record_correction_control" FOR EACH ROW EXECUTE FUNCTION "core"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_time_records" AFTER INSERT OR DELETE OR UPDATE ON "rh"."time_records" FOR EACH ROW EXECUTE FUNCTION "core"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "audit_user_dashboard_preferences" AFTER INSERT OR DELETE OR UPDATE ON "rh"."user_dashboard_preferences" FOR EACH ROW EXECUTE FUNCTION "core"."audit_trigger_function"();



CREATE OR REPLACE TRIGGER "generate_equipment_rental_payments" AFTER INSERT OR UPDATE ON "rh"."equipment_rentals" FOR EACH ROW EXECUTE FUNCTION "core"."generate_monthly_payments"();



CREATE OR REPLACE TRIGGER "trigger_atualizar_banco_horas" AFTER INSERT ON "rh"."time_records" FOR EACH ROW EXECUTE FUNCTION "rh"."atualizar_banco_horas"();



CREATE OR REPLACE TRIGGER "trigger_calcular_adicionais" BEFORE INSERT OR UPDATE ON "rh"."time_records" FOR EACH ROW EXECUTE FUNCTION "rh"."calcular_adicionais_automaticos"();



CREATE OR REPLACE TRIGGER "trigger_historico_rateio_departamentos" AFTER UPDATE ON "rh"."beneficio_rateio_departamentos" FOR EACH ROW EXECUTE FUNCTION "rh"."trigger_historico_rateio"();



CREATE OR REPLACE TRIGGER "trigger_limpar_notificacoes_ferias" AFTER UPDATE ON "rh"."vacations" FOR EACH ROW EXECUTE FUNCTION "rh"."limpar_notificacoes_apos_ferias"();



CREATE OR REPLACE TRIGGER "trigger_log_employee_admission" AFTER INSERT ON "rh"."employees" FOR EACH ROW EXECUTE FUNCTION "rh"."log_employee_admission"();



CREATE OR REPLACE TRIGGER "trigger_log_employee_changes" AFTER UPDATE ON "rh"."employees" FOR EACH ROW EXECUTE FUNCTION "rh"."log_employee_changes"();



CREATE OR REPLACE TRIGGER "trigger_set_employee_matricula" BEFORE INSERT ON "rh"."employees" FOR EACH ROW EXECUTE FUNCTION "rh"."set_employee_matricula"();



CREATE OR REPLACE TRIGGER "trigger_update_time_record_correction_control_updated_at" BEFORE UPDATE ON "rh"."time_record_correction_control" FOR EACH ROW EXECUTE FUNCTION "rh"."update_time_record_correction_control_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_vacation_periods_updated_at" BEFORE UPDATE ON "rh"."vacation_periods" FOR EACH ROW EXECUTE FUNCTION "rh"."update_vacation_periods_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_validar_ponto" BEFORE INSERT ON "rh"."time_records" FOR EACH ROW EXECUTE FUNCTION "rh"."validar_ponto_automatico"();



CREATE OR REPLACE TRIGGER "trigger_validate_clt_compliance" BEFORE INSERT OR UPDATE ON "rh"."work_shifts" FOR EACH ROW EXECUTE FUNCTION "rh"."trigger_validate_clt_compliance"();



CREATE OR REPLACE TRIGGER "trigger_verificar_ferias" BEFORE INSERT ON "rh"."vacations" FOR EACH ROW EXECUTE FUNCTION "rh"."verificar_ferias_solicitadas"();



CREATE OR REPLACE TRIGGER "update_candidates_updated_at" BEFORE UPDATE ON "rh"."candidates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_equipment_rental_payments_updated_at" BEFORE UPDATE ON "rh"."equipment_rental_payments" FOR EACH ROW EXECUTE FUNCTION "core"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_equipment_rentals_updated_at" BEFORE UPDATE ON "rh"."equipment_rentals" FOR EACH ROW EXECUTE FUNCTION "core"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_hiring_documents_updated_at" BEFORE UPDATE ON "rh"."hiring_documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_job_applications_updated_at" BEFORE UPDATE ON "rh"."job_applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_job_openings_updated_at" BEFORE UPDATE ON "rh"."job_openings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_job_requests_updated_at" BEFORE UPDATE ON "rh"."job_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_periodic_exams_updated_at" BEFORE UPDATE ON "rh"."periodic_exams" FOR EACH ROW EXECUTE FUNCTION "rh"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_settings_updated_at" BEFORE UPDATE ON "rh"."user_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "validate_discount_installment_trigger" BEFORE INSERT OR UPDATE ON "rh"."employee_discounts" FOR EACH ROW EXECUTE FUNCTION "rh"."validate_discount_installment"();



ALTER TABLE ONLY "rh"."absence_types"
    ADD CONSTRAINT "absence_types_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."absence_types"
    ADD CONSTRAINT "absence_types_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."absence_types"
    ADD CONSTRAINT "absence_types_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."allowance_types"
    ADD CONSTRAINT "allowance_types_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."allowance_types"
    ADD CONSTRAINT "allowance_types_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."allowance_types"
    ADD CONSTRAINT "allowance_types_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."analytics_cache"
    ADD CONSTRAINT "analytics_cache_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."attendance_corrections"
    ADD CONSTRAINT "attendance_corrections_aprovado_por_fkey" FOREIGN KEY ("aprovado_por") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."attendance_corrections"
    ADD CONSTRAINT "attendance_corrections_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."attendance_corrections"
    ADD CONSTRAINT "attendance_corrections_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."attendance_corrections"
    ADD CONSTRAINT "attendance_corrections_time_record_id_fkey" FOREIGN KEY ("time_record_id") REFERENCES "rh"."time_records"("id");



ALTER TABLE ONLY "rh"."beneficio_elegibilidade"
    ADD CONSTRAINT "beneficio_elegibilidade_beneficio_tipo_id_fkey" FOREIGN KEY ("beneficio_tipo_id") REFERENCES "rh"."beneficio_tipos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."beneficio_elegibilidade_cargos"
    ADD CONSTRAINT "beneficio_elegibilidade_cargos_elegibilidade_id_fkey" FOREIGN KEY ("elegibilidade_id") REFERENCES "rh"."beneficio_elegibilidade"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."beneficio_elegibilidade_cargos"
    ADD CONSTRAINT "beneficio_elegibilidade_cargos_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "rh"."positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."beneficio_elegibilidade"
    ADD CONSTRAINT "beneficio_elegibilidade_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."beneficio_elegibilidade_departamentos"
    ADD CONSTRAINT "beneficio_elegibilidade_departamentos_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "core"."departments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."beneficio_elegibilidade_departamentos"
    ADD CONSTRAINT "beneficio_elegibilidade_departamentos_elegibilidade_id_fkey" FOREIGN KEY ("elegibilidade_id") REFERENCES "rh"."beneficio_elegibilidade"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."beneficio_rateio_departamentos"
    ADD CONSTRAINT "beneficio_rateio_departamentos_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "core"."departments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."beneficio_rateio_departamentos"
    ADD CONSTRAINT "beneficio_rateio_departamentos_rateio_id_fkey" FOREIGN KEY ("rateio_id") REFERENCES "rh"."beneficio_rateios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."beneficio_rateio_historico"
    ADD CONSTRAINT "beneficio_rateio_historico_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "core"."departments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."beneficio_rateio_historico"
    ADD CONSTRAINT "beneficio_rateio_historico_rateio_id_fkey" FOREIGN KEY ("rateio_id") REFERENCES "rh"."beneficio_rateios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."beneficio_rateio_historico"
    ADD CONSTRAINT "beneficio_rateio_historico_usuario_alteracao_fkey" FOREIGN KEY ("usuario_alteracao") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "rh"."beneficio_rateios"
    ADD CONSTRAINT "beneficio_rateios_beneficio_tipo_id_fkey" FOREIGN KEY ("beneficio_tipo_id") REFERENCES "rh"."beneficio_tipos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."beneficio_rateios"
    ADD CONSTRAINT "beneficio_rateios_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."beneficio_tipos"
    ADD CONSTRAINT "beneficio_tipos_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."beneficios_descontos_afastamento"
    ADD CONSTRAINT "beneficios_descontos_afastamento_benefit_id_fkey" FOREIGN KEY ("benefit_id") REFERENCES "rh"."benefits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."beneficios_descontos_afastamento"
    ADD CONSTRAINT "beneficios_descontos_afastamento_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."beneficios_elegibilidade"
    ADD CONSTRAINT "beneficios_elegibilidade_benefit_id_fkey" FOREIGN KEY ("benefit_id") REFERENCES "rh"."benefits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."beneficios_elegibilidade"
    ADD CONSTRAINT "beneficios_elegibilidade_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."beneficios_elegibilidade"
    ADD CONSTRAINT "beneficios_elegibilidade_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "core"."departments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."beneficios_elegibilidade"
    ADD CONSTRAINT "beneficios_elegibilidade_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."beneficios_elegibilidade"
    ADD CONSTRAINT "beneficios_elegibilidade_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "rh"."positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."beneficios_rateios"
    ADD CONSTRAINT "beneficios_rateios_benefit_id_fkey" FOREIGN KEY ("benefit_id") REFERENCES "rh"."benefits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."beneficios_rateios"
    ADD CONSTRAINT "beneficios_rateios_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."beneficios_rateios"
    ADD CONSTRAINT "beneficios_rateios_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "core"."departments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."benefits"
    ADD CONSTRAINT "benefits_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."candidate_upload_links"
    ADD CONSTRAINT "candidate_upload_links_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "rh"."candidates"("id");



ALTER TABLE ONLY "rh"."candidate_upload_links"
    ADD CONSTRAINT "candidate_upload_links_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."candidate_upload_links"
    ADD CONSTRAINT "candidate_upload_links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."candidate_upload_links"
    ADD CONSTRAINT "candidate_upload_links_job_application_id_fkey" FOREIGN KEY ("job_application_id") REFERENCES "rh"."job_applications"("id");



ALTER TABLE ONLY "rh"."candidates"
    ADD CONSTRAINT "candidates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."cid_codes"
    ADD CONSTRAINT "cid_codes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."cid_codes"
    ADD CONSTRAINT "cid_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."cid_codes"
    ADD CONSTRAINT "cid_codes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."compensation_requests"
    ADD CONSTRAINT "compensation_requests_aprovado_por_fkey" FOREIGN KEY ("aprovado_por") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."compensation_requests"
    ADD CONSTRAINT "compensation_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."compensation_requests"
    ADD CONSTRAINT "compensation_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."convenios_empresas"
    ADD CONSTRAINT "convenios_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."convenios_planos"
    ADD CONSTRAINT "convenios_planos_convenio_empresa_id_fkey" FOREIGN KEY ("convenio_empresa_id") REFERENCES "rh"."convenios_empresas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."dashboard_alerts"
    ADD CONSTRAINT "dashboard_alerts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."dashboard_alerts"
    ADD CONSTRAINT "dashboard_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."dashboard_configs"
    ADD CONSTRAINT "dashboard_configs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."dashboard_configs"
    ADD CONSTRAINT "dashboard_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."deficiency_degrees"
    ADD CONSTRAINT "deficiency_degrees_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."deficiency_degrees"
    ADD CONSTRAINT "deficiency_degrees_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."deficiency_degrees"
    ADD CONSTRAINT "deficiency_degrees_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."deficiency_types"
    ADD CONSTRAINT "deficiency_types_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."deficiency_types"
    ADD CONSTRAINT "deficiency_types_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."deficiency_types"
    ADD CONSTRAINT "deficiency_types_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."delay_reasons"
    ADD CONSTRAINT "delay_reasons_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."delay_reasons"
    ADD CONSTRAINT "delay_reasons_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."delay_reasons"
    ADD CONSTRAINT "delay_reasons_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."dependent_types"
    ADD CONSTRAINT "dependent_types_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."dependent_types"
    ADD CONSTRAINT "dependent_types_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."dependent_types"
    ADD CONSTRAINT "dependent_types_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_absences"
    ADD CONSTRAINT "employee_absences_absence_type_id_fkey" FOREIGN KEY ("absence_type_id") REFERENCES "rh"."absence_types"("id");



ALTER TABLE ONLY "rh"."employee_absences"
    ADD CONSTRAINT "employee_absences_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_absences"
    ADD CONSTRAINT "employee_absences_cid_code_id_fkey" FOREIGN KEY ("cid_code_id") REFERENCES "rh"."cid_codes"("id");



ALTER TABLE ONLY "rh"."employee_absences"
    ADD CONSTRAINT "employee_absences_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_absences"
    ADD CONSTRAINT "employee_absences_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_absences"
    ADD CONSTRAINT "employee_absences_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_absences"
    ADD CONSTRAINT "employee_absences_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_addresses"
    ADD CONSTRAINT "employee_addresses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_addresses"
    ADD CONSTRAINT "employee_addresses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_addresses"
    ADD CONSTRAINT "employee_addresses_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_addresses"
    ADD CONSTRAINT "employee_addresses_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_allowances"
    ADD CONSTRAINT "employee_allowances_allowance_type_id_fkey" FOREIGN KEY ("allowance_type_id") REFERENCES "rh"."allowance_types"("id");



ALTER TABLE ONLY "rh"."employee_allowances"
    ADD CONSTRAINT "employee_allowances_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_allowances"
    ADD CONSTRAINT "employee_allowances_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_allowances"
    ADD CONSTRAINT "employee_allowances_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_allowances"
    ADD CONSTRAINT "employee_allowances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_allowances"
    ADD CONSTRAINT "employee_allowances_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_bank_accounts"
    ADD CONSTRAINT "employee_bank_accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_bank_accounts"
    ADD CONSTRAINT "employee_bank_accounts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_bank_accounts"
    ADD CONSTRAINT "employee_bank_accounts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_bank_accounts"
    ADD CONSTRAINT "employee_bank_accounts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_benefit_assignments"
    ADD CONSTRAINT "employee_benefit_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_benefit_assignments"
    ADD CONSTRAINT "employee_benefit_assignments_transporte_config_id_fkey" FOREIGN KEY ("transporte_config_id") REFERENCES "rh"."transporte_configs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_benefit_assignments"
    ADD CONSTRAINT "employee_benefit_assignments_vr_va_config_id_fkey" FOREIGN KEY ("vr_va_config_id") REFERENCES "rh"."vr_va_configs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_benefits"
    ADD CONSTRAINT "employee_benefits_benefit_id_fkey" FOREIGN KEY ("benefit_id") REFERENCES "rh"."benefits"("id");



ALTER TABLE ONLY "rh"."employee_benefits"
    ADD CONSTRAINT "employee_benefits_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."employee_benefits"
    ADD CONSTRAINT "employee_benefits_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."employee_delay_records"
    ADD CONSTRAINT "employee_delay_records_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_delay_records"
    ADD CONSTRAINT "employee_delay_records_cid_code_id_fkey" FOREIGN KEY ("cid_code_id") REFERENCES "rh"."cid_codes"("id");



ALTER TABLE ONLY "rh"."employee_delay_records"
    ADD CONSTRAINT "employee_delay_records_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_delay_records"
    ADD CONSTRAINT "employee_delay_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_delay_records"
    ADD CONSTRAINT "employee_delay_records_delay_reason_id_fkey" FOREIGN KEY ("delay_reason_id") REFERENCES "rh"."delay_reasons"("id");



ALTER TABLE ONLY "rh"."employee_delay_records"
    ADD CONSTRAINT "employee_delay_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_delay_records"
    ADD CONSTRAINT "employee_delay_records_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_dependents"
    ADD CONSTRAINT "employee_dependents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_dependents"
    ADD CONSTRAINT "employee_dependents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_dependents"
    ADD CONSTRAINT "employee_dependents_deficiency_degree_id_fkey" FOREIGN KEY ("deficiency_degree_id") REFERENCES "rh"."deficiency_degrees"("id");



ALTER TABLE ONLY "rh"."employee_dependents"
    ADD CONSTRAINT "employee_dependents_deficiency_type_id_fkey" FOREIGN KEY ("deficiency_type_id") REFERENCES "rh"."deficiency_types"("id");



ALTER TABLE ONLY "rh"."employee_dependents"
    ADD CONSTRAINT "employee_dependents_dependent_type_id_fkey" FOREIGN KEY ("dependent_type_id") REFERENCES "rh"."dependent_types"("id");



ALTER TABLE ONLY "rh"."employee_dependents"
    ADD CONSTRAINT "employee_dependents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_dependents"
    ADD CONSTRAINT "employee_dependents_kinship_degree_id_fkey" FOREIGN KEY ("kinship_degree_id") REFERENCES "rh"."kinship_degrees"("id");



ALTER TABLE ONLY "rh"."employee_dependents"
    ADD CONSTRAINT "employee_dependents_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_discounts"
    ADD CONSTRAINT "employee_discounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_discounts"
    ADD CONSTRAINT "employee_discounts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "rh"."employee_discounts"
    ADD CONSTRAINT "employee_discounts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_discounts"
    ADD CONSTRAINT "employee_discounts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "rh"."employee_documents"
    ADD CONSTRAINT "employee_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_documents"
    ADD CONSTRAINT "employee_documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_documents"
    ADD CONSTRAINT "employee_documents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_documents"
    ADD CONSTRAINT "employee_documents_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_education"
    ADD CONSTRAINT "employee_education_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_education"
    ADD CONSTRAINT "employee_education_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_education"
    ADD CONSTRAINT "employee_education_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_education"
    ADD CONSTRAINT "employee_education_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_history"
    ADD CONSTRAINT "employee_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_history"
    ADD CONSTRAINT "employee_history_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "rh"."employee_history"
    ADD CONSTRAINT "employee_history_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_history"
    ADD CONSTRAINT "employee_history_movement_type_id_fkey" FOREIGN KEY ("movement_type_id") REFERENCES "rh"."employee_movement_types"("id");



ALTER TABLE ONLY "rh"."employee_history"
    ADD CONSTRAINT "employee_history_new_cost_center_id_fkey" FOREIGN KEY ("new_cost_center_id") REFERENCES "core"."cost_centers"("id");



ALTER TABLE ONLY "rh"."employee_history"
    ADD CONSTRAINT "employee_history_new_manager_id_fkey" FOREIGN KEY ("new_manager_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."employee_history"
    ADD CONSTRAINT "employee_history_new_position_id_fkey" FOREIGN KEY ("new_position_id") REFERENCES "rh"."positions"("id");



ALTER TABLE ONLY "rh"."employee_history"
    ADD CONSTRAINT "employee_history_new_project_id_fkey" FOREIGN KEY ("new_project_id") REFERENCES "core"."projects"("id");



ALTER TABLE ONLY "rh"."employee_history"
    ADD CONSTRAINT "employee_history_new_work_shift_id_fkey" FOREIGN KEY ("new_work_shift_id") REFERENCES "rh"."work_shifts"("id");



ALTER TABLE ONLY "rh"."employee_history"
    ADD CONSTRAINT "employee_history_previous_cost_center_id_fkey" FOREIGN KEY ("previous_cost_center_id") REFERENCES "core"."cost_centers"("id");



ALTER TABLE ONLY "rh"."employee_history"
    ADD CONSTRAINT "employee_history_previous_manager_id_fkey" FOREIGN KEY ("previous_manager_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."employee_history"
    ADD CONSTRAINT "employee_history_previous_position_id_fkey" FOREIGN KEY ("previous_position_id") REFERENCES "rh"."positions"("id");



ALTER TABLE ONLY "rh"."employee_history"
    ADD CONSTRAINT "employee_history_previous_project_id_fkey" FOREIGN KEY ("previous_project_id") REFERENCES "core"."projects"("id");



ALTER TABLE ONLY "rh"."employee_history"
    ADD CONSTRAINT "employee_history_previous_work_shift_id_fkey" FOREIGN KEY ("previous_work_shift_id") REFERENCES "rh"."work_shifts"("id");



ALTER TABLE ONLY "rh"."employee_history"
    ADD CONSTRAINT "employee_history_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "rh"."employee_pcd_info"
    ADD CONSTRAINT "employee_pcd_info_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_pcd_info"
    ADD CONSTRAINT "employee_pcd_info_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_pcd_info"
    ADD CONSTRAINT "employee_pcd_info_deficiency_degree_id_fkey" FOREIGN KEY ("deficiency_degree_id") REFERENCES "rh"."deficiency_degrees"("id");



ALTER TABLE ONLY "rh"."employee_pcd_info"
    ADD CONSTRAINT "employee_pcd_info_deficiency_type_id_fkey" FOREIGN KEY ("deficiency_type_id") REFERENCES "rh"."deficiency_types"("id");



ALTER TABLE ONLY "rh"."employee_pcd_info"
    ADD CONSTRAINT "employee_pcd_info_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_pcd_info"
    ADD CONSTRAINT "employee_pcd_info_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_shifts"
    ADD CONSTRAINT "employee_shifts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."employee_shifts"
    ADD CONSTRAINT "employee_shifts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."employee_shifts"
    ADD CONSTRAINT "employee_shifts_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "rh"."work_shifts"("id");



ALTER TABLE ONLY "rh"."employee_spouses"
    ADD CONSTRAINT "employee_spouses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_spouses"
    ADD CONSTRAINT "employee_spouses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_spouses"
    ADD CONSTRAINT "employee_spouses_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_spouses"
    ADD CONSTRAINT "employee_spouses_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_tax_calculations"
    ADD CONSTRAINT "employee_tax_calculations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_tax_calculations"
    ADD CONSTRAINT "employee_tax_calculations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employee_tax_calculations"
    ADD CONSTRAINT "employee_tax_calculations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."employee_tax_calculations"
    ADD CONSTRAINT "employee_tax_calculations_fgts_config_id_fkey" FOREIGN KEY ("fgts_config_id") REFERENCES "rh"."fgts_config"("id");



ALTER TABLE ONLY "rh"."employee_tax_calculations"
    ADD CONSTRAINT "employee_tax_calculations_inss_bracket_id_fkey" FOREIGN KEY ("inss_bracket_id") REFERENCES "rh"."inss_brackets"("id");



ALTER TABLE ONLY "rh"."employee_tax_calculations"
    ADD CONSTRAINT "employee_tax_calculations_irrf_bracket_id_fkey" FOREIGN KEY ("irrf_bracket_id") REFERENCES "rh"."irrf_brackets"("id");



ALTER TABLE ONLY "rh"."employee_tax_calculations"
    ADD CONSTRAINT "employee_tax_calculations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."employees"
    ADD CONSTRAINT "employees_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."employees"
    ADD CONSTRAINT "employees_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "core"."cost_centers"("id");



ALTER TABLE ONLY "rh"."employees"
    ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "core"."departments"("id");



ALTER TABLE ONLY "rh"."employees"
    ADD CONSTRAINT "employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."employees"
    ADD CONSTRAINT "employees_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "rh"."positions"("id");



ALTER TABLE ONLY "rh"."employees"
    ADD CONSTRAINT "employees_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "core"."projects"("id");



ALTER TABLE ONLY "rh"."employment_contracts"
    ADD CONSTRAINT "employment_contracts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."employment_contracts"
    ADD CONSTRAINT "employment_contracts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."employment_contracts"
    ADD CONSTRAINT "employment_contracts_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "rh"."positions"("id");



ALTER TABLE ONLY "rh"."employment_contracts"
    ADD CONSTRAINT "employment_contracts_work_schedule_id_fkey" FOREIGN KEY ("work_schedule_id") REFERENCES "rh"."work_shifts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "rh"."equipment_rental_approvals"
    ADD CONSTRAINT "equipment_rental_approvals_aprovado_por_fkey" FOREIGN KEY ("aprovado_por") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."equipment_rental_approvals"
    ADD CONSTRAINT "equipment_rental_approvals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."equipment_rental_approvals"
    ADD CONSTRAINT "equipment_rental_approvals_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."equipment_rental_approvals"
    ADD CONSTRAINT "equipment_rental_approvals_equipment_rental_id_fkey" FOREIGN KEY ("equipment_rental_id") REFERENCES "rh"."equipment_rentals"("id");



ALTER TABLE ONLY "rh"."equipment_rental_payments"
    ADD CONSTRAINT "equipment_rental_payments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."equipment_rental_payments"
    ADD CONSTRAINT "equipment_rental_payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."equipment_rental_payments"
    ADD CONSTRAINT "equipment_rental_payments_equipment_rental_id_fkey" FOREIGN KEY ("equipment_rental_id") REFERENCES "rh"."equipment_rentals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."equipment_rental_payments"
    ADD CONSTRAINT "equipment_rental_payments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."equipment_rentals"
    ADD CONSTRAINT "equipment_rentals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."equipment_rentals"
    ADD CONSTRAINT "equipment_rentals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."equipment_rentals"
    ADD CONSTRAINT "equipment_rentals_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."equipment_rentals"
    ADD CONSTRAINT "equipment_rentals_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."esocial_batches"
    ADD CONSTRAINT "esocial_batches_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."esocial_batches"
    ADD CONSTRAINT "esocial_batches_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."esocial_batches"
    ADD CONSTRAINT "esocial_batches_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."esocial_benefit_types"
    ADD CONSTRAINT "esocial_benefit_types_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."esocial_categories"
    ADD CONSTRAINT "esocial_categories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."esocial_events"
    ADD CONSTRAINT "esocial_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."esocial_integration_config"
    ADD CONSTRAINT "esocial_integration_config_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."esocial_integration_config"
    ADD CONSTRAINT "esocial_integration_config_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."esocial_integration_config"
    ADD CONSTRAINT "esocial_integration_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."esocial_leave_types"
    ADD CONSTRAINT "esocial_leave_types_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."esocial_naturezas_rubricas"
    ADD CONSTRAINT "esocial_naturezas_rubricas_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."esocial_processed_events"
    ADD CONSTRAINT "esocial_processed_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."esocial_processed_events"
    ADD CONSTRAINT "esocial_processed_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."esocial_processed_events"
    ADD CONSTRAINT "esocial_processed_events_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."esocial_processed_events"
    ADD CONSTRAINT "esocial_processed_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "rh"."esocial_events"("id");



ALTER TABLE ONLY "rh"."esocial_processed_events"
    ADD CONSTRAINT "esocial_processed_events_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."esocial_validation_history"
    ADD CONSTRAINT "esocial_validation_history_processed_event_id_fkey" FOREIGN KEY ("processed_event_id") REFERENCES "rh"."esocial_processed_events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."esocial_validation_history"
    ADD CONSTRAINT "esocial_validation_history_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."esocial_validation_history"
    ADD CONSTRAINT "esocial_validation_history_validation_id_fkey" FOREIGN KEY ("validation_id") REFERENCES "rh"."esocial_validations"("id");



ALTER TABLE ONLY "rh"."esocial_validations"
    ADD CONSTRAINT "esocial_validations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."esocial_validations"
    ADD CONSTRAINT "esocial_validations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."esocial_validations"
    ADD CONSTRAINT "esocial_validations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."fgts_config"
    ADD CONSTRAINT "fgts_config_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."fgts_config"
    ADD CONSTRAINT "fgts_config_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."fgts_config"
    ADD CONSTRAINT "fgts_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."funcionario_beneficios_historico"
    ADD CONSTRAINT "funcionario_beneficios_historico_benefit_id_fkey" FOREIGN KEY ("benefit_id") REFERENCES "rh"."benefits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."funcionario_beneficios_historico"
    ADD CONSTRAINT "funcionario_beneficios_historico_convenio_id_fkey" FOREIGN KEY ("convenio_id") REFERENCES "rh"."convenios_empresas"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "rh"."funcionario_beneficios_historico"
    ADD CONSTRAINT "funcionario_beneficios_historico_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."funcionario_beneficios_historico"
    ADD CONSTRAINT "funcionario_beneficios_historico_transporte_config_id_fkey" FOREIGN KEY ("transporte_config_id") REFERENCES "rh"."transporte_configs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "rh"."funcionario_beneficios_historico"
    ADD CONSTRAINT "funcionario_beneficios_historico_vr_va_config_id_fkey" FOREIGN KEY ("vr_va_config_id") REFERENCES "rh"."vr_va_configs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "rh"."funcionario_convenio_dependentes"
    ADD CONSTRAINT "funcionario_convenio_dependentes_employee_dependent_id_fkey" FOREIGN KEY ("employee_dependent_id") REFERENCES "rh"."employee_dependents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."funcionario_convenio_dependentes"
    ADD CONSTRAINT "funcionario_convenio_dependentes_funcionario_convenio_id_fkey" FOREIGN KEY ("funcionario_convenio_id") REFERENCES "rh"."funcionario_convenios"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."funcionario_convenios"
    ADD CONSTRAINT "funcionario_convenios_convenio_plano_id_fkey" FOREIGN KEY ("convenio_plano_id") REFERENCES "rh"."convenios_planos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."funcionario_convenios"
    ADD CONSTRAINT "funcionario_convenios_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."funcionario_elegibilidade"
    ADD CONSTRAINT "funcionario_elegibilidade_elegibilidade_id_fkey" FOREIGN KEY ("elegibilidade_id") REFERENCES "rh"."beneficio_elegibilidade"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."funcionario_elegibilidade"
    ADD CONSTRAINT "funcionario_elegibilidade_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."hiring_documents"
    ADD CONSTRAINT "hiring_documents_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "rh"."candidates"("id");



ALTER TABLE ONLY "rh"."hiring_documents"
    ADD CONSTRAINT "hiring_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."hiring_documents"
    ADD CONSTRAINT "hiring_documents_job_application_id_fkey" FOREIGN KEY ("job_application_id") REFERENCES "rh"."job_applications"("id");



ALTER TABLE ONLY "rh"."hiring_documents"
    ADD CONSTRAINT "hiring_documents_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."holidays"
    ADD CONSTRAINT "holidays_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."income_statements"
    ADD CONSTRAINT "income_statements_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."income_statements"
    ADD CONSTRAINT "income_statements_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."inss_brackets"
    ADD CONSTRAINT "inss_brackets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."inss_brackets"
    ADD CONSTRAINT "inss_brackets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."inss_brackets"
    ADD CONSTRAINT "inss_brackets_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."irrf_brackets"
    ADD CONSTRAINT "irrf_brackets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."irrf_brackets"
    ADD CONSTRAINT "irrf_brackets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."irrf_brackets"
    ADD CONSTRAINT "irrf_brackets_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."job_applications"
    ADD CONSTRAINT "job_applications_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "rh"."candidates"("id");



ALTER TABLE ONLY "rh"."job_applications"
    ADD CONSTRAINT "job_applications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."job_applications"
    ADD CONSTRAINT "job_applications_current_stage_id_fkey" FOREIGN KEY ("current_stage_id") REFERENCES "rh"."selection_stages"("id");



ALTER TABLE ONLY "rh"."job_applications"
    ADD CONSTRAINT "job_applications_job_opening_id_fkey" FOREIGN KEY ("job_opening_id") REFERENCES "rh"."job_openings"("id");



ALTER TABLE ONLY "rh"."job_applications"
    ADD CONSTRAINT "job_applications_selection_process_id_fkey" FOREIGN KEY ("selection_process_id") REFERENCES "rh"."selection_processes"("id");



ALTER TABLE ONLY "rh"."job_openings"
    ADD CONSTRAINT "job_openings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."job_openings"
    ADD CONSTRAINT "job_openings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."job_openings"
    ADD CONSTRAINT "job_openings_job_request_id_fkey" FOREIGN KEY ("job_request_id") REFERENCES "rh"."job_requests"("id");



ALTER TABLE ONLY "rh"."job_requests"
    ADD CONSTRAINT "job_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."job_requests"
    ADD CONSTRAINT "job_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."job_requests"
    ADD CONSTRAINT "job_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."kinship_degrees"
    ADD CONSTRAINT "kinship_degrees_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."kinship_degrees"
    ADD CONSTRAINT "kinship_degrees_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."kinship_degrees"
    ADD CONSTRAINT "kinship_degrees_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."medical_certificates"
    ADD CONSTRAINT "medical_certificates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."medical_certificates"
    ADD CONSTRAINT "medical_certificates_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."notification_history"
    ADD CONSTRAINT "notification_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."payroll_accounting_provisions"
    ADD CONSTRAINT "payroll_accounting_provisions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "financeiro"."chart_accounts"("id");



ALTER TABLE ONLY "rh"."payroll_accounting_provisions"
    ADD CONSTRAINT "payroll_accounting_provisions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."payroll_accounting_provisions"
    ADD CONSTRAINT "payroll_accounting_provisions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."payroll_accounting_provisions"
    ADD CONSTRAINT "payroll_accounting_provisions_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "core"."cost_centers"("id");



ALTER TABLE ONLY "rh"."payroll_accounting_provisions"
    ADD CONSTRAINT "payroll_accounting_provisions_payroll_calculation_id_fkey" FOREIGN KEY ("payroll_calculation_id") REFERENCES "rh"."payroll_calculations"("id");



ALTER TABLE ONLY "rh"."payroll_accounting_provisions"
    ADD CONSTRAINT "payroll_accounting_provisions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "core"."projects"("id");



ALTER TABLE ONLY "rh"."payroll_calculation_config"
    ADD CONSTRAINT "payroll_calculation_config_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."payroll_calculation_config"
    ADD CONSTRAINT "payroll_calculation_config_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."payroll_calculation_config"
    ADD CONSTRAINT "payroll_calculation_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."payroll_calculation_items"
    ADD CONSTRAINT "payroll_calculation_items_calculation_id_fkey" FOREIGN KEY ("calculation_id") REFERENCES "rh"."payroll_calculations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."payroll_calculation_items"
    ADD CONSTRAINT "payroll_calculation_items_rubrica_id_fkey" FOREIGN KEY ("rubrica_id") REFERENCES "rh"."payroll_rubricas"("id");



ALTER TABLE ONLY "rh"."payroll_calculations"
    ADD CONSTRAINT "payroll_calculations_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."payroll_calculations"
    ADD CONSTRAINT "payroll_calculations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."payroll_calculations"
    ADD CONSTRAINT "payroll_calculations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."payroll_calculations"
    ADD CONSTRAINT "payroll_calculations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."payroll_calculations"
    ADD CONSTRAINT "payroll_calculations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."payroll_cnab_files"
    ADD CONSTRAINT "payroll_cnab_files_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."payroll_cnab_files"
    ADD CONSTRAINT "payroll_cnab_files_payment_batch_id_fkey" FOREIGN KEY ("payment_batch_id") REFERENCES "rh"."payroll_payment_batches"("id");



ALTER TABLE ONLY "rh"."payroll"
    ADD CONSTRAINT "payroll_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."payroll_config"
    ADD CONSTRAINT "payroll_config_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."payroll_config"
    ADD CONSTRAINT "payroll_config_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."payroll_consolidation_config"
    ADD CONSTRAINT "payroll_consolidation_config_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."payroll_consolidation_config"
    ADD CONSTRAINT "payroll_consolidation_config_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."payroll_consolidation_config"
    ADD CONSTRAINT "payroll_consolidation_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."payroll_consolidation_history"
    ADD CONSTRAINT "payroll_consolidation_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."payroll_consolidation_history"
    ADD CONSTRAINT "payroll_consolidation_history_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."payroll_event_validations"
    ADD CONSTRAINT "payroll_event_validations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."payroll_event_validations"
    ADD CONSTRAINT "payroll_event_validations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."payroll_event_validations"
    ADD CONSTRAINT "payroll_event_validations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."payroll_events"
    ADD CONSTRAINT "payroll_events_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."payroll_events"
    ADD CONSTRAINT "payroll_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."payroll_events"
    ADD CONSTRAINT "payroll_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."payroll_events"
    ADD CONSTRAINT "payroll_events_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."payroll_events"
    ADD CONSTRAINT "payroll_events_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."payroll_financial_config"
    ADD CONSTRAINT "payroll_financial_config_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "financeiro"."bank_accounts"("id");



ALTER TABLE ONLY "rh"."payroll_financial_config"
    ADD CONSTRAINT "payroll_financial_config_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."payroll_financial_config"
    ADD CONSTRAINT "payroll_financial_config_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "core"."cost_centers"("id");



ALTER TABLE ONLY "rh"."payroll_financial_config"
    ADD CONSTRAINT "payroll_financial_config_fgts_account_id_fkey" FOREIGN KEY ("fgts_account_id") REFERENCES "financeiro"."chart_accounts"("id");



ALTER TABLE ONLY "rh"."payroll_financial_config"
    ADD CONSTRAINT "payroll_financial_config_food_account_id_fkey" FOREIGN KEY ("food_account_id") REFERENCES "financeiro"."chart_accounts"("id");



ALTER TABLE ONLY "rh"."payroll_financial_config"
    ADD CONSTRAINT "payroll_financial_config_health_account_id_fkey" FOREIGN KEY ("health_account_id") REFERENCES "financeiro"."chart_accounts"("id");



ALTER TABLE ONLY "rh"."payroll_financial_config"
    ADD CONSTRAINT "payroll_financial_config_inss_account_id_fkey" FOREIGN KEY ("inss_account_id") REFERENCES "financeiro"."chart_accounts"("id");



ALTER TABLE ONLY "rh"."payroll_financial_config"
    ADD CONSTRAINT "payroll_financial_config_irrf_account_id_fkey" FOREIGN KEY ("irrf_account_id") REFERENCES "financeiro"."chart_accounts"("id");



ALTER TABLE ONLY "rh"."payroll_financial_config"
    ADD CONSTRAINT "payroll_financial_config_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "core"."projects"("id");



ALTER TABLE ONLY "rh"."payroll_financial_config"
    ADD CONSTRAINT "payroll_financial_config_transport_account_id_fkey" FOREIGN KEY ("transport_account_id") REFERENCES "financeiro"."chart_accounts"("id");



ALTER TABLE ONLY "rh"."payroll_financial_config"
    ADD CONSTRAINT "payroll_financial_config_union_account_id_fkey" FOREIGN KEY ("union_account_id") REFERENCES "financeiro"."chart_accounts"("id");



ALTER TABLE ONLY "rh"."payroll_generated_titles"
    ADD CONSTRAINT "payroll_generated_titles_accounts_payable_id_fkey" FOREIGN KEY ("accounts_payable_id") REFERENCES "financeiro"."accounts_payable"("id");



ALTER TABLE ONLY "rh"."payroll_generated_titles"
    ADD CONSTRAINT "payroll_generated_titles_bank_transaction_id_fkey" FOREIGN KEY ("bank_transaction_id") REFERENCES "financeiro"."bank_transactions"("id");



ALTER TABLE ONLY "rh"."payroll_generated_titles"
    ADD CONSTRAINT "payroll_generated_titles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."payroll_generated_titles"
    ADD CONSTRAINT "payroll_generated_titles_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."payroll_generated_titles"
    ADD CONSTRAINT "payroll_generated_titles_payroll_calculation_id_fkey" FOREIGN KEY ("payroll_calculation_id") REFERENCES "rh"."payroll_calculations"("id");



ALTER TABLE ONLY "rh"."payroll_items"
    ADD CONSTRAINT "payroll_items_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."payroll_items"
    ADD CONSTRAINT "payroll_items_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."payroll_items"
    ADD CONSTRAINT "payroll_items_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES "rh"."payroll"("id");



ALTER TABLE ONLY "rh"."payroll_payment_batches"
    ADD CONSTRAINT "payroll_payment_batches_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."payroll_payment_batches"
    ADD CONSTRAINT "payroll_payment_batches_payroll_calculation_id_fkey" FOREIGN KEY ("payroll_calculation_id") REFERENCES "rh"."payroll_calculations"("id");



ALTER TABLE ONLY "rh"."payroll_rubricas"
    ADD CONSTRAINT "payroll_rubricas_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."payroll_rubricas"
    ADD CONSTRAINT "payroll_rubricas_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."payroll_rubricas"
    ADD CONSTRAINT "payroll_rubricas_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."payroll_slips"
    ADD CONSTRAINT "payroll_slips_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."payroll_slips"
    ADD CONSTRAINT "payroll_slips_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."payroll_tax_guides"
    ADD CONSTRAINT "payroll_tax_guides_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."payroll_tax_guides"
    ADD CONSTRAINT "payroll_tax_guides_payroll_calculation_id_fkey" FOREIGN KEY ("payroll_calculation_id") REFERENCES "rh"."payroll_calculations"("id");



ALTER TABLE ONLY "rh"."payroll_validation_history"
    ADD CONSTRAINT "payroll_validation_history_calculation_id_fkey" FOREIGN KEY ("calculation_id") REFERENCES "rh"."payroll_calculations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."payroll_validation_history"
    ADD CONSTRAINT "payroll_validation_history_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."payroll_validation_history"
    ADD CONSTRAINT "payroll_validation_history_validation_id_fkey" FOREIGN KEY ("validation_id") REFERENCES "rh"."payroll_validations"("id");



ALTER TABLE ONLY "rh"."payroll_validations"
    ADD CONSTRAINT "payroll_validations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."payroll_validations"
    ADD CONSTRAINT "payroll_validations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."payroll_validations"
    ADD CONSTRAINT "payroll_validations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."periodic_exams"
    ADD CONSTRAINT "periodic_exams_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."periodic_exams"
    ADD CONSTRAINT "periodic_exams_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "rh"."periodic_exams"
    ADD CONSTRAINT "periodic_exams_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."periodic_exams"
    ADD CONSTRAINT "periodic_exams_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "rh"."positions"
    ADD CONSTRAINT "positions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."report_history"
    ADD CONSTRAINT "report_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."report_history"
    ADD CONSTRAINT "report_history_report_template_id_fkey" FOREIGN KEY ("report_template_id") REFERENCES "rh"."report_templates"("id");



ALTER TABLE ONLY "rh"."report_history"
    ADD CONSTRAINT "report_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."report_templates"
    ADD CONSTRAINT "report_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."rubricas"
    ADD CONSTRAINT "rubricas_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."rubricas"
    ADD CONSTRAINT "rubricas_natureza_esocial_id_fkey" FOREIGN KEY ("natureza_esocial_id") REFERENCES "rh"."esocial_naturezas_rubricas"("id");



ALTER TABLE ONLY "rh"."schedule_entries"
    ADD CONSTRAINT "schedule_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."schedule_entries"
    ADD CONSTRAINT "schedule_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."schedule_entries"
    ADD CONSTRAINT "schedule_entries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."schedule_entries"
    ADD CONSTRAINT "schedule_entries_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "rh"."work_shifts"("id");



ALTER TABLE ONLY "rh"."selection_processes"
    ADD CONSTRAINT "selection_processes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."selection_processes"
    ADD CONSTRAINT "selection_processes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."selection_processes"
    ADD CONSTRAINT "selection_processes_job_opening_id_fkey" FOREIGN KEY ("job_opening_id") REFERENCES "rh"."job_openings"("id");



ALTER TABLE ONLY "rh"."selection_stages"
    ADD CONSTRAINT "selection_stages_selection_process_id_fkey" FOREIGN KEY ("selection_process_id") REFERENCES "rh"."selection_processes"("id");



ALTER TABLE ONLY "rh"."stage_results"
    ADD CONSTRAINT "stage_results_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."stage_results"
    ADD CONSTRAINT "stage_results_job_application_id_fkey" FOREIGN KEY ("job_application_id") REFERENCES "rh"."job_applications"("id");



ALTER TABLE ONLY "rh"."stage_results"
    ADD CONSTRAINT "stage_results_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "rh"."selection_stages"("id");



ALTER TABLE ONLY "rh"."talent_pool"
    ADD CONSTRAINT "talent_pool_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."talent_pool"
    ADD CONSTRAINT "talent_pool_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "rh"."candidates"("id");



ALTER TABLE ONLY "rh"."talent_pool"
    ADD CONSTRAINT "talent_pool_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."time_bank"
    ADD CONSTRAINT "time_bank_aprovado_por_fkey" FOREIGN KEY ("aprovado_por") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."time_bank"
    ADD CONSTRAINT "time_bank_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."time_bank"
    ADD CONSTRAINT "time_bank_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."time_record_correction_control"
    ADD CONSTRAINT "time_record_correction_control_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."time_record_correction_control"
    ADD CONSTRAINT "time_record_correction_control_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."time_record_correction_control"
    ADD CONSTRAINT "time_record_correction_control_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."time_records"
    ADD CONSTRAINT "time_records_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."time_records"
    ADD CONSTRAINT "time_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."transporte_configs"
    ADD CONSTRAINT "transporte_configs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."unions"
    ADD CONSTRAINT "unions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."units"
    ADD CONSTRAINT "units_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."units"
    ADD CONSTRAINT "units_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "rh"."units"("id");



ALTER TABLE ONLY "rh"."user_dashboard_preferences"
    ADD CONSTRAINT "user_dashboard_preferences_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."user_dashboard_preferences"
    ADD CONSTRAINT "user_dashboard_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id");



ALTER TABLE ONLY "rh"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."vacation_notifications"
    ADD CONSTRAINT "vacation_notifications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."vacation_notifications"
    ADD CONSTRAINT "vacation_notifications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."vacation_periods"
    ADD CONSTRAINT "vacation_periods_vacation_id_fkey" FOREIGN KEY ("vacation_id") REFERENCES "rh"."vacations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."vacations"
    ADD CONSTRAINT "vacations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



ALTER TABLE ONLY "rh"."vacations"
    ADD CONSTRAINT "vacations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "rh"."employees"("id");



ALTER TABLE ONLY "rh"."vr_va_configs"
    ADD CONSTRAINT "vr_va_configs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."work_shift_patterns"
    ADD CONSTRAINT "work_shift_patterns_work_shift_id_fkey" FOREIGN KEY ("work_shift_id") REFERENCES "rh"."work_shifts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."work_shift_templates"
    ADD CONSTRAINT "work_shift_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "rh"."work_shifts"
    ADD CONSTRAINT "work_shifts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id");



CREATE POLICY "Apenas RH pode modificar folha" ON "rh"."payroll" USING ((("company_id" = ANY ("core"."get_user_companies"())) AND "core"."check_user_permission"('rh'::"text", 'write'::"text")));



CREATE POLICY "Employees can manage own attendance corrections" ON "rh"."attendance_corrections" USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "rh"."employees"
  WHERE ("employees"."id" = "auth"."uid"()))));



CREATE POLICY "Employees can view own income statements" ON "rh"."income_statements" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "rh"."employees"
  WHERE ("employees"."id" = "auth"."uid"()))));



CREATE POLICY "Employees can view own payroll slips" ON "rh"."payroll_slips" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "rh"."employees"
  WHERE ("employees"."id" = "auth"."uid"()))));



CREATE POLICY "Enable all operations for benefits" ON "rh"."benefits" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for compensation_requests" ON "rh"."compensation_requests" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for employee_benefits" ON "rh"."employee_benefits" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for employee_shifts" ON "rh"."employee_shifts" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for employees" ON "rh"."employees" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for esocial_events" ON "rh"."esocial_events" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for medical_certificates" ON "rh"."medical_certificates" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for payroll" ON "rh"."payroll" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for payroll_config" ON "rh"."payroll_config" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for payroll_items" ON "rh"."payroll_items" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for periodic_exams" ON "rh"."periodic_exams" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for positions" ON "rh"."positions" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for time_bank" ON "rh"."time_bank" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for time_records" ON "rh"."time_records" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for unions" ON "rh"."unions" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for vacations" ON "rh"."vacations" USING (true) WITH CHECK (true);



CREATE POLICY "Enable all operations for work_shifts" ON "rh"."work_shifts" USING (true) WITH CHECK (true);



CREATE POLICY "Enable delete for authenticated users" ON "rh"."employees" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable delete for authenticated users" ON "rh"."payroll" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable delete for authenticated users" ON "rh"."time_bank" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable delete for authenticated users" ON "rh"."time_records" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable insert for authenticated users" ON "rh"."employees" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users" ON "rh"."payroll" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users" ON "rh"."time_bank" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users" ON "rh"."time_records" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for anon users" ON "rh"."employees" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Enable read access for anon users" ON "rh"."payroll" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Enable read access for anon users" ON "rh"."time_bank" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Enable read access for anon users" ON "rh"."time_records" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "rh"."employees" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "rh"."payroll" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "rh"."time_bank" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "rh"."time_records" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable update for authenticated users" ON "rh"."employees" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Enable update for authenticated users" ON "rh"."payroll" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Enable update for authenticated users" ON "rh"."time_bank" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Enable update for authenticated users" ON "rh"."time_records" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Funcionários podem inserir seu próprio ponto" ON "rh"."time_records" FOR INSERT WITH CHECK ((("company_id" = ANY ("core"."get_user_companies"())) AND ("auth"."uid"() = "employee_id")));



CREATE POLICY "Funcionários podem ver seu banco de horas" ON "rh"."time_bank" FOR SELECT USING ((("company_id" = ANY ("core"."get_user_companies"())) AND (("auth"."uid"() = "employee_id") OR "core"."check_user_permission"('rh'::"text", 'read'::"text"))));



CREATE POLICY "Funcionários podem ver seu próprio ponto" ON "rh"."time_records" FOR SELECT USING ((("company_id" = ANY ("core"."get_user_companies"())) AND (("auth"."uid"() = "employee_id") OR "core"."check_user_permission"('rh'::"text", 'read'::"text"))));



CREATE POLICY "Funcionários podem ver suas notificações" ON "rh"."vacation_notifications" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "rh"."employees"
  WHERE ("employees"."id" = (("auth"."uid"())::"text")::"uuid"))));



CREATE POLICY "Gestores podem aprovar banco de horas" ON "rh"."time_bank" FOR UPDATE USING ((("company_id" = ANY ("core"."get_user_companies"())) AND "core"."check_user_permission"('rh'::"text", 'write'::"text")));



CREATE POLICY "Gestores podem modificar ponto" ON "rh"."time_records" FOR UPDATE USING ((("company_id" = ANY ("core"."get_user_companies"())) AND "core"."check_user_permission"('rh'::"text", 'write'::"text")));



CREATE POLICY "Managers can manage team attendance corrections" ON "rh"."attendance_corrections" FOR UPDATE USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "rh"."employees"
  WHERE ("employees"."manager_id" = "auth"."uid"()))));



CREATE POLICY "Managers can manage team compensation requests" ON "rh"."compensation_requests" FOR UPDATE USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "rh"."employees"
  WHERE ("employees"."manager_id" = "auth"."uid"()))));



CREATE POLICY "Managers can manage team equipment rental approvals" ON "rh"."equipment_rental_approvals" USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "rh"."employees"
  WHERE ("employees"."manager_id" = "auth"."uid"()))));



CREATE POLICY "Managers can manage team medical certificates" ON "rh"."medical_certificates" FOR UPDATE USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "rh"."employees"
  WHERE ("employees"."manager_id" = "auth"."uid"()))));



CREATE POLICY "Managers can manage team vacations" ON "rh"."vacations" FOR UPDATE USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "rh"."employees"
  WHERE ("employees"."manager_id" = "auth"."uid"()))));



CREATE POLICY "Managers can view team attendance corrections" ON "rh"."attendance_corrections" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "rh"."employees"
  WHERE ("employees"."manager_id" = "auth"."uid"()))));



CREATE POLICY "Managers can view team compensation requests" ON "rh"."compensation_requests" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "rh"."employees"
  WHERE ("employees"."manager_id" = "auth"."uid"()))));



CREATE POLICY "Managers can view team equipment rental approvals" ON "rh"."equipment_rental_approvals" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "rh"."employees"
  WHERE ("employees"."manager_id" = "auth"."uid"()))));



CREATE POLICY "Managers can view team equipment rentals" ON "rh"."equipment_rentals" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "rh"."employees"
  WHERE ("employees"."manager_id" = "auth"."uid"()))));



CREATE POLICY "Managers can view team medical certificates" ON "rh"."medical_certificates" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "rh"."employees"
  WHERE ("employees"."manager_id" = "auth"."uid"()))));



CREATE POLICY "Managers can view team periodic exams" ON "rh"."periodic_exams" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "rh"."employees"
  WHERE ("employees"."manager_id" = "auth"."uid"()))));



CREATE POLICY "Managers can view team time records" ON "rh"."time_records" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "rh"."employees"
  WHERE ("employees"."manager_id" = "auth"."uid"()))));



CREATE POLICY "Managers can view team vacations" ON "rh"."vacations" FOR SELECT USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "rh"."employees"
  WHERE ("employees"."manager_id" = "auth"."uid"()))));



CREATE POLICY "Permitir atualização para usuários autenticados" ON "rh"."delay_reasons" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Permitir exclusão para usuários autenticados" ON "rh"."delay_reasons" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Permitir inserção para usuários autenticados" ON "rh"."delay_reasons" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Permitir leitura para usuários autenticados" ON "rh"."delay_reasons" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "RH pode ver todas as notificações da empresa" ON "rh"."vacation_notifications" USING (("company_id" IN ( SELECT "employees"."company_id"
   FROM "rh"."employees"
  WHERE ("employees"."id" = (("auth"."uid"())::"text")::"uuid"))));



CREATE POLICY "System can insert notifications" ON "rh"."notification_history" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can create report history for their company" ON "rh"."report_history" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) AND ("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete employee discounts" ON "rh"."employee_discounts" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "rh"."employees" "e"
  WHERE (("e"."id" = "employee_discounts"."employee_id") AND ("e"."company_id" = ( SELECT "user_companies"."company_id"
           FROM "core"."user_companies"
          WHERE ("user_companies"."user_id" = "auth"."uid"())))))));



CREATE POLICY "Users can delete holidays from their company" ON "rh"."holidays" FOR DELETE USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE (("user_companies"."user_id" = "auth"."uid"()) AND ("holidays"."is_active" = true)))));



CREATE POLICY "Users can delete schedule entries from their company" ON "rh"."schedule_entries" FOR DELETE USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE (("user_companies"."user_id" = "auth"."uid"()) AND ("schedule_entries"."is_active" = true)))));



CREATE POLICY "Users can delete their own vacation periods" ON "rh"."vacation_periods" FOR DELETE USING (("vacation_id" IN ( SELECT "vacations"."id"
   FROM "rh"."vacations"
  WHERE ("vacations"."employee_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert employee discounts" ON "rh"."employee_discounts" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "rh"."employees" "e"
  WHERE (("e"."id" = "employee_discounts"."employee_id") AND ("e"."company_id" = ( SELECT "user_companies"."company_id"
           FROM "core"."user_companies"
          WHERE ("user_companies"."user_id" = "auth"."uid"())))))));



CREATE POLICY "Users can insert holidays for their company" ON "rh"."holidays" FOR INSERT WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE (("user_companies"."user_id" = "auth"."uid"()) AND ("holidays"."is_active" = true)))));



CREATE POLICY "Users can insert own settings" ON "rh"."user_settings" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert payroll accounting provisions for their compan" ON "rh"."payroll_accounting_provisions" FOR INSERT WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert payroll cnab files for their company" ON "rh"."payroll_cnab_files" FOR INSERT WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert payroll events for their company" ON "rh"."payroll_events" FOR INSERT WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert payroll financial config for their company" ON "rh"."payroll_financial_config" FOR INSERT WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert payroll generated titles for their company" ON "rh"."payroll_generated_titles" FOR INSERT WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert payroll payment batches for their company" ON "rh"."payroll_payment_batches" FOR INSERT WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert payroll tax guides for their company" ON "rh"."payroll_tax_guides" FOR INSERT WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert schedule entries for their company" ON "rh"."schedule_entries" FOR INSERT WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE (("user_companies"."user_id" = "auth"."uid"()) AND ("schedule_entries"."is_active" = true)))));



CREATE POLICY "Users can insert their own vacation periods" ON "rh"."vacation_periods" FOR INSERT WITH CHECK (("vacation_id" IN ( SELECT "vacations"."id"
   FROM "rh"."vacations"
  WHERE ("vacations"."employee_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage report templates for their company" ON "rh"."report_templates" USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage their own dashboard configs" ON "rh"."dashboard_configs" USING ((("user_id" = "auth"."uid"()) AND ("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage their own preferences" ON "rh"."user_dashboard_preferences" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage work shift patterns from their company" ON "rh"."work_shift_patterns" USING (("work_shift_id" IN ( SELECT "work_shifts"."id"
   FROM "rh"."work_shifts"
  WHERE ("work_shifts"."company_id" IN ( SELECT "companies"."id"
           FROM "core"."companies"
          WHERE ("companies"."id" IN ( SELECT "users"."company_id"
                   FROM "core"."users"
                  WHERE ("users"."id" = "auth"."uid"()))))))));



CREATE POLICY "Users can manage work shift templates from their company" ON "rh"."work_shift_templates" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "core"."companies"
  WHERE ("companies"."id" IN ( SELECT "users"."company_id"
           FROM "core"."users"
          WHERE ("users"."id" = "auth"."uid"()))))));



CREATE POLICY "Users can update employee discounts" ON "rh"."employee_discounts" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "rh"."employees" "e"
  WHERE (("e"."id" = "employee_discounts"."employee_id") AND ("e"."company_id" = ( SELECT "user_companies"."company_id"
           FROM "core"."user_companies"
          WHERE ("user_companies"."user_id" = "auth"."uid"())))))));



CREATE POLICY "Users can update holidays from their company" ON "rh"."holidays" FOR UPDATE USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE (("user_companies"."user_id" = "auth"."uid"()) AND ("holidays"."is_active" = true)))));



CREATE POLICY "Users can update own notifications" ON "rh"."notification_history" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own settings" ON "rh"."user_settings" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update payroll accounting provisions for their compan" ON "rh"."payroll_accounting_provisions" FOR UPDATE USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update payroll cnab files for their company" ON "rh"."payroll_cnab_files" FOR UPDATE USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update payroll events from their company" ON "rh"."payroll_events" FOR UPDATE USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update payroll financial config for their company" ON "rh"."payroll_financial_config" FOR UPDATE USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update payroll generated titles for their company" ON "rh"."payroll_generated_titles" FOR UPDATE USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update payroll payment batches for their company" ON "rh"."payroll_payment_batches" FOR UPDATE USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update payroll tax guides for their company" ON "rh"."payroll_tax_guides" FOR UPDATE USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update schedule entries from their company" ON "rh"."schedule_entries" FOR UPDATE USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE (("user_companies"."user_id" = "auth"."uid"()) AND ("schedule_entries"."is_active" = true)))));



CREATE POLICY "Users can update their own alerts" ON "rh"."dashboard_alerts" FOR UPDATE USING ((("user_id" = "auth"."uid"()) AND ("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own vacation periods" ON "rh"."vacation_periods" FOR UPDATE USING (("vacation_id" IN ( SELECT "vacations"."id"
   FROM "rh"."vacations"
  WHERE ("vacations"."employee_id" = "auth"."uid"()))));



CREATE POLICY "Users can view alerts for their company" ON "rh"."dashboard_alerts" FOR SELECT USING ((("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))) AND (("user_id" IS NULL) OR ("user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view analytics cache for their company" ON "rh"."analytics_cache" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view candidates from their company" ON "rh"."candidates" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view consolidation config from their company" ON "rh"."payroll_consolidation_config" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view consolidation history from their company" ON "rh"."payroll_consolidation_history" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view dashboard configs for their company" ON "rh"."dashboard_configs" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view employee discounts" ON "rh"."employee_discounts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "rh"."employees" "e"
  WHERE (("e"."id" = "employee_discounts"."employee_id") AND ("e"."company_id" = ( SELECT "user_companies"."company_id"
           FROM "core"."user_companies"
          WHERE ("user_companies"."user_id" = "auth"."uid"())))))));



CREATE POLICY "Users can view esocial batches from their company" ON "rh"."esocial_batches" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view esocial integration config from their company" ON "rh"."esocial_integration_config" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view esocial processed events from their company" ON "rh"."esocial_processed_events" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view esocial validation history from their company" ON "rh"."esocial_validation_history" FOR SELECT USING (("processed_event_id" IN ( SELECT "esocial_processed_events"."id"
   FROM "rh"."esocial_processed_events"
  WHERE ("esocial_processed_events"."company_id" IN ( SELECT "user_companies"."company_id"
           FROM "core"."user_companies"
          WHERE ("user_companies"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view esocial validations from their company" ON "rh"."esocial_validations" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view event validations from their company" ON "rh"."payroll_event_validations" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view hiring documents from their company" ON "rh"."hiring_documents" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view holidays from their company" ON "rh"."holidays" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE (("user_companies"."user_id" = "auth"."uid"()) AND ("holidays"."is_active" = true)))));



CREATE POLICY "Users can view job applications from their company" ON "rh"."job_applications" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view job openings from their company" ON "rh"."job_openings" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view job requests from their company" ON "rh"."job_requests" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own notifications" ON "rh"."notification_history" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own settings" ON "rh"."user_settings" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view payroll accounting provisions for their company" ON "rh"."payroll_accounting_provisions" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view payroll calculation config from their company" ON "rh"."payroll_calculation_config" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view payroll calculation items from their company" ON "rh"."payroll_calculation_items" FOR SELECT USING (("calculation_id" IN ( SELECT "payroll_calculations"."id"
   FROM "rh"."payroll_calculations"
  WHERE ("payroll_calculations"."company_id" IN ( SELECT "user_companies"."company_id"
           FROM "core"."user_companies"
          WHERE ("user_companies"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view payroll calculations from their company" ON "rh"."payroll_calculations" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view payroll cnab files for their company" ON "rh"."payroll_cnab_files" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view payroll events from their company" ON "rh"."payroll_events" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view payroll financial config for their company" ON "rh"."payroll_financial_config" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view payroll generated titles for their company" ON "rh"."payroll_generated_titles" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view payroll payment batches for their company" ON "rh"."payroll_payment_batches" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view payroll rubricas from their company" ON "rh"."payroll_rubricas" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view payroll tax guides for their company" ON "rh"."payroll_tax_guides" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view payroll validation history from their company" ON "rh"."payroll_validation_history" FOR SELECT USING (("calculation_id" IN ( SELECT "payroll_calculations"."id"
   FROM "rh"."payroll_calculations"
  WHERE ("payroll_calculations"."company_id" IN ( SELECT "user_companies"."company_id"
           FROM "core"."user_companies"
          WHERE ("user_companies"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view payroll validations from their company" ON "rh"."payroll_validations" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view report templates for their company" ON "rh"."report_templates" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view schedule entries from their company" ON "rh"."schedule_entries" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE (("user_companies"."user_id" = "auth"."uid"()) AND ("schedule_entries"."is_active" = true)))));



CREATE POLICY "Users can view their own report history" ON "rh"."report_history" FOR SELECT USING ((("user_id" = "auth"."uid"()) AND ("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own vacation periods" ON "rh"."vacation_periods" FOR SELECT USING (("vacation_id" IN ( SELECT "vacations"."id"
   FROM "rh"."vacations"
  WHERE ("vacations"."employee_id" = "auth"."uid"()))));



CREATE POLICY "Users can view work shift patterns from their company" ON "rh"."work_shift_patterns" FOR SELECT USING (("work_shift_id" IN ( SELECT "work_shifts"."id"
   FROM "rh"."work_shifts"
  WHERE ("work_shifts"."company_id" IN ( SELECT "companies"."id"
           FROM "core"."companies"
          WHERE ("companies"."id" IN ( SELECT "users"."company_id"
                   FROM "core"."users"
                  WHERE ("users"."id" = "auth"."uid"()))))))));



CREATE POLICY "Users can view work shift templates from their company" ON "rh"."work_shift_templates" FOR SELECT USING (("company_id" IN ( SELECT "companies"."id"
   FROM "core"."companies"
  WHERE ("companies"."id" IN ( SELECT "users"."company_id"
           FROM "core"."users"
          WHERE ("users"."id" = "auth"."uid"()))))));



CREATE POLICY "Usuários podem modificar funcionários de suas empresas" ON "rh"."employees" USING ((("company_id" = ANY ("core"."get_user_companies"())) AND "core"."check_user_permission"('rh'::"text", 'write'::"text")));



CREATE POLICY "Usuários podem ver folha de suas empresas" ON "rh"."payroll" FOR SELECT USING ((("company_id" = ANY ("core"."get_user_companies"())) AND "core"."check_user_permission"('rh'::"text", 'read'::"text")));



CREATE POLICY "Usuários podem ver funcionários de suas empresas" ON "rh"."employees" FOR SELECT USING (("company_id" = ANY ("core"."get_user_companies"())));



ALTER TABLE "rh"."analytics_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."attendance_corrections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."beneficio_elegibilidade" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."beneficio_elegibilidade_cargos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "beneficio_elegibilidade_cargos_company_isolation" ON "rh"."beneficio_elegibilidade_cargos" USING (("elegibilidade_id" IN ( SELECT "beneficio_elegibilidade"."id"
   FROM "rh"."beneficio_elegibilidade"
  WHERE ("beneficio_elegibilidade"."company_id" IN ( SELECT "companies"."id"
           FROM "core"."companies"
          WHERE ("companies"."id" IN ( SELECT "user_companies"."company_id"
                   FROM "core"."user_companies"
                  WHERE ("user_companies"."user_id" = "auth"."uid"()))))))));



CREATE POLICY "beneficio_elegibilidade_company_isolation" ON "rh"."beneficio_elegibilidade" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "core"."companies"
  WHERE ("companies"."id" IN ( SELECT "user_companies"."company_id"
           FROM "core"."user_companies"
          WHERE ("user_companies"."user_id" = "auth"."uid"()))))));



ALTER TABLE "rh"."beneficio_elegibilidade_departamentos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "beneficio_elegibilidade_departamentos_company_isolation" ON "rh"."beneficio_elegibilidade_departamentos" USING (("elegibilidade_id" IN ( SELECT "beneficio_elegibilidade"."id"
   FROM "rh"."beneficio_elegibilidade"
  WHERE ("beneficio_elegibilidade"."company_id" IN ( SELECT "companies"."id"
           FROM "core"."companies"
          WHERE ("companies"."id" IN ( SELECT "user_companies"."company_id"
                   FROM "core"."user_companies"
                  WHERE ("user_companies"."user_id" = "auth"."uid"()))))))));



ALTER TABLE "rh"."beneficio_rateio_departamentos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "beneficio_rateio_departamentos_company_isolation" ON "rh"."beneficio_rateio_departamentos" USING (("rateio_id" IN ( SELECT "beneficio_rateios"."id"
   FROM "rh"."beneficio_rateios"
  WHERE ("beneficio_rateios"."company_id" IN ( SELECT "companies"."id"
           FROM "core"."companies"
          WHERE ("companies"."id" IN ( SELECT "user_companies"."company_id"
                   FROM "core"."user_companies"
                  WHERE ("user_companies"."user_id" = "auth"."uid"()))))))));



ALTER TABLE "rh"."beneficio_rateio_historico" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "beneficio_rateio_historico_company_isolation" ON "rh"."beneficio_rateio_historico" USING (("rateio_id" IN ( SELECT "beneficio_rateios"."id"
   FROM "rh"."beneficio_rateios"
  WHERE ("beneficio_rateios"."company_id" IN ( SELECT "companies"."id"
           FROM "core"."companies"
          WHERE ("companies"."id" IN ( SELECT "user_companies"."company_id"
                   FROM "core"."user_companies"
                  WHERE ("user_companies"."user_id" = "auth"."uid"()))))))));



ALTER TABLE "rh"."beneficio_rateios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "beneficio_rateios_company_isolation" ON "rh"."beneficio_rateios" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "core"."companies"
  WHERE ("companies"."id" IN ( SELECT "user_companies"."company_id"
           FROM "core"."user_companies"
          WHERE ("user_companies"."user_id" = "auth"."uid"()))))));



ALTER TABLE "rh"."beneficio_tipos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "beneficio_tipos_company_isolation" ON "rh"."beneficio_tipos" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "core"."companies"
  WHERE ("companies"."id" IN ( SELECT "user_companies"."company_id"
           FROM "core"."user_companies"
          WHERE ("user_companies"."user_id" = "auth"."uid"()))))));



ALTER TABLE "rh"."beneficios_descontos_afastamento" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "beneficios_descontos_afastamento_company_isolation" ON "rh"."beneficios_descontos_afastamento" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "core"."companies"
  WHERE ("companies"."id" IN ( SELECT "user_companies"."company_id"
           FROM "core"."user_companies"
          WHERE ("user_companies"."user_id" = "auth"."uid"()))))));



ALTER TABLE "rh"."beneficios_elegibilidade" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "beneficios_elegibilidade_company_isolation" ON "rh"."beneficios_elegibilidade" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "core"."companies"
  WHERE ("companies"."id" IN ( SELECT "user_companies"."company_id"
           FROM "core"."user_companies"
          WHERE ("user_companies"."user_id" = "auth"."uid"()))))));



ALTER TABLE "rh"."beneficios_rateios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "beneficios_rateios_company_isolation" ON "rh"."beneficios_rateios" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "core"."companies"
  WHERE ("companies"."id" IN ( SELECT "user_companies"."company_id"
           FROM "core"."user_companies"
          WHERE ("user_companies"."user_id" = "auth"."uid"()))))));



ALTER TABLE "rh"."benefits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."candidate_upload_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."candidates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."compensation_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "convenios_company_isolation" ON "rh"."convenios_empresas" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "core"."companies"
  WHERE ("companies"."id" IN ( SELECT "user_companies"."company_id"
           FROM "core"."user_companies"
          WHERE ("user_companies"."user_id" = "auth"."uid"()))))));



ALTER TABLE "rh"."convenios_empresas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "convenios_empresas_company_isolation" ON "rh"."convenios_empresas" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "core"."companies"
  WHERE ("companies"."id" IN ( SELECT "user_companies"."company_id"
           FROM "core"."user_companies"
          WHERE ("user_companies"."user_id" = "auth"."uid"()))))));



ALTER TABLE "rh"."convenios_planos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "convenios_planos_company_isolation" ON "rh"."convenios_planos" USING (("convenio_empresa_id" IN ( SELECT "convenios_empresas"."id"
   FROM "rh"."convenios_empresas"
  WHERE ("convenios_empresas"."company_id" IN ( SELECT "companies"."id"
           FROM "core"."companies"
          WHERE ("companies"."id" IN ( SELECT "user_companies"."company_id"
                   FROM "core"."user_companies"
                  WHERE ("user_companies"."user_id" = "auth"."uid"()))))))));



ALTER TABLE "rh"."dashboard_alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."dashboard_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."delay_reasons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."employee_addresses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."employee_bank_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."employee_benefits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."employee_dependents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "employee_dependents_company_isolation" ON "rh"."employee_dependents" USING (("company_id" IN ( SELECT "uc"."company_id"
   FROM "core"."user_companies" "uc"
  WHERE ("uc"."user_id" = "auth"."uid"()))));



ALTER TABLE "rh"."employee_discounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."employee_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."employee_education" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."employee_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "employee_history_insert_policy" ON "rh"."employee_history" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "employee_history_select_policy" ON "rh"."employee_history" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "employee_history_update_policy" ON "rh"."employee_history" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "rh"."employee_movement_types" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "employee_movement_types_select_policy" ON "rh"."employee_movement_types" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "rh"."employee_pcd_info" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "employee_pcd_info_company_isolation" ON "rh"."employee_pcd_info" USING (("company_id" IN ( SELECT "uc"."company_id"
   FROM "core"."user_companies" "uc"
  WHERE ("uc"."user_id" = "auth"."uid"()))));



ALTER TABLE "rh"."employee_shifts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."employee_spouses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."employees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."equipment_rental_approvals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."equipment_rental_payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "equipment_rental_payments_delete_policy" ON "rh"."equipment_rental_payments" FOR DELETE USING (true);



CREATE POLICY "equipment_rental_payments_insert_policy" ON "rh"."equipment_rental_payments" FOR INSERT WITH CHECK (true);



CREATE POLICY "equipment_rental_payments_select_policy" ON "rh"."equipment_rental_payments" FOR SELECT USING (true);



CREATE POLICY "equipment_rental_payments_update_policy" ON "rh"."equipment_rental_payments" FOR UPDATE USING (true);



ALTER TABLE "rh"."equipment_rentals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "equipment_rentals_delete_policy" ON "rh"."equipment_rentals" FOR DELETE USING (true);



CREATE POLICY "equipment_rentals_insert_policy" ON "rh"."equipment_rentals" FOR INSERT WITH CHECK (true);



CREATE POLICY "equipment_rentals_select_policy" ON "rh"."equipment_rentals" FOR SELECT USING (true);



CREATE POLICY "equipment_rentals_update_policy" ON "rh"."equipment_rentals" FOR UPDATE USING (true);



ALTER TABLE "rh"."esocial_batches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."esocial_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."esocial_integration_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."esocial_processed_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."esocial_validation_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."esocial_validations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."funcionario_beneficios_historico" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "funcionario_beneficios_historico_company_isolation" ON "rh"."funcionario_beneficios_historico" USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "rh"."employees"
  WHERE ("employees"."company_id" IN ( SELECT "companies"."id"
           FROM "core"."companies"
          WHERE ("companies"."id" IN ( SELECT "user_companies"."company_id"
                   FROM "core"."user_companies"
                  WHERE ("user_companies"."user_id" = "auth"."uid"()))))))));



ALTER TABLE "rh"."funcionario_convenio_dependentes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "funcionario_convenio_dependentes_company_isolation" ON "rh"."funcionario_convenio_dependentes" USING (("funcionario_convenio_id" IN ( SELECT "funcionario_convenios"."id"
   FROM "rh"."funcionario_convenios"
  WHERE ("funcionario_convenios"."employee_id" IN ( SELECT "employees"."id"
           FROM "rh"."employees"
          WHERE ("employees"."company_id" IN ( SELECT "companies"."id"
                   FROM "core"."companies"
                  WHERE ("companies"."id" IN ( SELECT "user_companies"."company_id"
                           FROM "core"."user_companies"
                          WHERE ("user_companies"."user_id" = "auth"."uid"()))))))))));



ALTER TABLE "rh"."funcionario_convenios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "funcionario_convenios_company_isolation" ON "rh"."funcionario_convenios" USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "rh"."employees"
  WHERE ("employees"."company_id" IN ( SELECT "companies"."id"
           FROM "core"."companies"
          WHERE ("companies"."id" IN ( SELECT "user_companies"."company_id"
                   FROM "core"."user_companies"
                  WHERE ("user_companies"."user_id" = "auth"."uid"()))))))));



ALTER TABLE "rh"."funcionario_elegibilidade" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "funcionario_elegibilidade_company_isolation" ON "rh"."funcionario_elegibilidade" USING (("employee_id" IN ( SELECT "employees"."id"
   FROM "rh"."employees"
  WHERE ("employees"."company_id" IN ( SELECT "companies"."id"
           FROM "core"."companies"
          WHERE ("companies"."id" IN ( SELECT "user_companies"."company_id"
                   FROM "core"."user_companies"
                  WHERE ("user_companies"."user_id" = "auth"."uid"()))))))));



ALTER TABLE "rh"."hiring_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."holidays" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."income_statements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."job_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."job_openings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."job_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."medical_certificates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."notification_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."payroll" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."payroll_accounting_provisions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."payroll_calculation_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."payroll_calculation_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."payroll_calculations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."payroll_cnab_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."payroll_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."payroll_consolidation_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."payroll_consolidation_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."payroll_event_validations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."payroll_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."payroll_financial_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."payroll_generated_titles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."payroll_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."payroll_payment_batches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."payroll_rubricas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."payroll_slips" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."payroll_tax_guides" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."payroll_validation_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."payroll_validations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."periodic_exams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."positions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."report_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."report_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."schedule_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."selection_processes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."selection_stages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."stage_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."talent_pool" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."time_bank" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."time_record_correction_control" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "time_record_correction_control_insert_policy" ON "rh"."time_record_correction_control" FOR INSERT WITH CHECK (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "time_record_correction_control_select_policy" ON "rh"."time_record_correction_control" FOR SELECT USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



CREATE POLICY "time_record_correction_control_update_policy" ON "rh"."time_record_correction_control" FOR UPDATE USING (("company_id" IN ( SELECT "user_companies"."company_id"
   FROM "core"."user_companies"
  WHERE ("user_companies"."user_id" = "auth"."uid"()))));



ALTER TABLE "rh"."time_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."transporte_configs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "transporte_configs_company_isolation" ON "rh"."transporte_configs" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "core"."companies"
  WHERE ("companies"."id" IN ( SELECT "user_companies"."company_id"
           FROM "core"."user_companies"
          WHERE ("user_companies"."user_id" = "auth"."uid"()))))));



ALTER TABLE "rh"."unions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."user_dashboard_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."user_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."vacation_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."vacation_periods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."vacations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."vr_va_configs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vr_va_configs_company_isolation" ON "rh"."vr_va_configs" USING (("company_id" IN ( SELECT "companies"."id"
   FROM "core"."companies"
  WHERE ("companies"."id" IN ( SELECT "user_companies"."company_id"
           FROM "core"."user_companies"
          WHERE ("user_companies"."user_id" = "auth"."uid"()))))));



ALTER TABLE "rh"."work_shift_patterns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."work_shift_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "rh"."work_shifts" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "rh" TO "authenticated";
GRANT USAGE ON SCHEMA "rh" TO "anon";
GRANT USAGE ON SCHEMA "rh" TO "service_role";
GRANT USAGE ON SCHEMA "rh" TO PUBLIC;



GRANT ALL ON FUNCTION "rh"."atualizar_banco_horas"() TO "authenticated";
GRANT ALL ON FUNCTION "rh"."atualizar_banco_horas"() TO "anon";
GRANT ALL ON FUNCTION "rh"."atualizar_banco_horas"() TO "service_role";



GRANT ALL ON FUNCTION "rh"."calcular_banco_horas"("p_employee_id" "uuid", "p_data_inicio" "date", "p_data_fim" "date") TO "authenticated";
GRANT ALL ON FUNCTION "rh"."calcular_banco_horas"("p_employee_id" "uuid", "p_data_inicio" "date", "p_data_fim" "date") TO "anon";
GRANT ALL ON FUNCTION "rh"."calcular_banco_horas"("p_employee_id" "uuid", "p_data_inicio" "date", "p_data_fim" "date") TO "service_role";



GRANT ALL ON FUNCTION "rh"."calcular_horas_trabalhadas"("p_employee_id" "uuid", "p_data" "date") TO "authenticated";
GRANT ALL ON FUNCTION "rh"."calcular_horas_trabalhadas"("p_employee_id" "uuid", "p_data" "date") TO "anon";
GRANT ALL ON FUNCTION "rh"."calcular_horas_trabalhadas"("p_employee_id" "uuid", "p_data" "date") TO "service_role";



GRANT ALL ON FUNCTION "rh"."calcular_salario_liquido"("p_employee_id" "uuid", "p_competencia" "text") TO "authenticated";
GRANT ALL ON FUNCTION "rh"."calcular_salario_liquido"("p_employee_id" "uuid", "p_competencia" "text") TO "anon";
GRANT ALL ON FUNCTION "rh"."calcular_salario_liquido"("p_employee_id" "uuid", "p_competencia" "text") TO "service_role";



GRANT ALL ON FUNCTION "rh"."calculate_all_equipment_absence_discounts"("p_company_id" "uuid", "p_period" "text") TO "authenticated";



GRANT ALL ON FUNCTION "rh"."calculate_equipment_absence_discount"("p_equipment_rental_id" "uuid", "p_company_id" "uuid", "p_period" "text") TO "authenticated";



GRANT ALL ON FUNCTION "rh"."generate_absence_discount_report"("p_company_id" "uuid", "p_period" "text") TO "authenticated";



GRANT ALL ON FUNCTION "rh"."get_employee_absence_days"("p_employee_id" "uuid", "p_company_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";



GRANT ALL ON FUNCTION "rh"."relatorio_headcount"("p_company_id" "uuid", "p_data_inicio" "date", "p_data_fim" "date") TO "authenticated";
GRANT ALL ON FUNCTION "rh"."relatorio_headcount"("p_company_id" "uuid", "p_data_inicio" "date", "p_data_fim" "date") TO "anon";
GRANT ALL ON FUNCTION "rh"."relatorio_headcount"("p_company_id" "uuid", "p_data_inicio" "date", "p_data_fim" "date") TO "service_role";



GRANT ALL ON FUNCTION "rh"."validar_ponto"("p_employee_id" "uuid", "p_data" "date", "p_hora_entrada" time without time zone, "p_hora_saida" time without time zone) TO "authenticated";
GRANT ALL ON FUNCTION "rh"."validar_ponto"("p_employee_id" "uuid", "p_data" "date", "p_hora_entrada" time without time zone, "p_hora_saida" time without time zone) TO "anon";
GRANT ALL ON FUNCTION "rh"."validar_ponto"("p_employee_id" "uuid", "p_data" "date", "p_hora_entrada" time without time zone, "p_hora_saida" time without time zone) TO "service_role";



GRANT ALL ON FUNCTION "rh"."validar_ponto_automatico"() TO "authenticated";
GRANT ALL ON FUNCTION "rh"."validar_ponto_automatico"() TO "anon";
GRANT ALL ON FUNCTION "rh"."validar_ponto_automatico"() TO "service_role";



GRANT ALL ON FUNCTION "rh"."verificar_ferias_solicitadas"() TO "authenticated";
GRANT ALL ON FUNCTION "rh"."verificar_ferias_solicitadas"() TO "anon";
GRANT ALL ON FUNCTION "rh"."verificar_ferias_solicitadas"() TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employees" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employees" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employees" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employees" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."periodic_exams" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."periodic_exams" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."periodic_exams" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."periodic_exams" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."absence_types" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."absence_types" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."absence_types" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."absence_types" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vacation_notifications" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vacation_notifications" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vacation_notifications" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vacation_notifications" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."alertas_ferias_criticos" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."alertas_ferias_criticos" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."alertas_ferias_criticos" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."alertas_ferias_criticos" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."allowance_types" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."allowance_types" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."allowance_types" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."allowance_types" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."analytics_cache" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."analytics_cache" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."analytics_cache" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."analytics_cache" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."attendance_corrections" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."attendance_corrections" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."attendance_corrections" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."attendance_corrections" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_elegibilidade" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_elegibilidade" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_elegibilidade" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_elegibilidade" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_elegibilidade_cargos" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_elegibilidade_cargos" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_elegibilidade_cargos" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_elegibilidade_cargos" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_elegibilidade_departamentos" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_elegibilidade_departamentos" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_elegibilidade_departamentos" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_elegibilidade_departamentos" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_rateio_departamentos" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_rateio_departamentos" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_rateio_departamentos" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_rateio_departamentos" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_rateio_historico" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_rateio_historico" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_rateio_historico" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_rateio_historico" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_rateios" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_rateios" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_rateios" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_rateios" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_tipos" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_tipos" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_tipos" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficio_tipos" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficios_descontos_afastamento" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficios_descontos_afastamento" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficios_descontos_afastamento" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficios_descontos_afastamento" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficios_elegibilidade" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficios_elegibilidade" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficios_elegibilidade" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficios_elegibilidade" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficios_rateios" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficios_rateios" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficios_rateios" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."beneficios_rateios" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."benefits" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."benefits" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."benefits" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."benefits" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."candidate_upload_links" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."candidate_upload_links" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."candidate_upload_links" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."candidate_upload_links" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."candidates" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."candidates" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."candidates" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."candidates" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."cid_codes" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."cid_codes" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."cid_codes" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."cid_codes" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."compensation_requests" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."compensation_requests" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."compensation_requests" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."compensation_requests" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."convenios_empresas" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."convenios_empresas" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."convenios_empresas" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."convenios_empresas" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."convenios_planos" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."convenios_planos" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."convenios_planos" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."convenios_planos" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."dashboard_alerts" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."dashboard_alerts" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."dashboard_alerts" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."dashboard_alerts" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."dashboard_configs" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."dashboard_configs" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."dashboard_configs" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."dashboard_configs" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vacations" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vacations" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vacations" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vacations" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."dashboard_ferias" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."dashboard_ferias" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."dashboard_ferias" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."dashboard_ferias" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."deficiency_degrees" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."deficiency_degrees" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."deficiency_degrees" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."deficiency_degrees" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."deficiency_types" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."deficiency_types" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."deficiency_types" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."deficiency_types" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."delay_reasons" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."delay_reasons" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."delay_reasons" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."delay_reasons" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."dependent_types" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."dependent_types" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."dependent_types" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."dependent_types" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_absences" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_absences" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_absences" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_absences" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_addresses" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_addresses" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_addresses" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_addresses" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_allowances" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_allowances" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_allowances" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_allowances" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_bank_accounts" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_bank_accounts" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_bank_accounts" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_bank_accounts" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_benefit_assignments" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_benefit_assignments" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_benefit_assignments" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_benefit_assignments" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_benefits" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_benefits" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_benefits" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_benefits" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_delay_records" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_delay_records" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_delay_records" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_delay_records" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_dependents" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_dependents" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_dependents" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_dependents" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_discounts" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_discounts" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_discounts" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_discounts" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_documents" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_documents" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_documents" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_documents" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_education" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_education" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_education" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_education" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_history" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_history" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_history" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_history" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_movement_types" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_movement_types" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_movement_types" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_movement_types" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_pcd_info" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_pcd_info" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_pcd_info" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_pcd_info" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_shifts" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_shifts" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_shifts" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_shifts" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_spouses" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_spouses" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_spouses" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_spouses" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_tax_calculations" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_tax_calculations" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_tax_calculations" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employee_tax_calculations" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employment_contracts" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employment_contracts" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employment_contracts" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."employment_contracts" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."equipment_rental_approvals" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."equipment_rental_approvals" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."equipment_rental_approvals" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."equipment_rental_approvals" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."equipment_rental_payments" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."equipment_rental_payments" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."equipment_rental_payments" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."equipment_rental_payments" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."equipment_rentals" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."equipment_rentals" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."equipment_rentals" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."equipment_rentals" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_batches" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_batches" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_batches" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_batches" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_benefit_types" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_benefit_types" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_benefit_types" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_benefit_types" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_categories" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_categories" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_categories" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_categories" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_events" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_events" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_events" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_events" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_integration_config" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_integration_config" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_integration_config" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_integration_config" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_leave_types" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_leave_types" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_leave_types" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_leave_types" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_naturezas_rubricas" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_naturezas_rubricas" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_naturezas_rubricas" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_naturezas_rubricas" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_processed_events" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_processed_events" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_processed_events" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_processed_events" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_validation_history" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_validation_history" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_validation_history" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_validation_history" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_validations" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_validations" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_validations" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."esocial_validations" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."fgts_config" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."fgts_config" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."fgts_config" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."fgts_config" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."funcionario_beneficios_historico" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."funcionario_beneficios_historico" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."funcionario_beneficios_historico" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."funcionario_beneficios_historico" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."funcionario_convenio_dependentes" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."funcionario_convenio_dependentes" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."funcionario_convenio_dependentes" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."funcionario_convenio_dependentes" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."funcionario_convenios" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."funcionario_convenios" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."funcionario_convenios" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."funcionario_convenios" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."funcionario_elegibilidade" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."funcionario_elegibilidade" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."funcionario_elegibilidade" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."funcionario_elegibilidade" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."hiring_documents" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."hiring_documents" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."hiring_documents" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."hiring_documents" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."holidays" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."holidays" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."holidays" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."holidays" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."income_statements" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."income_statements" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."income_statements" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."income_statements" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."inss_brackets" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."inss_brackets" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."inss_brackets" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."inss_brackets" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."irrf_brackets" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."irrf_brackets" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."irrf_brackets" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."irrf_brackets" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."job_applications" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."job_applications" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."job_applications" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."job_applications" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."job_openings" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."job_openings" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."job_openings" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."job_openings" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."job_requests" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."job_requests" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."job_requests" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."job_requests" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."kinship_degrees" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."kinship_degrees" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."kinship_degrees" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."kinship_degrees" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."medical_certificates" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."medical_certificates" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."medical_certificates" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."medical_certificates" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."notification_history" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."notification_history" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."notification_history" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."notification_history" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_accounting_provisions" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_accounting_provisions" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_accounting_provisions" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_accounting_provisions" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_calculation_config" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_calculation_config" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_calculation_config" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_calculation_config" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_calculation_items" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_calculation_items" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_calculation_items" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_calculation_items" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_calculations" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_calculations" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_calculations" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_calculations" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_cnab_files" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_cnab_files" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_cnab_files" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_cnab_files" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_config" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_config" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_config" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_config" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_consolidation_config" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_consolidation_config" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_consolidation_config" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_consolidation_config" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_consolidation_history" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_consolidation_history" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_consolidation_history" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_consolidation_history" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_event_validations" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_event_validations" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_event_validations" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_event_validations" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_events" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_events" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_events" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_events" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_financial_config" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_financial_config" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_financial_config" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_financial_config" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_generated_titles" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_generated_titles" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_generated_titles" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_generated_titles" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_items" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_items" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_items" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_items" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_payment_batches" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_payment_batches" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_payment_batches" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_payment_batches" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_rubricas" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_rubricas" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_rubricas" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_rubricas" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_slips" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_slips" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_slips" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_slips" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_tax_guides" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_tax_guides" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_tax_guides" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_tax_guides" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_validation_history" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_validation_history" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_validation_history" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_validation_history" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_validations" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_validations" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_validations" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."payroll_validations" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."positions" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."positions" TO "authenticated";
GRANT ALL ON TABLE "rh"."positions" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."positions" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."report_history" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."report_history" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."report_history" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."report_history" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."report_templates" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."report_templates" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."report_templates" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."report_templates" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."rubricas" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."rubricas" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."rubricas" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."rubricas" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."schedule_entries" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."schedule_entries" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."schedule_entries" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."schedule_entries" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."selection_processes" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."selection_processes" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."selection_processes" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."selection_processes" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."selection_stages" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."selection_stages" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."selection_stages" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."selection_stages" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."stage_results" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."stage_results" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."stage_results" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."stage_results" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."talent_pool" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."talent_pool" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."talent_pool" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."talent_pool" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."time_bank" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."time_bank" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."time_bank" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."time_bank" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."time_record_correction_control" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."time_record_correction_control" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."time_record_correction_control" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."time_record_correction_control" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."time_records" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."time_records" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."time_records" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."time_records" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."transporte_configs" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."transporte_configs" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."transporte_configs" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."transporte_configs" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."unions" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."unions" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."unions" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."unions" TO PUBLIC;



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."units" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."units" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."units" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."units" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."user_dashboard_preferences" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."user_dashboard_preferences" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."user_dashboard_preferences" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."user_dashboard_preferences" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."user_settings" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."user_settings" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."user_settings" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."user_settings" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vacation_periods" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vacation_periods" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vacation_periods" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vacation_periods" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vr_va_configs" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vr_va_configs" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vr_va_configs" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vr_va_configs" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vw_employee_benefit_assignments" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vw_employee_benefit_assignments" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vw_employee_benefit_assignments" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vw_employee_benefit_assignments" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vw_periodic_exams_report" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vw_periodic_exams_report" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vw_periodic_exams_report" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."vw_periodic_exams_report" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."work_shift_patterns" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."work_shift_patterns" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."work_shift_patterns" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."work_shift_patterns" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."work_shift_templates" TO PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."work_shift_templates" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."work_shift_templates" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."work_shift_templates" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."work_shifts" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."work_shifts" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."work_shifts" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "rh"."work_shifts" TO PUBLIC;



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "rh" GRANT SELECT,USAGE ON SEQUENCES TO PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "rh" GRANT SELECT,USAGE ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "rh" GRANT SELECT,USAGE ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "rh" GRANT SELECT,USAGE ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "rh" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "rh" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "rh" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "rh" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "service_role";



RESET ALL;
