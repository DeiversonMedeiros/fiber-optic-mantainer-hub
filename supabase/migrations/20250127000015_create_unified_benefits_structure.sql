-- =====================================================
-- MIGRAÇÃO: ESTRUTURA UNIFICADA DE BENEFÍCIOS
-- =====================================================
-- Esta migração cria uma estrutura unificada para todos os tipos de benefícios
-- (VR/VA, Transporte, Locação de Equipamentos, Premiação)

-- 1. CRIAR ENUMS NECESSÁRIOS
-- =====================================================

-- Enum para tipos de benefícios
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'benefit_type_enum') THEN
        CREATE TYPE rh.benefit_type_enum AS ENUM (
            'vr_va',           -- VR/VA
            'transporte',      -- Vale Transporte
            'equipment_rental', -- Locação de Equipamentos
            'premiacao'        -- Premiação/Produtividade
        );
    END IF;
END $$;

-- Enum para tipos de cálculo
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'calculation_type_enum') THEN
        CREATE TYPE rh.calculation_type_enum AS ENUM (
            'fixed_value',     -- Valor fixo
            'daily_value',     -- Valor por dia trabalhado
            'percentage',      -- Percentual sobre salário
            'production_based', -- Baseado em produção
            'goal_based'       -- Baseado em metas
        );
    END IF;
END $$;

-- Enum para status de processamento
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'processing_status_enum') THEN
        CREATE TYPE rh.processing_status_enum AS ENUM (
            'pending',         -- Pendente
            'calculated',      -- Calculado
            'validated',       -- Validado
            'paid',           -- Pago
            'cancelled'       -- Cancelado
        );
    END IF;
END $$;

-- 2. CRIAR TABELA UNIFICADA DE CONFIGURAÇÕES DE BENEFÍCIOS
-- =====================================================

CREATE TABLE IF NOT EXISTS rh.benefit_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    benefit_type rh.benefit_type_enum NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    calculation_type rh.calculation_type_enum NOT NULL,
    
    -- Configurações de valor
    base_value NUMERIC(10, 2),                    -- Valor base (para fixed_value e daily_value)
    percentage_value NUMERIC(5, 2),               -- Percentual (para percentage)
    min_value NUMERIC(10, 2),                     -- Valor mínimo (para variavel)
    max_value NUMERIC(10, 2),                     -- Valor máximo (para variavel)
    
    -- Configurações específicas por tipo
    daily_calculation_base INTEGER DEFAULT 30,    -- Base de dias para cálculo diário (padrão 30)
    production_percentage NUMERIC(5, 2),          -- Percentual sobre produção
    goal_id UUID,                                 -- ID da meta (para goal_based)
    
    -- Regras de desconto
    discount_rules JSONB DEFAULT '{}',            -- Regras de desconto em JSON
    apply_absence_discount BOOLEAN DEFAULT true,  -- Aplicar desconto por ausência
    absence_discount_percentage NUMERIC(5, 2) DEFAULT 0, -- % de desconto por ausência
    
    -- Configurações de pagamento
    payment_methods TEXT[] DEFAULT '{"flash", "transfer", "pix"}', -- Métodos de pagamento permitidos
    flash_category VARCHAR(100),                  -- Categoria Flash (REFEICAO E ALIMENTACAO, VALE TRANSPORTE PIX, PREMIACAO VIRTUAL)
    
    -- Status e controle
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id),
    
    -- Constraints
    CONSTRAINT benefit_configurations_company_type_name_unique 
        UNIQUE (company_id, benefit_type, name),
    CONSTRAINT benefit_configurations_value_check 
        CHECK (
            (calculation_type = 'fixed_value' AND base_value IS NOT NULL) OR
            (calculation_type = 'daily_value' AND base_value IS NOT NULL) OR
            (calculation_type = 'percentage' AND percentage_value IS NOT NULL) OR
            (calculation_type = 'production_based' AND production_percentage IS NOT NULL) OR
            (calculation_type = 'goal_based' AND goal_id IS NOT NULL)
        )
);

-- Comentários da tabela
COMMENT ON TABLE rh.benefit_configurations IS 'Configurações unificadas de todos os tipos de benefícios';
COMMENT ON COLUMN rh.benefit_configurations.benefit_type IS 'Tipo do benefício: vr_va, transporte, equipment_rental, premiacao';
COMMENT ON COLUMN rh.benefit_configurations.calculation_type IS 'Tipo de cálculo: fixed_value, daily_value, percentage, production_based, goal_based';
COMMENT ON COLUMN rh.benefit_configurations.daily_calculation_base IS 'Base de dias para cálculo diário (padrão 30 para equipamentos)';
COMMENT ON COLUMN rh.benefit_configurations.discount_rules IS 'Regras de desconto em formato JSON';
COMMENT ON COLUMN rh.benefit_configurations.flash_category IS 'Categoria Flash para pagamento: REFEICAO E ALIMENTACAO, VALE TRANSPORTE PIX, PREMIACAO VIRTUAL';

