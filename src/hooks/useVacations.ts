import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Vacation, VacationInsert, VacationUpdate } from '@/integrations/supabase/rh-types';

// Chaves de query para cache
const VACATION_KEYS = {
  all: ['rh', 'vacations'] as const,
  lists: () => [...VACATION_KEYS.all, 'list'] as const,
  list: (filters: string) => [...VACATION_KEYS.lists(), { filters }] as const,
  details: () => [...VACATION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...VACATION_KEYS.details(), id] as const,
  employee: (employeeId: string) => [...VACATION_KEYS.all, 'employee', employeeId] as const,
  year: (year: number) => [...VACATION_KEYS.all, 'year', year] as const,
  pending: () => [...VACATION_KEYS.all, 'pending'] as const,
};

export const useVacations = (companyId?: string) => {
  const queryClient = useQueryClient();

  // Buscar todas as férias
  const {
    data: vacations = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: VACATION_KEYS.list(companyId || 'all'),
    queryFn: async (): Promise<Vacation[]> => {
      console.log('🔍 Buscando férias...');
      
      let query = supabase
        .from('rh.vacations')
        .select('*')
        .order('ano', { ascending: false })
        .order('data_inicio', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar férias:', error);
        throw error;
      }

      console.log('✅ Férias encontradas:', data?.length || 0);
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
  });

  // Buscar férias pendentes
  const {
    data: pendingVacations = [],
    isLoading: pendingLoading,
    error: pendingError
  } = useQuery({
    queryKey: VACATION_KEYS.pending(),
    queryFn: async (): Promise<Vacation[]> => {
      console.log('🔍 Buscando férias pendentes...');
      
      let query = supabase
        .from('rh.vacations')
        .select('*')
        .eq('status', 'solicitado')
        .order('data_inicio', { ascending: true });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar férias pendentes:', error);
        throw error;
      }

      console.log('✅ Férias pendentes encontradas:', data?.length || 0);
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Buscar férias por funcionário
  const useVacationsByEmployee = (employeeId: string, year?: number) => {
    return useQuery({
      queryKey: [...VACATION_KEYS.employee(employeeId), year],
      queryFn: async (): Promise<Vacation[]> => {
        console.log('🔍 Buscando férias do funcionário:', employeeId);
        
        let query = supabase
          .from('rh.vacations')
          .select('*')
          .eq('employee_id', employeeId)
          .order('ano', { ascending: false })
          .order('data_inicio', { ascending: false });

        if (year) {
          query = query.eq('ano', year);
        }

        const { data, error } = await query;

        if (error) {
          console.error('❌ Erro ao buscar férias do funcionário:', error);
          throw error;
        }

        console.log('✅ Férias do funcionário encontradas:', data?.length || 0);
        return data || [];
      },
      enabled: !!employeeId,
      staleTime: 1000 * 60 * 10, // 10 minutos
    });
  };

  // Buscar férias por ano
  const useVacationsByYear = (year: number) => {
    return useQuery({
      queryKey: VACATION_KEYS.year(year),
      queryFn: async (): Promise<Vacation[]> => {
        console.log('🔍 Buscando férias do ano:', year);
        
        let query = supabase
          .from('rh.vacations')
          .select('*')
          .eq('ano', year)
          .order('data_inicio', { ascending: true });

        if (companyId) {
          query = query.eq('company_id', companyId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('❌ Erro ao buscar férias do ano:', error);
          throw error;
        }

        console.log('✅ Férias do ano encontradas:', data?.length || 0);
        return data || [];
      },
      enabled: !!year && !!companyId,
      staleTime: 1000 * 60 * 10, // 10 minutos
    });
  };

  // Buscar férias por ID
  const useVacation = (id: string) => {
    return useQuery({
      queryKey: VACATION_KEYS.detail(id),
      queryFn: async (): Promise<Vacation | null> => {
        console.log('🔍 Buscando férias:', id);
        
        const { data, error } = await supabase
          .from('rh.vacations')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('❌ Erro ao buscar férias:', error);
          throw error;
        }

        console.log('✅ Férias encontradas');
        return data;
      },
      enabled: !!id,
      staleTime: 1000 * 60 * 10, // 10 minutos
    });
  };

  // Criar férias
  const createVacation = useMutation({
    mutationFn: async (vacation: VacationInsert): Promise<Vacation> => {
      console.log('➕ Criando férias para funcionário:', vacation.employee_id);
      
      const { data, error } = await supabase
        .from('rh.vacations')
        .insert(vacation)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar férias:', error);
        throw error;
      }

      console.log('✅ Férias criadas');
      return data;
    },
    onSuccess: (data) => {
      // Invalidar caches relacionados
      queryClient.invalidateQueries({ queryKey: VACATION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: VACATION_KEYS.employee(data.employee_id!) });
      queryClient.invalidateQueries({ queryKey: VACATION_KEYS.year(data.ano) });
      queryClient.invalidateQueries({ queryKey: VACATION_KEYS.pending() });
      console.log('🔄 Cache de férias invalidado');
    },
    onError: (error) => {
      console.error('❌ Erro na criação das férias:', error);
    },
  });

  // Atualizar férias
  const updateVacation = useMutation({
    mutationFn: async ({ id, ...updates }: VacationUpdate & { id: string }): Promise<Vacation> => {
      console.log('✏️ Atualizando férias:', id);
      
      const { data, error } = await supabase
        .from('rh.vacations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar férias:', error);
        throw error;
      }

      console.log('✅ Férias atualizadas');
      return data;
    },
    onSuccess: (data) => {
      // Atualizar cache específico e invalidar relacionados
      queryClient.setQueryData(VACATION_KEYS.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: VACATION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: VACATION_KEYS.employee(data.employee_id!) });
      queryClient.invalidateQueries({ queryKey: VACATION_KEYS.year(data.ano) });
      queryClient.invalidateQueries({ queryKey: VACATION_KEYS.pending() });
      console.log('🔄 Cache de férias atualizado');
    },
    onError: (error) => {
      console.error('❌ Erro na atualização das férias:', error);
    },
  });

  // Deletar férias
  const deleteVacation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      console.log('🗑️ Deletando férias:', id);
      
      const { error } = await supabase
        .from('rh.vacations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao deletar férias:', error);
        throw error;
      }

      console.log('✅ Férias deletadas');
    },
    onSuccess: (_, id) => {
      // Remover do cache e invalidar relacionados
      queryClient.removeQueries({ queryKey: VACATION_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: VACATION_KEYS.lists() });
      console.log('🔄 Cache de férias limpo');
    },
    onError: (error) => {
      console.error('❌ Erro na exclusão das férias:', error);
    },
  });

  // Aprovar férias
  const approveVacation = useMutation({
    mutationFn: async ({ id, approvedBy, status }: { id: string; approvedBy: string; status: 'aprovado' | 'rejeitado' }): Promise<Vacation> => {
      console.log(`${status === 'aprovado' ? '✅' : '❌'} ${status === 'aprovado' ? 'Aprovando' : 'Rejeitando'} férias:`, id);
      
      const { data, error } = await supabase
        .from('rh.vacations')
        .update({ 
          status, 
          aprovado_por: approvedBy 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao alterar status das férias:', error);
        throw error;
      }

      console.log(`✅ Férias ${status}`);
      return data;
    },
    onSuccess: (data) => {
      // Atualizar cache específico e invalidar relacionados
      queryClient.setQueryData(VACATION_KEYS.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: VACATION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: VACATION_KEYS.employee(data.employee_id!) });
      queryClient.invalidateQueries({ queryKey: VACATION_KEYS.year(data.ano) });
      queryClient.invalidateQueries({ queryKey: VACATION_KEYS.pending() });
      console.log('🔄 Cache de férias atualizado');
    },
    onError: (error) => {
      console.error('❌ Erro na alteração do status das férias:', error);
    },
  });

  // Calcular dias de férias
  const calculateVacationDays = (vacation: Vacation): number => {
    if (!vacation.data_inicio || !vacation.data_fim) return 0;
    
    const inicio = new Date(vacation.data_inicio);
    const fim = new Date(vacation.data_fim);
    
    const diffTime = Math.abs(fim.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays + 1; // +1 para incluir o dia inicial
  };

  // Validar férias
  const validateVacation = (vacation: VacationInsert): string[] => {
    const errors: string[] = [];

    if (!vacation.employee_id) {
      errors.push('Funcionário é obrigatório');
    }

    if (!vacation.ano || vacation.ano < 2000 || vacation.ano > 2100) {
      errors.push('Ano deve estar entre 2000 e 2100');
    }

    if (!vacation.periodo?.trim()) {
      errors.push('Período é obrigatório');
    }

    if (vacation.data_inicio && vacation.data_fim) {
      const inicio = new Date(vacation.data_inicio);
      const fim = new Date(vacation.data_fim);
      
      if (inicio >= fim) {
        errors.push('Data de início deve ser anterior à data de fim');
      }
      
      if (inicio.getFullYear() !== vacation.ano) {
        errors.push('Data de início deve ser do ano especificado');
      }
    }

    if (vacation.dias_ferias && (vacation.dias_ferias < 0 || vacation.dias_ferias > 30)) {
      errors.push('Dias de férias devem estar entre 0 e 30');
    }

    if (vacation.dias_abono && (vacation.dias_abono < 0 || vacation.dias_abono > 10)) {
      errors.push('Dias de abono devem estar entre 0 e 10');
    }

    return errors;
  };

  return {
    // Dados
    vacations,
    pendingVacations,
    isLoading: isLoading || pendingLoading,
    error: error || pendingError,
    
    // Ações
    createVacation,
    updateVacation,
    deleteVacation,
    approveVacation,
    refetch,
    
    // Hooks específicos
    useVacation,
    useVacationsByEmployee,
    useVacationsByYear,
    
    // Utilitários
    calculateVacationDays,
    validateVacation,
  };
};


