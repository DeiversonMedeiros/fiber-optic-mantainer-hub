import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase, rhTable } from '@/integrations/supabase/rh-client';
import { Employee, EmployeeInsert, EmployeeUpdate } from '@/integrations/supabase/rh-types';

// Chaves de query para cache
const EMPLOYEE_KEYS = {
  all: ['rh', 'employees'] as const,
  lists: () => [...EMPLOYEE_KEYS.all, 'list'] as const,
  list: (filters: string) => [...EMPLOYEE_KEYS.lists(), { filters }] as const,
  details: () => [...EMPLOYEE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...EMPLOYEE_KEYS.details(), id] as const,
};

export const useEmployees = (companyId?: string) => {
  const queryClient = useQueryClient();

  // Buscar todos os funcionários
  const {
    data: employees = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: EMPLOYEE_KEYS.list(companyId || 'all'),
    queryFn: async (): Promise<Employee[]> => {
      console.log('🔍 Buscando funcionários...');
      
      let query = rhTable('employees')
        .select('*')
        .order('nome');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar funcionários:', error);
        throw error;
      }

      console.log('✅ Funcionários encontrados:', data?.length || 0);
      return data || [];
    },
    enabled: !!companyId, // Só executa se tiver companyId
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
  });

  // Buscar funcionário por ID
  const useEmployee = (id: string) => {
    return useQuery({
      queryKey: EMPLOYEE_KEYS.detail(id),
      queryFn: async (): Promise<Employee | null> => {
        console.log('🔍 Buscando funcionário:', id);
        
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('❌ Erro ao buscar funcionário:', error);
          throw error;
        }

        console.log('✅ Funcionário encontrado:', data?.nome);
        return data;
      },
      enabled: !!id,
      staleTime: 1000 * 60 * 5, // 5 minutos
    });
  };

  // Criar funcionário
  const createEmployee = useMutation({
    mutationFn: async (employee: EmployeeInsert): Promise<Employee> => {
      console.log('➕ Criando funcionário:', employee.nome);
      
      const { data, error } = await supabase
        .from('employees')
        .insert(employee)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar funcionário:', error);
        throw error;
      }

      console.log('✅ Funcionário criado:', data.nome);
      return data;
    },
    onSuccess: () => {
      // Invalidar cache de funcionários
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.lists() });
      console.log('🔄 Cache de funcionários invalidado');
    },
    onError: (error) => {
      console.error('❌ Erro na criação do funcionário:', error);
    },
  });

  // Atualizar funcionário
  const updateEmployee = useMutation({
    mutationFn: async ({ id, ...updates }: EmployeeUpdate & { id: string }): Promise<Employee> => {
      console.log('✏️ Atualizando funcionário:', id);
      
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar funcionário:', error);
        throw error;
      }

      console.log('✅ Funcionário atualizado:', data.nome);
      return data;
    },
    onSuccess: (data) => {
      // Atualizar cache específico e lista
      queryClient.setQueryData(EMPLOYEE_KEYS.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.lists() });
      console.log('🔄 Cache de funcionários atualizado');
    },
    onError: (error) => {
      console.error('❌ Erro na atualização do funcionário:', error);
    },
  });

  // Deletar funcionário
  const deleteEmployee = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      console.log('🗑️ Deletando funcionário:', id);
      
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao deletar funcionário:', error);
        throw error;
      }

      console.log('✅ Funcionário deletado');
    },
    onSuccess: (_, id) => {
      // Remover do cache e invalidar lista
      queryClient.removeQueries({ queryKey: EMPLOYEE_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.lists() });
      console.log('🔄 Cache de funcionários limpo');
    },
    onError: (error) => {
      console.error('❌ Erro na exclusão do funcionário:', error);
    },
  });

  // Buscar funcionários por status
  const useEmployeesByStatus = (status: string) => {
    return useQuery({
      queryKey: [...EMPLOYEE_KEYS.list(companyId || 'all'), 'status', status],
      queryFn: async (): Promise<Employee[]> => {
        console.log('🔍 Buscando funcionários por status:', status);
        
        let query = supabase
          .from('employees')
          .select('*')
          .eq('status', status)
          .order('nome');

        if (companyId) {
          query = query.eq('company_id', companyId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('❌ Erro ao buscar funcionários por status:', error);
          throw error;
        }

        console.log('✅ Funcionários encontrados por status:', data?.length || 0);
        return data || [];
      },
      enabled: !!companyId && !!status,
      staleTime: 1000 * 60 * 5, // 5 minutos
    });
  };

  // Buscar funcionários por cargo
  const useEmployeesByPosition = (positionId: string) => {
    return useQuery({
      queryKey: [...EMPLOYEE_KEYS.list(companyId || 'all'), 'position', positionId],
      queryFn: async (): Promise<Employee[]> => {
        console.log('🔍 Buscando funcionários por cargo:', positionId);
        
        let query = supabase
          .from('employees')
          .select('*')
          .eq('position_id', positionId)
          .order('nome');

        if (companyId) {
          query = query.eq('company_id', companyId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('❌ Erro ao buscar funcionários por cargo:', error);
          throw error;
        }

        console.log('✅ Funcionários encontrados por cargo:', data?.length || 0);
        return data || [];
      },
      enabled: !!companyId && !!positionId,
      staleTime: 1000 * 60 * 5, // 5 minutos
    });
  };

  return {
    // Dados
    employees,
    isLoading,
    error,
    
    // Ações
    createEmployee,
    updateEmployee,
    deleteEmployee,
    refetch,
    
    // Hooks específicos
    useEmployee,
    useEmployeesByStatus,
    useEmployeesByPosition,
  };
};

