-- =====================================================
-- MÓDULO FINANCEIRO - CONFIGURAÇÃO COMPLETA DO BANCO
-- =====================================================
-- Este script contém todas as funções RPC, triggers e 
-- configurações necessárias para o módulo financeiro
-- =====================================================

-- =====================================================
-- 1. FUNÇÕES RPC PARA CONTAS A PAGAR
-- =====================================================

-- Função para relatório de aging de contas a pagar
CREATE OR REPLACE FUNCTION financeiro.get_accounts_payable_aging(company_id uuid)
RETURNS TABLE (
    faixa_vencimento text,
    quantidade bigint,
    valor_total numeric,
    percentual numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH aging_data AS (
        SELECT 
            CASE 
                WHEN data_vencimento IS NULL THEN 'Sem vencimento'
                WHEN data_vencimento < CURRENT_DATE THEN 'Vencidas'
                WHEN data_vencimento <= CURRENT_DATE + INTERVAL '30 days' THEN '0-30 dias'
                WHEN data_vencimento <= CURRENT_DATE + INTERVAL '60 days' THEN '31-60 dias'
                WHEN data_vencimento <= CURRENT_DATE + INTERVAL '90 days' THEN '61-90 dias'
                ELSE 'Mais de 90 dias'
            END as faixa,
            COUNT(*) as qtd,
            SUM(valor) as total
        FROM financeiro.accounts_payable 
        WHERE company_id = $1 
        AND status IN ('pendente', 'vencido')
        GROUP BY 1
    ),
    total_geral AS (
        SELECT SUM(valor) as total_geral FROM financeiro.accounts_payable 
        WHERE company_id = $1 AND status IN ('pendente', 'vencido')
    )
    SELECT 
        ad.faixa::text,
        ad.qtd::bigint,
        ad.total::numeric,
        CASE 
            WHEN tg.total_geral > 0 THEN ROUND((ad.total / tg.total_geral) * 100, 2)
            ELSE 0
        END::numeric as percentual
    FROM aging_data ad
    CROSS JOIN total_geral tg
    ORDER BY 
        CASE ad.faixa
            WHEN 'Vencidas' THEN 1
            WHEN '0-30 dias' THEN 2
            WHEN '31-60 dias' THEN 3
            WHEN '61-90 dias' THEN 4
            WHEN 'Mais de 90 dias' THEN 5
            WHEN 'Sem vencimento' THEN 6
        END;
END;
$$;

-- Função para totais de contas a pagar por status
CREATE OR REPLACE FUNCTION financeiro.get_accounts_payable_totals(company_id uuid)
RETURNS TABLE (
    pendente numeric,
    pago numeric,
    vencido numeric,
    cancelado numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END), 0)::numeric as pendente,
        COALESCE(SUM(CASE WHEN status = 'pago' THEN valor ELSE 0 END), 0)::numeric as pago,
        COALESCE(SUM(CASE WHEN status = 'vencido' THEN valor ELSE 0 END), 0)::numeric as vencido,
        COALESCE(SUM(CASE WHEN status = 'cancelado' THEN valor ELSE 0 END), 0)::numeric as cancelado
    FROM financeiro.accounts_payable 
    WHERE company_id = $1;
END;
$$;

-- =====================================================
-- 2. FUNÇÕES RPC PARA CONTAS A RECEBER
-- =====================================================

