-- Restaurar tabelas principais do banco

-- Tabela de configuração de pagamentos
CREATE TABLE IF NOT EXISTS rh.benefit_payment_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    benefit_type VARCHAR(50) NOT NULL,
    allowed_payment_methods JSONB NOT NULL DEFAULT '["flash", "transfer", "pix"]',
    flash_api_key VARCHAR(255),
    flash_company_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (company_id, benefit_type)
);

-- Tabela de pagamentos de benefícios
CREATE TABLE IF NOT EXISTS rh.benefit_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES rh.employees(id) ON DELETE CASCADE,
    benefit_type VARCHAR(50) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_date DATE,
    reference_month DATE NOT NULL,
    flash_transaction_id VARCHAR(255),
    bank_transfer_id VARCHAR(255),
    pix_transaction_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de contas bancárias dos funcionários
CREATE TABLE IF NOT EXISTS rh.employee_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES rh.employees(id) ON DELETE CASCADE,
    bank_code VARCHAR(10) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    agency VARCHAR(10) NOT NULL,
    account VARCHAR(20) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('checking', 'savings')),
    pix_key VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de processamento mensal de benefícios
CREATE TABLE IF NOT EXISTS rh.monthly_benefit_processing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    reference_month DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    total_employees INTEGER DEFAULT 0,
    total_amount NUMERIC(12,2) DEFAULT 0,
    processed_at TIMESTAMP WITH TIME ZONE,
    validated_at TIMESTAMP WITH TIME ZONE,
    validated_by UUID REFERENCES core.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (company_id, reference_month)
);

-- Tabela de histórico de benefícios
CREATE TABLE IF NOT EXISTS rh.funcionario_beneficios_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES rh.employees(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    benefit_type VARCHAR(50) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    reference_month DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);