-- 3. ATUALIZAR TABELA EXISTENTE DE VÍNCULOS FUNCIONÁRIO-BENEFÍCIO
-- =====================================================

-- Adicionar colunas necessárias à tabela existente
ALTER TABLE rh.employee_benefit_assignments 
ADD COLUMN IF NOT EXISTS benefit_config_id UUID REFERENCES rh.benefit_configurations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES core.companies(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS custom_value NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS custom_percentage NUMERIC(5, 2),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES core.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES core.users(id);

-- Renomear colunas existentes para padronizar
ALTER TABLE rh.employee_benefit_assignments 
RENAME COLUMN data_inicio TO start_date;

ALTER TABLE rh.employee_benefit_assignments 
RENAME COLUMN data_fim TO end_date;

-- Adicionar constraints se não existirem
DO $$
BEGIN
    -- Constraint de unicidade
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'employee_benefit_assignments_employee_config_unique'
    ) THEN
        ALTER TABLE rh.employee_benefit_assignments 
        ADD CONSTRAINT employee_benefit_assignments_employee_config_unique 
        UNIQUE (employee_id, benefit_config_id, start_date);
    END IF;
    
    -- Constraint de data
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'employee_benefit_assignments_date_check'
    ) THEN
        ALTER TABLE rh.employee_benefit_assignments 
        ADD CONSTRAINT employee_benefit_assignments_date_check 
        CHECK (end_date IS NULL OR end_date >= start_date);
    END IF;
END $$;

-- Comentários da tabela
COMMENT ON TABLE rh.employee_benefit_assignments IS 'Vínculos entre funcionários e configurações de benefícios';
COMMENT ON COLUMN rh.employee_benefit_assignments.benefit_config_id IS 'ID da configuração de benefício unificada';
COMMENT ON COLUMN rh.employee_benefit_assignments.custom_value IS 'Valor customizado para este funcionário específico';
COMMENT ON COLUMN rh.employee_benefit_assignments.custom_percentage IS 'Percentual customizado para este funcionário específico';

-- 4. CRIAR TABELA UNIFICADA DE PROCESSAMENTO MENSAL
-- =====================================================

CREATE TABLE IF NOT EXISTS rh.monthly_benefit_processing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES rh.employees(id) ON DELETE CASCADE,
    benefit_config_id UUID NOT NULL REFERENCES rh.benefit_configurations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    
    -- Período de referência
    month_reference INTEGER NOT NULL CHECK (month_reference >= 1 AND month_reference <= 12),
    year_reference INTEGER NOT NULL CHECK (year_reference >= 2020),
    
    -- Valores calculados
    base_value NUMERIC(10, 2) NOT NULL DEFAULT 0,        -- Valor base calculado
    work_days INTEGER NOT NULL DEFAULT 0,                -- Dias trabalhados no mês
    absence_days INTEGER NOT NULL DEFAULT 0,             -- Dias de ausência
    discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0,    -- Valor do desconto
    final_value NUMERIC(10, 2) NOT NULL DEFAULT 0,       -- Valor final após descontos
    
    -- Dados de produção (para premiação)
    production_value NUMERIC(10, 2),                     -- Valor da produção
    production_percentage NUMERIC(5, 2),                 -- Percentual aplicado
    
    -- Status e controle
    status rh.processing_status_enum DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    validated_at TIMESTAMP WITH TIME ZONE,
    validated_by UUID REFERENCES core.users(id),
    
    -- Metadados
    calculation_details JSONB DEFAULT '{}',              -- Detalhes do cálculo
    notes TEXT,                                          -- Observações
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT monthly_benefit_processing_unique 
        UNIQUE (employee_id, benefit_config_id, month_reference, year_reference),
    CONSTRAINT monthly_benefit_processing_values_check 
        CHECK (base_value >= 0 AND final_value >= 0 AND discount_value >= 0)
);

-- Comentários da tabela
COMMENT ON TABLE rh.monthly_benefit_processing IS 'Processamento mensal unificado de todos os benefícios';
COMMENT ON COLUMN rh.monthly_benefit_processing.calculation_details IS 'Detalhes do cálculo em formato JSON para auditoria';
COMMENT ON COLUMN rh.monthly_benefit_processing.production_value IS 'Valor da produção para cálculo de premiação';

-- 5. ATUALIZAR TABELA EXISTENTE DE PAGAMENTOS
-- =====================================================

