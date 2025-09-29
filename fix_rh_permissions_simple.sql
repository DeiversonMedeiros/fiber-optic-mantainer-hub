-- =====================================================
-- CORREÇÃO SIMPLES DE PERMISSÕES PARA SCHEMA RH
-- =====================================================

-- 1. DESABILITAR RLS TEMPORARIAMENTE PARA TESTE
ALTER TABLE rh.positions DISABLE ROW LEVEL SECURITY;

-- 2. CONCEDER PERMISSÕES BÁSICAS PARA TODOS OS ROLES
GRANT USAGE ON SCHEMA rh TO anon;
GRANT USAGE ON SCHEMA rh TO authenticated;
GRANT USAGE ON SCHEMA rh TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON rh.positions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON rh.positions TO authenticated;
GRANT ALL ON rh.positions TO service_role;

-- 3. CONCEDER PERMISSÕES NA SEQUÊNCIA (SE EXISTIR)
GRANT USAGE, SELECT ON SEQUENCE rh.positions_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE rh.positions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE rh.positions_id_seq TO service_role;

-- 4. VERIFICAR SE AS PERMISSÕES FORAM APLICADAS
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'rh' 
  AND table_name = 'positions'
  AND grantee IN ('anon', 'authenticated', 'service_role');

-- 5. TESTAR ACESSO À TABELA
SELECT COUNT(*) as total_positions FROM rh.positions;

-- 6. SE FUNCIONAR, REABILITAR RLS COM POLÍTICAS SIMPLES
-- ALTER TABLE rh.positions ENABLE ROW LEVEL SECURITY;

-- 7. CRIAR POLÍTICAS SIMPLES
-- CREATE POLICY "Allow all operations for authenticated users" ON rh.positions
--     FOR ALL USING (auth.role() = 'authenticated');

-- CREATE POLICY "Allow read access for anonymous users" ON rh.positions
--     FOR SELECT USING (true);




















































































