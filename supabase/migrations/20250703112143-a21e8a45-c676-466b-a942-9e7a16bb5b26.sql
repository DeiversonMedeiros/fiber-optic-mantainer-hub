
-- Criar tabela para cronograma de preventiva
CREATE TABLE IF NOT EXISTS public.preventive_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cable_number TEXT NOT NULL,
  client_site TEXT NOT NULL,
  scheduled_month INTEGER NOT NULL CHECK (scheduled_month >= 1 AND scheduled_month <= 12),
  scheduled_year INTEGER NOT NULL CHECK (scheduled_year >= 2020),
  inspector_id UUID REFERENCES public.profiles(id) NOT NULL,
  attachments JSONB DEFAULT '[]',
  observations TEXT,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar colunas à tabela risks para suporte ao workflow de preventiva
ALTER TABLE public.risks 
ADD COLUMN IF NOT EXISTS risk_number TEXT,
ADD COLUMN IF NOT EXISTS risk_type TEXT,
ADD COLUMN IF NOT EXISTS cable_client_site TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS directed_to UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS directed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Atualizar enum de status de riscos para incluir os novos status
DO $$ 
BEGIN
    -- Verificar se o campo status ainda é TEXT (não enum)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'risks' 
        AND column_name = 'status' 
        AND data_type = 'text'
    ) THEN
        -- Criar enum para status de riscos
        CREATE TYPE public.risk_status AS ENUM ('enviado', 'direcionado', 'concluido', 'aberto');
        
        -- Remover o valor padrão antes da conversão
        ALTER TABLE public.risks ALTER COLUMN status DROP DEFAULT;
        
        -- Converter coluna para enum
        ALTER TABLE public.risks 
        ALTER COLUMN status TYPE public.risk_status 
        USING CASE 
          WHEN status = 'aberto' THEN 'aberto'::risk_status
          WHEN status = 'enviado' THEN 'enviado'::risk_status
          WHEN status = 'direcionado' THEN 'direcionado'::risk_status
          WHEN status = 'concluido' THEN 'concluido'::risk_status
          ELSE 'aberto'::risk_status
        END;
        
        -- Definir novo valor padrão
        ALTER TABLE public.risks ALTER COLUMN status SET DEFAULT 'aberto'::risk_status;
    END IF;
END $$;

-- Gerar números de risco para registros existentes usando um método compatível com UPDATE
DO $$
DECLARE
    r RECORD;
    counter INTEGER := 1;
BEGIN
    FOR r IN SELECT id FROM public.risks WHERE risk_number IS NULL ORDER BY created_at LOOP
        UPDATE public.risks 
        SET risk_number = 'R-' || LPAD(counter::text, 6, '0')
        WHERE id = r.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Habilitar RLS na nova tabela
ALTER TABLE public.preventive_schedule ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para preventive_schedule
CREATE POLICY "Users can view preventive schedule"
ON public.preventive_schedule FOR SELECT
USING (
  inspector_id = auth.uid() OR
  created_by = auth.uid() OR
  public.is_admin_or_manager_safe()
);

CREATE POLICY "Admins and managers can create preventive schedule"
ON public.preventive_schedule FOR INSERT
WITH CHECK (public.is_admin_or_manager_safe());

CREATE POLICY "Admins and managers can update preventive schedule"
ON public.preventive_schedule FOR UPDATE
USING (public.is_admin_or_manager_safe());

CREATE POLICY "Admins and managers can delete preventive schedule"
ON public.preventive_schedule FOR DELETE
USING (public.is_admin_or_manager_safe());

-- Trigger para atualizar updated_at
CREATE TRIGGER handle_updated_at_preventive_schedule
  BEFORE UPDATE ON public.preventive_schedule
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger para atualizar status_updated_at quando status muda
CREATE OR REPLACE FUNCTION public.handle_risk_status_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER handle_risk_status_update
  BEFORE UPDATE ON public.risks
  FOR EACH ROW EXECUTE PROCEDURE public.handle_risk_status_update();
