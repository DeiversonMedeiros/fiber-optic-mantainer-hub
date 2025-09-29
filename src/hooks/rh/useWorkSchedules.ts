import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { WorkSchedule, WorkScheduleInsert, WorkScheduleUpdate } from '@/integrations/supabase/rh-types-export';

const WORK_SCHEDULE_KEYS = {
  all: ['work_schedules'] as const,
  lists: () => [...WORK_SCHEDULE_KEYS.all, 'list'] as const,
  list: (filters: string) => [...WORK_SCHEDULE_KEYS.lists(), { filters }] as const,
  details: () => [...WORK_SCHEDULE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...WORK_SCHEDULE_KEYS.details(), id] as const,
  byCompany: (companyId: string) => [...WORK_SCHEDULE_KEYS.all, 'company', companyId] as const,
};

export const useWorkSchedules = (companyId?: string) => {
  const queryClient = useQueryClient();
  
  const { data: workSchedules, isLoading, error, refetch } = useQuery({
    queryKey: WORK_SCHEDULE_KEYS.lists(),
    queryFn: async (): Promise<WorkSchedule[]> => {
      try {
        let query = rhSupabase.from('rh.work_schedules')
          .select('*')
          .order('nome');
        if (companyId) { 
          query = query.eq('company_id', companyId); 
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        console.log('✅ useWorkSchedules: Sucesso! Escalas encontradas:', data?.length || 0);
        return data || [];
      } catch (error) {
        throw error;
      }
    },
    enabled: !!companyId,
  });

  const { data: workSchedule, isLoading: isLoadingSingle, error: singleError } = useQuery({
    queryKey: WORK_SCHEDULE_KEYS.detail(''),
    queryFn: async (): Promise<WorkSchedule | null> => {
      const { data, error } = await rhSupabase.from('rh.work_schedules')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  const createWorkSchedule = useMutation({
    mutationFn: async (newWorkSchedule: Omit<WorkSchedule, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await rhSupabase.from('rh.work_schedules')
        .insert([newWorkSchedule])
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORK_SCHEDULE_KEYS.lists() });
    },
  });

  const updateWorkSchedule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WorkSchedule> & { id: string }) => {
      const { data, error } = await rhSupabase.from('rh.work_schedules')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORK_SCHEDULE_KEYS.lists() });
    },
  });

  const deleteWorkSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase.from('rh.work_schedules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORK_SCHEDULE_KEYS.lists() });
    },
  });

  const getWorkScheduleById = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await rhSupabase.from('rh.work_schedules')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  return {
    workSchedules,
    workSchedule,
    isLoading,
    isLoadingSingle,
    error,
    singleError,
    createWorkSchedule,
    updateWorkSchedule,
    deleteWorkSchedule,
    getWorkScheduleById,
    refetch,
  };
};