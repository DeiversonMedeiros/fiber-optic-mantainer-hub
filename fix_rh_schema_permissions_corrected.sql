-- Script CORRIGIDO para configurar permissões do schema RH no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Garantir que o schema 'rh' existe
CREATE SCHEMA IF NOT EXISTS rh;

-- 2. Adicionar o schema 'rh' ao search_path
ALTER DATABASE postgres SET search_path TO public, rh, extensions;

-- 3. Conceder permissões de USAGE no schema 'rh' para o usuário anônimo
GRANT USAGE ON SCHEMA rh TO anon;

-- 4. Conceder permissões de USAGE no schema 'rh' para o usuário autenticado
GRANT USAGE ON SCHEMA rh TO authenticated;

-- 5. Conceder permissões de USAGE no schema 'rh' para o usuário service_role
GRANT USAGE ON SCHEMA rh TO service_role;

-- 6. Conceder permissões nas tabelas do schema 'rh' para o usuário anônimo
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA rh TO anon;

-- 7. Conceder permissões nas tabelas do schema 'rh' para o usuário autenticado
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA rh TO authenticated;

-- 8. Conceder permissões nas tabelas do schema 'rh' para o usuário service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA rh TO service_role;

-- 9. Conceder permissões nas sequências do schema 'rh' para o usuário anônimo
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA rh TO anon;

-- 10. Conceder permissões nas sequências do schema 'rh' para o usuário autenticado
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA rh TO authenticated;

-- 11. Conceder permissões nas sequências do schema 'rh' para o usuário service_role
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA rh TO service_role;

-- 12. Configurar permissões padrão para novas tabelas no schema 'rh'
ALTER DEFAULT PRIVILEGES IN SCHEMA rh GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA rh GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA rh GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;

-- 13. Configurar permissões padrão para novas sequências no schema 'rh'
ALTER DEFAULT PRIVILEGES IN SCHEMA rh GRANT USAGE, SELECT ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA rh GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA rh GRANT USAGE, SELECT ON SEQUENCES TO service_role;

-- 14. Configurar políticas RLS para tabelas que têm RLS habilitado
-- Para a tabela employees
CREATE POLICY "Enable read access for anon users" ON rh.employees FOR SELECT TO anon USING (true);
CREATE POLICY "Enable read access for authenticated users" ON rh.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON rh.employees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON rh.employees FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON rh.employees FOR DELETE TO authenticated USING (true);

-- Para a tabela payroll
CREATE POLICY "Enable read access for anon users" ON rh.payroll FOR SELECT TO anon USING (true);
CREATE POLICY "Enable read access for authenticated users" ON rh.payroll FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON rh.payroll FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON rh.payroll FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON rh.payroll FOR DELETE TO authenticated USING (true);

-- Para a tabela time_bank
CREATE POLICY "Enable read access for anon users" ON rh.time_bank FOR SELECT TO anon USING (true);
CREATE POLICY "Enable read access for authenticated users" ON rh.time_bank FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON rh.time_bank FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON rh.time_bank FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON rh.time_bank FOR DELETE TO authenticated USING (true);

-- Para a tabela time_records
CREATE POLICY "Enable read access for anon users" ON rh.time_records FOR SELECT TO anon USING (true);
CREATE POLICY "Enable read access for authenticated users" ON rh.time_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON rh.time_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON rh.time_records FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON rh.time_records FOR DELETE TO authenticated USING (true);

-- 15. Verificar as permissões aplicadas
SELECT 
    schemaname,
    tablename,
    has_table_privilege('anon', schemaname||'.'||tablename, 'SELECT') as anon_select,
    has_table_privilege('authenticated', schemaname||'.'||tablename, 'SELECT') as auth_select,
    has_table_privilege('service_role', schemaname||'.'||tablename, 'SELECT') as service_select
FROM pg_tables 
WHERE schemaname = 'rh'
ORDER BY tablename;

-- 16. Verificar se o schema foi adicionado ao search_path
SHOW search_path;


