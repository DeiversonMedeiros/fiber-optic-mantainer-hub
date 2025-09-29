import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase, rhTable } from '@/integrations/supabase/rh-client';
import { WorkShift, WorkShiftInsert, WorkShiftUpdate } from '@/integrations/supabase/rh-types';

const WORK_SHIFT_KEYS = {
  all: ['work_shifts'] as const,
  lists: () => [...WORK_SHIFT_KEYS.all, 'list'] as const,
  list: (filters: string) => [...WORK_SHIFT_KEYS.lists(), { filters }] as const,
  details: () => [...WORK_SHIFT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...WORK_SHIFT_KEYS.details(), id] as const,
  byCompany: (companyId: string) => [...WORK_SHIFT_KEYS.all, 'company', companyId] as const,
};

export const useWorkShifts = (companyId?: string) => {
  const queryClient = useQueryClient();
  
  const { data: workShifts, isLoading, error } = useQuery({
    queryKey: WORK_SHIFT_KEYS.byCompany(companyId || ''),
    queryFn: async (): Promise<WorkShift[]> => {
      if (!companyId) {
        console.log('useWorkShifts: companyId não fornecido');
        return [];
      }
      
      console.log('useWorkShifts: Buscando work_shifts para companyId:', companyId);
      
      const { data, error } = await rhTable('work_shifts')
        .select('*')
        .eq('company_id', companyId)
        .order('nome', { ascending: true });
      
      if (error) {
        console.error('useWorkShifts: Erro na consulta:', error);
        throw error;
      }
      
      console.log('useWorkShifts: Dados retornados:', data);
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: workShift, isLoading: isLoadingSingle, error: singleError } = useQuery({
    queryKey: WORK_SHIFT_KEYS.detail(''),
    queryFn: async (): Promise<WorkShift | null> => {
      const { data, error } = await supabase
        .from('work_shifts')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  const createWorkShift = useMutation({
    mutationFn: async (newWorkShift: WorkShiftInsert) => {
      const { data, error } = await supabase
        .from('work_shifts')
        .insert(newWorkShift)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORK_SHIFT_KEYS.lists() });
    },
  });

  const updateWorkShift = useMutation({
    mutationFn: async ({ id, ...updates }: WorkShiftUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('work_shifts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORK_SHIFT_KEYS.lists() });
    },
  });

  const deleteWorkShift = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('work_shifts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORK_SHIFT_KEYS.lists() });
    },
  });

  const getWorkShiftById = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('work_shifts')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: WORK_SHIFT_KEYS.byCompany(companyId || '') });
  };

  return {
    workShifts: workShifts || [],
    workShift,
    isLoading,
    isLoadingSingle,
    error,
    singleError,
    createWorkShift,
    updateWorkShift,
    deleteWorkShift,
    getWorkShiftById,
    refetch,
  };
};