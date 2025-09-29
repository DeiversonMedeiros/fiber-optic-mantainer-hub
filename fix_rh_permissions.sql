-- =====================================================
-- CORREÇÃO DE PERMISSÕES PARA SCHEMA RH
-- =====================================================

-- 1. VERIFICAR SE O SCHEMA RH EXISTE
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'rh';

-- 2. VERIFICAR SE A TABELA POSITIONS EXISTE
SELECT table_name FROM information_schema.tables WHERE table_schema = 'rh' AND table_name = 'positions';

-- 3. VERIFICAR PERMISSÕES ATUAIS
SELECT 
    schemaname,
    tablename,
    hasinserts,
    hasselects,
    hasupdates,
    hasdeletes
FROM pg_tables 
WHERE schemaname = 'rh' AND tablename = 'positions';

-- 4. HABILITAR RLS NA TABELA POSITIONS
ALTER TABLE rh.positions ENABLE ROW LEVEL SECURITY;

-- 5. CRIAR POLÍTICAS RLS PARA POSITIONS
-- Política para SELECT (todos podem ler)
CREATE POLICY "Enable read access for all users" ON rh.positions
    FOR SELECT USING (true);

-- Política para INSERT (apenas usuários autenticados)
CREATE POLICY "Enable insert for authenticated users only" ON rh.positions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para UPDATE (apenas usuários autenticados)
CREATE POLICY "Enable update for authenticated users only" ON rh.positions
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para DELETE (apenas usuários autenticados)
CREATE POLICY "Enable delete for authenticated users only" ON rh.positions
    FOR DELETE USING (auth.role() = 'authenticated');

-- 6. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
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
WHERE schemaname = 'rh' AND tablename = 'positions';

-- 7. CONCEDER PERMISSÕES EXPLÍCITAS PARA O ROLE ANON
GRANT USAGE ON SCHEMA rh TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON rh.positions TO anon;
GRANT USAGE, SELECT ON SEQUENCE rh.positions_id_seq TO anon;

-- 8. CONCEDER PERMISSÕES EXPLÍCITAS PARA O ROLE AUTHENTICATED
GRANT USAGE ON SCHEMA rh TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON rh.positions TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE rh.positions_id_seq TO authenticated;

-- 9. CONCEDER PERMISSÕES EXPLÍCITAS PARA O ROLE SERVICE_ROLE
GRANT USAGE ON SCHEMA rh TO service_role;
GRANT ALL ON rh.positions TO service_role;
GRANT USAGE, SELECT ON SEQUENCE rh.positions_id_seq TO service_role;

-- 10. VERIFICAR PERMISSÕES FINAIS
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'rh' 
  AND table_name = 'positions'
  AND grantee IN ('anon', 'authenticated', 'service_role');

-- 11. TESTAR ACESSO À TABELA
SELECT COUNT(*) FROM rh.positions;

-- 12. SE AINDA HOUVER PROBLEMAS, TENTAR DESABILITAR RLS TEMPORARIAMENTE
-- ALTER TABLE rh.positions DISABLE ROW LEVEL SECURITY;

-- 13. VERIFICAR SE EXISTE FUNÇÃO TRIGGER PROBLEMÁTICA
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'rh' 
  AND event_object_table = 'positions';

-- 14. SE EXISTIR TRIGGER PROBLEMÁTICO, REMOVER TEMPORARIAMENTE
-- DROP TRIGGER IF EXISTS validar_ponto_automatico ON rh.positions;




















































































