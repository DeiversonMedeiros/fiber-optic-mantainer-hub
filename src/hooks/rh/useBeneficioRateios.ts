import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { 
  BeneficioRateio, 
  BeneficioRateioInsert, 
  BeneficioRateioUpdate,
  BeneficioRateioDepartamento,
  BeneficioRateioDepartamentoInsert,
  BeneficioRateioDepartamentoUpdate
} from '@/integrations/supabase/rh-types';

export const useBeneficioRateios = (companyId?: string) => {
  const queryClient = useQueryClient();

  // Buscar rateios
  const {
    data: rateios = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['beneficioRateios', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await rhSupabase
        .from('beneficio_rateios')
        .select(`
          *,
          beneficio_tipos (
            nome,
            categoria
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar rateios:', error);
        throw error;
      }
      return data as any[];
    },
    enabled: !!companyId,
  });

  // Criar rateio
  const createRateio = useMutation({
    mutationFn: async (data: BeneficioRateioInsert) => {
      const { data: result, error } = await rhSupabase
        .from('beneficio_rateios')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficioRateios', companyId] });
    },
  });

  // Atualizar rateio
  const updateRateio = useMutation({
    mutationFn: async ({ id, ...data }: BeneficioRateioUpdate & { id: string }) => {
      const { data: result, error } = await rhSupabase
        .from('beneficio_rateios')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficioRateios', companyId] });
    },
  });

  // Excluir rateio
  const deleteRateio = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('beneficio_rateios')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficioRateios', companyId] });
    },
  });

  // Calcular rateio
  const calcularRateio = useMutation({
    mutationFn: async (rateioId: string) => {
      const { data, error } = await rhSupabase
        .rpc('calcular_rateio_beneficio', { p_rateio_id: rateioId });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficioRateios', companyId] });
      queryClient.invalidateQueries({ queryKey: ['beneficioRateioDepartamentos'] });
    },
  });

  // Aplicar rateio
  const aplicarRateio = useMutation({
    mutationFn: async (rateioId: string) => {
      const { data, error } = await rhSupabase
        .rpc('aplicar_rateio_beneficio', { p_rateio_id: rateioId });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficioRateios', companyId] });
      queryClient.invalidateQueries({ queryKey: ['beneficioRateioDepartamentos'] });
    },
  });

  // Obter resumo de rateios
  const getResumoRateios = useQuery({
    queryKey: ['resumoRateios', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await rhSupabase
        .rpc('get_resumo_rateios', { 
          p_company_id: companyId 
        });

      if (error) {
        console.error('Erro ao buscar resumo de rateios:', error);
        throw error;
      }
      return data as any[];
    },
    enabled: !!companyId,
  });

  return {
    rateios,
    isLoading,
    error,
    createRateio,
    updateRateio,
    deleteRateio,
    calcularRateio,
    aplicarRateio,
    resumoRateios: getResumoRateios.data || [],
    isLoadingResumo: getResumoRateios.isLoading,
  };
};

export const useBeneficioRateioDepartamentos = (rateioId?: string) => {
  const queryClient = useQueryClient();

  // Buscar departamentos do rateio
  const {
    data: departamentos = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['beneficioRateioDepartamentos', rateioId],
    queryFn: async () => {
      if (!rateioId) return [];

      const { data, error } = await rhSupabase
        .from('beneficio_rateio_departamentos')
        .select(`
          *,
          departments (
            nome
          )
        `)
        .eq('rateio_id', rateioId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar departamentos do rateio:', error);
        throw error;
      }
      return data as any[];
    },
    enabled: !!rateioId,
  });

  // Adicionar departamento ao rateio
  const addDepartamento = useMutation({
    mutationFn: async (data: BeneficioRateioDepartamentoInsert) => {
      const { data: result, error } = await rhSupabase
        .from('beneficio_rateio_departamentos')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficioRateioDepartamentos', rateioId] });
    },
  });

  // Atualizar departamento do rateio
  const updateDepartamento = useMutation({
    mutationFn: async ({ id, ...data }: BeneficioRateioDepartamentoUpdate & { id: string }) => {
      const { data: result, error } = await rhSupabase
        .from('beneficio_rateio_departamentos')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficioRateioDepartamentos', rateioId] });
    },
  });

  // Remover departamento do rateio
  const removeDepartamento = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('beneficio_rateio_departamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficioRateioDepartamentos', rateioId] });
    },
  });

  return {
    departamentos,
    isLoading,
    error,
    addDepartamento,
    updateDepartamento,
    removeDepartamento,
  };
};
