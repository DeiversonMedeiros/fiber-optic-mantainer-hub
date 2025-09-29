import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface AbsenceType {
  id: string;
  codigo: string;
  descricao: string;
  categoria: string;
  is_paid: boolean;
  requires_medical_certificate: boolean;
  requires_approval: boolean;
  max_days?: number;
  is_active: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface AbsenceTypeInsert {
  codigo: string;
  descricao: string;
  categoria: string;
  is_paid: boolean;
  requires_medical_certificate: boolean;
  requires_approval: boolean;
  max_days?: number;
  is_active?: boolean;
}

export interface AbsenceTypeUpdate {
  codigo?: string;
  descricao?: string;
  categoria?: string;
  is_paid?: boolean;
  requires_medical_certificate?: boolean;
  requires_approval?: boolean;
  max_days?: number;
  is_active?: boolean;
}

export const useAbsenceTypes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const companyId = user?.user_metadata?.company_id;

  const { data: absenceTypes = [], isLoading, error } = useQuery({
    queryKey: ['absence-types', companyId],
    queryFn: async () => {
      try {
        // Consulta simples sem filtros primeiro para testar
        const { data: allData, error: allError } = await rhSupabase
          .from('absence_types')
          .select('*');

        if (allError) throw allError;

        // Se temos company_id, filtrar por ele
        if (companyId) {
          const filteredData = allData?.filter(item => 
            item.company_id === companyId && item.is_active === true
          ) || [];
          return filteredData as AbsenceType[];
        } else {
          // Se não temos company_id, retornar todos os ativos
          const activeData = allData?.filter(item => item.is_active === true) || [];
          return activeData as AbsenceType[];
        }
      } catch (err) {
        throw err;
      }
    },
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: async (data: AbsenceTypeInsert) => {
      if (!companyId) throw new Error('Company ID not found');

      const { data: result, error } = await rhSupabase
        .from('absence_types')
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
      queryClient.invalidateQueries({ queryKey: ['absence-types', companyId] });
      toast({
        title: "Sucesso",
        description: "Tipo de afastamento criado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao criar tipo de afastamento: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AbsenceTypeUpdate }) => {
      const { data: result, error } = await rhSupabase
        .from('absence_types')
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
      queryClient.invalidateQueries({ queryKey: ['absence-types', companyId] });
      toast({
        title: "Sucesso",
        description: "Tipo de afastamento atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar tipo de afastamento: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('absence_types')
        .update({ is_active: false, updated_by: user?.id })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absence-types', companyId] });
      toast({
        title: "Sucesso",
        description: "Tipo de afastamento removido com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao remover tipo de afastamento: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  return {
    absenceTypes,
    isLoading,
    error,
    createAbsenceType: createMutation.mutate,
    updateAbsenceType: updateMutation.mutate,
    deleteAbsenceType: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
};
