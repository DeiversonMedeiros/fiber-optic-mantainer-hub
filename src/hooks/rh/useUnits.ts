import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { Unit, UnitInsert, UnitUpdate } from '@/integrations/supabase/rh-types';

interface UseUnitsProps {
  companyId: string;
}

export function useUnits({ companyId }: UseUnitsProps) {
  const queryClient = useQueryClient();

  // Buscar unidades (árvore hierárquica)
  const {
    data: units = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['units', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('units')
        .select(`
          *,
          parent:units!parent_id(id, nome, codigo),
          children:units!parent_id(id, nome, codigo, nivel_hierarquico)
        `)
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('nivel_hierarquico')
        .order('nome');

      if (error) throw error;
      return data as Unit[];
    },
  });

  // Buscar unidades para select (apenas ativas)
  const { data: unitsForSelect = [] } = useQuery({
    queryKey: ['units-select', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('units')
        .select('id, codigo, nome, parent_id, nivel_hierarquico')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('nivel_hierarquico')
        .order('nome');

      if (error) throw error;
      return data;
    },
  });

  // Criar unidade
  const createUnit = useMutation({
    mutationFn: async (data: UnitInsert) => {
      // Calcular nível hierárquico baseado no parent
      let nivel = 1;
      if (data.parent_id) {
        const { data: parent } = await rhSupabase
          .from('units')
          .select('nivel_hierarquico')
          .eq('id', data.parent_id)
          .single();
        
        if (parent) {
          nivel = (parent.nivel_hierarquico || 1) + 1;
        }
      }

      const { data: result, error } = await rhSupabase
        .from('units')
        .insert({ ...data, nivel_hierarquico: nivel })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', companyId] });
      queryClient.invalidateQueries({ queryKey: ['units-select', companyId] });
    },
  });

  // Atualizar unidade
  const updateUnit = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UnitUpdate }) => {
      const { data: result, error } = await rhSupabase
        .from('units')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', companyId] });
      queryClient.invalidateQueries({ queryKey: ['units-select', companyId] });
    },
  });

  // Excluir unidade (soft delete)
  const deleteUnit = useMutation({
    mutationFn: async (id: string) => {
      // Verificar se tem filhos
      const { data: children } = await rhSupabase
        .from('units')
        .select('id')
        .eq('parent_id', id)
        .eq('is_active', true);

      if (children && children.length > 0) {
        throw new Error('Não é possível excluir uma unidade que possui subunidades');
      }

      const { error } = await rhSupabase
        .from('units')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', companyId] });
      queryClient.invalidateQueries({ queryKey: ['units-select', companyId] });
    },
  });

  // Mover unidade (alterar parent)
  const moveUnit = useMutation({
    mutationFn: async ({ id, newParentId }: { id: string; newParentId: string | null }) => {
      // Calcular novo nível hierárquico
      let nivel = 1;
      if (newParentId) {
        const { data: parent } = await rhSupabase
          .from('units')
          .select('nivel_hierarquico')
          .eq('id', newParentId)
          .single();
        
        if (parent) {
          nivel = (parent.nivel_hierarquico || 1) + 1;
        }
      }

      const { error } = await rhSupabase
        .from('units')
        .update({ parent_id: newParentId, nivel_hierarquico: nivel })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', companyId] });
      queryClient.invalidateQueries({ queryKey: ['units-select', companyId] });
    },
  });

  return {
    units,
    unitsForSelect,
    isLoading,
    error,
    createUnit,
    updateUnit,
    deleteUnit,
    moveUnit,
    refetch,
  };
}
