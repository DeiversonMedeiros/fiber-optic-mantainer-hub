import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Benefit, BenefitInsert, BenefitUpdate } from '@/integrations/supabase/rh-types';

// Chaves de query para cache
const BENEFIT_KEYS = {
  all: ['rh', 'benefits'] as const,
  lists: () => [...BENEFIT_KEYS.all, 'list'] as const,
  list: (filters: string) => [...BENEFIT_KEYS.lists(), { filters }] as const,
  details: () => [...BENEFIT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...BENEFIT_KEYS.details(), id] as const,
  active: () => [...BENEFIT_KEYS.all, 'active'] as const,
  byType: (type: string) => [...BENEFIT_KEYS.all, 'type', type] as const,
};

export const useBenefits = (companyId?: string) => {
  const queryClient = useQueryClient();

  // Buscar todos os benefícios
  const {
    data: benefits = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: BENEFIT_KEYS.list(companyId || 'all'),
    queryFn: async (): Promise<Benefit[]> => {
      console.log('🔍 Buscando benefícios...');
      
      let query = supabase
        .from('rh.benefits')
        .select('*')
        .order('nome');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar benefícios:', error);
        throw error;
      }

      console.log('✅ Benefícios encontrados:', data?.length || 0);
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 15, // 15 minutos (benefícios mudam menos)
    gcTime: 1000 * 60 * 60, // 1 hora
  });

  // Buscar benefícios ativos
  const {
    data: activeBenefits = [],
    isLoading: activeLoading,
    error: activeError
  } = useQuery({
    queryKey: BENEFIT_KEYS.active(),
    queryFn: async (): Promise<Benefit[]> => {
      console.log('🔍 Buscando benefícios ativos...');
      
      let query = supabase
        .from('rh.benefits')
        .select('*')
        .eq('is_active', true)
        .order('nome');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar benefícios ativos:', error);
        throw error;
      }

      console.log('✅ Benefícios ativos encontrados:', data?.length || 0);
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 15, // 15 minutos
  });

  // Buscar benefício por ID
  const useBenefit = (id: string) => {
    return useQuery({
      queryKey: BENEFIT_KEYS.detail(id),
      queryFn: async (): Promise<Benefit | null> => {
        console.log('🔍 Buscando benefício:', id);
        
        const { data, error } = await supabase
          .from('rh.benefits')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('❌ Erro ao buscar benefício:', error);
          throw error;
        }

        console.log('✅ Benefício encontrado:', data?.nome);
        return data;
      },
      enabled: !!id,
      staleTime: 1000 * 60 * 15, // 15 minutos
    });
  };

  // Buscar benefícios por tipo
  const useBenefitsByType = (type: string) => {
    return useQuery({
      queryKey: BENEFIT_KEYS.byType(type),
      queryFn: async (): Promise<Benefit[]> => {
        console.log('🔍 Buscando benefícios por tipo:', type);
        
        let query = supabase
          .from('rh.benefits')
          .select('*')
          .eq('tipo', type)
          .eq('is_active', true)
          .order('nome');

        if (companyId) {
          query = query.eq('company_id', companyId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('❌ Erro ao buscar benefícios por tipo:', error);
          throw error;
        }

        console.log('✅ Benefícios encontrados por tipo:', data?.length || 0);
        return data || [];
      },
      enabled: !!companyId && !!type,
      staleTime: 1000 * 60 * 15, // 15 minutos
    });
  };

  // Criar benefício
  const createBenefit = useMutation({
    mutationFn: async (benefit: BenefitInsert): Promise<Benefit> => {
      console.log('➕ Criando benefício:', benefit.nome);
      
      const { data, error } = await supabase
        .from('rh.benefits')
        .insert(benefit)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar benefício:', error);
        throw error;
      }

      console.log('✅ Benefício criado:', data.nome);
      return data;
    },
    onSuccess: () => {
      // Invalidar cache de benefícios
      queryClient.invalidateQueries({ queryKey: BENEFIT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BENEFIT_KEYS.active() });
      console.log('🔄 Cache de benefícios invalidado');
    },
    onError: (error) => {
      console.error('❌ Erro na criação do benefício:', error);
    },
  });

  // Atualizar benefício
  const updateBenefit = useMutation({
    mutationFn: async ({ id, ...updates }: BenefitUpdate & { id: string }): Promise<Benefit> => {
      console.log('✏️ Atualizando benefício:', id);
      
      const { data, error } = await supabase
        .from('rh.benefits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar benefício:', error);
        throw error;
      }

      console.log('✅ Benefício atualizado:', data.nome);
      return data;
    },
    onSuccess: (data) => {
      // Atualizar cache específico e listas
      queryClient.setQueryData(BENEFIT_KEYS.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: BENEFIT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BENEFIT_KEYS.active() });
      console.log('🔄 Cache de benefícios atualizado');
    },
    onError: (error) => {
      console.error('❌ Erro na atualização do benefício:', error);
    },
  });

  // Deletar benefício
  const deleteBenefit = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      console.log('🗑️ Deletando benefício:', id);
      
      const { error } = await supabase
        .from('rh.benefits')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao deletar benefício:', error);
        throw error;
      }

      console.log('✅ Benefício deletado');
    },
    onSuccess: (_, id) => {
      // Remover do cache e invalidar listas
      queryClient.removeQueries({ queryKey: BENEFIT_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: BENEFIT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BENEFIT_KEYS.active() });
      console.log('🔄 Cache de benefícios limpo');
    },
    onError: (error) => {
      console.error('❌ Erro na exclusão do benefício:', error);
    },
  });

  // Ativar/Desativar benefício
  const toggleBenefitStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }): Promise<Benefit> => {
      console.log(`${isActive ? '✅' : '❌'} ${isActive ? 'Ativando' : 'Desativando'} benefício:`, id);
      
      const { data, error } = await supabase
        .from('rh.benefits')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao alterar status do benefício:', error);
        throw error;
      }

      console.log(`✅ Benefício ${isActive ? 'ativado' : 'desativado'}:`, data.nome);
      return data;
    },
    onSuccess: (data) => {
      // Atualizar cache específico e listas
      queryClient.setQueryData(BENEFIT_KEYS.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: BENEFIT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BENEFIT_KEYS.active() });
      console.log('🔄 Cache de benefícios atualizado');
    },
    onError: (error) => {
      console.error('❌ Erro na alteração do status do benefício:', error);
    },
  });

  // Calcular valor do benefício
  const calculateBenefitValue = (benefit: Benefit, baseValue: number): number => {
    if (benefit.tipo === 'valor_fixo' && benefit.valor) {
      return benefit.valor;
    } else if (benefit.tipo === 'percentual' && benefit.percentual) {
      return (baseValue * benefit.percentual) / 100;
    }
    return 0;
  };

  // Validar benefício
  const validateBenefit = (benefit: BenefitInsert): string[] => {
    const errors: string[] = [];

    if (!benefit.nome?.trim()) {
      errors.push('Nome do benefício é obrigatório');
    }

    if (!benefit.tipo) {
      errors.push('Tipo do benefício é obrigatório');
    }

    if (benefit.tipo === 'valor_fixo' && (!benefit.valor || benefit.valor <= 0)) {
      errors.push('Valor fixo deve ser maior que zero');
    }

    if (benefit.tipo === 'percentual' && (!benefit.percentual || benefit.percentual <= 0 || benefit.percentual > 100)) {
      errors.push('Percentual deve estar entre 0 e 100');
    }

    return errors;
  };

  return {
    // Dados
    benefits,
    activeBenefits,
    isLoading: isLoading || activeLoading,
    error: error || activeError,
    
    // Ações
    createBenefit,
    updateBenefit,
    deleteBenefit,
    toggleBenefitStatus,
    refetch,
    
    // Hooks específicos
    useBenefit,
    useBenefitsByType,
    
    // Utilitários
    calculateBenefitValue,
    validateBenefit,
  };
};