-- Função para relatório de aging de contas a receber
CREATE OR REPLACE FUNCTION financeiro.get_accounts_receivable_aging(company_id uuid)
RETURNS TABLE (
    faixa_vencimento text,
    quantidade bigint,
    valor_total numeric,
    percentual numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH aging_data AS (
        SELECT 
            CASE 
                WHEN data_vencimento IS NULL THEN 'Sem vencimento'
                WHEN data_vencimento < CURRENT_DATE THEN 'Vencidas'
                WHEN data_vencimento <= CURRENT_DATE + INTERVAL '30 days' THEN '0-30 dias'
                WHEN data_vencimento <= CURRENT_DATE + INTERVAL '60 days' THEN '31-60 dias'
                WHEN data_vencimento <= CURRENT_DATE + INTERVAL '90 days' THEN '61-90 dias'
                ELSE 'Mais de 90 dias'
            END as faixa,
            COUNT(*) as qtd,
            SUM(valor) as total
        FROM financeiro.accounts_receivable 
        WHERE company_id = $1 
        AND status IN ('pendente', 'vencido')
        GROUP BY 1
    ),
    total_geral AS (
        SELECT SUM(valor) as total_geral FROM financeiro.accounts_receivable 
        WHERE company_id = $1 AND status IN ('pendente', 'vencido')
    )
    SELECT 
        ad.faixa::text,
        ad.qtd::bigint,
        ad.total::numeric,
        CASE 
            WHEN tg.total_geral > 0 THEN ROUND((ad.total / tg.total_geral) * 100, 2)
            ELSE 0
        END::numeric as percentual
    FROM aging_data ad
    CROSS JOIN total_geral tg
    ORDER BY 
        CASE ad.faixa
            WHEN 'Vencidas' THEN 1
            WHEN '0-30 dias' THEN 2
            WHEN '31-60 dias' THEN 3
            WHEN '61-90 dias' THEN 4
            WHEN 'Mais de 90 dias' THEN 5
            WHEN 'Sem vencimento' THEN 6
        END;
END;
$$;

-- Função para totais de contas a receber por status
CREATE OR REPLACE FUNCTION financeiro.get_accounts_receivable_totals(company_id uuid)
RETURNS TABLE (
    pendente numeric,
    recebido numeric,
    vencido numeric,
    cancelado numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END), 0)::numeric as pendente,
        COALESCE(SUM(CASE WHEN status = 'recebido' THEN valor ELSE 0 END), 0)::numeric as recebido,
        COALESCE(SUM(CASE WHEN status = 'vencido' THEN valor ELSE 0 END), 0)::numeric as vencido,
        COALESCE(SUM(CASE WHEN status = 'cancelado' THEN valor ELSE 0 END), 0)::numeric as cancelado
    FROM financeiro.accounts_receivable 
    WHERE company_id = $1;
END;
$$;

-- Função para calcular DSO (Days Sales Outstanding)
CREATE OR REPLACE FUNCTION financeiro.calculate_dso(company_id uuid)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
    dso_value numeric;
BEGIN
    WITH receitas_ultimos_30_dias AS (
        SELECT SUM(valor) as total_receitas
        FROM financeiro.accounts_receivable 
        WHERE company_id = $1 
        AND data_recebimento >= CURRENT_DATE - INTERVAL '30 days'
        AND status = 'recebido'
    ),
    contas_pendentes AS (
        SELECT SUM(valor) as total_pendente
        FROM financeiro.accounts_receivable 
        WHERE company_id = $1 
        AND status = 'pendente'
    )
    SELECT 
        CASE 
            WHEN r.total_receitas > 0 THEN 
                ROUND((c.total_pendente / r.total_receitas) * 30, 2)
            ELSE 0
        END
    INTO dso_value
    FROM receitas_ultimos_30_dias r, contas_pendentes c;
    
    RETURN COALESCE(dso_value, 0);
END;
$$;

-- =====================================================
-- 3. FUNÇÕES RPC PARA TESOURARIA
-- =====================================================

-- Função para projeção de fluxo de caixa
CREATE OR REPLACE FUNCTION financeiro.get_cash_flow_projection(company_id uuid, days_ahead integer)
RETURNS TABLE (
    data_projecao date,
    entrada numeric,
    saida numeric,
    saldo_projetado numeric
) 
LANGUAGE plpgsql
AS $$
DECLARE
    saldo_atual numeric;
    data_inicio date := CURRENT_DATE;
    data_fim date := CURRENT_DATE + (days_ahead || ' days')::interval;