-- Adicionar colunas necessárias à tabela existente
ALTER TABLE rh.benefit_payments 
ADD COLUMN IF NOT EXISTS processing_id UUID REFERENCES rh.monthly_benefit_processing(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS payment_value NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS employee_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS employee_document VARCHAR(20),
ADD COLUMN IF NOT EXISTS bank_account_data JSONB,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES core.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES core.users(id);

-- Atualizar payment_value com amount se estiver vazio
UPDATE rh.benefit_payments 
SET payment_value = amount 
WHERE payment_value IS NULL;

-- Comentários da tabela
COMMENT ON TABLE rh.benefit_payments IS 'Pagamentos unificados de todos os benefícios';
COMMENT ON COLUMN rh.benefit_payments.processing_id IS 'ID do processamento mensal relacionado';
COMMENT ON COLUMN rh.benefit_payments.payment_value IS 'Valor do pagamento (alias para amount)';
COMMENT ON COLUMN rh.benefit_payments.bank_account_data IS 'Dados da conta bancária em formato JSON';

-- 6. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para benefit_configurations
CREATE INDEX IF NOT EXISTS idx_benefit_configurations_company_type 
    ON rh.benefit_configurations(company_id, benefit_type);
CREATE INDEX IF NOT EXISTS idx_benefit_configurations_active 
    ON rh.benefit_configurations(is_active) WHERE is_active = true;

-- Índices para employee_benefit_assignments
CREATE INDEX IF NOT EXISTS idx_employee_benefit_assignments_employee 
    ON rh.employee_benefit_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_benefit_assignments_config 
    ON rh.employee_benefit_assignments(benefit_config_id);
CREATE INDEX IF NOT EXISTS idx_employee_benefit_assignments_active 
    ON rh.employee_benefit_assignments(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_employee_benefit_assignments_dates 
    ON rh.employee_benefit_assignments(start_date, end_date);

-- Índices para monthly_benefit_processing
CREATE INDEX IF NOT EXISTS idx_monthly_benefit_processing_employee 
    ON rh.monthly_benefit_processing(employee_id);
CREATE INDEX IF NOT EXISTS idx_monthly_benefit_processing_config 
    ON rh.monthly_benefit_processing(benefit_config_id);
CREATE INDEX IF NOT EXISTS idx_monthly_benefit_processing_period 
    ON rh.monthly_benefit_processing(year_reference, month_reference);
CREATE INDEX IF NOT EXISTS idx_monthly_benefit_processing_status 
    ON rh.monthly_benefit_processing(status);

-- Índices para benefit_payments
CREATE INDEX IF NOT EXISTS idx_benefit_payments_processing 
    ON rh.benefit_payments(processing_id);
CREATE INDEX IF NOT EXISTS idx_benefit_payments_status 
    ON rh.benefit_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_benefit_payments_method 
    ON rh.benefit_payments(payment_method);

-- 7. HABILITAR ROW LEVEL SECURITY
-- =====================================================

-- RLS para benefit_configurations
ALTER TABLE rh.benefit_configurations ENABLE ROW LEVEL SECURITY;

-- RLS para employee_benefit_assignments
ALTER TABLE rh.employee_benefit_assignments ENABLE ROW LEVEL SECURITY;

-- RLS para monthly_benefit_processing
ALTER TABLE rh.monthly_benefit_processing ENABLE ROW LEVEL SECURITY;

-- RLS para benefit_payments
ALTER TABLE rh.benefit_payments ENABLE ROW LEVEL SECURITY;

-- 8. CRIAR POLÍTICAS RLS
-- =====================================================

-- Políticas para benefit_configurations
DROP POLICY IF EXISTS "Empresas podem ver suas configurações de benefícios" ON rh.benefit_configurations;
CREATE POLICY "Empresas podem ver suas configurações de benefícios" ON rh.benefit_configurations
    FOR SELECT USING (company_id = ANY(core.get_user_companies()));

DROP POLICY IF EXISTS "Empresas podem criar suas configurações de benefícios" ON rh.benefit_configurations;
CREATE POLICY "Empresas podem criar suas configurações de benefícios" ON rh.benefit_configurations
    FOR INSERT WITH CHECK (company_id = ANY(core.get_user_companies()));

DROP POLICY IF EXISTS "Empresas podem atualizar suas configurações de benefícios" ON rh.benefit_configurations;
CREATE POLICY "Empresas podem atualizar suas configurações de benefícios" ON rh.benefit_configurations
    FOR UPDATE USING (company_id = ANY(core.get_user_companies()));

DROP POLICY IF EXISTS "Empresas podem deletar suas configurações de benefícios" ON rh.benefit_configurations;
CREATE POLICY "Empresas podem deletar suas configurações de benefícios" ON rh.benefit_configurations
    FOR DELETE USING (company_id = ANY(core.get_user_companies()));

-- Políticas para employee_benefit_assignments
DROP POLICY IF EXISTS "Empresas podem ver suas atribuições de benefícios" ON rh.employee_benefit_assignments;
CREATE POLICY "Empresas podem ver suas atribuições de benefícios" ON rh.employee_benefit_assignments
    FOR SELECT USING (company_id = ANY(core.get_user_companies()));

DROP POLICY IF EXISTS "Empresas podem criar suas atribuições de benefícios" ON rh.employee_benefit_assignments;
CREATE POLICY "Empresas podem criar suas atribuições de benefícios" ON rh.employee_benefit_assignments
    FOR INSERT WITH CHECK (company_id = ANY(core.get_user_companies()));

DROP POLICY IF EXISTS "Empresas podem atualizar suas atribuições de benefícios" ON rh.employee_benefit_assignments;
CREATE POLICY "Empresas podem atualizar suas atribuições de benefícios" ON rh.employee_benefit_assignments
    FOR UPDATE USING (company_id = ANY(core.get_user_companies()));

DROP POLICY IF EXISTS "Empresas podem deletar suas atribuições de benefícios" ON rh.employee_benefit_assignments;
CREATE POLICY "Empresas podem deletar suas atribuições de benefícios" ON rh.employee_benefit_assignments
    FOR DELETE USING (company_id = ANY(core.get_user_companies()));

-- Políticas para monthly_benefit_processing
DROP POLICY IF EXISTS "Empresas podem ver seus processamentos de benefícios" ON rh.monthly_benefit_processing;
CREATE POLICY "Empresas podem ver seus processamentos de benefícios" ON rh.monthly_benefit_processing
    FOR SELECT USING (company_id = ANY(core.get_user_companies()));

DROP POLICY IF EXISTS "Empresas podem criar seus processamentos de benefícios" ON rh.monthly_benefit_processing;
CREATE POLICY "Empresas podem criar seus processamentos de benefícios" ON rh.monthly_benefit_processing
    FOR INSERT WITH CHECK (company_id = ANY(core.get_user_companies()));

DROP POLICY IF EXISTS "Empresas podem atualizar seus processamentos de benefícios" ON rh.monthly_benefit_processing;
CREATE POLICY "Empresas podem atualizar seus processamentos de benefícios" ON rh.monthly_benefit_processing
    FOR UPDATE USING (company_id = ANY(core.get_user_companies()));

-- Políticas para benefit_payments
DROP POLICY IF EXISTS "Empresas podem ver seus pagamentos de benefícios" ON rh.benefit_payments;
CREATE POLICY "Empresas podem ver seus pagamentos de benefícios" ON rh.benefit_payments
    FOR SELECT USING (company_id = ANY(core.get_user_companies()));

DROP POLICY IF EXISTS "Empresas podem criar seus pagamentos de benefícios" ON rh.benefit_payments;
CREATE POLICY "Empresas podem criar seus pagamentos de benefícios" ON rh.benefit_payments
    FOR INSERT WITH CHECK (company_id = ANY(core.get_user_companies()));

DROP POLICY IF EXISTS "Empresas podem atualizar seus pagamentos de benefícios" ON rh.benefit_payments;
CREATE POLICY "Empresas podem atualizar seus pagamentos de benefícios" ON rh.benefit_payments
    FOR UPDATE USING (company_id = ANY(core.get_user_companies()));

-- 9. CRIAR FUNÇÃO E TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Criar função para atualizar timestamp
CREATE OR REPLACE FUNCTION rh.set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para benefit_configurations
DROP TRIGGER IF EXISTS set_benefit_configurations_updated_at ON rh.benefit_configurations;
CREATE TRIGGER set_benefit_configurations_updated_at
    BEFORE UPDATE ON rh.benefit_configurations
    FOR EACH ROW
    EXECUTE FUNCTION rh.set_updated_at_timestamp();

-- Trigger para employee_benefit_assignments
DROP TRIGGER IF EXISTS set_employee_benefit_assignments_updated_at ON rh.employee_benefit_assignments;
CREATE TRIGGER set_employee_benefit_assignments_updated_at
    BEFORE UPDATE ON rh.employee_benefit_assignments
    FOR EACH ROW
    EXECUTE FUNCTION rh.set_updated_at_timestamp();

-- Trigger para monthly_benefit_processing
DROP TRIGGER IF EXISTS set_monthly_benefit_processing_updated_at ON rh.monthly_benefit_processing;
CREATE TRIGGER set_monthly_benefit_processing_updated_at
    BEFORE UPDATE ON rh.monthly_benefit_processing
    FOR EACH ROW
    EXECUTE FUNCTION rh.set_updated_at_timestamp();

-- Trigger para benefit_payments
DROP TRIGGER IF EXISTS set_benefit_payments_updated_at ON rh.benefit_payments;
CREATE TRIGGER set_benefit_payments_updated_at
    BEFORE UPDATE ON rh.benefit_payments
    FOR EACH ROW
    EXECUTE FUNCTION rh.set_updated_at_timestamp();
