import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { Payroll, PayrollInsert, PayrollUpdate } from '@/integrations/supabase/rh-types-export';

const PAYROLL_KEYS = {
  all: ['payroll'] as const,
  lists: () => [...PAYROLL_KEYS.all, 'list'] as const,
  list: (filters: string) => [...PAYROLL_KEYS.lists(), { filters }] as const,
  details: () => [...PAYROLL_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PAYROLL_KEYS.details(), id] as const,
  byEmployee: (employeeId: string) => [...PAYROLL_KEYS.all, 'employee', employeeId] as const,
  byPeriod: (period: string) => [...PAYROLL_KEYS.all, 'period', period] as const,
  byCompany: (companyId: string) => [...PAYROLL_KEYS.all, 'company', companyId] as const,
};

export const usePayroll = (companyId?: string) => {
  const queryClient = useQueryClient();
  
  const { data: payrolls, isLoading, error, refetch } = useQuery({
    queryKey: PAYROLL_KEYS.lists(),
    queryFn: async (): Promise<Payroll[]> => {
      try {
        let query = rhSupabase.from('payroll')
          .select('*')
          .order('competencia', { ascending: false });
        if (companyId) { 
          query = query.eq('company_id', companyId); 
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        console.log('✅ usePayroll: Sucesso! Folhas encontradas:', data?.length || 0);
        return data || [];
      } catch (error) {
        throw error;
      }
    },
    enabled: !!companyId,
  });

  const { data: payroll, isLoading: isLoadingSingle, error: singleError } = useQuery({
    queryKey: PAYROLL_KEYS.detail(''),
    queryFn: async (): Promise<Payroll | null> => {
      const { data, error } = await rhSupabase.from('payroll')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  const createPayroll = useMutation({
    mutationFn: async (newPayroll: Omit<Payroll, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await rhSupabase.from('payroll')
        .insert([newPayroll])
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYROLL_KEYS.lists() });
    },
  });

  const updatePayroll = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Payroll> & { id: string }) => {
      const { data, error } = await rhSupabase.from('payroll')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYROLL_KEYS.lists() });
    },
  });

  const deletePayroll = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase.from('payroll')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYROLL_KEYS.lists() });
    },
  });

  const getPayrollById = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await rhSupabase.from('payroll')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const getPayrollsByEmployee = useMutation({
    mutationFn: async (employeeId: string) => {
      const { data, error } = await rhSupabase.from('payroll')
        .select('*')
        .eq('employee_id', employeeId)
        .order('periodo', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const getPayrollsByPeriod = useMutation({
    mutationFn: async (period: string) => {
      const { data, error } = await rhSupabase.from('payroll')
          .select('*')
          .eq('competencia', period)
          .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return {
    payrolls,
    payroll,
    isLoading,
    isLoadingSingle,
    error,
    singleError,
    refetch,
    createPayroll,
    updatePayroll,
    deletePayroll,
    getPayrollById,
    getPayrollsByEmployee,
    getPayrollsByPeriod,
  };
};