-- Script mínimo para criar as tabelas de locação de equipamentos
-- Execute este script no Supabase SQL Editor

-- Verificar se o schema rh existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'rh') THEN
        CREATE SCHEMA rh;
    END IF;
END $$;

-- 1. Criar tabela de equipamentos locados (sem foreign keys por enquanto)
CREATE TABLE IF NOT EXISTS rh.equipment_rentals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    employee_id UUID NOT NULL,
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
    created_by UUID,
    updated_by UUID
);

-- 2. Criar tabela de pagamentos (sem foreign keys por enquanto)
CREATE TABLE IF NOT EXISTS rh.equipment_rental_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    equipment_rental_id UUID NOT NULL,
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
    created_by UUID,
    updated_by UUID
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

-- 5. Criar políticas básicas de RLS (sem foreign keys)
CREATE POLICY "Users can view equipment rentals from their company" ON rh.equipment_rentals
    FOR SELECT USING (true);

CREATE POLICY "Users can insert equipment rentals" ON rh.equipment_rentals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update equipment rentals" ON rh.equipment_rentals
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete equipment rentals" ON rh.equipment_rentals
    FOR DELETE USING (true);

CREATE POLICY "Users can view equipment rental payments" ON rh.equipment_rental_payments
    FOR SELECT USING (true);

CREATE POLICY "Users can insert equipment rental payments" ON rh.equipment_rental_payments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update equipment rental payments" ON rh.equipment_rental_payments
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete equipment rental payments" ON rh.equipment_rental_payments
    FOR DELETE USING (true);

-- 6. Comentários
COMMENT ON TABLE rh.equipment_rentals IS 'Tabela para controle de equipamentos locados pelos funcionários';
COMMENT ON TABLE rh.equipment_rental_payments IS 'Tabela para controle de pagamentos de locação de equipamentos';

-- 7. Verificar se as tabelas foram criadas
SELECT 'Tabelas criadas com sucesso!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'rh' AND table_name LIKE 'equipment_rental%';

