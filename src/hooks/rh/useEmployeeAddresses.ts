import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { EmployeeAddress, EmployeeAddressInsert, EmployeeAddressUpdate } from '@/integrations/supabase/rh-types';

const EMPLOYEE_ADDRESSES_KEYS = {
  all: ['employee_addresses'] as const,
  lists: () => [...EMPLOYEE_ADDRESSES_KEYS.all, 'list'] as const,
  list: (employeeId: string) => [...EMPLOYEE_ADDRESSES_KEYS.lists(), employeeId] as const,
  details: () => [...EMPLOYEE_ADDRESSES_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...EMPLOYEE_ADDRESSES_KEYS.details(), id] as const,
  byEmployee: (employeeId: string) => [...EMPLOYEE_ADDRESSES_KEYS.all, 'employee', employeeId] as const,
  byType: (employeeId: string, tipo: string) => [...EMPLOYEE_ADDRESSES_KEYS.byEmployee(employeeId), tipo] as const,
};

export const useEmployeeAddresses = (employeeId?: string) => {
  const queryClient = useQueryClient();
  
  const { data: addresses, isLoading, error } = useQuery({
    queryKey: EMPLOYEE_ADDRESSES_KEYS.list(employeeId || ''),
    queryFn: async (): Promise<EmployeeAddress[]> => {
      if (!employeeId) return [];
      
      const { data, error } = await rhSupabase
        .from('employee_addresses')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!employeeId,
  });

  // Endereço residencial principal
  const residentialAddress = addresses?.find(addr => addr.tipo_endereco === 'residencial') || null;

  const createAddress = useMutation({
    mutationFn: async (newAddress: EmployeeAddressInsert) => {
      const { data, error } = await rhSupabase
        .from('employee_addresses')
        .insert(newAddress)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_ADDRESSES_KEYS.byEmployee(variables.employee_id) });
    },
  });

  const updateAddress = useMutation({
    mutationFn: async ({ id, ...updates }: EmployeeAddressUpdate & { id: string }) => {
      const { data, error } = await rhSupabase
        .from('employee_addresses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_ADDRESSES_KEYS.byEmployee(data.employee_id) });
    },
  });

  const deleteAddress = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('employee_addresses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (employeeId) {
        queryClient.invalidateQueries({ queryKey: EMPLOYEE_ADDRESSES_KEYS.byEmployee(employeeId) });
      }
    },
  });

  return {
    addresses,
    residentialAddress,
    isLoading,
    error,
    createAddress,
    updateAddress,
    deleteAddress,
  };
};




