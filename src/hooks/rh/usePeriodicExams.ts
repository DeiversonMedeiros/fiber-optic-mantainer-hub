import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PeriodicExam, PeriodicExamInsert, PeriodicExamUpdate } from '@/integrations/supabase/rh-types';

const PERIODIC_EXAM_KEYS = {
  all: ['periodic-exams'] as const,
  lists: () => [...PERIODIC_EXAM_KEYS.all, 'list'] as const,
  list: (filters: string) => [...PERIODIC_EXAM_KEYS.lists(), { filters }] as const,
  details: () => [...PERIODIC_EXAM_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PERIODIC_EXAM_KEYS.details(), id] as const,
  byEmployee: (employeeId: string) => [...PERIODIC_EXAM_KEYS.all, 'employee', employeeId] as const,
  byType: (type: string) => [...PERIODIC_EXAM_KEYS.all, 'type', type] as const,
  byStatus: (status: string) => [...PERIODIC_EXAM_KEYS.all, 'status', status] as const,
  pending: () => [...PERIODIC_EXAM_KEYS.all, 'pending'] as const,
  completed: () => [...PERIODIC_EXAM_KEYS.all, 'completed'] as const,
  overdue: () => [...PERIODIC_EXAM_KEYS.all, 'overdue'] as const,
  byCompany: (companyId: string) => [...PERIODIC_EXAM_KEYS.all, 'company', companyId] as const,
};

export const usePeriodicExams = (companyId?: string) => {
  const queryClient = useQueryClient();
  
  const { data: periodicExams, isLoading, error } = useQuery({
    queryKey: PERIODIC_EXAM_KEYS.lists(),
    queryFn: async (): Promise<PeriodicExam[]> => {
      let query = (supabase as any)
        .from('rh.periodic_exams')
        .select(`
          *,
          employee:rh.employees(id, nome, matricula)
        `)
        .order('data_exame', { ascending: false });
      if (companyId) { query = query.eq('company_id', companyId); }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: periodicExam, isLoading: isLoadingSingle, error: singleError } = useQuery({
    queryKey: PERIODIC_EXAM_KEYS.detail(''),
    queryFn: async (): Promise<PeriodicExam | null> => {
      const { data, error } = await (supabase as any)
        .from('rh.periodic_exams')
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

  const createPeriodicExam = useMutation({
    mutationFn: async (newPeriodicExam: Omit<PeriodicExam, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase as any)
        .from('rh.periodic_exams')
        .insert([newPeriodicExam])
        .select(`
          *,
          employee:rh.employees(id, nome, matricula)
        `)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERIODIC_EXAM_KEYS.lists() });
    },
  });

  const updatePeriodicExam = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PeriodicExam> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('rh.periodic_exams')
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
      queryClient.invalidateQueries({ queryKey: PERIODIC_EXAM_KEYS.lists() });
    },
  });

  const deletePeriodicExam = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('rh.periodic_exams')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERIODIC_EXAM_KEYS.lists() });
    },
  });

  const getPeriodicExamById = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await (supabase as any)
        .from('rh.periodic_exams')
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

  const getPeriodicExamsByEmployee = useMutation({
    mutationFn: async (employeeId: string) => {
      const { data, error } = await (supabase as any)
        .from('rh.periodic_exams')
        .select(`
          *,
          employee:rh.employees(id, nome, matricula)
        `)
        .eq('employee_id', employeeId)
        .order('data_exame', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const getPeriodicExamsByType = useMutation({
    mutationFn: async (type: string) => {
      const { data, error } = await (supabase as any)
        .from('rh.periodic_exams')
        .select(`
          *,
          employee:rh.employees(id, nome, matricula)
        `)
        .eq('tipo_exame', type)
        .order('data_exame', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const getPeriodicExamsByStatus = useMutation({
    mutationFn: async (status: string) => {
      const { data, error } = await (supabase as any)
        .from('rh.periodic_exams')
        .select(`
          *,
          employee:rh.employees(id, nome, matricula)
        `)
        .eq('status', status)
        .order('data_exame', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return {
    periodicExams,
    periodicExam,
    isLoading,
    isLoadingSingle,
    error,
    singleError,
    createPeriodicExam,
    updatePeriodicExam,
    deletePeriodicExam,
    getPeriodicExamById,
    getPeriodicExamsByEmployee,
    getPeriodicExamsByType,
    getPeriodicExamsByStatus,
  };
};