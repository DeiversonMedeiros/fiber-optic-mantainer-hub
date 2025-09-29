import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { TimeRecord, TimeRecordInsert, TimeRecordUpdate } from '@/integrations/supabase/rh-types-export';

const TIME_RECORD_KEYS = {
  all: ['time_records'] as const,
  lists: () => [...TIME_RECORD_KEYS.all, 'list'] as const,
  list: (filters: string) => [...TIME_RECORD_KEYS.lists(), { filters }] as const,
  details: () => [...TIME_RECORD_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TIME_RECORD_KEYS.details(), id] as const,
  byEmployee: (employeeId: string) => [...TIME_RECORD_KEYS.all, 'employee', employeeId] as const,
  byDate: (date: string) => [...TIME_RECORD_KEYS.all, 'date', date] as const,
  byCompany: (companyId: string) => [...TIME_RECORD_KEYS.all, 'company', companyId] as const,
};

export const useTimeRecords = (companyId?: string) => {
  const queryClient = useQueryClient();
  
  const { data: timeRecords, isLoading, error } = useQuery({
    queryKey: TIME_RECORD_KEYS.lists(),
    queryFn: async (): Promise<TimeRecord[]> => {
      try {
        let query = rhSupabase.from('time_records')
          .select('*')
          .order('data', { ascending: false });
        if (companyId) { 
          query = query.eq('company_id', companyId); 
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        console.log('✅ useTimeRecords: Sucesso! Registros encontrados:', data?.length || 0);
        return data || [];
      } catch (error) {
        throw error;
      }
    },
    enabled: !!companyId,
  });

  const { data: timeRecord, isLoading: isLoadingSingle, error: singleError } = useQuery({
    queryKey: TIME_RECORD_KEYS.detail(''),
    queryFn: async (): Promise<TimeRecord | null> => {
      const { data, error } = await rhSupabase.from('time_records')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  const createTimeRecord = useMutation({
    mutationFn: async (newTimeRecord: Omit<TimeRecord, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await rhSupabase.from('time_records')
        .insert([newTimeRecord])
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIME_RECORD_KEYS.lists() });
    },
  });

  const updateTimeRecord = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TimeRecord> & { id: string }) => {
      const { data, error } = await rhSupabase.from('time_records')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIME_RECORD_KEYS.lists() });
    },
  });

  const deleteTimeRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase.from('time_records')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIME_RECORD_KEYS.lists() });
    },
  });

  const getTimeRecordById = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await rhSupabase.from('time_records')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const getTimeRecordsByEmployee = useMutation({
    mutationFn: async (employeeId: string) => {
      const { data, error } = await rhSupabase.from('time_records')
        .select('*')
        .eq('employee_id', employeeId)
        .order('data', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const getTimeRecordsByDate = useMutation({
    mutationFn: async (date: string) => {
      const { data, error } = await rhSupabase.from('time_records')
        .select('*')
        .eq('data', date)
        .order('hora_entrada');
      if (error) throw error;
      return data || [];
    },
  });

  return {
    timeRecords,
    timeRecord,
    isLoading,
    isLoadingSingle,
    error,
    singleError,
    createTimeRecord,
    updateTimeRecord,
    deleteTimeRecord,
    getTimeRecordById,
    getTimeRecordsByEmployee,
    getTimeRecordsByDate,
  };
};