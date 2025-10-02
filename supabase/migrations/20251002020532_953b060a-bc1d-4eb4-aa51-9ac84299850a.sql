-- ============================================================================
-- FASE 1: SISTEMA DE AUTENTICAÇÃO E ROLES (ADAPTADO À ESTRUTURA EXISTENTE)
-- ============================================================================

-- 1. Criar enum para roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'gestor_rh', 'gestor_financeiro', 'tecnico', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Criar tabela de roles de usuários
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Adicionar coluna user_id à tabela core.profiles se não existir
DO $$ BEGIN
  ALTER TABLE core.profiles ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- 4. Criar índices úteis
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON core.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON core.user_companies(user_id);

-- 5. Criar função de segurança para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 6. Criar função para verificar se é super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  );
$$;

-- 7. Criar função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Verificar se core.profiles já tem registro para este user
  IF NOT EXISTS (SELECT 1 FROM core.profiles WHERE user_id = NEW.id) THEN
    -- Se core.profiles não tem user_id preenchido para algum registro, tentar preencher o primeiro vazio
    IF EXISTS (SELECT 1 FROM core.profiles WHERE user_id IS NULL LIMIT 1) THEN
      UPDATE core.profiles 
      SET user_id = NEW.id 
      WHERE id = (SELECT id FROM core.profiles WHERE user_id IS NULL LIMIT 1);
    ELSE
      -- Criar novo perfil
      INSERT INTO core.profiles (user_id, name, description, permissions, is_active)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        'Usuário padrão',
        '{"read": true}'::jsonb,
        true
      );
    END IF;
  END IF;
  
  -- Atribuir role padrão de 'user' se não existir
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 8. Criar trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- POLICIES RLS BÁSICAS
-- ============================================================================

-- Policies para user_roles
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
  CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
  CREATE POLICY "Super admins can manage all roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- Policies para core.profiles
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own profile" ON core.profiles;
  CREATE POLICY "Users can view own profile"
    ON core.profiles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can update own profile" ON core.profiles;
  CREATE POLICY "Users can update own profile"
    ON core.profiles FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Super admins full access profiles" ON core.profiles;
  CREATE POLICY "Super admins full access profiles"
    ON core.profiles FOR ALL
    TO authenticated
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- Policies para core.companies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users view active companies" ON core.companies;
  CREATE POLICY "Users view active companies"
    ON core.companies FOR SELECT
    TO authenticated
    USING (is_active = true OR public.is_super_admin(auth.uid()));
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Super admins manage companies" ON core.companies;
  CREATE POLICY "Super admins manage companies"
    ON core.companies FOR ALL
    TO authenticated
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

-- Policies para core.user_companies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users view own companies" ON core.user_companies;
  CREATE POLICY "Users view own companies"
    ON core.user_companies FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));
EXCEPTION
  WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Super admins manage user companies" ON core.user_companies;
  CREATE POLICY "Super admins manage user companies"
    ON core.user_companies FOR ALL
    TO authenticated
    USING (public.is_super_admin(auth.uid()))
    WITH CHECK (public.is_super_admin(auth.uid()));
EXCEPTION
  WHEN OTHERS THEN null;
END $$;