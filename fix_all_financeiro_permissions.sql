-- Corrigir permissões para todas as tabelas do schema financeiro
-- Este script garante que o role authenticated tenha acesso a todas as tabelas necessárias

-- 1. Verificar todas as tabelas no schema financeiro
SELECT 
  'Tabelas no schema financeiro' as info,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'financeiro'
ORDER BY table_name;

-- 2. Verificar permissões atuais em todas as tabelas do financeiro
SELECT 
  'Permissões atuais' as info,
  table_name,
  grantee,
  privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'financeiro'
ORDER BY table_name, grantee, privilege_type;

-- 3. Conceder permissões básicas para todas as tabelas do financeiro
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'financeiro'
        AND t.table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON financeiro.%I TO authenticated', table_name);
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON financeiro.%I TO anon', table_name);
        RAISE NOTICE 'Permissões concedidas para tabela: %', table_name;
    END LOOP;
END $$;

-- 4. Conceder permissões para sequences (se existirem)
DO $$
DECLARE
    sequence_name TEXT;
BEGIN
    FOR sequence_name IN 
        SELECT s.sequence_name 
        FROM information_schema.sequences s
        WHERE s.sequence_schema = 'financeiro'
    LOOP
        EXECUTE format('GRANT USAGE, SELECT ON financeiro.%I TO authenticated', sequence_name);
        EXECUTE format('GRANT USAGE, SELECT ON financeiro.%I TO anon', sequence_name);
        RAISE NOTICE 'Permissões concedidas para sequence: %', sequence_name;
    END LOOP;
END $$;

-- 5. Verificar permissões após GRANT
SELECT 
  'Permissões após GRANT' as info,
  table_name,
  grantee,
  privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'financeiro'
AND grantee IN ('authenticated', 'anon')
ORDER BY table_name, grantee, privilege_type;

-- 6. Testar acesso às tabelas principais
SELECT 
  'Teste de acesso - reimbursement_requests' as info,
  COUNT(*) as total_registros
FROM financeiro.reimbursement_requests;

-- 7. Verificar se há outras tabelas que podem ter o mesmo problema
SELECT 
  'Verificando outras tabelas com RLS' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname IN ('financeiro', 'rh', 'core')
AND rowsecurity = true
ORDER BY schemaname, tablename;

-- 8. Conceder permissões para tabelas do schema rh também (se necessário)
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'rh'
        AND t.table_type = 'BASE TABLE'
        AND t.table_name IN ('compensation_requests', 'employees', 'time_bank')
    LOOP
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON rh.%I TO authenticated', table_name);
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON rh.%I TO anon', table_name);
        RAISE NOTICE 'Permissões concedidas para tabela rh: %', table_name;
    END LOOP;
END $$;

-- 9. Conceder permissões para tabelas do schema core também (se necessário)
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'core'
        AND t.table_type = 'BASE TABLE'
        AND t.table_name IN ('users', 'profiles', 'companies', 'departments')
    LOOP
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON core.%I TO authenticated', table_name);
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON core.%I TO anon', table_name);
        RAISE NOTICE 'Permissões concedidas para tabela core: %', table_name;
    END LOOP;
END $$;

-- 10. Teste final de acesso
SELECT 
  'Teste final - todas as tabelas' as info,
  (SELECT COUNT(*) FROM financeiro.reimbursement_requests) as reimbursement_count,
  (SELECT COUNT(*) FROM rh.compensation_requests) as compensation_count,
  (SELECT COUNT(*) FROM core.users) as users_count,
  (SELECT COUNT(*) FROM core.profiles) as profiles_count;
