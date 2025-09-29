-- Migração para criar tabela de histórico de benefícios processados
-- Esta tabela armazena os benefícios calculados e processados mensalmente

-- 1. Criar enum para status de benefício
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'benefit_status_enum') THEN
        CREATE TYPE rh.benefit_status_enum AS ENUM (
            'processado',    -- Benefício calculado e processado
            'enviado_pagamento', -- Enviado para pagamento
            'pago',          -- Pagamento confirmado
            'cancelado'      -- Benefício cancelado
        );
    END IF;
END $$;

-- 2. Criar enum para forma de pagamento
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

-- 3. Criar tabela de histórico de benefícios
CREATE TABLE IF NOT EXISTS rh.funcionario_beneficios_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES rh.employees(id) ON DELETE CASCADE,
    benefit_id UUID REFERENCES rh.benefits(id) ON DELETE SET NULL,
    
    -- Configurações específicas
    vr_va_config_id UUID REFERENCES rh.vr_va_configs(id) ON DELETE SET NULL,
    transporte_config_id UUID REFERENCES rh.transporte_configs(id) ON DELETE SET NULL,
    
    -- Dados do benefício
    benefit_type VARCHAR(50) NOT NULL, -- VR, VA, transporte, etc.
    valor_beneficio NUMERIC(10,2) NOT NULL DEFAULT 0,
    valor_desconto NUMERIC(10,2) NOT NULL DEFAULT 0,
    valor_final NUMERIC(10,2) NOT NULL DEFAULT 0,
    motivo_desconto TEXT,
    
    -- Período de referência
    mes_referencia INTEGER NOT NULL CHECK (mes_referencia >= 1 AND mes_referencia <= 12),
    ano_referencia INTEGER NOT NULL CHECK (ano_referencia >= 2020),
    
    -- Datas
    data_inicio DATE,
    data_fim DATE,
    
    -- Status e pagamento
    status rh.benefit_status_enum DEFAULT 'processado',
    payment_method rh.payment_method_enum,
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    payment_transaction_id VARCHAR(255),
    payment_date TIMESTAMP WITH TIME ZONE,
    
    -- Dados adicionais
    dias_uteis INTEGER,
    dias_trabalhados INTEGER,
    dias_ausencia INTEGER,
    observacoes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_benefit_config CHECK (
        (vr_va_config_id IS NOT NULL AND transporte_config_id IS NULL) OR
        (vr_va_config_id IS NULL AND transporte_config_id IS NOT NULL) OR
        (vr_va_config_id IS NULL AND transporte_config_id IS NULL)
    ),
    CONSTRAINT check_positive_values CHECK (
        valor_beneficio >= 0 AND
        valor_desconto >= 0 AND
        valor_final >= 0
    )
);

-- 3.1. Adicionar colunas se não existirem
DO $$
BEGIN
    -- Adicionar company_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'rh' 
        AND table_name = 'funcionario_beneficios_historico' 
        AND column_name = 'company_id'
    ) THEN
        ALTER TABLE rh.funcionario_beneficios_historico ADD COLUMN company_id UUID REFERENCES core.companies(id) ON DELETE CASCADE;
    END IF;

    -- Adicionar payment_method
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'rh' 
        AND table_name = 'funcionario_beneficios_historico' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE rh.funcionario_beneficios_historico ADD COLUMN payment_method rh.payment_method_enum;
    END IF;

    -- Adicionar payment_status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'rh' 
        AND table_name = 'funcionario_beneficios_historico' 
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE rh.funcionario_beneficios_historico ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';
    END IF;

    -- Adicionar payment_transaction_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'rh' 
        AND table_name = 'funcionario_beneficios_historico' 
        AND column_name = 'payment_transaction_id'
    ) THEN
        ALTER TABLE rh.funcionario_beneficios_historico ADD COLUMN payment_transaction_id VARCHAR(255);
    END IF;

    -- Adicionar payment_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'rh' 
        AND table_name = 'funcionario_beneficios_historico' 
        AND column_name = 'payment_date'
    ) THEN
        ALTER TABLE rh.funcionario_beneficios_historico ADD COLUMN payment_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_funcionario_beneficios_historico_company_id ON rh.funcionario_beneficios_historico(company_id);
