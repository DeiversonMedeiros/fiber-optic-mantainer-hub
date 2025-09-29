-- Script para verificar o status do RLS e políticas

-- 1. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'rh' 
AND tablename IN ('delay_reasons', 'cid_codes', 'absence_types', 'allowance_types', 'inss_brackets', 'irrf_brackets', 'fgts_config');

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
AND tablename IN ('delay_reasons', 'cid_codes', 'absence_types', 'allowance_types', 'inss_brackets', 'irrf_brackets', 'fgts_config')
ORDER BY tablename, policyname;

-- 3. Verificar permissões do usuário atual
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'rh' 
AND table_name IN ('delay_reasons', 'cid_codes', 'absence_types', 'allowance_types', 'inss_brackets', 'irrf_brackets', 'fgts_config');

-- 4. Verificar se o usuário atual tem acesso
SELECT current_user, current_database();

-- 5. Testar consulta direta (deve funcionar se RLS estiver configurado corretamente)
SELECT COUNT(*) as test_count FROM rh.delay_reasons;





























































