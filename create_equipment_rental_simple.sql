-- Script simplificado para criar as tabelas de locação de equipamentos
-- Execute este script no Supabase SQL Editor

-- 1. Criar tabela de equipamentos locados
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
    license_plate VARCHAR(20),
    monthly_value DECIMAL(10,2) NOT NULL CHECK (monthly_value >= 0),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id)
);

-- 2. Criar tabela de pagamentos
CREATE TABLE IF NOT EXISTS rh.equipment_rental_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    equipment_rental_id UUID NOT NULL REFERENCES rh.equipment_rentals(id) ON DELETE CASCADE,
    payment_month VARCHAR(7) NOT NULL,
    payment_year INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    payment_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('bank_transfer', 'pix', 'cash', 'check')),
    payment_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES core.users(id),
    updated_by UUID REFERENCES core.users(id)
);

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_equipment_rentals_company_id ON rh.equipment_rentals(company_id);
CREATE INDEX IF NOT EXISTS idx_equipment_rentals_employee_id ON rh.equipment_rentals(employee_id);
CREATE INDEX IF NOT EXISTS idx_equipment_rentals_status ON rh.equipment_rentals(status);
CREATE INDEX IF NOT EXISTS idx_equipment_rental_payments_company_id ON rh.equipment_rental_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_equipment_rental_payments_equipment_rental_id ON rh.equipment_rental_payments(equipment_rental_id);

-- 4. Habilitar RLS
ALTER TABLE rh.equipment_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.equipment_rental_payments ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas básicas de RLS
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

-- 6. Comentários
COMMENT ON TABLE rh.equipment_rentals IS 'Tabela para controle de equipamentos locados pelos funcionários';
COMMENT ON TABLE rh.equipment_rental_payments IS 'Tabela para controle de pagamentos de locação de equipamentos';

