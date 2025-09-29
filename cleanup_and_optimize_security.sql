-- Limpeza e otimização da segurança RLS
-- Remove políticas redundantes e cria configuração limpa

-- 1. Remover TODAS as políticas existentes (estão redundantes)
DROP POLICY IF EXISTS "Employees can manage own requests" ON financeiro.reimbursement_requests;
DROP POLICY IF EXISTS "Final reimbursement policy" ON financeiro.reimbursement_requests;
DROP POLICY IF EXISTS "Managers can manage team requests" ON financeiro.reimbursement_requests;
DROP POLICY IF EXISTS "Simple access policy" ON financeiro.reimbursement_requests;
DROP POLICY IF EXISTS "Super Admin has full access" ON financeiro.reimbursement_requests;
DROP POLICY IF EXISTS "Allow access based on role" ON financeiro.reimbursement_requests;
DROP POLICY IF EXISTS "Employees can manage own reimbursement requests" ON financeiro.reimbursement_requests;
DROP POLICY IF EXISTS "Managers can manage team reimbursement requests" ON financeiro.reimbursement_requests;
DROP POLICY IF EXISTS "Managers can view team reimbursement requests" ON financeiro.reimbursement_requests;

-- 2. Verificar se todas foram removidas
SELECT 
  'Políticas após limpeza' as info,
  schemaname,
  tablename,
  policyname
FROM pg_policies 
WHERE schemaname = 'financeiro' 
AND tablename = 'reimbursement_requests';

-- 3. Remover funções desnecessárias criadas durante debug
DROP FUNCTION IF EXISTS public.is_super_admin_simple();
DROP FUNCTION IF EXISTS public.get_reimbursement_requests(UUID, TEXT);
DROP FUNCTION IF EXISTS public.insert_reimbursement_request(UUID, UUID, DATE, NUMERIC, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.update_reimbursement_status(UUID, TEXT, UUID, TEXT);

-- 4. Manter apenas a função essencial (se ainda não existir, criar)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM core.profiles p
    JOIN core.users u ON u.profile_id = p.id
    WHERE u.id = auth.uid() 
    AND p.nome = 'Super Admin'
  );
$$;

-- 5. Criar UMA única política limpa e eficiente
CREATE POLICY "Reimbursement access policy" 
  ON financeiro.reimbursement_requests
  FOR ALL
  USING (
    -- Super Admin tem acesso total
    public.is_super_admin() 
    OR 
    -- Funcionários podem acessar seus próprios registros
    employee_id = auth.uid()
    OR
    -- Gestores podem acessar registros de sua equipe
    employee_id IN (
      SELECT employees.id
      FROM rh.employees
      WHERE employees.manager_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Super Admin pode criar/editar qualquer registro
    public.is_super_admin() 
    OR 
    -- Funcionários podem criar/editar seus próprios registros
    employee_id = auth.uid()
    OR
    -- Gestores podem gerenciar registros de sua equipe
    employee_id IN (
      SELECT employees.id
      FROM rh.employees
      WHERE employees.manager_id = auth.uid()
    )
  );

-- 6. Remover a view desnecessária (se existir)
DROP VIEW IF EXISTS public.reimbursement_requests_view;

-- 7. Verificar configuração final
SELECT 
  'Configuração final' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  LEFT(qual, 100) || '...' as qual_preview
FROM pg_policies 
WHERE schemaname = 'financeiro' 
AND tablename = 'reimbursement_requests';

-- 8. Verificar funções finais
SELECT 
  'Funções finais' as info,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%super_admin%'
ORDER BY routine_name;

-- 9. Teste final de funcionamento
SELECT 
  'Teste final' as info,
  COUNT(*) as total_registros,
  public.is_super_admin() as is_super_admin
FROM financeiro.reimbursement_requests;

-- 10. Verificar se RLS está habilitado
SELECT 
  'Status RLS' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'financeiro' 
AND tablename = 'reimbursement_requests';
