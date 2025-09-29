import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { Employee, EmployeeInsert, EmployeeUpdate } from '@/integrations/supabase/rh-types-export';

const EMPLOYEE_KEYS = {
  all: ['employees'] as const,
  lists: () => [...EMPLOYEE_KEYS.all, 'list'] as const,
  list: (filters: string) => [...EMPLOYEE_KEYS.lists(), { filters }] as const,
  details: () => [...EMPLOYEE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...EMPLOYEE_KEYS.details(), id] as const,
  byPosition: (positionId: string) => [...EMPLOYEE_KEYS.all, 'position', positionId] as const,
  byStatus: (status: string) => [...EMPLOYEE_KEYS.all, 'status', status] as const,
  byDepartment: (department: string) => [...EMPLOYEE_KEYS.all, 'department', department] as const,
  active: () => [...EMPLOYEE_KEYS.all, 'active'] as const,
  byCompany: (companyId: string) => [...EMPLOYEE_KEYS.all, 'company', companyId] as const,
};

export const useEmployees = (companyId?: string) => {
  const queryClient = useQueryClient();
  
  const { data: employees, isLoading, error } = useQuery({
    queryKey: EMPLOYEE_KEYS.lists(),
    queryFn: async (): Promise<Employee[]> => {
      
      if (!companyId) {
        console.log('useEmployees - companyId não fornecido');
        return [];
      }
      
      console.log('useEmployees - buscando funcionários para companyId:', companyId);
      
      const { data, error } = await rhSupabase
        .from('employees')
        .select('*')
        .eq('company_id', companyId)
        .order('nome', { ascending: true });
      
      if (error) {
        console.error('useEmployees - erro ao buscar funcionários:', error);
        throw error;
      }
      
      console.log('useEmployees - funcionários encontrados:', data?.length || 0);
      return data || [];
    },
    enabled: !!companyId,
  });

  // Computed value para funcionários ativos
  const activeEmployees = employees?.filter(emp => emp.status === 'ativo') || [];

  const { data: employee, isLoading: isLoadingSingle, error: singleError } = useQuery({
    queryKey: EMPLOYEE_KEYS.detail(''),
    queryFn: async (): Promise<Employee | null> => {
      return null;
    },
    enabled: false,
  });

  const createEmployee = useMutation({
    mutationFn: async (newEmployee: EmployeeInsert) => {
      const { data, error } = await rhSupabase
        .from('employees')
        .insert(newEmployee)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.lists() });
    },
  });

  const updateEmployee = useMutation({
    mutationFn: async ({ id, ...updates }: EmployeeUpdate & { id: string }) => {
      const { data, error } = await rhSupabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.lists() });
    },
  });

  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('employees')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.lists() });
    },
  });

  const getEmployeeById = useMutation({
    mutationFn: async (id: string) => {
      console.log('🔍 useEmployees: Buscando funcionário por ID:', id);
      // Implementar com RPC se necessário
      console.log('⚠️ useEmployees: Função getEmployeeById não implementada com RPC ainda');
      return null;
    },
  });

  const getEmployeesByPosition = useMutation({
    mutationFn: async (positionId: string) => {
      console.log('🔍 useEmployees: Buscando funcionários por posição:', positionId);
      // Nota: A tabela employees não tem campo position_id diretamente
      // Esta função pode ser implementada quando houver relacionamento com positions
      console.log('⚠️ useEmployees: Função getEmployeesByPosition não implementada - campo position_id não existe na tabela employees');
      return [];
    },
  });

  const getEmployeesByStatus = useMutation({
    mutationFn: async (status: 'ativo' | 'inativo' | 'demitido' | 'aposentado' | 'licenca') => {
      console.log('🔍 useEmployees: Buscando funcionários por status:', status);
      // Implementar com RPC se necessário
      console.log('⚠️ useEmployees: Função getEmployeesByStatus não implementada com RPC ainda');
      return [];
    },
  });

  const getEmployeesByDepartment = useMutation({
    mutationFn: async (costCenterId: string) => {
      console.log('🔍 useEmployees: Buscando funcionários por centro de custo:', costCenterId);
      // Implementar com RPC se necessário
      console.log('⚠️ useEmployees: Função getEmployeesByDepartment não implementada com RPC ainda');
      return [];
    },
  });

  const getActiveEmployees = useMutation({
    mutationFn: async () => {
      console.log('🔍 useEmployees: Buscando funcionários ativos...');
      // Implementar com RPC se necessário
      console.log('⚠️ useEmployees: Função getActiveEmployees não implementada com RPC ainda');
      return [];
    },
  });

  const changeEmployeeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await rhSupabase
        .from('employees')
        .update({ status: status as any })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.lists() });
    },
  });

  return {
    employees,
    activeEmployees,
    employee,
    isLoading,
    isLoadingSingle,
    error,
    singleError,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    changeEmployeeStatus,
    getEmployeeById,
    getEmployeesByPosition,
    getEmployeesByStatus,
    getEmployeesByDepartment,
    getActiveEmployees,
  };
};
