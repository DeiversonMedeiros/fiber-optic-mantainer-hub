-- =====================================================
-- CORREÇÃO DOS CAMPOS DA TABELA EMPLOYEES
-- SISTEMA DE NOTIFICAÇÕES DE FÉRIAS
-- =====================================================
-- Este script corrige as funções que foram criadas com
-- campos incorretos da tabela rh.employees

-- =====================================================
-- 1. CORRIGIR FUNÇÃO calcular_direito_ferias
-- =====================================================

CREATE OR REPLACE FUNCTION rh.calcular_direito_ferias(employee_id_param UUID)
RETURNS TABLE (
    tem_direito BOOLEAN,
    dias_trabalhados INTEGER,
    data_direito DATE,
    dias_restantes INTEGER
) 
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
        RETURN QUERY SELECT FALSE, 0, NULL, 0;
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

-- =====================================================
-- 2. CORRIGIR FUNÇÃO calcular_status_ferias
-- =====================================================

CREATE OR REPLACE FUNCTION rh.calcular_status_ferias(employee_id_param UUID)
RETURNS TABLE (
    ultima_feria DATE,
    dias_sem_ferias INTEGER,
    data_vencimento DATE,
    status_ferias TEXT,
    dias_restantes INTEGER,
    nivel_criticidade TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    hire_date_val DATE;
    last_vacation DATE;
    days_without_vacation INTEGER;
    expiration_date DATE;
    remaining_days INTEGER;
    criticality_level TEXT;
BEGIN
    -- Buscar data de admissão do funcionário
    SELECT data_admissao INTO hire_date_val
    FROM rh.employees 
    WHERE id = employee_id_param AND status = 'ativo';
    
    IF hire_date_val IS NULL THEN
        RETURN QUERY SELECT NULL, 0, NULL, 'inativo', 0, 'low';
        RETURN;
    END IF;
    
    -- Buscar última férias aprovada
    SELECT MAX(data_fim) INTO last_vacation
    FROM rh.vacations 
    WHERE employee_id = employee_id_param 
    AND status = 'aprovado';
    
    -- Se nunca tirou férias, calcular desde a data de direito (1 ano após admissão)
    IF last_vacation IS NULL THEN
        last_vacation := hire_date_val + INTERVAL '1 year';
    END IF;
    
    -- Calcular dias sem férias
    days_without_vacation := CURRENT_DATE - last_vacation;
    
    -- Data limite (2 anos após última férias)
    expiration_date := last_vacation + INTERVAL '2 years';
    
    -- Dias restantes até o vencimento
    remaining_days := expiration_date - CURRENT_DATE;
    
    -- Determinar status e criticidade
    IF remaining_days <= 0 THEN
        status_ferias := 'vencida';
        criticality_level := 'critical';
    ELSIF remaining_days <= 90 THEN -- 3 meses
        status_ferias := 'vencendo';
        criticality_level := 'high';
    ELSIF remaining_days <= 180 THEN -- 6 meses
        status_ferias := 'atencao';
        criticality_level := 'medium';
    ELSE
        status_ferias := 'ok';
        criticality_level := 'low';
    END IF;
    
    RETURN QUERY SELECT last_vacation, days_without_vacation, expiration_date, status_ferias, remaining_days, criticality_level;
END;
$$;

-- =====================================================
-- 3. CORRIGIR FUNÇÃO gerar_notificacoes_ferias
-- =====================================================

CREATE OR REPLACE FUNCTION rh.gerar_notificacoes_ferias(employee_id_param UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
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

-- =====================================================
-- 4. CORRIGIR FUNÇÃO relatorio_ferias_empresa
-- =====================================================

CREATE OR REPLACE FUNCTION rh.relatorio_ferias_empresa(company_id_param UUID)
RETURNS TABLE (
    employee_id UUID,
    employee_name TEXT,
    hire_date DATE,
    ultima_feria DATE,
    dias_sem_ferias INTEGER,
    data_vencimento DATE,
    status_ferias TEXT,
    dias_restantes INTEGER,
    nivel_criticidade TEXT,
    tem_direito BOOLEAN
)
LANGUAGE plpgsql
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

-- =====================================================
-- 5. VERIFICAÇÃO FINAL
-- =====================================================

-- Testar se as correções funcionam
SELECT 'Teste das funções corrigidas:' as status;

-- Testar função de direito a férias
SELECT 'Teste calcular_direito_ferias:' as teste;
SELECT * FROM rh.calcular_direito_ferias(
    (SELECT id FROM rh.employees WHERE status = 'ativo' LIMIT 1)
);

-- Testar função de status de férias
SELECT 'Teste calcular_status_ferias:' as teste;
SELECT * FROM rh.calcular_status_ferias(
    (SELECT id FROM rh.employees WHERE status = 'ativo' LIMIT 1)
);

SELECT 'Correções aplicadas com sucesso!' as resultado;

