import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface FgtsConfig {
  id: string;
  codigo: string;
  descricao: string;
  aliquota: number | null;
  valor_maximo?: number | null;
  is_active: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface FgtsConfigInsert {
  codigo: string;
  descricao: string;
  aliquota: number;
  valor_maximo?: number;
  is_active?: boolean;
}

export interface FgtsConfigUpdate {
  codigo?: string;
  descricao?: string;
  aliquota?: number;
  valor_maximo?: number;
  is_active?: boolean;
}

export const useFgtsConfig = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const companyId = user?.user_metadata?.company_id;

  const { data: fgtsConfigs = [], isLoading, error } = useQuery({
    queryKey: ['fgts-config', companyId],
    queryFn: async () => {
      try {
        // Consulta simples sem filtros primeiro para testar
        const { data: allData, error: allError } = await rhSupabase
          .from('fgts_config')
          .select('*');

        if (allError) throw allError;

        // Se temos company_id, filtrar por ele
        if (companyId) {
          const filteredData = allData?.filter(item => 
            item.company_id === companyId && item.is_active === true
          ) || [];
          return filteredData as FgtsConfig[];
        } else {
          // Se não temos company_id, retornar todos os ativos
          const activeData = allData?.filter(item => item.is_active === true) || [];
          return activeData as FgtsConfig[];
        }
      } catch (err) {
        throw err;
      }
    },
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: async (data: FgtsConfigInsert) => {
      if (!companyId) throw new Error('Company ID not found');

      const { data: result, error } = await rhSupabase
        .from('fgts_config')
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
      queryClient.invalidateQueries({ queryKey: ['fgts-config', companyId] });
      toast({
        title: "Sucesso",
        description: "Configuração FGTS criada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao criar configuração FGTS: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FgtsConfigUpdate }) => {
      const { data: result, error } = await rhSupabase
        .from('fgts_config')
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
      queryClient.invalidateQueries({ queryKey: ['fgts-config', companyId] });
      toast({
        title: "Sucesso",
        description: "Configuração FGTS atualizada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar configuração FGTS: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('fgts_config')
        .update({ is_active: false, updated_by: user?.id })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fgts-config', companyId] });
      toast({
        title: "Sucesso",
        description: "Configuração FGTS removida com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao remover configuração FGTS: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  return {
    fgtsConfigs,
    isLoading,
    error,
    createFgtsConfig: createMutation.mutate,
    updateFgtsConfig: updateMutation.mutate,
    deleteFgtsConfig: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
};