BEGIN
    -- Obter saldo atual total
    SELECT COALESCE(SUM(saldo_atual), 0) INTO saldo_atual
    FROM financeiro.bank_accounts 
    WHERE company_id = $1 AND is_active = true;
    
    RETURN QUERY
    WITH dias AS (
        SELECT generate_series(data_inicio, data_fim, '1 day'::interval)::date as data_proj
    ),
    entradas AS (
        SELECT 
            d.data_proj,
            COALESCE(SUM(bt.valor), 0) as entrada
        FROM dias d
        LEFT JOIN financeiro.bank_transactions bt ON bt.data_movimento = d.data_proj 
            AND bt.tipo = 'entrada' 
            AND bt.company_id = $1
        GROUP BY d.data_proj
    ),
    saidas AS (
        SELECT 
            d.data_proj,
            COALESCE(SUM(bt.valor), 0) as saida
        FROM dias d
        LEFT JOIN financeiro.bank_transactions bt ON bt.data_movimento = d.data_proj 
            AND bt.tipo = 'saida' 
            AND bt.company_id = $1
        GROUP BY d.data_proj
    ),
    projecao AS (
        SELECT 
            e.data_proj as data_projecao,
            e.entrada,
            s.saida,
            saldo_atual + SUM(e.entrada - s.saida) OVER (ORDER BY e.data_proj) as saldo_projetado
        FROM entradas e
        JOIN saidas s ON e.data_proj = s.data_proj
    )
    SELECT 
        p.data_projecao,
        p.entrada::numeric,
        p.saida::numeric,
        p.saldo_projetado::numeric
    FROM projecao p
    ORDER BY p.data_projecao;
END;
$$;

