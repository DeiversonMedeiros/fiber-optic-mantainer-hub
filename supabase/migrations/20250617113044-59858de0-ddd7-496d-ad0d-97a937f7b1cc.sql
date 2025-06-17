
-- Forçar remoção de TODAS as políticas RLS existentes na tabela profiles
-- Buscar e remover qualquer política que possa existir
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN
    -- Remove todas as políticas existentes na tabela profiles
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', policy_record.policyname);
    END LOOP;
END $$;

-- Verificar se as funções SECURITY DEFINER existem, caso contrário criar
CREATE OR REPLACE FUNCTION public.is_admin_or_manager_safe()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'gestor') AND is_active = true
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Aguardar um momento para garantir que as políticas foram removidas
SELECT pg_sleep(1);

-- Recriar apenas as políticas essenciais sem recursão
CREATE POLICY "users_own_profile_select" 
ON public.profiles 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "admin_manager_all_select" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin_or_manager_safe());

CREATE POLICY "users_own_profile_update" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid());

CREATE POLICY "admin_manager_all_update" 
ON public.profiles 
FOR UPDATE 
USING (public.is_admin_or_manager_safe());

CREATE POLICY "users_own_profile_insert" 
ON public.profiles 
FOR INSERT 
WITH CHECK (id = auth.uid());

CREATE POLICY "admin_manager_all_insert" 
ON public.profiles 
FOR INSERT 
WITH CHECK (public.is_admin_or_manager_safe());
