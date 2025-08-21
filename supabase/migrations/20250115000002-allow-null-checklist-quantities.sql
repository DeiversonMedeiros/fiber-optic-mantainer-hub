-- Permitir valores NULL e 0 para campos de quantidade do checklist
-- Data: 2025-01-15
-- Descrição: Permite que os campos standard_quantity e minimum_quantity aceitem NULL ou 0 para itens que não são necessários por padrão

-- Permitir valores NULL nos campos de quantidade
ALTER TABLE public.checklist_items 
ALTER COLUMN standard_quantity DROP NOT NULL,
ALTER COLUMN minimum_quantity DROP NOT NULL;

-- Atualizar comentários para refletir a nova funcionalidade
COMMENT ON COLUMN public.checklist_items.standard_quantity IS 'Quantidade padrão para o item do checklist. NULL ou 0 significa que o item não é necessário por padrão, apenas em situações excepcionais.';
COMMENT ON COLUMN public.checklist_items.minimum_quantity IS 'Quantidade mínima necessária para o item do checklist. NULL ou 0 significa que o item não é necessário por padrão, apenas em situações excepcionais.';

-- Atualizar registros existentes que tenham valores NULL para 0 (opcional, para manter consistência)
UPDATE public.checklist_items 
SET standard_quantity = 0 
WHERE standard_quantity IS NULL;

UPDATE public.checklist_items 
SET minimum_quantity = 0 
WHERE minimum_quantity IS NULL; 