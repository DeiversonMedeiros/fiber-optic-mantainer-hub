import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { rhSupabase, rhTable } from '@/integrations/supabase/rh-client';
import { EmploymentContractInsert, EmploymentContractUpdate } from '@/integrations/supabase/rh-types';

const EMPLOYMENT_CONTRACT_KEYS = {
  all: ['employment-contracts'] as const,
  lists: () => [...EMPLOYMENT_CONTRACT_KEYS.all, 'list'] as const,
  list: (filters: string) => [...EMPLOYMENT_CONTRACT_KEYS.lists(), { filters }] as const,
  details: () => [...EMPLOYMENT_CONTRACT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...EMPLOYMENT_CONTRACT_KEYS.details(), id] as const,
  byEmployee: (employeeId: string) => [...EMPLOYMENT_CONTRACT_KEYS.all, 'employee', employeeId] as const,
  byStatus: (status: string) => [...EMPLOYMENT_CONTRACT_KEYS.all, 'status', status] as const,
  active: () => [...EMPLOYMENT_CONTRACT_KEYS.byStatus('active')] as const,
  inactive: () => [...EMPLOYMENT_CONTRACT_KEYS.byStatus('inactive')] as const,
};

export const useEmploymentContracts = () => {
  const queryClient = useQueryClient();

  // List all employment contracts
  const {
    data: employmentContracts = [],
    isLoading,
    error
  } = useQuery({
    queryKey: EMPLOYMENT_CONTRACT_KEYS.lists(),
    queryFn: async () => {
      const { data, error } = await rhTable('employment_contracts')
        .select('*, employee:employees(id, nome, matricula), position:positions(id, nome, codigo), work_schedule:work_shifts(id, nome)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Single employment contract state
  const [employmentContract, setEmploymentContract] = useState(null);
  const [isLoadingSingle, setIsLoadingSingle] = useState(false);
  const [singleError, setSingleError] = useState(null);

  // Get employment contract by ID
  const getEmploymentContractById = useMutation({
    mutationFn: async (id: string) => {
      setIsLoadingSingle(true);
      setSingleError(null);
      
      try {
        const { data, error } = await rhTable('employment_contracts')
          .select(`
            *,
            employee:employees(id, nome, matricula),
            position:positions(id, nome, codigo),
            work_schedule:work_shifts(id, nome),
            union:unions!sindicato_id(id, nome)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setEmploymentContract(data);
        return data;
      } catch (error) {
        setSingleError(error);
        throw error;
      } finally {
        setIsLoadingSingle(false);
      }
    }
  });

  // Get employment contracts by employee
  const getEmploymentContractsByEmployee = useMutation({
    mutationFn: async (employeeId: string) => {
      const { data, error } = await rhTable('employment_contracts')
        .select('*, employee:employees(id, nome, matricula), position:positions(id, nome, codigo), work_schedule:work_shifts(id, nome)')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Get employment contracts by status
  const getEmploymentContractsByStatus = useMutation({
    mutationFn: async (isActive: boolean) => {
      const { data, error } = await rhTable('employment_contracts')
        .select('*, employee:employees(id, nome, matricula), position:positions(id, nome, codigo), work_schedule:work_shifts(id, nome)')
        .eq('is_active', isActive)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Get active employment contracts
  const getActiveEmploymentContracts = useMutation({
    mutationFn: async () => {
      return getEmploymentContractsByStatus.mutateAsync(true);
    }
  });

  // Get inactive employment contracts
  const getInactiveEmploymentContracts = useMutation({
    mutationFn: async () => {
      return getEmploymentContractsByStatus.mutateAsync(false);
    }
  });

  // Create employment contract
  const createEmploymentContract = useMutation({
    mutationFn: async (contract: EmploymentContractInsert) => {
      const { data, error } = await rhTable('employment_contracts')
        .insert(contract)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYMENT_CONTRACT_KEYS.lists() });
    }
  });

  // Update employment contract
  const updateEmploymentContract = useMutation({
    mutationFn: async ({ id, ...updates }: EmploymentContractUpdate & { id: string }) => {
      const { data, error } = await rhTable('employment_contracts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYMENT_CONTRACT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: EMPLOYMENT_CONTRACT_KEYS.details() });
    }
  });

  // Delete employment contract
  const deleteEmploymentContract = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhTable('employment_contracts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYMENT_CONTRACT_KEYS.lists() });
    }
  });

  // Toggle employment contract status
  const toggleEmploymentContractStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await rhTable('employment_contracts')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYMENT_CONTRACT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: EMPLOYMENT_CONTRACT_KEYS.details() });
    }
  });

  return {
    // Data
    employmentContracts,
    employmentContract,
    
    // Loading states
    isLoading,
    isLoadingSingle,
    
    // Error states
    error,
    singleError,
    
    // Mutations
    getEmploymentContractById,
    getEmploymentContractsByEmployee,
    getEmploymentContractsByStatus,
    getActiveEmploymentContracts,
    getInactiveEmploymentContracts,
    createEmploymentContract,
    updateEmploymentContract,
    deleteEmploymentContract,
    toggleEmploymentContractStatus
  };
};