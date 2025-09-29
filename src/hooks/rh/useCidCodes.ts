import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface CidCode {
  id: string;
  codigo: string;
  descricao: string;
  categoria?: string;
  requires_work_restriction: boolean;
  max_absence_days?: number;
  is_active: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CidCodeInsert {
  codigo: string;
  descricao: string;
  categoria?: string;
  requires_work_restriction?: boolean;
  max_absence_days?: number;
  is_active?: boolean;
}

export interface CidCodeUpdate {
  codigo?: string;
  descricao?: string;
  categoria?: string;
  requires_work_restriction?: boolean;
  max_absence_days?: number;
  is_active?: boolean;
}

export const useCidCodes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const companyId = user?.user_metadata?.company_id;

  const { data: cidCodes = [], isLoading, error } = useQuery({
    queryKey: ['cid-codes', companyId],
    queryFn: async () => {
      try {
        // Consulta simples sem filtros primeiro para testar
        const { data: allData, error: allError } = await rhSupabase
          .from('rh.cid_codes')
          .select('*');

        if (allError) throw allError;

        // Se temos company_id, filtrar por ele
        if (companyId) {
          const filteredData = allData?.filter(item => 
            item.company_id === companyId && item.is_active === true
          ) || [];
          return filteredData as CidCode[];
        } else {
          // Se não temos company_id, retornar todos os ativos
          const activeData = allData?.filter(item => item.is_active === true) || [];
          return activeData as CidCode[];
        }
      } catch (err) {
        throw err;
      }
    },
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: async (data: CidCodeInsert) => {
      if (!companyId) throw new Error('Company ID not found');

      const { data: result, error } = await rhSupabase
        .from('rh.cid_codes')
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
      queryClient.invalidateQueries({ queryKey: ['cid-codes', companyId] });
      toast({
        title: "Sucesso",
        description: "Código CID criado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao criar código CID: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CidCodeUpdate }) => {
      const { data: result, error } = await rhSupabase
        .from('rh.cid_codes')
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
      queryClient.invalidateQueries({ queryKey: ['cid-codes', companyId] });
      toast({
        title: "Sucesso",
        description: "Código CID atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar código CID: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('rh.cid_codes')
        .update({ is_active: false, updated_by: user?.id })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cid-codes', companyId] });
      toast({
        title: "Sucesso",
        description: "Código CID removido com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao remover código CID: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  return {
    cidCodes,
    isLoading,
    error,
    createCidCode: createMutation.mutate,
    updateCidCode: updateMutation.mutate,
    deleteCidCode: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
};
