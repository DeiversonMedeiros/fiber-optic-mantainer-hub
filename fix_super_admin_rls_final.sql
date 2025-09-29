-- Solução definitiva para Super Admin acessar reimbursement_requests
-- Este script cria políticas RLS que funcionam corretamente para Super Admin

-- 1. Primeiro, vamos verificar se o usuário atual é Super Admin
SELECT 
  'Verificando usuário atual' as info,
  auth.uid() as user_id,
  u.email,
  p.nome as profile_name
FROM core.users u
JOIN core.profiles p ON u.profile_id = p.id
WHERE u.id = auth.uid();

-- 2. Criar uma função mais robusta para verificar Super Admin
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

-- 3. Testar a função
SELECT 
  'Testando função is_super_admin' as info,
  public.is_super_admin() as is_super_admin;

-- 4. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Super Admin full access" ON financeiro.reimbursement_requests;
DROP POLICY IF EXISTS "Employees can manage own reimbursement requests" ON financeiro.reimbursement_requests;
DROP POLICY IF EXISTS "Managers can manage team reimbursement requests" ON financeiro.reimbursement_requests;
DROP POLICY IF EXISTS "Managers can view team reimbursement requests" ON financeiro.reimbursement_requests;

-- 5. Criar política principal para Super Admin (deve vir primeiro)
CREATE POLICY "Super Admin has full access" 
  ON financeiro.reimbursement_requests
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 6. Criar política para funcionários (apenas se não for Super Admin)
CREATE POLICY "Employees can manage own requests" 
  ON financeiro.reimbursement_requests
  FOR ALL
  USING (
    NOT public.is_super_admin() AND
    employee_id = auth.uid()
  )
  WITH CHECK (
    NOT public.is_super_admin() AND
    employee_id = auth.uid()
  );

-- 7. Criar política para gestores (apenas se não for Super Admin)
CREATE POLICY "Managers can manage team requests" 
  ON financeiro.reimbursement_requests
  FOR ALL
  USING (
    NOT public.is_super_admin() AND
    employee_id IN (
      SELECT employees.id
      FROM rh.employees
      WHERE employees.manager_id = auth.uid()
    )
  )
  WITH CHECK (
    NOT public.is_super_admin() AND
    employee_id IN (
      SELECT employees.id
      FROM rh.employees
      WHERE employees.manager_id = auth.uid()
    )
  );

-- 8. Verificar se RLS está habilitado
ALTER TABLE financeiro.reimbursement_requests ENABLE ROW LEVEL SECURITY;

-- 9. Verificar as políticas criadas
SELECT 
  'Políticas finais' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'financeiro' 
AND tablename = 'reimbursement_requests'
ORDER BY policyname;

-- 10. Testar acesso direto
SELECT 
  'Teste de acesso direto' as info,
  COUNT(*) as total_registros,
  public.is_super_admin() as is_super_admin
FROM financeiro.reimbursement_requests;
