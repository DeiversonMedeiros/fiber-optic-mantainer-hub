-- Adicionar campos padrão e mínimo à tabela checklist_items
-- Data: 2025-01-15
-- Descrição: Adiciona campos para controlar quantidades padrão e mínimas dos itens do checklist

-- Adicionar campos padrão e mínimo à tabela checklist_items
ALTER TABLE public.checklist_items 
ADD COLUMN IF NOT EXISTS standard_quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS minimum_quantity INTEGER DEFAULT 1;

-- Adicionar comentários para documentar os campos
COMMENT ON COLUMN public.checklist_items.standard_quantity IS 'Quantidade padrão para o item do checklist (usado principalmente para itens da categoria "materiais")';
COMMENT ON COLUMN public.checklist_items.minimum_quantity IS 'Quantidade mínima necessária para o item do checklist (usado principalmente para itens da categoria "materiais")';

-- Atualizar registros existentes para ter valores padrão
UPDATE public.checklist_items 
SET standard_quantity = 1, minimum_quantity = 1 
WHERE standard_quantity IS NULL OR minimum_quantity IS NULL;

-- Criar índices para melhorar performance em consultas que filtram por categoria
CREATE INDEX IF NOT EXISTS idx_checklist_items_category ON public.checklist_items(category);
CREATE INDEX IF NOT EXISTS idx_checklist_items_user_class_active ON public.checklist_items(user_class_id, is_active); 

-- Verificar se o campo report_number existe
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'inspection_reports' 
AND column_name = 'report_number';