import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { rhSupabase } from '@/integrations/supabase/client';
import { EmployeeShiftInsert, EmployeeShiftUpdate } from '@/integrations/supabase/rh-types';

const EMPLOYEE_SHIFT_KEYS = {
  all: ['employee-shifts'] as const,
  lists: () => [...EMPLOYEE_SHIFT_KEYS.all, 'list'] as const,
  list: (filters: string) => [...EMPLOYEE_SHIFT_KEYS.lists(), { filters }] as const,
  details: () => [...EMPLOYEE_SHIFT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...EMPLOYEE_SHIFT_KEYS.details(), id] as const,
  byEmployee: (employeeId: string) => [...EMPLOYEE_SHIFT_KEYS.all, 'employee', employeeId] as const,
  byShift: (shiftId: string) => [...EMPLOYEE_SHIFT_KEYS.all, 'shift', shiftId] as const,
  byStatus: (status: string) => [...EMPLOYEE_SHIFT_KEYS.all, 'status', status] as const,
  active: () => [...EMPLOYEE_SHIFT_KEYS.byStatus('active')] as const,
  inactive: () => [...EMPLOYEE_SHIFT_KEYS.byStatus('inactive')] as const,
};

export const useEmployeeShifts = () => {
  const queryClient = useQueryClient();

  // List all employee shifts
  const {
    data: employeeShifts = [],
    isLoading,
    error
  } = useQuery({
    queryKey: EMPLOYEE_SHIFT_KEYS.lists(),
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('employee_shifts')
        .select(`
          *,
          employee:employees(id, nome, matricula),
          shift:work_shifts(id, nome, hora_inicio, hora_fim)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Single employee shift state
  const [employeeShift, setEmployeeShift] = useState(null);
  const [isLoadingSingle, setIsLoadingSingle] = useState(false);
  const [singleError, setSingleError] = useState(null);

  // Get employee shift by ID
  const getEmployeeShiftById = useMutation({
    mutationFn: async (id: string) => {
      setIsLoadingSingle(true);
      setSingleError(null);
      
      try {
        const { data, error } = await rhSupabase
          .from('employee_shifts')
          .select(`
            *,
            employee:employees(id, nome, matricula),
            shift:work_shifts(id, nome, hora_inicio, hora_fim)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setEmployeeShift(data);
        return data;
      } catch (error) {
        setSingleError(error);
        throw error;
      } finally {
        setIsLoadingSingle(false);
      }
    }
  });

  // Get employee shifts by employee
  const getEmployeeShiftsByEmployee = useMutation({
    mutationFn: async (employeeId: string) => {
      const { data, error } = await rhSupabase
        .from('employee_shifts')
        .select(`
          *,
          employee:employees(id, nome, matricula),
          shift:work_shifts(id, nome, hora_inicio, hora_fim)
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Get employee shifts by shift
  const getEmployeeShiftsByShift = useMutation({
    mutationFn: async (shiftId: string) => {
      const { data, error } = await rhSupabase
        .from('employee_shifts')
        .select(`
          *,
          employee:employees(id, nome, matricula),
          shift:work_shifts(id, nome, hora_inicio, hora_fim)
        `)
        .eq('shift_id', shiftId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Get employee shifts by status
  const getEmployeeShiftsByStatus = useMutation({
    mutationFn: async (isActive: boolean) => {
      const { data, error } = await rhSupabase
        .from('employee_shifts')
        .select(`
          *,
          employee:employees(id, nome, matricula),
          shift:work_shifts(id, nome, hora_inicio, hora_fim)
        `)
        .eq('is_active', isActive)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Get active employee shifts
  const getActiveEmployeeShifts = useMutation({
    mutationFn: async () => {
      return getEmployeeShiftsByStatus.mutateAsync(true);
    }
  });

  // Get inactive employee shifts
  const getInactiveEmployeeShifts = useMutation({
    mutationFn: async () => {
      return getEmployeeShiftsByStatus.mutateAsync(false);
    }
  });

  // Create employee shift
  const createEmployeeShift = useMutation({
    mutationFn: async (employeeShift: EmployeeShiftInsert) => {
      const { data, error } = await rhSupabase
        .from('employee_shifts')
        .insert(employeeShift)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_SHIFT_KEYS.lists() });
    }
  });

  // Update employee shift
  const updateEmployeeShift = useMutation({
    mutationFn: async ({ id, ...updates }: EmployeeShiftUpdate & { id: string }) => {
      const { data, error } = await rhSupabase
        .from('employee_shifts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_SHIFT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_SHIFT_KEYS.details() });
    }
  });

  // Delete employee shift
  const deleteEmployeeShift = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('employee_shifts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_SHIFT_KEYS.lists() });
    }
  });

  // Toggle employee shift status
  const toggleEmployeeShiftStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await rhSupabase
        .from('employee_shifts')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_SHIFT_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_SHIFT_KEYS.details() });
    }
  });

  return {
    // Data
    employeeShifts,
    employeeShift,
    
    // Loading states
    isLoading,
    isLoadingSingle,
    
    // Error states
    error,
    singleError,
    
    // Mutations
    getEmployeeShiftById,
    getEmployeeShiftsByEmployee,
    getEmployeeShiftsByShift,
    getEmployeeShiftsByStatus,
    getActiveEmployeeShifts,
    getInactiveEmployeeShifts,
    createEmployeeShift,
    updateEmployeeShift,
    deleteEmployeeShift,
    toggleEmployeeShiftStatus
  };
};