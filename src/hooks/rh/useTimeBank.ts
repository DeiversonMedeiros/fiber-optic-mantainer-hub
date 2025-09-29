import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/rh-client';
import { TimeBank, TimeBankInsert, TimeBankUpdate } from '@/integrations/supabase/rh-types';

const TIME_BANK_KEYS = {
  all: ['time-bank'] as const,
  lists: () => [...TIME_BANK_KEYS.all, 'list'] as const,
  list: (filters: string) => [...TIME_BANK_KEYS.lists(), { filters }] as const,
  details: () => [...TIME_BANK_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TIME_BANK_KEYS.details(), id] as const,
  byEmployee: (employeeId: string) => [...TIME_BANK_KEYS.all, 'employee', employeeId] as const,
  byType: (type: string) => [...TIME_BANK_KEYS.all, 'type', type] as const,
  positive: () => [...TIME_BANK_KEYS.all, 'positive'] as const,
  negative: () => [...TIME_BANK_KEYS.all, 'negative'] as const,
  byCompany: (companyId: string) => [...TIME_BANK_KEYS.all, 'company', companyId] as const,
};

export const useTimeBank = (companyId?: string) => {
  const queryClient = useQueryClient();
  
  const { data: timeBanks, isLoading, error } = useQuery({
    queryKey: TIME_BANK_KEYS.lists(),
    queryFn: async (): Promise<TimeBank[]> => {
      let query = rhSupabase
        .from('time_bank')
        .select(`
          *,
          employee:employees(id, nome, matricula),
          time_record:time_records(id, data, hora_entrada, hora_saida)
        `)
                 .order('data_registro', { ascending: false });
      if (companyId) { query = query.eq('company_id', companyId); }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: timeBank, isLoading: isLoadingSingle, error: singleError } = useQuery({
    queryKey: TIME_BANK_KEYS.detail(''),
    queryFn: async (): Promise<TimeBank | null> => {
      const { data, error } = await rhSupabase
        .from('time_bank')
        .select(`
          *,
          employee:employees(id, nome, matricula),
          time_record:time_records(id, data, hora_entrada, hora_saida)
        `)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  const createTimeBank = useMutation({
    mutationFn: async (newTimeBank: Omit<TimeBank, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await rhSupabase
        .from('time_bank')
        .insert([newTimeBank])
        .select(`
          *,
          employee:employees(id, nome, matricula),
          time_record:time_records(id, data, hora_entrada, hora_saida)
        `)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIME_BANK_KEYS.lists() });
    },
  });

  const updateTimeBank = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TimeBank> & { id: string }) => {
      const { data, error } = await rhSupabase
        .from('time_bank')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          employee:employees(id, nome, matricula),
          time_record:time_records(id, data, hora_entrada, hora_saida)
        `)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIME_BANK_KEYS.lists() });
    },
  });

  const deleteTimeBank = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('time_bank')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIME_BANK_KEYS.lists() });
    },
  });

  const getTimeBankById = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await rhSupabase
        .from('time_bank')
        .select(`
          *,
          employee:employees(id, nome, matricula),
          time_record:time_records(id, data, hora_entrada, hora_saida)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const getTimeBankByEmployee = useMutation({
    mutationFn: async (employeeId: string) => {
      const { data, error } = await rhSupabase
        .from('time_bank')
        .select(`
          *,
          employee:employees(id, nome, matricula),
          time_record:time_records(id, data, hora_entrada, hora_saida)
        `)
        .eq('employee_id', employeeId)
                 .order('data_registro', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const getTimeBankByType = useMutation({
    mutationFn: async (type: string) => {
      const { data, error } = await rhSupabase
        .from('time_bank')
        .select(`
          *,
          employee:employees(id, nome, matricula),
          time_record:time_records(id, data, hora_entrada, hora_saida)
        `)
        .eq('tipo', type)
                 .order('data_registro', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const getTimeBankBalance = useMutation({
    mutationFn: async (employeeId: string) => {
      const { data, error } = await rhSupabase
        .from('time_bank')
        .select('*')
        .eq('employee_id', employeeId);
      if (error) throw error;
      
             const balance = data?.reduce((acc, record) => {
         if (record.tipo === 'credito') {
           return acc + (record.quantidade || 0);
         } else {
           return acc - (record.quantidade || 0);
         }
       }, 0);
      
      return balance || 0;
    },
  });

  const getTimeBankSummary = useMutation({
    mutationFn: async (employeeId: string) => {
      const { data, error } = await rhSupabase
        .from('time_bank')
        .select('*')
        .eq('employee_id', employeeId);
      if (error) throw error;
      
      const summary = {
        totalCredits: 0,
        totalDebits: 0,
        balance: 0,
        records: data || []
      };
      
             data?.forEach(record => {
         if (record.tipo === 'credito') {
           summary.totalCredits += record.quantidade || 0;
         } else {
           summary.totalDebits += record.quantidade || 0;
         }
       });
      
      summary.balance = summary.totalCredits - summary.totalDebits;
      return summary;
    },
  });

  return {
    timeBanks,
    timeBank,
    isLoading,
    isLoadingSingle,
    error,
    singleError,
    createTimeBank,
    updateTimeBank,
    deleteTimeBank,
    getTimeBankById,
    getTimeBankByEmployee,
    getTimeBankByType,
    getTimeBankBalance,
    getTimeBankSummary,
  };
};