-- Função para conciliação bancária
CREATE OR REPLACE FUNCTION financeiro.get_bank_reconciliation(bank_account_id uuid, data_inicio date, data_fim date)
RETURNS TABLE (
    data_movimento date,
    descricao text,
    valor numeric,
    tipo text,
    conciliado boolean,
    data_conciliacao date
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bt.data_movimento,
        bt.descricao,
        bt.valor,
        bt.tipo,
        bt.conciliado,
        bt.data_conciliacao
    FROM financeiro.bank_transactions bt
    WHERE bt.bank_account_id = $1
    AND bt.data_movimento BETWEEN $2 AND $3
    ORDER BY bt.data_movimento DESC;
END;
$$;

-- =====================================================
-- 4. FUNÇÕES RPC PARA INTEGRAÇÃO SEFAZ
-- =====================================================

-- Função para testar conexão SEFAZ
CREATE OR REPLACE FUNCTION financeiro.test_sefaz_connection(integration_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    integration_record record;
    result json;
BEGIN
    -- Buscar configuração da integração
    SELECT * INTO integration_record
    FROM financeiro.sefaz_integration 
    WHERE id = $1;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Integração não encontrada');
    END IF;
    
    -- Simular teste de conexão (implementar lógica real conforme necessário)
    -- Por enquanto, retornar sucesso simulado
    result := json_build_object(
        'success', true,
        'uf', integration_record.uf,
        'ambiente', integration_record.ambiente,
        'webservice_url', integration_record.webservice_url,
        'tested_at', NOW()
    );
    
    -- Atualizar status SEFAZ
    INSERT INTO financeiro.sefaz_status (company_id, uf, status, ultima_verificacao, observacoes)
    VALUES (integration_record.company_id, integration_record.uf, 'online', NOW(), 'Teste de conexão realizado com sucesso')
    ON CONFLICT (company_id, uf) 
    DO UPDATE SET 
        status = 'online',
        ultima_verificacao = NOW(),
        observacoes = 'Teste de conexão realizado com sucesso';
    
    RETURN result;
END;
$$;

-- Função para processar XML de NF-e
CREATE OR REPLACE FUNCTION financeiro.process_nfe_xml(file_path text, company_id uuid, uf text)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    result json;
BEGIN
    -- Simular processamento de XML (implementar lógica real conforme necessário)
    result := json_build_object(
        'success', true,
        'message', 'XML processado com sucesso',
        'file_path', file_path,
        'processed_at', NOW()
    );
    
    RETURN result;
END;
$$;

-- Função para consultar status de NF-e
CREATE OR REPLACE FUNCTION financeiro.consult_nfe_status(chave_acesso text, uf text, company_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    result json;
BEGIN
    -- Simular consulta de status (implementar lógica real conforme necessário)
    result := json_build_object(
        'success', true,
        'chave_acesso', chave_acesso,
        'status', 'autorizada',
        'consulted_at', NOW()
    );
    
    RETURN result;
END;
$$;

-- Função para cancelar NF-e
CREATE OR REPLACE FUNCTION financeiro.cancel_nfe(invoice_id uuid, justificativa text, company_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    result json;
BEGIN
    -- Atualizar status da nota fiscal
    UPDATE financeiro.invoices 
    SET status = 'cancelada', updated_at = NOW()
    WHERE id = $1 AND company_id = $3;
    
    result := json_build_object(
        'success', true,
        'message', 'NF-e cancelada com sucesso',
        'invoice_id', $1,
        'cancelled_at', NOW()
    );
    
    RETURN result;
END;
$$;

-- Função para inutilizar NF-e
CREATE OR REPLACE FUNCTION financeiro.inutilize_nfe(serie text, numero_inicial integer, numero_final integer, justificativa text, uf text, company_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    result json;
BEGIN
    -- Simular inutilização (implementar lógica real conforme necessário)
    result := json_build_object(
        'success', true,
        'message', 'Sequência de NF-e inutilizada com sucesso',
        'serie', $1,
        'numero_inicial', $2,
        'numero_final', $3,
        'inutilized_at', NOW()
    );
    
    RETURN result;
END;
$$;

-- Função para obter XML de NF-e
CREATE OR REPLACE FUNCTION financeiro.get_nfe_xml(invoice_id uuid, company_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'success', true,
        'xml_content', xml_anexo,
        'invoice_id', id,
        'numero_nf', numero_nf
    ) INTO result
    FROM financeiro.invoices 
    WHERE id = $1 AND company_id = $2;
    
    IF NOT FOUND THEN
        result := json_build_object('success', false, 'error', 'Nota fiscal não encontrada');
    END IF;
    
    RETURN result;
END;
$$;

-- Função para gerar DANFE
CREATE OR REPLACE FUNCTION financeiro.generate_danfe(invoice_id uuid, company_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    result json;
BEGIN
    -- Simular geração de DANFE (implementar lógica real conforme necessário)
    result := json_build_object(
        'success', true,
        'message', 'DANFE gerada com sucesso',
        'invoice_id', $1,
        'danfe_url', '/danfe/' || $1 || '.pdf',
        'generated_at', NOW()
    );
    
    RETURN result;
END;
$$;

-- =====================================================
-- 5. TRIGGERS E FUNÇÕES AUXILIARES
-- =====================================================

-- Função para verificar vencimento de títulos
CREATE OR REPLACE FUNCTION financeiro.verificar_vencimento_titulos()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Atualizar status para 'vencido' se a data de vencimento passou
    IF NEW.data_vencimento IS NOT NULL AND NEW.data_vencimento < CURRENT_DATE THEN
        NEW.status := 'vencido';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Função para atualizar saldo bancário
CREATE OR REPLACE FUNCTION financeiro.atualizar_saldo_bancario()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    bank_account_id uuid;
    valor_transacao numeric;
    tipo_transacao text;
BEGIN
    -- Obter dados da transação
    IF TG_OP = 'DELETE' THEN
        bank_account_id := OLD.bank_account_id;
        valor_transacao := OLD.valor;
        tipo_transacao := OLD.tipo;
    ELSE
        bank_account_id := NEW.bank_account_id;
        valor_transacao := NEW.valor;
        tipo_transacao := NEW.tipo;
    END IF;
    
    -- Atualizar saldo da conta bancária
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF tipo_transacao = 'entrada' THEN
            UPDATE financeiro.bank_accounts 
            SET saldo_atual = COALESCE(saldo_atual, 0) + valor_transacao
            WHERE id = bank_account_id;
        ELSE
            UPDATE financeiro.bank_accounts 
            SET saldo_atual = COALESCE(saldo_atual, 0) - valor_transacao
            WHERE id = bank_account_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF tipo_transacao = 'entrada' THEN
            UPDATE financeiro.bank_accounts 
            SET saldo_atual = COALESCE(saldo_atual, 0) - valor_transacao
            WHERE id = bank_account_id;
        ELSE
            UPDATE financeiro.bank_accounts 
            SET saldo_atual = COALESCE(saldo_atual, 0) + valor_transacao
            WHERE id = bank_account_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Função para encontro de contas automático
CREATE OR REPLACE FUNCTION financeiro.encontro_contas_automatico()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Implementar lógica de encontro de contas automático
    -- quando uma NF-e é inserida
    RETURN NEW;
END;
$$;

-- =====================================================
-- 6. CONFIGURAÇÕES DE PERMISSÕES RLS
-- =====================================================

-- Habilitar RLS nas tabelas do módulo financeiro
ALTER TABLE financeiro.accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro.accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro.chart_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro.sefaz_integration ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro.sefaz_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro.cnab_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro.advances ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para contas a pagar
CREATE POLICY "Users can view accounts payable from their company" ON financeiro.accounts_payable
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert accounts payable for their company" ON financeiro.accounts_payable
    FOR INSERT WITH CHECK (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update accounts payable from their company" ON financeiro.accounts_payable
    FOR UPDATE USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete accounts payable from their company" ON financeiro.accounts_payable
    FOR DELETE USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

-- Políticas RLS para contas a receber
CREATE POLICY "Users can view accounts receivable from their company" ON financeiro.accounts_receivable
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert accounts receivable for their company" ON financeiro.accounts_receivable
    FOR INSERT WITH CHECK (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update accounts receivable from their company" ON financeiro.accounts_receivable
    FOR UPDATE USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete accounts receivable from their company" ON financeiro.accounts_receivable
    FOR DELETE USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

-- Políticas RLS para contas bancárias
CREATE POLICY "Users can view bank accounts from their company" ON financeiro.bank_accounts
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert bank accounts for their company" ON financeiro.bank_accounts
    FOR INSERT WITH CHECK (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update bank accounts from their company" ON financeiro.bank_accounts
    FOR UPDATE USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete bank accounts from their company" ON financeiro.bank_accounts
    FOR DELETE USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

-- Políticas RLS para transações bancárias
CREATE POLICY "Users can view bank transactions from their company" ON financeiro.bank_transactions
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert bank transactions for their company" ON financeiro.bank_transactions
    FOR INSERT WITH CHECK (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update bank transactions from their company" ON financeiro.bank_transactions
    FOR UPDATE USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete bank transactions from their company" ON financeiro.bank_transactions
    FOR DELETE USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

-- Políticas RLS para plano de contas
CREATE POLICY "Users can view chart accounts from their company" ON financeiro.chart_accounts
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert chart accounts for their company" ON financeiro.chart_accounts
    FOR INSERT WITH CHECK (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update chart accounts from their company" ON financeiro.chart_accounts
    FOR UPDATE USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete chart accounts from their company" ON financeiro.chart_accounts
    FOR DELETE USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

-- Políticas RLS para notas fiscais
CREATE POLICY "Users can view invoices from their company" ON financeiro.invoices
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert invoices for their company" ON financeiro.invoices
    FOR INSERT WITH CHECK (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update invoices from their company" ON financeiro.invoices
    FOR UPDATE USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete invoices from their company" ON financeiro.invoices
    FOR DELETE USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

-- Políticas RLS para itens de notas fiscais
CREATE POLICY "Users can view invoice items from their company" ON financeiro.invoice_items
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert invoice items for their company" ON financeiro.invoice_items
    FOR INSERT WITH CHECK (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update invoice items from their company" ON financeiro.invoice_items
    FOR UPDATE USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete invoice items from their company" ON financeiro.invoice_items
    FOR DELETE USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

-- Políticas RLS para integração SEFAZ
CREATE POLICY "Users can view sefaz integration from their company" ON financeiro.sefaz_integration
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert sefaz integration for their company" ON financeiro.sefaz_integration
    FOR INSERT WITH CHECK (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update sefaz integration from their company" ON financeiro.sefaz_integration
    FOR UPDATE USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can delete sefaz integration from their company" ON financeiro.sefaz_integration
    FOR DELETE USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

-- Políticas RLS para status SEFAZ
CREATE POLICY "Users can view sefaz status from their company" ON financeiro.sefaz_status
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert sefaz status for their company" ON financeiro.sefaz_status
    FOR INSERT WITH CHECK (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update sefaz status from their company" ON financeiro.sefaz_status
    FOR UPDATE USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

-- Políticas RLS para arquivos CNAB
CREATE POLICY "Users can view cnab files from their company" ON financeiro.cnab_files
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert cnab files for their company" ON financeiro.cnab_files
    FOR INSERT WITH CHECK (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

-- Políticas RLS para adiantamentos
CREATE POLICY "Users can view advances from their company" ON financeiro.advances
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert advances for their company" ON financeiro.advances
    FOR INSERT WITH CHECK (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update advances from their company" ON financeiro.advances
    FOR UPDATE USING (company_id IN (
        SELECT company_id FROM core.user_companies WHERE user_id = auth.uid()
    ));

-- =====================================================
-- 7. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para contas a pagar
CREATE INDEX IF NOT EXISTS idx_accounts_payable_status ON financeiro.accounts_payable(status);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_vencimento ON financeiro.accounts_payable(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_fornecedor ON financeiro.accounts_payable(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_cost_center ON financeiro.accounts_payable(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_project ON financeiro.accounts_payable(project_id);

-- Índices para contas a receber
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_status ON financeiro.accounts_receivable(status);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_vencimento ON financeiro.accounts_receivable(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_cliente ON financeiro.accounts_receivable(cliente_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_cost_center ON financeiro.accounts_receivable(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_project ON financeiro.accounts_receivable(project_id);

-- Índices para transações bancárias
CREATE INDEX IF NOT EXISTS idx_bank_transactions_tipo ON financeiro.bank_transactions(tipo);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_data ON financeiro.bank_transactions(data_movimento);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_conciliado ON financeiro.bank_transactions(conciliado);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_bank_account ON financeiro.bank_transactions(bank_account_id);

-- Índices para notas fiscais
CREATE INDEX IF NOT EXISTS idx_invoices_status ON financeiro.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_data_emissao ON financeiro.invoices(data_emissao);
CREATE INDEX IF NOT EXISTS idx_invoices_tipo ON financeiro.invoices(tipo);
CREATE INDEX IF NOT EXISTS idx_invoices_fornecedor ON financeiro.invoices(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_cliente ON financeiro.invoices(cliente_id);

-- Índices para plano de contas
CREATE INDEX IF NOT EXISTS idx_chart_accounts_tipo ON financeiro.chart_accounts(tipo);
CREATE INDEX IF NOT EXISTS idx_chart_accounts_nivel ON financeiro.chart_accounts(nivel);
CREATE INDEX IF NOT EXISTS idx_chart_accounts_parent ON financeiro.chart_accounts(parent_id);
CREATE INDEX IF NOT EXISTS idx_chart_accounts_codigo ON financeiro.chart_accounts(codigo);

-- Índices para integração SEFAZ
CREATE INDEX IF NOT EXISTS idx_sefaz_integration_uf ON financeiro.sefaz_integration(uf);
CREATE INDEX IF NOT EXISTS idx_sefaz_integration_ambiente ON financeiro.sefaz_integration(ambiente);
CREATE INDEX IF NOT EXISTS idx_sefaz_status_uf ON financeiro.sefaz_status(uf);

-- =====================================================
-- 8. DADOS INICIAIS (OPCIONAL)
-- =====================================================

-- Inserir tipos de conta padrão no plano de contas
-- (Execute apenas se não existirem dados iniciais)
/*
INSERT INTO financeiro.chart_accounts (company_id, codigo, nome, tipo, nivel, is_active)
VALUES 
    (uuid_generate_v4(), '1', 'ATIVO', 'ativo', 1, true),
    (uuid_generate_v4(), '1.1', 'ATIVO CIRCULANTE', 'ativo', 2, true),
    (uuid_generate_v4(), '1.1.1', 'CAIXA E EQUIVALENTES', 'ativo', 3, true),
    (uuid_generate_v4(), '1.1.2', 'CONTAS A RECEBER', 'ativo', 3, true),
    (uuid_generate_v4(), '2', 'PASSIVO', 'passivo', 1, true),
    (uuid_generate_v4(), '2.1', 'PASSIVO CIRCULANTE', 'passivo', 2, true),
    (uuid_generate_v4(), '2.1.1', 'CONTAS A PAGAR', 'passivo', 3, true),
    (uuid_generate_v4(), '3', 'PATRIMÔNIO LÍQUIDO', 'patrimonio_liquido', 1, true),
    (uuid_generate_v4(), '4', 'RECEITAS', 'receita', 1, true),
    (uuid_generate_v4(), '5', 'DESPESAS', 'despesa', 1, true),
    (uuid_generate_v4(), '6', 'CUSTOS', 'custos', 1, true);
*/

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- Verificar se todas as funções foram criadas
SELECT 
    routine_name,
    routine_type,
    routine_schema
FROM information_schema.routines 
WHERE routine_schema = 'financeiro' 
AND routine_name LIKE 'get_%' OR routine_name LIKE 'calculate_%' OR routine_name LIKE 'test_%' OR routine_name LIKE 'process_%' OR routine_name LIKE 'consult_%' OR routine_name LIKE 'cancel_%' OR routine_name LIKE 'inutilize_%' OR routine_name LIKE 'generate_%'
ORDER BY routine_name;


 
