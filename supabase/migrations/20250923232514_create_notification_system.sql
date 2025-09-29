-- Sistema de Notificações para Registro de Ponto
-- Criar tabelas necessárias para o sistema de lembretes

-- 1. Tabela para configurações de usuário
CREATE TABLE IF NOT EXISTS rh.user_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    setting_type VARCHAR(50) NOT NULL,
    time_reminder_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    UNIQUE(user_id, setting_type)
);

-- 2. Tabela para histórico de notificações enviadas
CREATE TABLE IF NOT EXISTS rh.notification_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    was_delivered BOOLEAN DEFAULT false,
    was_clicked BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'
);

-- 3. Habilitar RLS nas tabelas
ALTER TABLE rh.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.notification_history ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para user_settings
CREATE POLICY "Users can view own settings" 
    ON rh.user_settings FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings" 
    ON rh.user_settings FOR INSERT 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings" 
    ON rh.user_settings FOR UPDATE 
    USING (user_id = auth.uid());

-- 5. Políticas RLS para notification_history
CREATE POLICY "Users can view own notifications" 
    ON rh.notification_history FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" 
    ON rh.notification_history FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Users can update own notifications" 
    ON rh.notification_history FOR UPDATE 
    USING (user_id = auth.uid());

-- 6. Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON rh.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_type ON rh.user_settings(setting_type);
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON rh.notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON rh.notification_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_history_type ON rh.notification_history(notification_type);

-- 7. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Trigger para user_settings
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON rh.user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON rh.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Função para obter configurações de lembrete de um usuário
CREATE OR REPLACE FUNCTION rh.get_user_reminder_settings(p_user_id UUID)
RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Função para salvar configurações de lembrete
CREATE OR REPLACE FUNCTION rh.save_user_reminder_settings(
    p_user_id UUID,
    p_settings JSONB
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO rh.user_settings (user_id, setting_type, time_reminder_settings)
    VALUES (p_user_id, 'time_reminders', p_settings)
    ON CONFLICT (user_id, setting_type)
    DO UPDATE SET 
        time_reminder_settings = p_settings,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Função para registrar notificação enviada
CREATE OR REPLACE FUNCTION rh.log_notification(
    p_user_id UUID,
    p_notification_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Função para obter estatísticas de notificações
CREATE OR REPLACE FUNCTION rh.get_notification_stats(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Inserir configurações padrão para usuários existentes (opcional)
-- INSERT INTO rh.user_settings (user_id, setting_type, time_reminder_settings)
-- SELECT 
--     u.id,
--     'time_reminders',
--     '{
--         "enabled": false,
--         "entrada_reminder": true,
--         "saida_reminder": true,
--         "intervalo_reminder": true,
--         "entrada_time": "08:00",
--         "saida_time": "17:00",
--         "intervalo_inicio_time": "12:00",
--         "intervalo_fim_time": "13:00",
--         "custom_message": ""
--     }'::jsonb
-- FROM core.users u
-- WHERE NOT EXISTS (
--     SELECT 1 FROM rh.user_settings us 
--     WHERE us.user_id = u.id 
--     AND us.setting_type = 'time_reminders'
-- );

-- 14. Comentários nas tabelas
COMMENT ON TABLE rh.user_settings IS 'Configurações personalizadas dos usuários do sistema';
COMMENT ON TABLE rh.notification_history IS 'Histórico de notificações enviadas para usuários';

COMMENT ON COLUMN rh.user_settings.setting_type IS 'Tipo de configuração (ex: time_reminders, preferences)';
COMMENT ON COLUMN rh.user_settings.time_reminder_settings IS 'Configurações específicas de lembretes de ponto em formato JSON';

COMMENT ON COLUMN rh.notification_history.notification_type IS 'Tipo de notificação (ex: time_reminder, system_alert)';
COMMENT ON COLUMN rh.notification_history.was_delivered IS 'Se a notificação foi entregue com sucesso';
COMMENT ON COLUMN rh.notification_history.was_clicked IS 'Se o usuário clicou na notificação';
COMMENT ON COLUMN rh.notification_history.metadata IS 'Dados adicionais da notificação em formato JSON';
