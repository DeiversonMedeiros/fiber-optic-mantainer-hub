import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/rh-client';
import { useToast } from '@/hooks/use-toast';

export function useFuncionarioElegibilidade(companyId: string, beneficioTipoId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar funcionários elegíveis
  const {
    data: funcionariosElegiveis = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['funcionariosElegiveis', companyId, beneficioTipoId],
    queryFn: async () => {
      if (!beneficioTipoId) return [];

      const { data, error } = await rhSupabase
        .rpc('get_funcionarios_elegiveis', {
          p_company_id: companyId,
          p_beneficio_tipo_id: beneficioTipoId
        });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!beneficioTipoId,
  });

  // Verificar elegibilidade de um funcionário específico
  const {
    data: elegibilidadeFuncionario,
    isLoading: isLoadingElegibilidade,
    error: errorElegibilidade,
  } = useQuery({
    queryKey: ['elegibilidadeFuncionario', companyId, beneficioTipoId],
    queryFn: async () => {
      if (!beneficioTipoId) return null;

      const { data, error } = await rhSupabase
        .rpc('verificar_elegibilidade_funcionario', {
          p_employee_id: '', // Será passado como parâmetro
          p_beneficio_tipo_id: beneficioTipoId
        });

      if (error) throw error;
      return data as any[];
    },
    enabled: false, // Será chamado manualmente
  });

  // Recalcular elegibilidade de todos os funcionários
  const recalcularElegibilidade = useMutation({
    mutationFn: async (beneficioTipoId?: string) => {
      const { data, error } = await rhSupabase
        .rpc('calcular_elegibilidade_funcionarios', {
          p_company_id: companyId,
          p_beneficio_tipo_id: beneficioTipoId
        });

      if (error) throw error;
      return data as any[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionariosElegiveis', companyId] });
      queryClient.invalidateQueries({ queryKey: ['elegibilidadeFuncionario', companyId] });
      toast({
        title: 'Sucesso!',
        description: 'Elegibilidade recalculada com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Erro ao recalcular elegibilidade:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível recalcular a elegibilidade.',
        variant: 'destructive',
      });
    },
  });

  // Verificar elegibilidade de um funcionário específico
  const verificarElegibilidadeFuncionario = async (employeeId: string, beneficioTipoId: string) => {
    const { data, error } = await rhSupabase
      .rpc('verificar_elegibilidade_funcionario', {
        p_employee_id: employeeId,
        p_beneficio_tipo_id: beneficioTipoId
      });

    if (error) throw error;
    return data as any[];
  };

  return {
    funcionariosElegiveis,
    elegibilidadeFuncionario,
    isLoading: isLoading || isLoadingElegibilidade,
    error: error || errorElegibilidade,
    recalcularElegibilidade,
    verificarElegibilidadeFuncionario,
  };
}
