-- Script para corrigir permissões do schema RH no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Garantir que o schema 'rh' existe
CREATE SCHEMA IF NOT EXISTS rh;

-- 2. Conceder permissões de USAGE no schema 'rh' para o usuário anônimo
GRANT USAGE ON SCHEMA rh TO anon;

-- 3. Conceder permissões de USAGE no schema 'rh' para o usuário autenticado
GRANT USAGE ON SCHEMA rh TO authenticated;

-- 4. Conceder permissões de USAGE no schema 'rh' para o usuário service_role
GRANT USAGE ON SCHEMA rh TO service_role;

-- 5. Conceder permissões nas tabelas do schema 'rh' para o usuário anônimo
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA rh TO anon;

-- 6. Conceder permissões nas tabelas do schema 'rh' para o usuário autenticado
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA rh TO authenticated;

-- 7. Conceder permissões nas tabelas do schema 'rh' para o usuário service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA rh TO service_role;

-- 8. Conceder permissões nas sequências do schema 'rh' para o usuário anônimo
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA rh TO anon;

-- 9. Conceder permissões nas sequências do schema 'rh' para o usuário autenticado
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA rh TO authenticated;

-- 10. Conceder permissões nas sequências do schema 'rh' para o usuário service_role
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA rh TO service_role;

-- 11. Configurar permissões padrão para novas tabelas no schema 'rh'
ALTER DEFAULT PRIVILEGES IN SCHEMA rh GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA rh GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA rh GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;

-- 12. Configurar permissões padrão para novas sequências no schema 'rh'
ALTER DEFAULT PRIVILEGES IN SCHEMA rh GRANT USAGE, SELECT ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA rh GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA rh GRANT USAGE, SELECT ON SEQUENCES TO service_role;

-- 13. Verificar se o schema 'rh' está no search_path (opcional)
-- ALTER DATABASE postgres SET search_path TO public, rh;

-- 14. Verificar as permissões aplicadas
SELECT 
    schemaname,
    tablename,
    has_table_privilege('anon', schemaname||'.'||tablename, 'SELECT') as anon_select,
    has_table_privilege('authenticated', schemaname||'.'||tablename, 'SELECT') as auth_select,
    has_table_privilege('service_role', schemaname||'.'||tablename, 'SELECT') as service_select
FROM pg_tables 
WHERE schemaname = 'rh'
ORDER BY tablename;


