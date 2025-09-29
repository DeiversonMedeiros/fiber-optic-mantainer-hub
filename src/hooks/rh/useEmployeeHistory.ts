import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmployeeHistoryService } from '@/services/rh/employeeHistoryService';
import { EmployeeHistoryInsert, EmployeeHistoryUpdate } from '@/integrations/supabase/rh-history-types';

export function useEmployeeHistory(employeeId?: string) {
  return useQuery({
    queryKey: ['employee-history', employeeId],
    queryFn: () => EmployeeHistoryService.getEmployeeHistory(employeeId!),
    enabled: !!employeeId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

export function useEmployeeHistoryStats(employeeId?: string) {
  return useQuery({
    queryKey: ['employee-history-stats', employeeId],
    queryFn: () => EmployeeHistoryService.getHistoryStats(employeeId!),
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useMovementTypes() {
  return useQuery({
    queryKey: ['movement-types'],
    queryFn: () => EmployeeHistoryService.getMovementTypes(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

export function useCreateHistoryEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entry: EmployeeHistoryInsert) => EmployeeHistoryService.createHistoryEntry(entry),
    onSuccess: (data) => {
      // Invalidar queries relacionadas ao funcionário
      queryClient.invalidateQueries({ queryKey: ['employee-history', data.employee_id] });
      queryClient.invalidateQueries({ queryKey: ['employee-history-stats', data.employee_id] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useUpdateHistoryEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: EmployeeHistoryUpdate }) => 
      EmployeeHistoryService.updateHistoryEntry(id, updates),
    onSuccess: (data) => {
      // Invalidar queries relacionadas ao funcionário
      queryClient.invalidateQueries({ queryKey: ['employee-history', data.employee_id] });
      queryClient.invalidateQueries({ queryKey: ['employee-history-stats', data.employee_id] });
    },
  });
}

export function useDeleteHistoryEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, employeeId }: { id: string; employeeId: string }) => 
      EmployeeHistoryService.deleteHistoryEntry(id),
    onSuccess: (_, { employeeId }) => {
      // Invalidar queries relacionadas ao funcionário
      queryClient.invalidateQueries({ queryKey: ['employee-history', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee-history-stats', employeeId] });
    },
  });
}
