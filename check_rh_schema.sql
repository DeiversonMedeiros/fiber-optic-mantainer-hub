-- Script para verificar e configurar o schema RH no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se o schema 'rh' existe
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'rh';

-- 2. Verificar as tabelas no schema 'rh'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'rh'
ORDER BY table_name;

-- 3. Verificar permissões do schema 'rh'
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasinserts,
    hasselects,
    hasupdates,
    hasdeletes
FROM pg_tables 
WHERE schemaname = 'rh';

-- 4. Verificar se o schema 'rh' está no search_path
SHOW search_path;

-- 5. Verificar permissões do usuário anônimo no schema 'rh'
SELECT 
    n.nspname as schema_name,
    has_schema_privilege('anon', n.nspname, 'USAGE') as has_usage,
    has_schema_privilege('anon', n.nspname, 'CREATE') as has_create
FROM pg_namespace n
WHERE n.nspname = 'rh';

-- 6. Verificar permissões do usuário anônimo nas tabelas do schema 'rh'
SELECT 
    schemaname,
    tablename,
    has_table_privilege('anon', schemaname||'.'||tablename, 'SELECT') as can_select,
    has_table_privilege('anon', schemaname||'.'||tablename, 'INSERT') as can_insert,
    has_table_privilege('anon', schemaname||'.'||tablename, 'UPDATE') as can_update,
    has_table_privilege('anon', schemaname||'.'||tablename, 'DELETE') as can_delete
FROM pg_tables 
WHERE schemaname = 'rh'
ORDER BY tablename;

-- 7. Verificar se o schema 'rh' está habilitado para Row Level Security
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'rh'
ORDER BY tablename;


