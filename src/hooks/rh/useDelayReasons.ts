import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface DelayReason {
  id: string;
  codigo: string;
  descricao: string;
  categoria: string;
  requires_justification: boolean;
  requires_medical_certificate: boolean;
  is_active: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface DelayReasonInsert {
  codigo: string;
  descricao: string;
  categoria: string;
  requires_justification: boolean;
  requires_medical_certificate: boolean;
  is_active?: boolean;
}

export interface DelayReasonUpdate {
  codigo?: string;
  descricao?: string;
  categoria?: string;
  requires_justification?: boolean;
  requires_medical_certificate?: boolean;
  is_active?: boolean;
}

export const useDelayReasons = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const companyId = user?.user_metadata?.company_id;

  const { data: delayReasons = [], isLoading, error } = useQuery({
    queryKey: ['delay-reasons', companyId],
    queryFn: async () => {
      try {
        // Consulta simples sem filtros primeiro para testar
        const { data: allData, error: allError } = await rhSupabase
          .from('rh.delay_reasons')
          .select('*');

        if (allError) throw allError;

        // Se temos company_id, filtrar por ele
        if (companyId) {
          const filteredData = allData?.filter(item => 
            item.company_id === companyId && item.is_active === true
          ) || [];
          return filteredData as DelayReason[];
        } else {
          // Se não temos company_id, retornar todos os ativos
          const activeData = allData?.filter(item => item.is_active === true) || [];
          return activeData as DelayReason[];
        }
      } catch (err) {
        throw err;
      }
    },
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: async (data: DelayReasonInsert) => {
      if (!companyId) throw new Error('Company ID not found');

      const { data: result, error } = await rhSupabase
        .from('rh.delay_reasons')
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
      queryClient.invalidateQueries({ queryKey: ['delay-reasons', companyId] });
      toast({
        title: "Sucesso",
        description: "Motivo de atraso criado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao criar motivo de atraso: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DelayReasonUpdate }) => {
      const { data: result, error } = await rhSupabase
        .from('rh.delay_reasons')
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
      queryClient.invalidateQueries({ queryKey: ['delay-reasons', companyId] });
      toast({
        title: "Sucesso",
        description: "Motivo de atraso atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar motivo de atraso: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('rh.delay_reasons')
        .update({ is_active: false, updated_by: user?.id })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delay-reasons', companyId] });
      toast({
        title: "Sucesso",
        description: "Motivo de atraso removido com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao remover motivo de atraso: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  return {
    delayReasons,
    isLoading,
    error,
    createDelayReason: createMutation.mutate,
    updateDelayReason: updateMutation.mutate,
    deleteDelayReason: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
};
