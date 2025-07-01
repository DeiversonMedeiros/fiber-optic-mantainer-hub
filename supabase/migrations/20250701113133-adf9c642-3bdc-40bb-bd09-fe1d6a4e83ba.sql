
-- 1. Atualizar enum checklist_category para ter apenas "servicos" e "materiais"
DO $$ 
BEGIN
    -- Verificar se o enum antigo existe antes de renomear
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checklist_category') THEN
        -- Só faz a alteração se ainda não foi feita
        IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid 
                      WHERE t.typname = 'checklist_category' AND e.enumlabel IN ('servicos', 'materiais') 
                      AND NOT EXISTS (SELECT 1 FROM pg_enum e2 JOIN pg_type t2 ON e2.enumtypid = t2.oid 
                                     WHERE t2.typname = 'checklist_category' AND e2.enumlabel NOT IN ('servicos', 'materiais'))) THEN
            
            ALTER TYPE public.checklist_category RENAME TO checklist_category_old;
            CREATE TYPE public.checklist_category AS ENUM ('servicos', 'materiais');

            -- Atualizar tabela checklist_items para usar o novo enum
            ALTER TABLE public.checklist_items 
            ALTER COLUMN category TYPE public.checklist_category 
            USING CASE 
              WHEN category::text = 'acessorios' THEN 'materiais'::checklist_category
              WHEN category::text = 'cabos' THEN 'materiais'::checklist_category  
              WHEN category::text = 'caixas' THEN 'materiais'::checklist_category
              WHEN category::text = 'servicos' THEN 'servicos'::checklist_category
              WHEN category::text = 'outros' THEN 'servicos'::checklist_category
              ELSE 'servicos'::checklist_category
            END;

            -- Remover o enum antigo
            DROP TYPE public.checklist_category_old;
        END IF;
    END IF;
END $$;

-- 2. Expandir tabela reports para armazenar dados dinâmicos dos formulários
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.report_templates(id),
ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS checklist_data JSONB DEFAULT '[]';

-- 3. Criar tabela para relacionar relatórios com itens do checklist utilizados (se não existir)
CREATE TABLE IF NOT EXISTS public.report_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES public.checklist_items(id),
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Habilitar RLS na nova tabela (se não estiver habilitado)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'report_checklist_items' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.report_checklist_items ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 5. Criar políticas RLS para report_checklist_items (verificar se não existem)
DO $$ 
BEGIN
    -- Política de SELECT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'report_checklist_items' 
        AND policyname = 'Users can view report checklist items'
    ) THEN
        CREATE POLICY "Users can view report checklist items" 
          ON public.report_checklist_items 
          FOR SELECT 
          USING (
            EXISTS (
              SELECT 1 FROM public.reports 
              WHERE id = report_id 
              AND (technician_id = auth.uid() OR public.is_admin_or_manager_safe())
            )
          );
    END IF;

    -- Política de INSERT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'report_checklist_items' 
        AND policyname = 'Users can create report checklist items'
    ) THEN
        CREATE POLICY "Users can create report checklist items" 
          ON public.report_checklist_items 
          FOR INSERT 
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.reports 
              WHERE id = report_id 
              AND technician_id = auth.uid()
            )
          );
    END IF;

    -- Política de UPDATE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'report_checklist_items' 
        AND policyname = 'Users can update their report checklist items'
    ) THEN
        CREATE POLICY "Users can update their report checklist items" 
          ON public.report_checklist_items 
          FOR UPDATE 
          USING (
            EXISTS (
              SELECT 1 FROM public.reports 
              WHERE id = report_id 
              AND technician_id = auth.uid()
            )
          );
    END IF;
END $$;

-- 6. Trigger para atualizar updated_at (verificar se não existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'handle_updated_at_report_checklist_items'
    ) THEN
        CREATE TRIGGER handle_updated_at_report_checklist_items
          BEFORE UPDATE ON public.report_checklist_items
          FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
    END IF;
END $$;

-- 7. Atualizar dados existentes dos checklist_items para as novas categorias
UPDATE public.checklist_items 
SET category = 'materiais'::checklist_category 
WHERE category::text IN ('acessorios', 'cabos', 'caixas') 
AND category::text != 'materiais';

UPDATE public.checklist_items 
SET category = 'servicos'::checklist_category 
WHERE category::text IN ('outros') 
AND category::text != 'servicos';
