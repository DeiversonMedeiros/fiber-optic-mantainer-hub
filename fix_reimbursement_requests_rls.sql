-- Corrigir políticas RLS para reimbursement_requests incluindo Super Admin
-- Este arquivo corrige o problema de permissão 403 para usuários Super Admin

-- 1. Criar função para verificar se usuário é Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM core.profiles p
    JOIN core.users u ON u.profile_id = p.id
    WHERE u.id = auth.uid() 
    AND p.nome = 'Super Admin'
  );
$$;

-- 2. Criar função para verificar se usuário é admin ou manager (compatibilidade)
CREATE OR REPLACE FUNCTION public.is_admin_or_manager_safe()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM core.profiles p
    JOIN core.users u ON u.profile_id = p.id
    WHERE u.id = auth.uid() 
    AND (p.nome = 'Super Admin' OR p.nome = 'Administrador' OR p.nome = 'Gestor RH')
  );
$$;

-- 3. Atualizar políticas RLS da tabela reimbursement_requests
-- Primeiro, remover políticas existentes
DROP POLICY IF EXISTS "Employees can manage own reimbursement requests" ON financeiro.reimbursement_requests;
DROP POLICY IF EXISTS "Managers can manage team reimbursement requests" ON financeiro.reimbursement_requests;
DROP POLICY IF EXISTS "Managers can view team reimbursement requests" ON financeiro.reimbursement_requests;

-- 4. Criar novas políticas que incluem Super Admin
CREATE POLICY "Employees can manage own reimbursement requests" 
  ON financeiro.reimbursement_requests
  FOR ALL
  USING (
    employee_id IN (
      SELECT employees.id
      FROM rh.employees
      WHERE employees.id = auth.uid()
    )
    OR public.is_super_admin()
  )
  WITH CHECK (
    employee_id IN (
      SELECT employees.id
      FROM rh.employees
      WHERE employees.id = auth.uid()
    )
    OR public.is_super_admin()
  );

CREATE POLICY "Managers can manage team reimbursement requests" 
  ON financeiro.reimbursement_requests
  FOR ALL
  USING (
    employee_id IN (
      SELECT employees.id
      FROM rh.employees
      WHERE employees.manager_id = auth.uid()
    )
    OR public.is_super_admin()
  )
  WITH CHECK (
    employee_id IN (
      SELECT employees.id
      FROM rh.employees
      WHERE employees.manager_id = auth.uid()
    )
    OR public.is_super_admin()
  );

CREATE POLICY "Managers can view team reimbursement requests" 
  ON financeiro.reimbursement_requests
  FOR SELECT
  USING (
    employee_id IN (
      SELECT employees.id
      FROM rh.employees
      WHERE employees.manager_id = auth.uid()
    )
    OR public.is_super_admin()
  );

-- 5. Garantir que RLS está habilitado
ALTER TABLE financeiro.reimbursement_requests ENABLE ROW LEVEL SECURITY;

-- 6. Verificar se as políticas foram criadas corretamente
SELECT 
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
