-- Script para verificar a estrutura das tabelas de locação de equipamentos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estrutura da tabela equipment_rentals
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'rh' 
AND table_name = 'equipment_rentals'
ORDER BY ordinal_position;

-- 2. Verificar estrutura da tabela equipment_rental_payments
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'rh' 
AND table_name = 'equipment_rental_payments'
ORDER BY ordinal_position;

-- 3. Verificar foreign keys
SELECT
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'rh'
AND tc.table_name IN ('equipment_rentals', 'equipment_rental_payments')
AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name;

-- 4. Verificar índices
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'rh'
AND tablename IN ('equipment_rentals', 'equipment_rental_payments')
ORDER BY tablename, indexname;

-- 5. Testar inserção de dados de exemplo
INSERT INTO rh.equipment_rentals (
    company_id,
    employee_id,
    equipment_type,
    equipment_name,
    monthly_value,
    start_date,
    status,
    created_by
) VALUES (
    '443ce2a2-5718-4a8f-9ec2-70d98e71d7e0'::uuid,
    (SELECT id FROM rh.employees LIMIT 1),
    'computer',
    'Notebook Teste',
    500.00,
    CURRENT_DATE,
    'active',
    auth.uid()
) ON CONFLICT DO NOTHING;

-- 6. Verificar se a inserção funcionou
SELECT COUNT(*) as total_equipment_rentals FROM rh.equipment_rentals;

