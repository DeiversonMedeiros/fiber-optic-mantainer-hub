-- Migração para criar estrutura de integração com Flash API
-- Esta migração cria as tabelas necessárias para gerenciar pagamentos de benefícios

-- 1. Criar enum para tipos de pagamento
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_enum') THEN
        CREATE TYPE rh.payment_method_enum AS ENUM (
            'flash',        -- Cartão Flash
            'transfer',     -- Transferência bancária
            'pix'          -- PIX
        );
    END IF;
END $$;

-- 2. Criar enum para status de pagamento
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
        CREATE TYPE rh.payment_status_enum AS ENUM (
            'pending',      -- Pendente
            'processing',   -- Processando
            'completed',    -- Concluído
            'failed',       -- Falhou
            'cancelled'     -- Cancelado
        );
    END IF;
END $$;

-- 3. Criar tabela de configuração de pagamentos
CREATE TABLE IF NOT EXISTS rh.benefit_payment_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    benefit_type VARCHAR(50) NOT NULL, -- VR, VA, transporte, etc.
    allowed_payment_methods JSONB NOT NULL DEFAULT '["flash", "transfer", "pix"]',
    flash_api_key VARCHAR(255),
    flash_company_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (company_id, benefit_type)
);

-- 4. Criar tabela de histórico de pagamentos
CREATE TABLE IF NOT EXISTS rh.benefit_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES rh.employees(id) ON DELETE CASCADE,
    benefit_type VARCHAR(50) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    payment_method rh.payment_method_enum NOT NULL,
    payment_status rh.payment_status_enum DEFAULT 'pending',
    
    -- IDs de transação para cada método
    flash_transaction_id VARCHAR(255),
    bank_transaction_id VARCHAR(255),
    pix_transaction_id VARCHAR(255),
    
    -- Dados adicionais
    payment_details JSONB DEFAULT '{}',
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- 5. Criar tabela de configuração de contas bancárias dos funcionários
CREATE TABLE IF NOT EXISTS rh.employee_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES rh.employees(id) ON DELETE CASCADE,
    bank_code VARCHAR(10) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    agency VARCHAR(20) NOT NULL,
    account VARCHAR(20) NOT NULL,
    account_type VARCHAR(20) NOT NULL, -- checking, savings
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (employee_id, bank_code, agency, account)
);

-- 5.1. Adicionar coluna pix_key se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'rh' 
        AND table_name = 'employee_bank_accounts' 
        AND column_name = 'pix_key'
    ) THEN
        ALTER TABLE rh.employee_bank_accounts ADD COLUMN pix_key VARCHAR(255);
    END IF;
END $$;

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_benefit_payments_employee_id ON rh.benefit_payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_benefit_payments_company_id ON rh.benefit_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_benefit_payments_status ON rh.benefit_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_benefit_payments_created_at ON rh.benefit_payments(created_at);
CREATE INDEX IF NOT EXISTS idx_employee_bank_accounts_employee_id ON rh.employee_bank_accounts(employee_id);

-- 7. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION rh.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar triggers para updated_at
CREATE TRIGGER update_benefit_payment_configs_updated_at
    BEFORE UPDATE ON rh.benefit_payment_configs
    FOR EACH ROW
    EXECUTE FUNCTION rh.update_updated_at_column();

CREATE TRIGGER update_benefit_payments_updated_at
    BEFORE UPDATE ON rh.benefit_payments
    FOR EACH ROW
    EXECUTE FUNCTION rh.update_updated_at_column();

CREATE TRIGGER update_employee_bank_accounts_updated_at
    BEFORE UPDATE ON rh.employee_bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION rh.update_updated_at_column();

-- 9. Inserir configurações padrão para benefícios
DO $$
DECLARE
    company_uuid UUID;
BEGIN
    -- Buscar a primeira empresa disponível
    SELECT id INTO company_uuid FROM core.companies LIMIT 1;

    -- Se encontrou uma empresa, inserir as configurações padrão
    IF company_uuid IS NOT NULL THEN
        INSERT INTO rh.benefit_payment_configs (company_id, benefit_type, allowed_payment_methods) VALUES
        (company_uuid, 'VR', '["flash"]'), -- VR só pode ser Flash
        (company_uuid, 'VA', '["flash"]'), -- VA só pode ser Flash
        (company_uuid, 'transporte', '["flash", "transfer", "pix"]'),
        (company_uuid, 'premiacao', '["flash", "transfer", "pix"]'),
        (company_uuid, 'producao', '["flash", "transfer", "pix"]')
        ON CONFLICT (company_id, benefit_type) DO NOTHING;
    END IF;
END $$;

-- 10. Configurar RLS (Row Level Security)
ALTER TABLE rh.benefit_payment_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.benefit_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.employee_bank_accounts ENABLE ROW LEVEL SECURITY;

-- 11. Criar políticas RLS para benefit_payment_configs
CREATE POLICY "Users can view benefit_payment_configs for their company" ON rh.benefit_payment_configs
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM core.user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert benefit_payment_configs for their company" ON rh.benefit_payment_configs
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM core.user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update benefit_payment_configs for their company" ON rh.benefit_payment_configs
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM core.user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- 12. Criar políticas RLS para benefit_payments
CREATE POLICY "Users can view benefit_payments for their company" ON rh.benefit_payments
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM core.user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert benefit_payments for their company" ON rh.benefit_payments
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM core.user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update benefit_payments for their company" ON rh.benefit_payments
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM core.user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- 13. Criar políticas RLS para employee_bank_accounts
CREATE POLICY "Users can view employee_bank_accounts for their company" ON rh.employee_bank_accounts
    FOR SELECT USING (
        employee_id IN (
            SELECT e.id FROM rh.employees e
            JOIN core.user_companies uc ON e.company_id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert employee_bank_accounts for their company" ON rh.employee_bank_accounts
    FOR INSERT WITH CHECK (
        employee_id IN (
            SELECT e.id FROM rh.employees e
            JOIN core.user_companies uc ON e.company_id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update employee_bank_accounts for their company" ON rh.employee_bank_accounts
    FOR UPDATE USING (
        employee_id IN (
            SELECT e.id FROM rh.employees e
            JOIN core.user_companies uc ON e.company_id = uc.company_id
            WHERE uc.user_id = auth.uid()
        )
    );

-- 14. Comentários nas tabelas
COMMENT ON TABLE rh.benefit_payment_configs IS 'Configurações de pagamento para cada tipo de benefício';
COMMENT ON TABLE rh.benefit_payments IS 'Histórico de pagamentos de benefícios';
COMMENT ON TABLE rh.employee_bank_accounts IS 'Contas bancárias dos funcionários para recebimento de benefícios';

COMMENT ON COLUMN rh.benefit_payment_configs.allowed_payment_methods IS 'Array JSON com métodos de pagamento permitidos para o benefício';
COMMENT ON COLUMN rh.benefit_payments.payment_details IS 'Detalhes específicos do pagamento (JSON)';
COMMENT ON COLUMN rh.employee_bank_accounts.pix_key IS 'Chave PIX do funcionário (CPF, email, telefone, etc.)';
