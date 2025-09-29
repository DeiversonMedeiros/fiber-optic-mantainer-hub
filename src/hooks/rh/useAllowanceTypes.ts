import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface AllowanceType {
  id: string;
  codigo: string;
  descricao: string;
  tipo: string;
  valor: number;
  unidade: string;
  base_calculo: string;
  is_cumulative: boolean;
  requires_approval: boolean;
  is_active: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface AllowanceTypeInsert {
  codigo: string;
  descricao: string;
  tipo: string;
  valor: number;
  unidade: string;
  base_calculo: string;
  is_cumulative: boolean;
  requires_approval: boolean;
  is_active?: boolean;
}

export interface AllowanceTypeUpdate {
  codigo?: string;
  descricao?: string;
  tipo?: string;
  valor?: number;
  unidade?: string;
  base_calculo?: string;
  is_cumulative?: boolean;
  requires_approval?: boolean;
  is_active?: boolean;
}

export const useAllowanceTypes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const companyId = user?.user_metadata?.company_id;

  const { data: allowanceTypes = [], isLoading, error } = useQuery({
    queryKey: ['allowance-types', companyId],
    queryFn: async () => {
      try {
        // Consulta simples sem filtros primeiro para testar
        const { data: allData, error: allError } = await rhSupabase
          .from('allowance_types')
          .select('*');

        if (allError) throw allError;

        // Se temos company_id, filtrar por ele
        if (companyId) {
          const filteredData = allData?.filter(item => 
            item.company_id === companyId && item.is_active === true
          ) || [];
          return filteredData as AllowanceType[];
        } else {
          // Se não temos company_id, retornar todos os ativos
          const activeData = allData?.filter(item => item.is_active === true) || [];
          return activeData as AllowanceType[];
        }
      } catch (err) {
        throw err;
      }
    },
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: async (data: AllowanceTypeInsert) => {
      if (!companyId) throw new Error('Company ID not found');

      const { data: result, error } = await rhSupabase
        .from('allowance_types')
        .insert([{
          ...data,
          company_id: companyId,
          created_by: user?.id,
          updated_by: user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowance-types', companyId] });
      toast({
        title: "Sucesso",
        description: "Tipo de adicional criado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao criar tipo de adicional: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AllowanceTypeUpdate }) => {
      const { data: result, error } = await rhSupabase
        .from('allowance_types')
        .update({
          ...data,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowance-types', companyId] });
      toast({
        title: "Sucesso",
        description: "Tipo de adicional atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar tipo de adicional: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('allowance_types')
        .update({ is_active: false, updated_by: user?.id })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowance-types', companyId] });
      toast({
        title: "Sucesso",
        description: "Tipo de adicional removido com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao remover tipo de adicional: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  return {
    allowanceTypes,
    isLoading,
    error,
    createAllowanceType: createMutation.mutate,
    updateAllowanceType: updateMutation.mutate,
    deleteAllowanceType: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
};
