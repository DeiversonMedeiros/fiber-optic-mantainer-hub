import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/rh-client';
import { 
  FuncionarioBeneficioHistorico, 
  FuncionarioBeneficioHistoricoInsert, 
  FuncionarioBeneficioHistoricoUpdate,
  Benefit
} from '@/integrations/supabase/rh-types';

export function useEmployeeBenefits(employeeId: string) {
  const queryClient = useQueryClient();

  // Buscar benefícios do funcionário
  const {
    data: benefits = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['employee-benefits', employeeId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('funcionario_beneficios_historico')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FuncionarioBeneficioHistorico[];
    },
    enabled: !!employeeId,
  });

  // Buscar tipos de benefício
  const { data: benefitTypes = [] } = useQuery({
    queryKey: ['benefit-types'],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('benefits')
        .select('*')
        .eq('is_active', true)
        .order('nome');

      if (error) throw error;
      return data as Benefit[];
    },
  });

  // Criar benefício
  const createBenefit = useMutation({
    mutationFn: async (data: FuncionarioBeneficioHistoricoInsert) => {
      const { data: result, error } = await rhSupabase
        .from('funcionario_beneficios_historico')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result as FuncionarioBeneficioHistorico;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-benefits', employeeId] });
    },
  });

  // Atualizar benefício
  const updateBenefit = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & FuncionarioBeneficioHistoricoUpdate) => {
      const { data: result, error } = await rhSupabase
        .from('funcionario_beneficios_historico')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as FuncionarioBeneficioHistorico;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-benefits', employeeId] });
    },
  });

  // Deletar benefício
  const deleteBenefit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('funcionario_beneficios_historico')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-benefits', employeeId] });
    },
  });

  return {
    benefits,
    benefitTypes,
    isLoading,
    error,
    createBenefit,
    updateBenefit,
    deleteBenefit,
  };
}