import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CompensationRequest, CompensationRequestInsert, CompensationRequestUpdate } from '@/integrations/supabase/rh-types';

const COMPENSATION_REQUEST_KEYS = {
  all: ['compensation-requests'] as const,
  lists: () => [...COMPENSATION_REQUEST_KEYS.all, 'list'] as const,
  list: (filters: string) => [...COMPENSATION_REQUEST_KEYS.lists(), { filters }] as const,
  details: () => [...COMPENSATION_REQUEST_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...COMPENSATION_REQUEST_KEYS.details(), id] as const,
  byEmployee: (employeeId: string) => [...COMPENSATION_REQUEST_KEYS.all, 'employee', employeeId] as const,
  byStatus: (status: string) => [...COMPENSATION_REQUEST_KEYS.all, 'status', status] as const,
  pending: () => [...COMPENSATION_REQUEST_KEYS.all, 'pending'] as const,
  approved: () => [...COMPENSATION_REQUEST_KEYS.all, 'approved'] as const,
  byCompany: (companyId: string) => [...COMPENSATION_REQUEST_KEYS.all, 'company', companyId] as const,
};

export const useCompensationRequests = (companyId?: string) => {
  const queryClient = useQueryClient();
  
  const { data: compensationRequests, isLoading, error } = useQuery({
    queryKey: COMPENSATION_REQUEST_KEYS.lists(),
    queryFn: async (): Promise<CompensationRequest[]> => {
      let query = (supabase as any)
        .from('rh.compensation_requests')
        .select(`
          *,
          employee:rh.employees(id, nome, matricula)
        `)
        .order('data_solicitacao', { ascending: false });
      if (companyId) { query = query.eq('company_id', companyId); }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: compensationRequest, isLoading: isLoadingSingle, error: singleError } = useQuery({
    queryKey: COMPENSATION_REQUEST_KEYS.detail(''),
    queryFn: async (): Promise<CompensationRequest | null> => {
      const { data, error } = await (supabase as any)
        .from('rh.compensation_requests')
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

  const createCompensationRequest = useMutation({
    mutationFn: async (newCompensationRequest: Omit<CompensationRequest, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase as any)
        .from('rh.compensation_requests')
        .insert([newCompensationRequest])
        .select(`
          *,
          employee:rh.employees(id, nome, matricula)
        `)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPENSATION_REQUEST_KEYS.lists() });
    },
  });

  const updateCompensationRequest = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CompensationRequest> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('rh.compensation_requests')
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
      queryClient.invalidateQueries({ queryKey: COMPENSATION_REQUEST_KEYS.lists() });
    },
  });

  const deleteCompensationRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('rh.compensation_requests')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPENSATION_REQUEST_KEYS.lists() });
    },
  });

  const getCompensationRequestById = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await (supabase as any)
        .from('rh.compensation_requests')
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

  const getCompensationRequestsByEmployee = useMutation({
    mutationFn: async (employeeId: string) => {
      const { data, error } = await (supabase as any)
        .from('rh.compensation_requests')
        .select(`
          *,
          employee:rh.employees(id, nome, matricula)
        `)
        .eq('employee_id', employeeId)
        .order('data_solicitacao', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const getCompensationRequestsByStatus = useMutation({
    mutationFn: async (status: string) => {
      const { data, error } = await (supabase as any)
        .from('rh.compensation_requests')
        .select(`
          *,
          employee:rh.employees(id, nome, matricula)
        `)
        .eq('status', status)
        .order('data_solicitacao', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const getPendingCompensationRequests = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase as any)
        .from('rh.compensation_requests')
        .select(`
          *,
          employee:rh.employees(id, nome, matricula)
        `)
        .eq('status', 'pendente')
        .order('data_solicitacao', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const approveCompensationRequest = useMutation({
    mutationFn: async ({ id, approvedBy }: { id: string; approvedBy: string }) => {
      const { data, error } = await (supabase as any)
        .from('rh.compensation_requests')
        .update({ 
          status: 'aprovado',
          aprovado_por: approvedBy,
          data_aprovacao: new Date().toISOString()
        })
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
      queryClient.invalidateQueries({ queryKey: COMPENSATION_REQUEST_KEYS.lists() });
    },
  });

  return {
    compensationRequests,
    compensationRequest,
    isLoading,
    isLoadingSingle,
    error,
    singleError,
    createCompensationRequest,
    updateCompensationRequest,
    deleteCompensationRequest,
    getCompensationRequestById,
    getCompensationRequestsByEmployee,
    getCompensationRequestsByStatus,
    getPendingCompensationRequests,
    approveCompensationRequest,
  };
};