import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ESocialEvent, ESocialEventInsert, ESocialEventUpdate } from '@/integrations/supabase/rh-types';

const ESOCIAL_EVENT_KEYS = {
  all: ['esocial-events'] as const,
  lists: () => [...ESOCIAL_EVENT_KEYS.all, 'list'] as const,
  list: (filters: string) => [...ESOCIAL_EVENT_KEYS.lists(), { filters }] as const,
  details: () => [...ESOCIAL_EVENT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ESOCIAL_EVENT_KEYS.details(), id] as const,
  byEmployee: (employeeId: string) => [...ESOCIAL_EVENT_KEYS.all, 'employee', employeeId] as const,
  byType: (type: string) => [...ESOCIAL_EVENT_KEYS.all, 'type', type] as const,
  byStatus: (status: string) => [...ESOCIAL_EVENT_KEYS.all, 'status', status] as const,
  byCompany: (companyId: string) => [...ESOCIAL_EVENT_KEYS.all, 'company', companyId] as const,
};

export const useESocialEvents = (companyId?: string) => {
  const queryClient = useQueryClient();
  
  const { data: esocialEvents, isLoading, error } = useQuery({
    queryKey: ESOCIAL_EVENT_KEYS.lists(),
    queryFn: async (): Promise<ESocialEvent[]> => {
      let query = (supabase as any)
        .from('rh.esocial_events')
        .select(`
          *,
          employee:rh.employees(id, nome, matricula)
        `)
        .order('data_evento', { ascending: false });
      if (companyId) { query = query.eq('company_id', companyId); }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: esocialEvent, isLoading: isLoadingSingle, error: singleError } = useQuery({
    queryKey: ESOCIAL_EVENT_KEYS.detail(''),
    queryFn: async (): Promise<ESocialEvent | null> => {
      const { data, error } = await (supabase as any)
        .from('rh.esocial_events')
        .select(`
          *,
          employee:rh.employees(id, nome, matricula)
        `)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  const createESocialEvent = useMutation({
    mutationFn: async (newESocialEvent: Omit<ESocialEvent, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase as any)
        .from('rh.esocial_events')
        .insert([newESocialEvent])
        .select(`
          *,
          employee:rh.employees(id, nome, matricula)
        `)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ESOCIAL_EVENT_KEYS.lists() });
    },
  });

  const updateESocialEvent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ESocialEvent> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('rh.esocial_events')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          employee:rh.employees(id, nome, matricula)
        `)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ESOCIAL_EVENT_KEYS.lists() });
    },
  });

  const deleteESocialEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('rh.esocial_events')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ESOCIAL_EVENT_KEYS.lists() });
    },
  });

  const getESocialEventById = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await (supabase as any)
        .from('rh.esocial_events')
        .select(`
          *,
          employee:rh.employees(id, nome, matricula)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const getESocialEventsByEmployee = useMutation({
    mutationFn: async (employeeId: string) => {
      const { data, error } = await (supabase as any)
        .from('rh.esocial_events')
        .select(`
          *,
          employee:rh.employees(id, nome, matricula)
        `)
        .eq('employee_id', employeeId)
        .order('data_evento', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const getESocialEventsByType = useMutation({
    mutationFn: async (type: string) => {
      const { data, error } = await (supabase as any)
        .from('rh.esocial_events')
        .select(`
          *,
          employee:rh.employees(id, nome, matricula)
        `)
        .eq('tipo_evento', type)
        .order('data_evento', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const getESocialEventsByStatus = useMutation({
    mutationFn: async (status: string) => {
      const { data, error } = await (supabase as any)
        .from('rh.esocial_events')
        .select(`
          *,
          employee:rh.employees(id, nome, matricula)
        `)
        .eq('status', status)
        .order('data_evento', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return {
    esocialEvents,
    esocialEvent,
    isLoading,
    isLoadingSingle,
    error,
    singleError,
    createESocialEvent,
    updateESocialEvent,
    deleteESocialEvent,
    getESocialEventById,
    getESocialEventsByEmployee,
    getESocialEventsByType,
    getESocialEventsByStatus,
  };
};