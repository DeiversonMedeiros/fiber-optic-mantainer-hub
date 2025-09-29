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
      const { data, error } = await supabase.rpc('get_rh_periodic_exams', {
        p_company_id: companyId
      });
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
          employee:employees(id, nome, matricula)
        `)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  const createPeriodicExam = useMutation({
    mutationFn: async (newPeriodicExam: Omit<PeriodicExam, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: examId, error } = await supabase.rpc('create_rh_periodic_exam', {
        p_company_id: newPeriodicExam.company_id,
        p_employee_id: newPeriodicExam.employee_id,
        p_tipo_exame: newPeriodicExam.tipo_exame,
        p_data_agendada: newPeriodicExam.data_agendada,
        p_resultado: newPeriodicExam.resultado,
        p_arquivo_anexo: newPeriodicExam.arquivo_anexo,
        p_medico_responsavel: newPeriodicExam.medico_responsavel,
        p_observacoes: newPeriodicExam.observacoes
      });
      if (error) throw error;
      
      // Buscar o exame criado para retornar com dados completos
      const { data: createdExam, error: fetchError } = await supabase.rpc('get_rh_periodic_exams', {
        p_employee_id: newPeriodicExam.employee_id
      });
      if (fetchError) throw fetchError;
      
      return createdExam?.[0] || null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERIODIC_EXAM_KEYS.lists() });
    },
  });

  const updatePeriodicExam = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PeriodicExam> & { id: string }) => {
      const { data, error } = await supabase.rpc('update_rh_periodic_exam', {
        p_exam_id: id,
        p_data_agendada: updates.data_agendada,
        p_data_realizacao: updates.data_realizacao,
        p_resultado: updates.resultado,
        p_arquivo_anexo: updates.arquivo_anexo,
        p_status: updates.status,
        p_medico_responsavel: updates.medico_responsavel,
        p_observacoes: updates.observacoes
      });
      if (error) throw error;
      
      // Buscar o exame atualizado para retornar com dados completos
      const { data: updatedExam, error: fetchError } = await supabase.rpc('get_rh_periodic_exams', {
        p_employee_id: updates.employee_id
      });
      if (fetchError) throw fetchError;
      
      return updatedExam?.find(exam => exam.id === id) || null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERIODIC_EXAM_KEYS.lists() });
    },
  });

  const deletePeriodicExam = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc('delete_rh_periodic_exam', {
        p_exam_id: id
      });
      if (error) throw error;
      return data;
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
          employee:employees(id, nome, matricula)
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
          employee:employees(id, nome, matricula)
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
          employee:employees(id, nome, matricula)
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
          employee:employees(id, nome, matricula)
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