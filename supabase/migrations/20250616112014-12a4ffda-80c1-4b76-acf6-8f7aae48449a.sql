
-- Adicionar coluna para código da SA na tabela material_consumption
ALTER TABLE public.material_consumption 
ADD COLUMN sa_code TEXT;

-- Criar tabela para registrar baixas de materiais
CREATE TABLE public.material_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  material_id UUID REFERENCES public.materials(id) NOT NULL,
  quantity_reduced INTEGER NOT NULL CHECK (quantity_reduced > 0),
  sa_code TEXT NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na nova tabela
ALTER TABLE public.material_adjustments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para material_adjustments
CREATE POLICY "Users can view material adjustments"
ON public.material_adjustments FOR SELECT
USING (
  user_id = auth.uid() OR
  created_by = auth.uid() OR
  public.is_admin_or_manager_safe()
);

CREATE POLICY "Admins and managers can create material adjustments"
ON public.material_adjustments FOR INSERT
WITH CHECK (public.is_admin_or_manager_safe());

-- Atualizar políticas RLS para material_consumption para permitir visualização mais ampla
DROP POLICY IF EXISTS "Users can view material consumption" ON public.material_consumption;
DROP POLICY IF EXISTS "Users can record material consumption" ON public.material_consumption;

CREATE POLICY "Users can view material consumption"
ON public.material_consumption FOR SELECT
USING (
  used_by = auth.uid() OR
  public.is_admin_or_manager_safe()
);

CREATE POLICY "Users can record material consumption"
ON public.material_consumption FOR INSERT
WITH CHECK (used_by = auth.uid());

CREATE POLICY "Admins and managers can update material consumption"
ON public.material_consumption FOR UPDATE
USING (public.is_admin_or_manager_safe());
