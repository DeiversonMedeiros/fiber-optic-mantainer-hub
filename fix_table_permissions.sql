-- Solução definitiva: Corrigir permissões GRANT na tabela reimbursement_requests
-- O problema não é RLS, mas sim permissões básicas de acesso à tabela

-- 1. Verificar permissões atuais da tabela
SELECT 
  'Permissões atuais' as info,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'financeiro' 
AND table_name = 'reimbursement_requests'
ORDER BY grantee, privilege_type;

-- 2. Verificar qual role está sendo usado
SELECT 
  'Role atual' as info,
  current_user as current_user,
  session_user as session_user,
  current_setting('role') as current_role;

-- 3. Conceder permissões para o role authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON financeiro.reimbursement_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON financeiro.reimbursement_requests TO anon;

-- 4. Conceder permissões para o role public (se necessário)
GRANT SELECT, INSERT, UPDATE, DELETE ON financeiro.reimbursement_requests TO public;

-- 5. Verificar permissões após GRANT
SELECT 
  'Permissões após GRANT' as info,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'financeiro' 
AND table_name = 'reimbursement_requests'
ORDER BY grantee, privilege_type;

-- 6. Testar acesso direto
SELECT 
  'Teste após GRANT' as info,
  COUNT(*) as total_registros
FROM financeiro.reimbursement_requests;

-- 7. Se funcionar, reabilitar RLS com políticas corretas
ALTER TABLE financeiro.reimbursement_requests ENABLE ROW LEVEL SECURITY;

-- 8. Remover política atual
DROP POLICY IF EXISTS "Restrictive access policy" ON financeiro.reimbursement_requests;

-- 9. Criar política final
CREATE POLICY "Final reimbursement policy" 
  ON financeiro.reimbursement_requests
  FOR ALL
  USING (
    public.is_super_admin() 
    OR employee_id = auth.uid()
    OR employee_id IN (
      SELECT employees.id
      FROM rh.employees
      WHERE employees.manager_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_super_admin() 
    OR employee_id = auth.uid()
    OR employee_id IN (
      SELECT employees.id
      FROM rh.employees
      WHERE employees.manager_id = auth.uid()
    )
  );

-- 10. Teste final com RLS habilitado
SELECT 
  'Teste final com RLS' as info,
  COUNT(*) as total_registros,
  public.is_super_admin() as is_super_admin
FROM financeiro.reimbursement_requests;

-- 11. Verificar políticas finais
SELECT 
  'Políticas finais' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'financeiro' 
AND tablename = 'reimbursement_requests'
ORDER BY policyname;
