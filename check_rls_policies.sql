-- Verificar políticas RLS para a tabela delay_reasons
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
AND tablename = 'delay_reasons';

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'rh' 
AND tablename = 'delay_reasons';































































