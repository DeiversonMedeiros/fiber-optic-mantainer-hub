-- Script FINAL para corrigir o problema do schema RH
-- Execute este script no SQL Editor do Supabase

-- 1. Garantir que o schema 'rh' existe
CREATE SCHEMA IF NOT EXISTS rh;

-- 2. Conceder permissões de USAGE no schema 'rh' para TODOS os usuários
GRANT USAGE ON SCHEMA rh TO anon;
GRANT USAGE ON SCHEMA rh TO authenticated;
GRANT USAGE ON SCHEMA rh TO service_role;
GRANT USAGE ON SCHEMA rh TO public;

-- 3. Adicionar o schema 'rh' ao search_path do banco
ALTER DATABASE postgres SET search_path TO public, rh, extensions;

-- 4. Conceder permissões nas tabelas do schema 'rh' para TODOS os usuários
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA rh TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA rh TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA rh TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA rh TO public;

-- 5. Conceder permissões nas sequências do schema 'rh' para TODOS os usuários
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA rh TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA rh TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA rh TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA rh TO public;

-- 6. Configurar permissões padrão para novas tabelas no schema 'rh'
ALTER DEFAULT PRIVILEGES IN SCHEMA rh GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA rh GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA rh GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA rh GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO public;

-- 7. Configurar permissões padrão para novas sequências no schema 'rh'
ALTER DEFAULT PRIVILEGES IN SCHEMA rh GRANT USAGE, SELECT ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA rh GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA rh GRANT USAGE, SELECT ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA rh GRANT USAGE, SELECT ON SEQUENCES TO public;

-- 8. Verificar se as permissões foram aplicadas corretamente
SELECT 
    grantee,
    privilege_type
FROM information_schema.usage_privileges 
WHERE object_name = 'rh' AND object_type = 'SCHEMA';

-- 9. Verificar se o schema foi adicionado ao search_path
SHOW search_path;

-- 10. Verificar permissões nas tabelas
SELECT 
    schemaname,
    tablename,
    has_table_privilege('anon', schemaname||'.'||tablename, 'SELECT') as anon_select,
    has_table_privilege('authenticated', schemaname||'.'||tablename, 'SELECT') as auth_select,
    has_table_privilege('service_role', schemaname||'.'||tablename, 'SELECT') as service_select,
    has_table_privilege('public', schemaname||'.'||tablename, 'SELECT') as public_select
FROM pg_tables 
WHERE schemaname = 'rh'
ORDER BY tablename;


