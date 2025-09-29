import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface IrrfBracket {
  id: string;
  codigo: string;
  descricao: string;
  valor_minimo: number | null;
  valor_maximo?: number | null;
  aliquota: number | null;
  valor_deducao: number | null;
  is_active: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface IrrfBracketInsert {
  codigo: string;
  descricao: string;
  valor_minimo: number;
  valor_maximo?: number;
  aliquota: number;
  valor_deducao: number;
  is_active?: boolean;
}

export interface IrrfBracketUpdate {
  codigo?: string;
  descricao?: string;
  valor_minimo?: number;
  valor_maximo?: number;
  aliquota?: number;
  valor_deducao?: number;
  is_active?: boolean;
}

export const useIrrfBrackets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const companyId = user?.user_metadata?.company_id;

  const { data: irrfBrackets = [], isLoading, error } = useQuery({
    queryKey: ['irrf-brackets', companyId],
    queryFn: async () => {
      try {
        // Consulta simples sem filtros primeiro para testar
        const { data: allData, error: allError } = await rhSupabase
          .from('rh.irrf_brackets')
          .select('*');

        if (allError) throw allError;

        // Se temos company_id, filtrar por ele
        if (companyId) {
          const filteredData = allData?.filter(item => 
            item.company_id === companyId && item.is_active === true
          ) || [];
          return filteredData as IrrfBracket[];
        } else {
          // Se não temos company_id, retornar todos os ativos
          const activeData = allData?.filter(item => item.is_active === true) || [];
          return activeData as IrrfBracket[];
        }
      } catch (err) {
        throw err;
      }
    },
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: async (data: IrrfBracketInsert) => {
      if (!companyId) throw new Error('Company ID not found');

      const { data: result, error } = await rhSupabase
        .from('rh.irrf_brackets')
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
      queryClient.invalidateQueries({ queryKey: ['irrf-brackets', companyId] });
      toast({
        title: "Sucesso",
        description: "Faixa IRRF criada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao criar faixa IRRF: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: IrrfBracketUpdate }) => {
      const { data: result, error } = await rhSupabase
        .from('rh.irrf_brackets')
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
      queryClient.invalidateQueries({ queryKey: ['irrf-brackets', companyId] });
      toast({
        title: "Sucesso",
        description: "Faixa IRRF atualizada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar faixa IRRF: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('rh.irrf_brackets')
        .update({ is_active: false, updated_by: user?.id })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['irrf-brackets', companyId] });
      toast({
        title: "Sucesso",
        description: "Faixa IRRF removida com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao remover faixa IRRF: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  return {
    irrfBrackets,
    isLoading,
    error,
    createIrrfBracket: createMutation.mutate,
    updateIrrfBracket: updateMutation.mutate,
    deleteIrrfBracket: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
};
