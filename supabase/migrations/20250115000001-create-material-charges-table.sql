-- Criar tabela para registrar cargas de materiais
-- Data: 2025-01-15
-- Descrição: Adiciona tabela para controle de cargas de materiais

-- Criar tabela para registrar cargas de materiais
CREATE TABLE IF NOT EXISTS public.material_charges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_item_id UUID NOT NULL REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  quantity_added INTEGER NOT NULL,
  sa_code TEXT NOT NULL,
  reason TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.material_charges ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para material_charges
CREATE POLICY "Users can view material charges" ON public.material_charges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can create material charges" ON public.material_charges
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Trigger para atualizar updated_at
CREATE TRIGGER handle_updated_at_material_charges
  BEFORE UPDATE ON public.material_charges
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Comentários para documentação
COMMENT ON TABLE public.material_charges IS 'Registra cargas de materiais adicionadas pelos usuários';
COMMENT ON COLUMN public.material_charges.quantity_added IS 'Quantidade adicionada ao estoque';
COMMENT ON COLUMN public.material_charges.sa_code IS 'Código da SA (Solicitação de Aquisição)';
COMMENT ON COLUMN public.material_charges.reason IS 'Motivo da carga (opcional)'; 