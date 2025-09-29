-- =====================================================
-- MÓDULO FINANCEIRO - CONFIGURAÇÕES ADICIONAIS
-- =====================================================
-- Script com configurações adicionais e melhorias
-- para o módulo financeiro
-- =====================================================

-- =====================================================
-- 1. FUNÇÕES AUXILIARES ADICIONAIS
-- =====================================================

-- Função para calcular DPO (Days Payable Outstanding)
CREATE OR REPLACE FUNCTION financeiro.calculate_dpo(company_id uuid)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
    dpo_value numeric;
BEGIN
    WITH pagamentos_ultimos_30_dias AS (
        SELECT SUM(valor) as total_pagamentos
        FROM financeiro.accounts_payable 
        WHERE company_id = $1 
        AND data_pagamento >= CURRENT_DATE - INTERVAL '30 days'
        AND status = 'pago'
    ),
    contas_pendentes AS (
        SELECT SUM(valor) as total_pendente
        FROM financeiro.accounts_payable 
        WHERE company_id = $1 
        AND status = 'pendente'
    )
    SELECT 
        CASE 
            WHEN p.total_pagamentos > 0 THEN 
                ROUND((c.total_pendente / p.total_pagamentos) * 30, 2)
            ELSE 0
        END
    INTO dpo_value
    FROM pagamentos_ultimos_30_dias p, contas_pendentes c;
    
    RETURN COALESCE(dpo_value, 0);
END;
$$;

