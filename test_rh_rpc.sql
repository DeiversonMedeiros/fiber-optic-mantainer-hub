-- Script de teste para verificar se as funções RPC estão funcionando
-- Execute este script no SQL Editor do Supabase

-- 1. Testar função get_employees (sem filtro de company_id)
SELECT * FROM get_employees(NULL, 10, 0);

-- 2. Testar função get_positions (sem filtro de company_id)
SELECT * FROM get_positions(NULL, 10, 0);

-- 3. Verificar se as funções foram criadas corretamente
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_employees', 'insert_employee', 'update_employee', 'delete_employee', 'get_positions')
ORDER BY routine_name;

-- 4. Verificar se há dados nas tabelas
SELECT COUNT(*) as total_employees FROM rh.employees;
SELECT COUNT(*) as total_positions FROM rh.positions;
