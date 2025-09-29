-- =====================================================
-- CONFIGURAÇÃO DO POSTGREST PARA ACESSAR SCHEMA RH
-- =====================================================

-- Opção 1: Configurar o search_path do PostgREST para incluir o schema 'rh'
-- Isso permite que o PostgREST acesse as tabelas do schema 'rh' diretamente

-- Verificar o search_path atual
SHOW search_path;

-- Configurar o search_path para incluir 'rh' antes de 'public'
-- Isso faz com que o PostgREST procure primeiro no schema 'rh'
ALTER DATABASE postgres SET search_path TO rh, public, "$user";

-- Verificar se a configuração foi aplicada
SHOW search_path;

-- Opção 2: Se a Opção 1 não funcionar, criar views no schema public
-- (Descomente as linhas abaixo se necessário)

/*
-- Criar views no schema public para as tabelas do rh
CREATE OR REPLACE VIEW public.employees AS 
SELECT * FROM rh.employees;

CREATE OR REPLACE VIEW public.periodic_exams AS 
SELECT * FROM rh.periodic_exams;

-- Configurar permissões para as views
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.periodic_exams TO authenticated;

-- As views herdam as políticas RLS das tabelas subjacentes automaticamente
*/

-- Verificar se as tabelas estão acessíveis
SELECT 'Tabelas do schema rh acessíveis:' as status;
SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'rh' ORDER BY tablename;

-- Verificar políticas RLS
SELECT 'Políticas RLS configuradas:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'rh' AND tablename IN ('employees', 'periodic_exams')
ORDER BY tablename, policyname;

-- Teste de acesso (execute após configurar)
-- SELECT count(*) FROM rh.employees;
-- SELECT count(*) FROM rh.periodic_exams;