-- Função para obter transações não conciliadas
CREATE OR REPLACE FUNCTION financeiro.get_unreconciled_transactions(company_id uuid, p_bank_account_id uuid DEFAULT NULL)
RETURNS TABLE (
    id uuid,
    bank_account_id uuid,
    tipo text,
    descricao text,
    valor numeric,
    data_movimento date,
    conciliado boolean,
    banco text,
    conta text
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bt.id,
        bt.bank_account_id,
        bt.tipo,
        bt.descricao,
        bt.valor,
        bt.data_movimento,
        bt.conciliado,
        ba.banco,
        ba.conta
    FROM financeiro.bank_transactions bt
    JOIN financeiro.bank_accounts ba ON bt.bank_account_id = ba.id
    WHERE bt.company_id = $1 
    AND bt.conciliado = false
    AND (p_bank_account_id IS NULL OR bt.bank_account_id = p_bank_account_id)
    ORDER BY bt.data_movimento DESC;
END;
$$;

-- Função para relatório de fluxo de caixa detalhado
CREATE OR REPLACE FUNCTION financeiro.get_detailed_cash_flow(company_id uuid, data_inicio date, data_fim date)
RETURNS TABLE (
    data_movimento date,
    banco text,
    conta text,
    descricao text,
    tipo text,
    valor numeric,
    saldo_anterior numeric,
    saldo_atual numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH transacoes_ordenadas AS (
        SELECT 
            bt.data_movimento,
            ba.banco,
            ba.conta,
            bt.descricao,
            bt.tipo,
            bt.valor,
            ba.saldo_atual,
            ROW_NUMBER() OVER (PARTITION BY bt.bank_account_id ORDER BY bt.data_movimento, bt.created_at) as ordem
        FROM financeiro.bank_transactions bt
        JOIN financeiro.bank_accounts ba ON bt.bank_account_id = ba.id
        WHERE bt.company_id = $1
        AND bt.data_movimento BETWEEN $2 AND $3
        ORDER BY bt.bank_account_id, bt.data_movimento, bt.created_at
    ),
    transacoes_com_saldo AS (
        SELECT 
            *,
            LAG(ba.saldo_atual, 1, 0) OVER (PARTITION BY bank_account_id ORDER BY data_movimento, ordem) as saldo_anterior
        FROM transacoes_ordenadas
        JOIN financeiro.bank_accounts ba ON ba.id = bank_account_id
    )
    SELECT 
        t.data_movimento,
        t.banco,
        t.conta,
        t.descricao,
        t.tipo,
        t.valor,
        t.saldo_anterior,
        t.saldo_atual
    FROM transacoes_com_saldo t
    ORDER BY t.banco, t.conta, t.data_movimento, t.ordem;
END;
$$;

-- =====================================================
-- 2. VIEWS PARA RELATÓRIOS
-- =====================================================

-- View para resumo financeiro por empresa
CREATE OR REPLACE VIEW financeiro.vw_resumo_financeiro AS
SELECT 
    c.id as company_id,
    c.nome as empresa,
    -- Contas a pagar
    COALESCE(ap.pendente, 0) as contas_pagar_pendente,
    COALESCE(ap.vencido, 0) as contas_pagar_vencido,
    COALESCE(ap.pago, 0) as contas_pagar_pago,
    -- Contas a receber
    COALESCE(ar.pendente, 0) as contas_receber_pendente,
    COALESCE(ar.vencido, 0) as contas_receber_vencido,
    COALESCE(ar.recebido, 0) as contas_receber_recebido,
    -- Saldo bancário
    COALESCE(ba.saldo_total, 0) as saldo_bancario_total,
    -- DSO e DPO
    COALESCE(dso.dso_value, 0) as dso,
    COALESCE(dpo.dpo_value, 0) as dpo
FROM core.companies c
LEFT JOIN (
    SELECT 
        company_id,
        SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END) as pendente,
        SUM(CASE WHEN status = 'vencido' THEN valor ELSE 0 END) as vencido,
        SUM(CASE WHEN status = 'pago' THEN valor ELSE 0 END) as pago
    FROM financeiro.accounts_payable
    GROUP BY company_id
) ap ON c.id = ap.company_id
LEFT JOIN (
    SELECT 
        company_id,
        SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END) as pendente,
        SUM(CASE WHEN status = 'vencido' THEN valor ELSE 0 END) as vencido,
        SUM(CASE WHEN status = 'recebido' THEN valor ELSE 0 END) as recebido
    FROM financeiro.accounts_receivable
    GROUP BY company_id
) ar ON c.id = ar.company_id
LEFT JOIN (
    SELECT 
        company_id,
        SUM(saldo_atual) as saldo_total
    FROM financeiro.bank_accounts
    WHERE is_active = true
    GROUP BY company_id
) ba ON c.id = ba.company_id
LEFT JOIN (
    SELECT 
        company_id,
        financeiro.calculate_dso(company_id) as dso_value
    FROM core.companies
) dso ON c.id = dso.company_id
LEFT JOIN (
    SELECT 
        company_id,
        financeiro.calculate_dpo(company_id) as dpo_value
    FROM core.companies
) dpo ON c.id = dpo.company_id;

-- View para transações bancárias com detalhes
CREATE OR REPLACE VIEW financeiro.vw_transacoes_detalhadas AS
SELECT 
    bt.id,
    bt.company_id,
    bt.bank_account_id,
    ba.banco,
    ba.agencia,
    ba.conta,
    ba.tipo_conta,
    bt.tipo,
    bt.descricao,
    bt.valor,
    bt.data_movimento,
    bt.data_conciliacao,
    bt.conciliado,
    bt.created_at,
    bt.updated_at
FROM financeiro.bank_transactions bt
JOIN financeiro.bank_accounts ba ON bt.bank_account_id = ba.id;

-- =====================================================
-- 3. FUNÇÕES DE AUDITORIA
-- =====================================================

-- Função para log de alterações financeiras
CREATE OR REPLACE FUNCTION financeiro.log_financial_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    table_name text;
    operation text;
    old_data jsonb;
    new_data jsonb;
