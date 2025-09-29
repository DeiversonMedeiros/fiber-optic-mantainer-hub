import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { Vacation, VacationInsert, VacationUpdate } from '@/integrations/supabase/rh-types-export';

const VACATION_KEYS = {
  all: ['vacations'] as const,
  lists: () => [...VACATION_KEYS.all, 'list'] as const,
  list: (filters: string) => [...VACATION_KEYS.lists(), { filters }] as const,
  details: () => [...VACATION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...VACATION_KEYS.details(), id] as const,
  byEmployee: (employeeId: string) => [...VACATION_KEYS.all, 'employee', employeeId] as const,
  byStatus: (status: string) => [...VACATION_KEYS.all, 'status', status] as const,
  pending: () => [...VACATION_KEYS.all, 'pending'] as const,
  approved: () => [...VACATION_KEYS.all, 'approved'] as const,
  byCompany: (companyId: string) => [...VACATION_KEYS.all, 'company', companyId] as const,
};

export const useVacations = (companyId?: string) => {
  const queryClient = useQueryClient();
  
  const { data: vacations, isLoading, error } = useQuery({
    queryKey: VACATION_KEYS.lists(),
    queryFn: async (): Promise<Vacation[]> => {
      let query = rhSupabase.from('vacations')
        .select('*')
        .order('data_inicio');
      if (companyId) { query = query.eq('company_id', companyId); }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: vacation, isLoading: isLoadingSingle, error: singleError } = useQuery({
    queryKey: VACATION_KEYS.detail(''),
    queryFn: async (): Promise<Vacation | null> => {
      const { data, error } = await rhSupabase.from('vacations')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  const createVacation = useMutation({
    mutationFn: async (newVacation: VacationInsert) => {
      const { data, error } = await rhSupabase.from('vacations')
        .insert([newVacation])
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VACATION_KEYS.lists() });
    },
  });

  const updateVacation = useMutation({
    mutationFn: async ({ id, ...updates }: VacationUpdate & { id: string }) => {
      const { data, error } = await rhSupabase.from('vacations')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VACATION_KEYS.lists() });
    },
  });

  const deleteVacation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase.from('vacations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VACATION_KEYS.lists() });
    },
  });

  const getVacationById = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await rhSupabase.from('vacations')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const getVacationsByEmployee = useMutation({
    mutationFn: async (employeeId: string) => {
      const { data, error } = await rhSupabase.from('vacations')
        .select('*')
        .eq('employee_id', employeeId)
        .order('data_inicio');
      if (error) throw error;
      return data || [];
    },
  });

  const getVacationsByStatus = useMutation({
    mutationFn: async (status: string) => {
      const { data, error } = await rhSupabase.from('vacations')
        .select('*')
        .eq('status', status)
        .order('data_inicio');
      if (error) throw error;
      return data || [];
    },
  });

  const getPendingVacations = useMutation({
    mutationFn: async () => {
      const { data, error } = await rhSupabase.from('vacations')
        .select('*')
        .eq('status', 'solicitado')
        .order('data_inicio');
      if (error) throw error;
      return data || [];
    },
  });

  const approveVacation = useMutation({
    mutationFn: async ({ id, approvedBy }: { id: string; approvedBy: string }) => {
      const { data, error } = await rhSupabase.from('vacations')
        .update({ 
          status: 'aprovado' as 'aprovado',
          aprovado_por: approvedBy,
          data_aprovacao: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VACATION_KEYS.lists() });
    },
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: VACATION_KEYS.lists() });
  };

  return {
    vacations: vacations || [],
    vacation,
    isLoading,
    isLoadingSingle,
    error,
    singleError,
    createVacation,
    updateVacation,
    deleteVacation,
    getVacationById,
    getVacationsByEmployee,
    getVacationsByStatus,
    getPendingVacations,
    approveVacation,
    refetch,
  };
};
