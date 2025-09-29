import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { Rubrica, RubricaInsert, RubricaUpdate } from '@/integrations/supabase/rh-types';

interface UseRubricasProps {
  companyId: string;
}

export function useRubricas({ companyId }: UseRubricasProps) {
  const queryClient = useQueryClient();

  // Buscar rubricas
  const {
    data: rubricas = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['rubricas', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('rh.rubricas')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('codigo');

      if (error) throw error;
      return data as Rubrica[];
    },
  });

  // Criar rubrica
  const createRubrica = useMutation({
    mutationFn: async (data: RubricaInsert) => {
      const { data: result, error } = await rhSupabase
        .from('rh.rubricas')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubricas', companyId] });
    },
  });

  // Atualizar rubrica
  const updateRubrica = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RubricaUpdate }) => {
      const { data: result, error } = await rhSupabase
        .from('rh.rubricas')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubricas', companyId] });
    },
  });

  // Excluir rubrica (soft delete)
  const deleteRubrica = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('rh.rubricas')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubricas', companyId] });
    },
  });

  return {
    rubricas,
    isLoading,
    error,
    createRubrica,
    updateRubrica,
    deleteRubrica,
    refetch,
  };
}

// Hook para buscar naturezas eSocial (para select)
export function useNaturezasESocial(companyId: string) {
  const { data: naturezas = [], isLoading } = useQuery({
    queryKey: ['naturezas-esocial', companyId],
    queryFn: async () => {
      try {
        const { data, error } = await rhSupabase
          .from('rh.esocial_naturezas_rubricas')
          .select('id, codigo, descricao')
          .eq('company_id', companyId)
          .eq('is_active', true)
          .order('codigo');

        if (error) {
          console.warn('Erro ao buscar naturezas eSocial:', error);
          return [];
        }
        
        return data || [];
      } catch (error) {
        console.warn('Erro ao buscar naturezas eSocial:', error);
        return [];
      }
    },
  });

  return { naturezas, isLoading };
}
