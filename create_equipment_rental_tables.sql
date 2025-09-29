-- ===== SISTEMA DE LOCAÇÃO DE EQUIPAMENTOS =====
-- Este script cria as tabelas necessárias para o sistema de locação de equipamentos
-- Execute este script no Supabase SQL Editor

-- 1. Tabela principal de equipamentos locados
CREATE TABLE IF NOT EXISTS rh.equipment_rentals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES rh.employees(id) ON DELETE CASCADE,
    equipment_type VARCHAR(20) NOT NULL CHECK (equipment_type IN ('vehicle', 'computer', 'phone', 'other')),
    equipment_name VARCHAR(255) NOT NULL,
    equipment_description TEXT,
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    license_plate VARCHAR(20), -- Para veículos
    monthly_value DECIMAL(10,2) NOT NULL CHECK (monthly_value >= 0),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id)
);

-- 2. Tabela de pagamentos de locação
CREATE TABLE IF NOT EXISTS rh.equipment_rental_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    equipment_rental_id UUID NOT NULL REFERENCES rh.equipment_rentals(id) ON DELETE CASCADE,
    payment_month VARCHAR(7) NOT NULL, -- Formato YYYY-MM
    payment_year INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    payment_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('bank_transfer', 'pix', 'cash', 'check')),
    payment_reference VARCHAR(255), -- Referência do pagamento (PIX, transferência, etc.)
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id)
);

-- 3. Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_equipment_rentals_company_id ON rh.equipment_rentals(company_id);
CREATE INDEX IF NOT EXISTS idx_equipment_rentals_employee_id ON rh.equipment_rentals(employee_id);
CREATE INDEX IF NOT EXISTS idx_equipment_rentals_status ON rh.equipment_rentals(status);
CREATE INDEX IF NOT EXISTS idx_equipment_rentals_equipment_type ON rh.equipment_rentals(equipment_type);
CREATE INDEX IF NOT EXISTS idx_equipment_rentals_start_date ON rh.equipment_rentals(start_date);

CREATE INDEX IF NOT EXISTS idx_equipment_rental_payments_company_id ON rh.equipment_rental_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_equipment_rental_payments_equipment_rental_id ON rh.equipment_rental_payments(equipment_rental_id);
CREATE INDEX IF NOT EXISTS idx_equipment_rental_payments_status ON rh.equipment_rental_payments(status);
CREATE INDEX IF NOT EXISTS idx_equipment_rental_payments_payment_month ON rh.equipment_rental_payments(payment_month);
CREATE INDEX IF NOT EXISTS idx_equipment_rental_payments_payment_year ON rh.equipment_rental_payments(payment_year);

-- 4. RLS (Row Level Security) Policies
ALTER TABLE rh.equipment_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.equipment_rental_payments ENABLE ROW LEVEL SECURITY;

-- Políticas para equipment_rentals
CREATE POLICY "Users can view equipment rentals from their company" ON rh.equipment_rentals
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM core.user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert equipment rentals in their company" ON rh.equipment_rentals
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM core.user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update equipment rentals in their company" ON rh.equipment_rentals
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM core.user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete equipment rentals in their company" ON rh.equipment_rentals
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM core.user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- Políticas para equipment_rental_payments
CREATE POLICY "Users can view equipment rental payments from their company" ON rh.equipment_rental_payments
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM core.user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert equipment rental payments in their company" ON rh.equipment_rental_payments
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM core.user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update equipment rental payments in their company" ON rh.equipment_rental_payments
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM core.user_companies 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete equipment rental payments in their company" ON rh.equipment_rental_payments
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM core.user_companies 
            WHERE user_id = auth.uid()
        )
    );

-- 5. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION core.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_equipment_rentals_updated_at 
    BEFORE UPDATE ON rh.equipment_rentals 
    FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();

CREATE TRIGGER update_equipment_rental_payments_updated_at 
    BEFORE UPDATE ON rh.equipment_rental_payments 
    FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();

-- 6. Função para gerar pagamentos mensais automaticamente
CREATE OR REPLACE FUNCTION core.generate_monthly_payments()
RETURNS TRIGGER AS $$
DECLARE
    current_month DATE;
    end_month DATE;
    payment_month VARCHAR(7);
BEGIN
    -- Só gera pagamentos para equipamentos ativos
    IF NEW.status = 'active' THEN
        current_month := DATE_TRUNC('month', NEW.start_date);
        end_month := COALESCE(NEW.end_date, DATE_TRUNC('month', NOW() + INTERVAL '12 months'));
        
        -- Gera pagamentos para cada mês
        WHILE current_month <= end_month LOOP
            payment_month := TO_CHAR(current_month, 'YYYY-MM');
            
            -- Verifica se já existe pagamento para este mês
            IF NOT EXISTS (
                SELECT 1 FROM rh.equipment_rental_payments 
                WHERE equipment_rental_id = NEW.id 
                AND payment_month = payment_month
            ) THEN
                INSERT INTO rh.equipment_rental_payments (
                    company_id,
                    equipment_rental_id,
                    payment_month,
                    payment_year,
                    amount,
                    status,
                    created_by
                ) VALUES (
                    NEW.company_id,
                    NEW.id,
                    payment_month,
                    EXTRACT(YEAR FROM current_month),
                    NEW.monthly_value,
                    'pending',
                    NEW.created_by
                );
            END IF;
            
            current_month := current_month + INTERVAL '1 month';
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para gerar pagamentos automaticamente
CREATE TRIGGER generate_equipment_rental_payments
    AFTER INSERT OR UPDATE ON rh.equipment_rentals
    FOR EACH ROW EXECUTE FUNCTION core.generate_monthly_payments();

-- 7. Comentários nas tabelas e colunas
COMMENT ON TABLE rh.equipment_rentals IS 'Tabela para controle de equipamentos locados pelos funcionários';
COMMENT ON TABLE rh.equipment_rental_payments IS 'Tabela para controle de pagamentos de locação de equipamentos';

COMMENT ON COLUMN rh.equipment_rentals.equipment_type IS 'Tipo do equipamento: vehicle, computer, phone, other';
COMMENT ON COLUMN rh.equipment_rentals.monthly_value IS 'Valor mensal da locação em reais';
COMMENT ON COLUMN rh.equipment_rentals.license_plate IS 'Placa do veículo (apenas para tipo vehicle)';
COMMENT ON COLUMN rh.equipment_rental_payments.payment_month IS 'Mês do pagamento no formato YYYY-MM';
COMMENT ON COLUMN rh.equipment_rental_payments.payment_method IS 'Método de pagamento: bank_transfer, pix, cash, check';
COMMENT ON COLUMN rh.equipment_rental_payments.payment_reference IS 'Referência do pagamento (chave PIX, número da transferência, etc.)';

-- 8. Dados de exemplo (opcional - descomente se quiser dados de teste)
/*
-- Inserir alguns equipamentos de exemplo
INSERT INTO rh.equipment_rentals (
    company_id,
    employee_id,
    equipment_type,
    equipment_name,
    brand,
    model,
    monthly_value,
    start_date,
    status,
    created_by
) VALUES (
    (SELECT id FROM core.companies LIMIT 1),
    (SELECT id FROM rh.employees LIMIT 1),
    'vehicle',
    'Honda Civic 2020',
    'Honda',
    'Civic',
    1500.00,
    '2024-01-01',
    'active',
    (SELECT id FROM core.users LIMIT 1)
);
*/
