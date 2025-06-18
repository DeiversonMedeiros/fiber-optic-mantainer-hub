
-- Verificar e corrigir as foreign keys que podem estar faltando
-- Adicionar foreign key para manager_id se não existir
DO $$ 
BEGIN
    -- Verificar se a foreign key para manager_id existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_manager_id_fkey' 
        AND table_name = 'profiles'
    ) THEN
        -- Adicionar a foreign key para manager_id
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_manager_id_fkey 
        FOREIGN KEY (manager_id) REFERENCES public.profiles(id);
    END IF;

    -- Verificar se a foreign key para user_class_id existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_user_class_id_fkey' 
        AND table_name = 'profiles'
    ) THEN
        -- Adicionar a foreign key para user_class_id
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_user_class_id_fkey 
        FOREIGN KEY (user_class_id) REFERENCES public.user_classes(id);
    END IF;

    -- Verificar se a foreign key para access_profile_id existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_access_profile_id_fkey' 
        AND table_name = 'profiles'
    ) THEN
        -- Adicionar a foreign key para access_profile_id
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_access_profile_id_fkey 
        FOREIGN KEY (access_profile_id) REFERENCES public.access_profiles(id);
    END IF;
END $$;
