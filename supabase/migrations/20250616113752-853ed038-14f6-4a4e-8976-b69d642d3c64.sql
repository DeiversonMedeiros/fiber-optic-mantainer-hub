
-- Remover todas as políticas RLS existentes na tabela profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and managers can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and managers can insert profiles" ON public.profiles;

-- Recriar políticas RLS simplificadas usando apenas funções SECURITY DEFINER

-- Política para usuários verem seu próprio perfil
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

-- Política para admins e gestores verem todos os perfis
CREATE POLICY "Admins and managers can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin_or_manager_safe());

-- Política para usuários atualizarem seu próprio perfil
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid());

-- Política para admins e gestores atualizarem todos os perfis
CREATE POLICY "Admins and managers can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.is_admin_or_manager_safe());

-- Política para usuários inserirem seu próprio perfil
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (id = auth.uid());

-- Política para admins e gestores inserirem novos perfis
CREATE POLICY "Admins and managers can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (public.is_admin_or_manager_safe());