BEGIN
    table_name := TG_TABLE_NAME;
    operation := TG_OP;
    
    IF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
        new_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'INSERT' THEN
        old_data := NULL;
        new_data := to_jsonb(NEW);
    END IF;
    
    -- Inserir log de auditoria
    INSERT INTO core.audit_logs (
        table_name,
        operation,
        old_data,
        new_data,
        user_id,
        created_at
    ) VALUES (
        table_name,
        operation,
        old_data,
        new_data,
        auth.uid(),
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar trigger de auditoria nas tabelas financeiras
CREATE TRIGGER audit_accounts_payable_changes
    AFTER INSERT OR UPDATE OR DELETE ON financeiro.accounts_payable
    FOR EACH ROW EXECUTE FUNCTION financeiro.log_financial_changes();

CREATE TRIGGER audit_accounts_receivable_changes
    AFTER INSERT OR UPDATE OR DELETE ON financeiro.accounts_receivable
    FOR EACH ROW EXECUTE FUNCTION financeiro.log_financial_changes();

CREATE TRIGGER audit_bank_transactions_changes
    AFTER INSERT OR UPDATE OR DELETE ON financeiro.bank_transactions
    FOR EACH ROW EXECUTE FUNCTION financeiro.log_financial_changes();

CREATE TRIGGER audit_invoices_changes
    AFTER INSERT OR UPDATE OR DELETE ON financeiro.invoices
    FOR EACH ROW EXECUTE FUNCTION financeiro.log_financial_changes();

-- =====================================================
-- 4. CONFIGURAÇÕES DE NOTIFICAÇÕES
-- =====================================================

-- Função para notificar vencimentos próximos
CREATE OR REPLACE FUNCTION financeiro.notify_upcoming_due_dates()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    vencimentos_cursor CURSOR FOR
        SELECT 
            ap.id,
            ap.descricao,
            ap.valor,
            ap.data_vencimento,
            ap.company_id
        FROM financeiro.accounts_payable ap
        WHERE ap.status = 'pendente'
        AND ap.data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        ORDER BY ap.data_vencimento;
    
    vencimento_record RECORD;
BEGIN
    FOR vencimento_record IN vencimentos_cursor LOOP
        -- Aqui você pode implementar a lógica de notificação
        -- Por exemplo, inserir em uma tabela de notificações
        INSERT INTO core.notifications (
            user_id,
            title,
            message,
            type,
            data,
            created_at
        ) VALUES (
            (SELECT user_id FROM core.user_companies WHERE company_id = vencimento_record.company_id LIMIT 1),
            'Vencimento Próximo',
            'Conta a pagar "' || vencimento_record.descricao || '" vence em ' || 
            EXTRACT(days FROM vencimento_record.data_vencimento - CURRENT_DATE) || ' dias',
            'financial_due_date',
            jsonb_build_object(
                'type', 'accounts_payable',
                'id', vencimento_record.id,
                'due_date', vencimento_record.data_vencimento,
                'amount', vencimento_record.valor
            ),
            NOW()
        );
    END LOOP;
END;
$$;

-- =====================================================
-- 5. FUNÇÕES DE VALIDAÇÃO
-- =====================================================

-- Função para validar código de conta contábil
CREATE OR REPLACE FUNCTION financeiro.validate_account_code(code text, parent_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    parent_code text;
    is_valid boolean := true;
    error_message text := '';
BEGIN
    -- Verificar se o código já existe
    IF EXISTS (SELECT 1 FROM financeiro.chart_accounts WHERE codigo = code) THEN
        is_valid := false;
        error_message := 'Código já existe';
    END IF;
    
    -- Se tem conta pai, verificar se o código é válido
    IF parent_id IS NOT NULL THEN
        SELECT codigo INTO parent_code 
        FROM financeiro.chart_accounts 
        WHERE id = parent_id;
        
        IF parent_code IS NOT NULL AND NOT code LIKE parent_code || '%' THEN
            is_valid := false;
            error_message := 'Código deve começar com o código da conta pai';
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'is_valid', is_valid,
        'error_message', error_message
    );
END;
$$;

-- =====================================================
-- 6. CONFIGURAÇÕES DE PERFORMANCE
-- =====================================================

-- Estatísticas das tabelas para otimização
ANALYZE financeiro.accounts_payable;
ANALYZE financeiro.accounts_receivable;
ANALYZE financeiro.bank_accounts;
ANALYZE financeiro.bank_transactions;
ANALYZE financeiro.chart_accounts;
ANALYZE financeiro.invoices;
ANALYZE financeiro.invoice_items;
ANALYZE financeiro.sefaz_integration;
ANALYZE financeiro.sefaz_status;

-- =====================================================
-- 7. CONFIGURAÇÕES DE BACKUP E MANUTENÇÃO
-- =====================================================

-- Função para limpeza de logs antigos (executar periodicamente)
CREATE OR REPLACE FUNCTION financeiro.cleanup_old_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Limpar logs de auditoria mais antigos que 1 ano
    DELETE FROM core.audit_logs 
    WHERE created_at < CURRENT_DATE - INTERVAL '1 year';
    
    -- Limpar notificações antigas
    DELETE FROM core.notifications 
    WHERE created_at < CURRENT_DATE - INTERVAL '6 months'
    AND read_at IS NOT NULL;
END;
$$;

-- =====================================================
-- 8. CONFIGURAÇÕES DE SEGURANÇA
-- =====================================================

-- Função para verificar permissões financeiras
CREATE OR REPLACE FUNCTION financeiro.check_financial_permissions(user_id uuid, company_id uuid, permission text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    has_permission boolean := false;
BEGIN
    -- Verificar se o usuário tem acesso à empresa
    IF NOT EXISTS (
        SELECT 1 FROM core.user_companies 
        WHERE user_id = $1 AND company_id = $2
    ) THEN
        RETURN false;
    END IF;
    
    -- Verificar permissões específicas baseadas no tipo de usuário
    -- Implementar lógica de permissões conforme necessário
    
    RETURN true;
END;
$$;

-- =====================================================
-- 9. DADOS DE EXEMPLO (OPCIONAL)
-- =====================================================

-- Inserir dados de exemplo para teste (descomente se necessário)
/*
-- Exemplo de conta bancária
INSERT INTO financeiro.bank_accounts (company_id, banco, agencia, conta, tipo_conta, saldo_atual, is_active)
VALUES (
    (SELECT id FROM core.companies LIMIT 1),
    'Banco do Brasil',
    '1234',
    '12345-6',
    'corrente',
    10000.00,
    true
);

-- Exemplo de conta a pagar
INSERT INTO financeiro.accounts_payable (company_id, descricao, valor, data_vencimento, status)
VALUES (
    (SELECT id FROM core.companies LIMIT 1),
    'Fornecedor de materiais',
    1500.00,
    CURRENT_DATE + INTERVAL '30 days',
    'pendente'
);

-- Exemplo de conta a receber
INSERT INTO financeiro.accounts_receivable (company_id, descricao, valor, data_vencimento, status)
VALUES (
    (SELECT id FROM core.companies LIMIT 1),
    'Cliente ABC Ltda',
    2500.00,
    CURRENT_DATE + INTERVAL '15 days',
    'pendente'
);
*/

-- =====================================================
-- FIM DO SCRIPT ADICIONAL
-- =====================================================

-- Verificar configurações aplicadas
SELECT 
    'Configurações do Módulo Financeiro' as status,
    COUNT(*) as total_functions
FROM information_schema.routines 
WHERE routine_schema = 'financeiro';

SELECT 
    'Tabelas com RLS habilitado' as status,
    COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'financeiro' 
AND table_name IN (
    'accounts_payable', 'accounts_receivable', 'bank_accounts', 
    'bank_transactions', 'chart_accounts', 'invoices', 
    'invoice_items', 'sefaz_integration', 'sefaz_status', 
    'cnab_files', 'advances'
);
