import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { rhSupabase } from '@/integrations/supabase/rh-client';
import { PayrollConfigInsert, PayrollConfigUpdate } from '@/integrations/supabase/rh-types';

const PAYROLL_CONFIG_KEYS = {
  all: ['payroll-configs'] as const,
  lists: () => [...PAYROLL_CONFIG_KEYS.all, 'list'] as const,
  list: (filters: string) => [...PAYROLL_CONFIG_KEYS.lists(), { filters }] as const,
  details: () => [...PAYROLL_CONFIG_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PAYROLL_CONFIG_KEYS.details(), id] as const,
  byEmployee: (employeeId: string) => [...PAYROLL_CONFIG_KEYS.all, 'employee', employeeId] as const,
  byRegime: (regime: string) => [...PAYROLL_CONFIG_KEYS.all, 'regime', regime] as const,
};

export const usePayrollConfig = () => {
  const queryClient = useQueryClient();

  // List all payroll configs
  const {
    data: payrollConfigs = [],
    isLoading,
    error
  } = useQuery({
    queryKey: PAYROLL_CONFIG_KEYS.lists(),
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('payroll_config')
        .select(`
          *,
          employee:employees(id, nome, matricula)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Single payroll config state
  const [payrollConfig, setPayrollConfig] = useState(null);
  const [isLoadingSingle, setIsLoadingSingle] = useState(false);
  const [singleError, setSingleError] = useState(null);

  // Get payroll config by ID
  const getPayrollConfigById = useMutation({
    mutationFn: async (id: string) => {
      setIsLoadingSingle(true);
      setSingleError(null);
      
      try {
        const { data, error } = await rhSupabase
          .from('payroll_config')
          .select(`
            *,
            employee:employees(id, nome, matricula)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setPayrollConfig(data);
        return data;
      } catch (error) {
        setSingleError(error);
        throw error;
      } finally {
        setIsLoadingSingle(false);
      }
    }
  });

  // Get payroll config by employee
  const getPayrollConfigByEmployee = useMutation({
    mutationFn: async (employeeId: string) => {
      const { data, error } = await rhSupabase
        .from('payroll_config')
        .select(`
          *,
          employee:employees(id, nome, matricula)
        `)
        .eq('employee_id', employeeId)
        .single();

      if (error) throw error;
      return data;
    }
  });

  // Get payroll configs by regime
  const getPayrollConfigsByRegime = useMutation({
    mutationFn: async (regime: string) => {
      const { data, error } = await rhSupabase
        .from('payroll_config')
        .select(`
          *,
          employee:employees(id, nome, matricula)
        `)
        .eq('regime_hora_extra', regime)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Create payroll config
  const createPayrollConfig = useMutation({
    mutationFn: async (config: PayrollConfigInsert) => {
      const { data, error } = await rhSupabase
        .from('payroll_config')
        .insert(config)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYROLL_CONFIG_KEYS.lists() });
    }
  });

  // Update payroll config
  const updatePayrollConfig = useMutation({
    mutationFn: async ({ id, ...updates }: PayrollConfigUpdate & { id: string }) => {
      const { data, error } = await rhSupabase
        .from('payroll_config')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYROLL_CONFIG_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PAYROLL_CONFIG_KEYS.details() });
    }
  });

  // Delete payroll config
  const deletePayrollConfig = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('payroll_config')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYROLL_CONFIG_KEYS.lists() });
    }
  });

  return {
    // Data
    payrollConfigs,
    payrollConfig,
    
    // Loading states
    isLoading,
    isLoadingSingle,
    
    // Error states
    error,
    singleError,
    
    // Mutations
    getPayrollConfigById,
    getPayrollConfigByEmployee,
    getPayrollConfigsByRegime,
    createPayrollConfig,
    updatePayrollConfig,
    deletePayrollConfig
  };
};