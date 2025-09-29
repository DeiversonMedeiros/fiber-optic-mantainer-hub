import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Payroll, PayrollInsert, PayrollUpdate, PayrollItem, PayrollItemInsert } from '@/integrations/supabase/rh-types';

// Chaves de query para cache
const PAYROLL_KEYS = {
  all: ['rh', 'payroll'] as const,
  lists: () => [...PAYROLL_KEYS.all, 'list'] as const,
  list: (filters: string) => [...PAYROLL_KEYS.lists(), { filters }] as const,
  details: () => [...PAYROLL_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PAYROLL_KEYS.details(), id] as const,
  byCompetencia: (competencia: string) => [...PAYROLL_KEYS.all, 'competencia', competencia] as const,
  items: (payrollId: string) => [...PAYROLL_KEYS.all, 'items', payrollId] as const,
  employee: (employeeId: string, competencia: string) => [...PAYROLL_KEYS.all, 'employee', employeeId, competencia] as const,
};

export const usePayroll = (companyId?: string) => {
  const queryClient = useQueryClient();

  // Buscar todas as folhas de pagamento
  const {
    data: payrolls = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: PAYROLL_KEYS.list(companyId || 'all'),
    queryFn: async (): Promise<Payroll[]> => {
      console.log('🔍 Buscando folhas de pagamento...');
      
      let query = supabase
        .from('rh.payroll')
        .select('*')
        .order('competencia', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar folhas de pagamento:', error);
        throw error;
      }

      console.log('✅ Folhas de pagamento encontradas:', data?.length || 0);
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 10, // 10 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
  });

  // Buscar folha de pagamento por competência
  const usePayrollByCompetencia = (competencia: string) => {
    return useQuery({
      queryKey: PAYROLL_KEYS.byCompetencia(competencia),
      queryFn: async (): Promise<Payroll | null> => {
        console.log('🔍 Buscando folha de pagamento da competência:', competencia);
        
        let query = supabase
          .from('rh.payroll')
          .select('*')
          .eq('competencia', competencia)
          .single();

        if (companyId) {
          query = query.eq('company_id', companyId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('❌ Erro ao buscar folha de pagamento:', error);
          throw error;
        }

        console.log('✅ Folha de pagamento encontrada');
        return data;
      },
      enabled: !!competencia && !!companyId,
      staleTime: 1000 * 60 * 10, // 10 minutos
    });
  };

  // Buscar folha de pagamento por ID
  const usePayroll = (id: string) => {
    return useQuery({
      queryKey: PAYROLL_KEYS.detail(id),
      queryFn: async (): Promise<Payroll | null> => {
        console.log('🔍 Buscando folha de pagamento:', id);
        
        const { data, error } = await supabase
          .from('rh.payroll')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('❌ Erro ao buscar folha de pagamento:', error);
          throw error;
        }

        console.log('✅ Folha de pagamento encontrada');
        return data;
      },
      enabled: !!id,
      staleTime: 1000 * 60 * 10, // 10 minutos
    });
  };

  // Buscar itens da folha de pagamento
  const usePayrollItems = (payrollId: string) => {
    return useQuery({
      queryKey: PAYROLL_KEYS.items(payrollId),
      queryFn: async (): Promise<PayrollItem[]> => {
        console.log('🔍 Buscando itens da folha de pagamento:', payrollId);
        
        const { data, error } = await supabase
          .from('rh.payroll_items')
          .select('*')
          .eq('payroll_id', payrollId)
          .order('tipo')
          .order('codigo');

        if (error) {
          console.error('❌ Erro ao buscar itens da folha:', error);
          throw error;
        }

        console.log('✅ Itens da folha encontrados:', data?.length || 0);
        return data || [];
      },
      enabled: !!payrollId,
      staleTime: 1000 * 60 * 5, // 5 minutos
    });
  };

  // Buscar folha de pagamento por funcionário e competência
  const usePayrollByEmployee = (employeeId: string, competencia: string) => {
    return useQuery({
      queryKey: PAYROLL_KEYS.employee(employeeId, competencia),
      queryFn: async (): Promise<PayrollItem[]> => {
        console.log('🔍 Buscando folha do funcionário:', employeeId, 'competência:', competencia);
        
        // Primeiro buscar a folha de pagamento
        let payrollQuery = supabase
          .from('rh.payroll')
          .select('id')
          .eq('competencia', competencia);

        if (companyId) {
          payrollQuery = payrollQuery.eq('company_id', companyId);
        }

        const { data: payrollData, error: payrollError } = await payrollQuery.single();

        if (payrollError) {
          console.error('❌ Erro ao buscar folha de pagamento:', payrollError);
          throw payrollError;
        }

        if (!payrollData) {
          return [];
        }

        // Depois buscar os itens do funcionário
        const { data, error } = await supabase
          .from('rh.payroll_items')
          .select('*')
          .eq('payroll_id', payrollData.id)
          .eq('employee_id', employeeId)
          .order('tipo')
          .order('codigo');

        if (error) {
          console.error('❌ Erro ao buscar itens da folha:', error);
          throw error;
        }

        console.log('✅ Itens da folha do funcionário encontrados:', data?.length || 0);
        return data || [];
      },
      enabled: !!employeeId && !!competencia && !!companyId,
      staleTime: 1000 * 60 * 5, // 5 minutos
    });
  };

  // Criar folha de pagamento
  const createPayroll = useMutation({
    mutationFn: async (payroll: PayrollInsert): Promise<Payroll> => {
      console.log('➕ Criando folha de pagamento para competência:', payroll.competencia);
      
      const { data, error } = await supabase
        .from('rh.payroll')
        .insert(payroll)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar folha de pagamento:', error);
        throw error;
      }

      console.log('✅ Folha de pagamento criada');
      return data;
    },
    onSuccess: (data) => {
      // Invalidar caches relacionados
      queryClient.invalidateQueries({ queryKey: PAYROLL_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PAYROLL_KEYS.byCompetencia(data.competencia) });
      console.log('🔄 Cache de folha de pagamento invalidado');
    },
    onError: (error) => {
      console.error('❌ Erro na criação da folha de pagamento:', error);
    },
  });

  // Atualizar folha de pagamento
  const updatePayroll = useMutation({
    mutationFn: async ({ id, ...updates }: PayrollUpdate & { id: string }): Promise<Payroll> => {
      console.log('✏️ Atualizando folha de pagamento:', id);
      
      const { data, error } = await supabase
        .from('rh.payroll')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar folha de pagamento:', error);
        throw error;
      }

      console.log('✅ Folha de pagamento atualizada');
      return data;
    },
    onSuccess: (data) => {
      // Atualizar cache específico e invalidar relacionados
      queryClient.setQueryData(PAYROLL_KEYS.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: PAYROLL_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PAYROLL_KEYS.byCompetencia(data.competencia) });
      console.log('🔄 Cache de folha de pagamento atualizado');
    },
    onError: (error) => {
      console.error('❌ Erro na atualização da folha de pagamento:', error);
    },
  });

  // Deletar folha de pagamento
  const deletePayroll = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      console.log('🗑️ Deletando folha de pagamento:', id);
      
      const { error } = await supabase
        .from('rh.payroll')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao deletar folha de pagamento:', error);
        throw error;
      }

      console.log('✅ Folha de pagamento deletada');
    },
    onSuccess: (_, id) => {
      // Remover do cache e invalidar relacionados
      queryClient.removeQueries({ queryKey: PAYROLL_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: PAYROLL_KEYS.lists() });
      console.log('🔄 Cache de folha de pagamento limpo');
    },
    onError: (error) => {
      console.error('❌ Erro na exclusão da folha de pagamento:', error);
    },
  });

  // Adicionar item à folha de pagamento
  const addPayrollItem = useMutation({
    mutationFn: async (item: PayrollItemInsert): Promise<PayrollItem> => {
      console.log('➕ Adicionando item à folha de pagamento:', item.descricao);
      
      const { data, error } = await supabase
        .from('rh.payroll_items')
        .insert(item)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao adicionar item à folha:', error);
        throw error;
      }

      console.log('✅ Item adicionado à folha');
      return data;
    },
    onSuccess: (data) => {
      // Invalidar cache dos itens
      if (data.payroll_id) {
        queryClient.invalidateQueries({ queryKey: PAYROLL_KEYS.items(data.payroll_id) });
      }
      console.log('🔄 Cache de itens da folha invalidado');
    },
    onError: (error) => {
      console.error('❌ Erro na adição do item à folha:', error);
    },
  });

  // Processar folha de pagamento
  const processPayroll = useMutation({
    mutationFn: async (id: string): Promise<Payroll> => {
      console.log('⚙️ Processando folha de pagamento:', id);
      
      const { data, error } = await supabase
        .from('rh.payroll')
        .update({ 
          status: 'processado',
          data_processamento: new Date().toISOString().split('T')[0]
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao processar folha de pagamento:', error);
        throw error;
      }

      console.log('✅ Folha de pagamento processada');
      return data;
    },
    onSuccess: (data) => {
      // Atualizar cache específico e invalidar relacionados
      queryClient.setQueryData(PAYROLL_KEYS.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: PAYROLL_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PAYROLL_KEYS.byCompetencia(data.competencia) });
      console.log('🔄 Cache de folha de pagamento atualizado');
    },
    onError: (error) => {
      console.error('❌ Erro no processamento da folha de pagamento:', error);
    },
  });

  // Calcular totais da folha
  const calculatePayrollTotals = (items: PayrollItem[]): { proventos: number; descontos: number; liquido: number } => {
    const proventos = items
      .filter(item => item.tipo === 'provento')
      .reduce((sum, item) => sum + (item.valor || 0), 0);

    const descontos = items
      .filter(item => item.tipo === 'desconto')
      .reduce((sum, item) => sum + (item.valor || 0), 0);

    const liquido = proventos - descontos;

    return { proventos, descontos, liquido };
  };

  // Validar folha de pagamento
  const validatePayroll = (payroll: PayrollInsert): string[] => {
    const errors: string[] = [];

    if (!payroll.competencia?.trim()) {
      errors.push('Competência é obrigatória');
    }

    if (payroll.competencia && !/^\d{4}-\d{2}$/.test(payroll.competencia)) {
      errors.push('Competência deve estar no formato AAAA-MM');
    }

    return errors;
  };

  return {
    // Dados
    payrolls,
    isLoading,
    error,
    
    // Ações
    createPayroll,
    updatePayroll,
    deletePayroll,
    addPayrollItem,
    processPayroll,
    refetch,
    
    // Hooks específicos
    usePayroll,
    usePayrollByCompetencia,
    usePayrollItems,
    usePayrollByEmployee,
    
    // Utilitários
    calculatePayrollTotals,
    validatePayroll,
  };
};