CREATE INDEX IF NOT EXISTS idx_funcionario_beneficios_historico_employee_id ON rh.funcionario_beneficios_historico(employee_id);
CREATE INDEX IF NOT EXISTS idx_funcionario_beneficios_historico_periodo ON rh.funcionario_beneficios_historico(ano_referencia, mes_referencia);
CREATE INDEX IF NOT EXISTS idx_funcionario_beneficios_historico_status ON rh.funcionario_beneficios_historico(status);
CREATE INDEX IF NOT EXISTS idx_funcionario_beneficios_historico_payment_status ON rh.funcionario_beneficios_historico(payment_status);
CREATE INDEX IF NOT EXISTS idx_funcionario_beneficios_historico_created_at ON rh.funcionario_beneficios_historico(created_at);

-- 5. Criar índice único para evitar duplicatas (apenas se as colunas existirem)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'rh' 
        AND table_name = 'funcionario_beneficios_historico' 
        AND column_name = 'benefit_type'
    ) THEN
        CREATE UNIQUE INDEX IF NOT EXISTS idx_funcionario_beneficios_historico_unique 
        ON rh.funcionario_beneficios_historico(employee_id, benefit_type, mes_referencia, ano_referencia);
    END IF;
END $$;

-- 6. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION rh.update_funcionario_beneficios_historico_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger para updated_at
CREATE TRIGGER update_funcionario_beneficios_historico_updated_at
    BEFORE UPDATE ON rh.funcionario_beneficios_historico
    FOR EACH ROW
    EXECUTE FUNCTION rh.update_funcionario_beneficios_historico_updated_at();

-- 8. Configurar RLS (Row Level Security)
ALTER TABLE rh.funcionario_beneficios_historico ENABLE ROW LEVEL SECURITY;

-- 9. Criar políticas RLS
CREATE POLICY "Users can view funcionario_beneficios_historico for their company" ON rh.funcionario_beneficios_historico
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM core.user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert funcionario_beneficios_historico for their company" ON rh.funcionario_beneficios_historico
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM core.user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update funcionario_beneficios_historico for their company" ON rh.funcionario_beneficios_historico
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM core.user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- 10. Comentários na tabela
COMMENT ON TABLE rh.funcionario_beneficios_historico IS 'Histórico de benefícios processados mensalmente para funcionários';

-- Comentários condicionais nas colunas
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'rh' 
        AND table_name = 'funcionario_beneficios_historico' 
        AND column_name = 'benefit_type'
    ) THEN
        COMMENT ON COLUMN rh.funcionario_beneficios_historico.benefit_type IS 'Tipo do benefício: VR, VA, transporte, etc.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'rh' 
        AND table_name = 'funcionario_beneficios_historico' 
        AND column_name = 'valor_beneficio'
    ) THEN
        COMMENT ON COLUMN rh.funcionario_beneficios_historico.valor_beneficio IS 'Valor original do benefício calculado';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'rh' 
        AND table_name = 'funcionario_beneficios_historico' 
        AND column_name = 'valor_desconto'
    ) THEN
        COMMENT ON COLUMN rh.funcionario_beneficios_historico.valor_desconto IS 'Valor total de descontos aplicados';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'rh' 
        AND table_name = 'funcionario_beneficios_historico' 
        AND column_name = 'valor_final'
    ) THEN
        COMMENT ON COLUMN rh.funcionario_beneficios_historico.valor_final IS 'Valor final após descontos';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'rh' 
        AND table_name = 'funcionario_beneficios_historico' 
        AND column_name = 'payment_method'
    ) THEN
        COMMENT ON COLUMN rh.funcionario_beneficios_historico.payment_method IS 'Forma de pagamento escolhida';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'rh' 
        AND table_name = 'funcionario_beneficios_historico' 
        AND column_name = 'payment_status'
    ) THEN
        COMMENT ON COLUMN rh.funcionario_beneficios_historico.payment_status IS 'Status do pagamento: pending, processing, completed, failed';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'rh' 
        AND table_name = 'funcionario_beneficios_historico' 
        AND column_name = 'payment_transaction_id'
    ) THEN
        COMMENT ON COLUMN rh.funcionario_beneficios_historico.payment_transaction_id IS 'ID da transação de pagamento';
    END IF;
END $$;
