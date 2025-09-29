-- =====================================================
-- CONFIGURAÇÃO DE EXECUÇÃO AUTOMÁTICA
-- SISTEMA DE NOTIFICAÇÕES DE FÉRIAS
-- =====================================================

-- =====================================================
-- 1. FUNÇÃO PARA LIMPEZA DE NOTIFICAÇÕES EXPIRADAS
-- =====================================================

-- Função para limpar notificações expiradas e antigas
CREATE OR REPLACE FUNCTION rh.limpar_notificacoes_expiradas()
RETURNS INTEGER
LANGUAGE plpgsql
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

-- =====================================================
-- 2. FUNÇÃO PRINCIPAL DE MANUTENÇÃO
-- =====================================================

-- Função principal que executa todas as verificações de férias
CREATE OR REPLACE FUNCTION rh.executar_verificacoes_ferias_completa()
RETURNS JSON
LANGUAGE plpgsql
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

-- =====================================================
-- 3. CONFIGURAÇÃO DE CRON JOB (PostgreSQL com pg_cron)
-- =====================================================

/*
IMPORTANTE: Para usar pg_cron, você precisa ter a extensão instalada no Supabase.
Se não estiver disponível, use um cron job externo ou agendador de tarefas.

-- Habilitar extensão pg_cron (se disponível)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar execução diária às 08:00
SELECT cron.schedule(
    'verificacao-ferias-diaria',
    '0 8 * * *', -- Todos os dias às 08:00
    'SELECT rh.executar_verificacoes_ferias_completa();'
);

-- Agendar limpeza semanal aos domingos às 02:00
SELECT cron.schedule(
    'limpeza-notificacoes-semanal',
    '0 2 * * 0', -- Domingos às 02:00
    'SELECT rh.limpar_notificacoes_expiradas();'
);

-- Verificar jobs agendados
SELECT * FROM cron.job;

-- Remover job (se necessário)
SELECT cron.unschedule('verificacao-ferias-diaria');
*/

-- =====================================================
-- 4. FUNÇÕES DE MONITORAMENTO
-- =====================================================

-- Função para verificar status do sistema de notificações
CREATE OR REPLACE FUNCTION rh.status_sistema_notificacoes()
RETURNS TABLE (
    total_funcionarios INTEGER,
    funcionarios_com_direito INTEGER,
    notificacoes_ativas INTEGER,
    notificacoes_criticas INTEGER,
    notificacoes_altas INTEGER,
    notificacoes_medias INTEGER,
    ultima_execucao TIMESTAMP WITH TIME ZONE,
    proxima_verificacao TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
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

-- =====================================================
-- 5. FUNÇÃO PARA TESTE MANUAL
-- =====================================================

-- Função para testar o sistema com dados de exemplo
CREATE OR REPLACE FUNCTION rh.testar_sistema_notificacoes()
RETURNS JSON
LANGUAGE plpgsql
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

-- =====================================================
-- 6. VIEWS PARA DASHBOARD
-- =====================================================

-- View para dashboard de férias
CREATE OR REPLACE VIEW rh.dashboard_ferias AS
SELECT 
    e.company_id,
    COUNT(*) as total_funcionarios,
    COUNT(*) FILTER (WHERE vs.status_ferias = 'vencida') as ferias_vencidas,
    COUNT(*) FILTER (WHERE vs.status_ferias = 'vencendo') as ferias_vencendo,
    COUNT(*) FILTER (WHERE vs.status_ferias = 'atencao') as ferias_atencao,
    COUNT(*) FILTER (WHERE vs.status_ferias = 'ok') as ferias_ok,
    COUNT(*) FILTER (WHERE vr.tem_direito = TRUE) as com_direito_ferias,
    AVG(vs.dias_restantes) FILTER (WHERE vs.dias_restantes > 0) as media_dias_restantes
FROM rh.employees e
LEFT JOIN rh.calcular_status_ferias(e.id) vs ON TRUE
    LEFT JOIN rh.calcular_direito_ferias(e.id) vr ON TRUE
    WHERE e.status = 'ativo'
    GROUP BY e.company_id;

-- View para alertas críticos
CREATE OR REPLACE VIEW rh.alertas_ferias_criticos AS
SELECT 
    e.nome as funcionario,
    e.email,
    e.company_id,
    vn.title,
    vn.message,
    vn.priority,
    vn.due_date,
    vn.days_remaining,
    vn.created_at
FROM rh.vacation_notifications vn
JOIN rh.employees e ON e.id = vn.employee_id
WHERE vn.is_active = TRUE
AND vn.priority IN ('critical', 'high')
AND (vn.expires_at IS NULL OR vn.expires_at > NOW())
ORDER BY 
    CASE vn.priority 
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
    END,
    vn.days_remaining ASC;

-- =====================================================
-- 7. INSTRUÇÕES DE IMPLEMENTAÇÃO
-- =====================================================

/*
INSTRUÇÕES PARA IMPLEMENTAR O SISTEMA DE NOTIFICAÇÕES:

1. EXECUTAR OS SCRIPTS:
   - Primeiro: vacation_notifications_system.sql
   - Segundo: vacation_notifications_cron_setup.sql

2. CONFIGURAR EXECUÇÃO AUTOMÁTICA:
   
   OPÇÃO A - Se pg_cron estiver disponível no Supabase:
   - Descomente as linhas do pg_cron no script
   - Execute os comandos SELECT cron.schedule()
   
   OPÇÃO B - Cron job externo (recomendado):
   - Configure um cron job no servidor para executar diariamente:
     curl -X POST 'https://seu-projeto.supabase.co/rest/v1/rpc/executar_verificacoes_ferias_completa' \
     -H "apikey: sua-api-key" \
     -H "Authorization: Bearer sua-api-key" \
     -H "Content-Type: application/json"
   
   OPÇÃO C - Edge Function do Supabase:
   - Crie uma Edge Function que execute a função
   - Configure um cron job para chamar a Edge Function

3. TESTAR O SISTEMA:
   - Execute: SELECT rh.testar_sistema_notificacoes();
   - Verifique: SELECT * FROM rh.status_sistema_notificacoes();
   - Monitore: SELECT * FROM rh.dashboard_ferias;

4. MONITORAMENTO:
   - Use as views para criar dashboards
   - Configure alertas para notificações críticas
   - Monitore a execução regular das verificações

5. MANUTENÇÃO:
   - Execute limpeza manual se necessário: SELECT rh.limpar_notificacoes_expiradas();
   - Verifique logs do sistema periodicamente
   - Ajuste frequências conforme necessário
*/
