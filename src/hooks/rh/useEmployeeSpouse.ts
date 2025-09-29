import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { EmployeeSpouse, EmployeeSpouseInsert, EmployeeSpouseUpdate } from '@/integrations/supabase/rh-types';

const EMPLOYEE_SPOUSE_KEYS = {
  all: ['employee_spouses'] as const,
  lists: () => [...EMPLOYEE_SPOUSE_KEYS.all, 'list'] as const,
  list: (employeeId: string) => [...EMPLOYEE_SPOUSE_KEYS.lists(), employeeId] as const,
  details: () => [...EMPLOYEE_SPOUSE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...EMPLOYEE_SPOUSE_KEYS.details(), id] as const,
  byEmployee: (employeeId: string) => [...EMPLOYEE_SPOUSE_KEYS.all, 'employee', employeeId] as const,
};

export const useEmployeeSpouse = (employeeId?: string) => {
  const queryClient = useQueryClient();
  
  const { data: spouse, isLoading, error } = useQuery({
    queryKey: EMPLOYEE_SPOUSE_KEYS.list(employeeId || ''),
    queryFn: async (): Promise<EmployeeSpouse | null> => {
      if (!employeeId) return null;
      
      const { data, error } = await rhSupabase
        .from('employee_spouses')
        .select('*')
        .eq('employee_id', employeeId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data || null;
    },
    enabled: !!employeeId,
  });

  const createSpouse = useMutation({
    mutationFn: async (newSpouse: EmployeeSpouseInsert) => {
      const { data, error } = await rhSupabase
        .from('employee_spouses')
        .insert(newSpouse)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_SPOUSE_KEYS.byEmployee(variables.employee_id) });
    },
  });

  const updateSpouse = useMutation({
    mutationFn: async ({ id, ...updates }: EmployeeSpouseUpdate & { id: string }) => {
      const { data, error } = await rhSupabase
        .from('employee_spouses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_SPOUSE_KEYS.byEmployee(data.employee_id) });
    },
  });

  const deleteSpouse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('employee_spouses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (employeeId) {
        queryClient.invalidateQueries({ queryKey: EMPLOYEE_SPOUSE_KEYS.byEmployee(employeeId) });
      }
    },
  });

  return {
    spouse,
    isLoading,
    error,
    createSpouse,
    updateSpouse,
    deleteSpouse,
  };
};




