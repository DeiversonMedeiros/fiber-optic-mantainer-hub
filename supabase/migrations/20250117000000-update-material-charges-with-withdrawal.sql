-- Migração para adicionar funcionalidade de retirada de materiais da carga
-- Data: 2025-01-17
-- Descrição: Adiciona colunas para controle de retiradas da carga

-- Adicionar colunas para retirada de materiais da carga
ALTER TABLE public.material_charges 
ADD COLUMN IF NOT EXISTS quantity_withdrawn INTEGER DEFAULT 0 CHECK (quantity_withdrawn >= 0);

ALTER TABLE public.material_charges 
ADD COLUMN IF NOT EXISTS operation_type TEXT DEFAULT 'charge' CHECK (operation_type IN ('charge', 'withdrawal'));

-- Adicionar coluna user_id se não existir
ALTER TABLE public.material_charges 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Criar índice para otimizar consultas por user_id
CREATE INDEX IF NOT EXISTS idx_material_charges_user_id ON public.material_charges(user_id);

-- Atualizar comentários da tabela
COMMENT ON COLUMN public.material_charges.quantity_withdrawn IS 'Quantidade retirada da carga';
COMMENT ON COLUMN public.material_charges.operation_type IS 'Tipo de operação: charge (carga) ou withdrawal (retirada)';
COMMENT ON COLUMN public.material_charges.user_id IS 'ID do usuário que recebeu a carga ou retirada';

-- Criar RPC para buscar cargas agregadas por usuário
CREATE OR REPLACE FUNCTION public.get_charges_by_users(user_ids UUID[])
RETURNS TABLE (
  user_id UUID,
  checklist_item_id UUID,
  total_quantity_added BIGINT,
  total_quantity_withdrawn BIGINT,
  net_charge_quantity BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mc.user_id,
    mc.checklist_item_id,
    COALESCE(SUM(CASE WHEN mc.operation_type = 'charge' THEN mc.quantity_added ELSE 0 END), 0) as total_quantity_added,
    COALESCE(SUM(CASE WHEN mc.operation_type = 'withdrawal' THEN mc.quantity_withdrawn ELSE 0 END), 0) as total_quantity_withdrawn,
    COALESCE(SUM(CASE WHEN mc.operation_type = 'charge' THEN mc.quantity_added ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN mc.operation_type = 'withdrawal' THEN mc.quantity_withdrawn ELSE 0 END), 0) as net_charge_quantity
  FROM public.material_charges mc
  WHERE mc.user_id = ANY(user_ids)
  GROUP BY mc.user_id, mc.checklist_item_id;
END;
$$;

-- Criar RPC para buscar materiais validados por técnicos
CREATE OR REPLACE FUNCTION public.get_validated_materials_by_technicians(tech_ids UUID[])
RETURNS TABLE (
  technician_id UUID,
  checklist_item_id UUID,
  total_quantity BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.user_id as technician_id,
    a.entity_id as checklist_item_id,
    COUNT(*) as total_quantity
  FROM public.activities a
  WHERE a.user_id = ANY(tech_ids)
    AND a.entity_type = 'checklist_item'
    AND a.action = 'validated'
  GROUP BY a.user_id, a.entity_id;
END;
$$;

-- Criar RPC para buscar ajustes por usuários
CREATE OR REPLACE FUNCTION public.get_adjustments_by_users(user_ids UUID[])
RETURNS TABLE (
  user_id UUID,
  checklist_item_id UUID,
  total_quantity_reduced BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ma.user_id,
    ma.checklist_item_id,
    COALESCE(SUM(ma.quantity_reduced), 0) as total_quantity_reduced
  FROM public.material_charges ma
  WHERE ma.user_id = ANY(user_ids)
  GROUP BY ma.user_id, ma.entity_id;
END;
$$;

-- NOTA: NÃO alterar as funções existentes de refresh do dashboard
-- As funções refresh_materials_dashboard_stats e trigger_refresh_materials_dashboard
-- já existem e funcionam corretamente. O trigger já está configurado na tabela.

-- Comentários para as funções
COMMENT ON FUNCTION public.get_charges_by_users(UUID[]) IS 'Retorna cargas agregadas de materiais por usuários';
COMMENT ON FUNCTION public.get_validated_materials_by_technicians(UUID[]) IS 'Retorna materiais validados por técnicos';
COMMENT ON FUNCTION public.get_adjustments_by_users(UUID[]) IS 'Retorna ajustes de materiais por usuários';
