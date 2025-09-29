-- =====================================================
-- SISTEMA DE NOTIFICAÇÕES DE FÉRIAS
-- =====================================================
-- Este arquivo cria um sistema completo de notificações
-- para alertar sobre férias vencidas e próximas do vencimento

-- =====================================================
-- 1. TABELA DE NOTIFICAÇÕES
-- =====================================================

-- Criar tabela para armazenar notificações do sistema
CREATE TABLE IF NOT EXISTS rh.vacation_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    company_id UUID,
    employee_id UUID NOT NULL,
    notification_type TEXT NOT NULL, -- 'ferias_disponivel', 'ferias_vencendo', 'ferias_vencida'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    due_date DATE, -- Data limite para a ação
    days_remaining INTEGER, -- Dias restantes até o vencimento
    is_read BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT vacation_notifications_pkey PRIMARY KEY (id),
    CONSTRAINT vacation_notifications_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES core.companies (id),
    CONSTRAINT vacation_notifications_employee_id_fkey 
        FOREIGN KEY (employee_id) REFERENCES rh.employees (id),
    CONSTRAINT vacation_notifications_type_check 
        CHECK (notification_type IN ('ferias_disponivel', 'ferias_vencendo', 'ferias_vencida')),
    CONSTRAINT vacation_notifications_priority_check 
        CHECK (priority IN ('low', 'medium', 'high', 'critical'))
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_vacation_notifications_employee_id 
    ON rh.vacation_notifications (employee_id);
CREATE INDEX IF NOT EXISTS idx_vacation_notifications_type 
    ON rh.vacation_notifications (notification_type);
CREATE INDEX IF NOT EXISTS idx_vacation_notifications_priority 
    ON rh.vacation_notifications (priority);
CREATE INDEX IF NOT EXISTS idx_vacation_notifications_active 
    ON rh.vacation_notifications (is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_vacation_notifications_due_date 
    ON rh.vacation_notifications (due_date) WHERE due_date IS NOT NULL;

-- =====================================================
-- 2. FUNÇÕES DE CÁLCULO DE FÉRIAS
-- =====================================================

-- Função para calcular se o funcionário já tem direito a férias (1 ano de trabalho)
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

-- Função para calcular férias vencidas e próximas do vencimento
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
-- 3. FUNÇÃO PARA GERAR NOTIFICAÇÕES
-- =====================================================

-- Função para gerar notificações de férias
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
                    priority, due_date, days_remaining, expires_at
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
-- 4. TRIGGER PARA ATUALIZAR NOTIFICAÇÕES
-- =====================================================

-- Função para limpar notificações antigas quando férias são aprovadas
CREATE OR REPLACE FUNCTION rh.limpar_notificacoes_apos_ferias()
RETURNS TRIGGER
LANGUAGE plpgsql
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

-- Criar trigger para limpar notificações após aprovação de férias
DROP TRIGGER IF EXISTS trigger_limpar_notificacoes_ferias ON rh.vacations;
CREATE TRIGGER trigger_limpar_notificacoes_ferias
    AFTER UPDATE ON rh.vacations
    FOR EACH ROW
    EXECUTE FUNCTION rh.limpar_notificacoes_apos_ferias();

-- =====================================================
-- 5. FUNÇÕES DE CONSULTA
-- =====================================================

-- Função para buscar notificações de um funcionário
CREATE OR REPLACE FUNCTION rh.buscar_notificacoes_ferias(
    employee_id_param UUID,
    include_inactive BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    id UUID,
    notification_type TEXT,
    title TEXT,
    message TEXT,
    priority TEXT,
    due_date DATE,
    days_remaining INTEGER,
    is_read BOOLEAN,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
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

-- Função para marcar notificação como lida
CREATE OR REPLACE FUNCTION rh.marcar_notificacao_lida(notification_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE rh.vacation_notifications 
    SET is_read = TRUE, read_at = NOW()
    WHERE id = notification_id_param;
    
    RETURN FOUND;
END;
$$;

-- Função para obter relatório de férias da empresa
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
-- 6. CONFIGURAÇÃO DE PERMISSÕES
-- =====================================================

-- Habilitar RLS na tabela de notificações
ALTER TABLE rh.vacation_notifications ENABLE ROW LEVEL SECURITY;

-- Política para funcionários verem apenas suas próprias notificações
CREATE POLICY "Funcionários podem ver suas notificações" ON rh.vacation_notifications
    FOR SELECT USING (
        employee_id IN (
            SELECT id FROM rh.employees 
            WHERE id = auth.uid()::text::uuid
        )
    );

-- Política para RH ver todas as notificações da empresa
CREATE POLICY "RH pode ver todas as notificações da empresa" ON rh.vacation_notifications
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM rh.employees 
            WHERE id = auth.uid()::text::uuid
        )
    );

-- =====================================================
-- 7. INSTRUÇÕES DE USO
-- =====================================================

/*
INSTRUÇÕES DE USO DO SISTEMA DE NOTIFICAÇÕES DE FÉRIAS:

1. EXECUÇÃO MANUAL:
   - Para gerar notificações para todos os funcionários:
     SELECT rh.gerar_notificacoes_ferias();
   
   - Para gerar notificação para um funcionário específico:
     SELECT rh.gerar_notificacoes_ferias('uuid-do-funcionario');

2. EXECUÇÃO AUTOMÁTICA (CRON JOB):
   - Configure um cron job para executar diariamente:
     SELECT rh.gerar_notificacoes_ferias();

3. CONSULTAS ÚTEIS:
   - Ver notificações de um funcionário:
     SELECT * FROM rh.buscar_notificacoes_ferias('uuid-do-funcionario');
   
   - Ver relatório da empresa:
     SELECT * FROM rh.relatorio_ferias_empresa('uuid-da-empresa');
   
   - Marcar notificação como lida:
     SELECT rh.marcar_notificacao_lida('uuid-da-notificacao');

4. TIPOS DE NOTIFICAÇÃO:
   - 'ferias_disponivel': Funcionário tem direito a férias
   - 'ferias_vencendo': Férias vencem em até 3 meses
   - 'ferias_vencida': Férias já vencidas (crítico)

5. NÍVEIS DE PRIORIDADE:
   - 'critical': Férias vencidas
   - 'high': Férias vencendo em até 90 dias
   - 'medium': Férias disponíveis
   - 'low': Informações gerais
*/
