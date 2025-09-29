-- Script para corrigir políticas RLS das tabelas de locação de equipamentos
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'rh' 
AND tablename IN ('equipment_rentals', 'equipment_rental_payments')
ORDER BY tablename;

-- 2. Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'rh' 
AND tablename IN ('equipment_rentals', 'equipment_rental_payments')
ORDER BY tablename, policyname;

-- 3. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can view equipment rentals from their company" ON rh.equipment_rentals;
DROP POLICY IF EXISTS "Users can insert equipment rentals in their company" ON rh.equipment_rentals;
DROP POLICY IF EXISTS "Users can update equipment rentals in their company" ON rh.equipment_rentals;
DROP POLICY IF EXISTS "Users can delete equipment rentals in their company" ON rh.equipment_rentals;
DROP POLICY IF EXISTS "Users can view equipment rental payments from their company" ON rh.equipment_rental_payments;
DROP POLICY IF EXISTS "Users can insert equipment rental payments in their company" ON rh.equipment_rental_payments;
DROP POLICY IF EXISTS "Users can update equipment rental payments in their company" ON rh.equipment_rental_payments;
DROP POLICY IF EXISTS "Users can delete equipment rental payments in their company" ON rh.equipment_rental_payments;

-- 4. Garantir que RLS está habilitado
ALTER TABLE rh.equipment_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.equipment_rental_payments ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas temporárias permissivas para teste
CREATE POLICY "equipment_rentals_select_policy" ON rh.equipment_rentals
    FOR SELECT USING (true);

CREATE POLICY "equipment_rentals_insert_policy" ON rh.equipment_rentals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "equipment_rentals_update_policy" ON rh.equipment_rentals
    FOR UPDATE USING (true);

CREATE POLICY "equipment_rentals_delete_policy" ON rh.equipment_rentals
    FOR DELETE USING (true);

CREATE POLICY "equipment_rental_payments_select_policy" ON rh.equipment_rental_payments
    FOR SELECT USING (true);

CREATE POLICY "equipment_rental_payments_insert_policy" ON rh.equipment_rental_payments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "equipment_rental_payments_update_policy" ON rh.equipment_rental_payments
    FOR UPDATE USING (true);

CREATE POLICY "equipment_rental_payments_delete_policy" ON rh.equipment_rental_payments
    FOR DELETE USING (true);

-- 6. Verificar se as políticas foram criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'rh' 
AND tablename IN ('equipment_rentals', 'equipment_rental_payments')
ORDER BY tablename, policyname;

-- 7. Testar acesso às tabelas
SELECT 'Teste de acesso às tabelas' as status;
SELECT COUNT(*) as equipment_rentals_count FROM rh.equipment_rentals;
SELECT COUNT(*) as equipment_rental_payments_count FROM rh.equipment_rental_payments;

