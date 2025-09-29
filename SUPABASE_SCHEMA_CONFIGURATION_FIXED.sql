-- =====================================================
-- CONFIGURAÇÃO CORRIGIDA DO SCHEMA PARA POSTGREST
-- =====================================================

-- Criar views no schema public para as tabelas do rh
CREATE OR REPLACE VIEW public.employees AS 
SELECT * FROM rh.employees;

CREATE OR REPLACE VIEW public.periodic_exams AS 
SELECT * FROM rh.periodic_exams;

-- Configurar permissões para as views
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.periodic_exams TO authenticated;

-- IMPORTANTE: Views herdam as políticas RLS das tabelas subjacentes
-- Não é possível habilitar RLS diretamente em views
-- As políticas RLS já configuradas nas tabelas rh.employees e rh.periodic_exams
-- serão aplicadas automaticamente quando acessadas através das views

-- Verificar se as tabelas originais têm RLS habilitado
-- Se não tiverem, habilitar nas tabelas originais:

-- Habilitar RLS nas tabelas originais (se ainda não estiver habilitado)
ALTER TABLE rh.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh.periodic_exams ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS nas tabelas originais (se ainda não existirem)
-- Política para employees
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'rh' 
        AND tablename = 'employees' 
        AND policyname = 'Enable all operations for employees'
    ) THEN
        CREATE POLICY "Enable all operations for employees" ON rh.employees
        FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Política para periodic_exams
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'rh' 
        AND tablename = 'periodic_exams' 
        AND policyname = 'Enable all operations for periodic_exams'
    ) THEN
        CREATE POLICY "Enable all operations for periodic_exams" ON rh.periodic_exams
        FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Política específica para managers (opcional)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'rh' 
        AND tablename = 'periodic_exams' 
        AND policyname = 'Managers can view team periodic exams'
    ) THEN
        CREATE POLICY "Managers can view team periodic exams" ON rh.periodic_exams
        FOR SELECT USING (
            employee_id IN (
                SELECT id FROM rh.employees 
                WHERE manager_id = auth.uid()
            )
        );
    END IF;
END $$;

-- Verificar se a configuração está funcionando
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE schemaname = t.schemaname AND tablename = t.tablename) as policy_count
FROM pg_tables t 
WHERE tablename IN ('employees', 'periodic_exams')
ORDER BY schemaname, tablename;

-- Testar se as views estão funcionando
SELECT 'Views criadas com sucesso' as status, count(*) as employee_count FROM public.employees;
SELECT 'Views criadas com sucesso' as status, count(*) as exam_count FROM public.periodic_exams;
