import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { MedicalCertificate, MedicalCertificateInsert, MedicalCertificateUpdate } from '@/integrations/supabase/rh-types';

const MEDICAL_CERTIFICATE_KEYS = {
  all: ['medical-certificates'] as const,
  lists: () => [...MEDICAL_CERTIFICATE_KEYS.all, 'list'] as const,
  list: (filters: string) => [...MEDICAL_CERTIFICATE_KEYS.lists(), { filters }] as const,
  details: () => [...MEDICAL_CERTIFICATE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...MEDICAL_CERTIFICATE_KEYS.details(), id] as const,
  byEmployee: (employeeId: string) => [...MEDICAL_CERTIFICATE_KEYS.all, 'employee', employeeId] as const,
  byStatus: (status: string) => [...MEDICAL_CERTIFICATE_KEYS.all, 'status', status] as const,
  pending: () => [...MEDICAL_CERTIFICATE_KEYS.all, 'pending'] as const,
  approved: () => [...MEDICAL_CERTIFICATE_KEYS.all, 'approved'] as const,
  byCompany: (companyId: string) => [...MEDICAL_CERTIFICATE_KEYS.all, 'company', companyId] as const,
};

export const useMedicalCertificates = (companyId?: string) => {
  const queryClient = useQueryClient();
  
  const { data: medicalCertificates, isLoading, error, refetch } = useQuery({
    queryKey: MEDICAL_CERTIFICATE_KEYS.byCompany(companyId || ''),
    queryFn: async (): Promise<MedicalCertificate[]> => {
      let query = rhSupabase
        .from('medical_certificates')
        .select('*')
        .order('data_inicio', { ascending: false });
      if (companyId) { query = query.eq('company_id', companyId); }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: medicalCertificate, isLoading: isLoadingSingle, error: singleError } = useQuery({
    queryKey: MEDICAL_CERTIFICATE_KEYS.detail(''),
    queryFn: async (): Promise<MedicalCertificate | null> => {
      const { data, error } = await rhSupabase
        .from('medical_certificates')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  const createMedicalCertificate = useMutation({
    mutationFn: async (newMedicalCertificate: Omit<MedicalCertificate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await rhSupabase
        .from('medical_certificates')
        .insert([newMedicalCertificate])
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDICAL_CERTIFICATE_KEYS.lists() });
    },
  });

  const updateMedicalCertificate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MedicalCertificate> & { id: string }) => {
      const { data, error } = await rhSupabase
        .from('medical_certificates')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDICAL_CERTIFICATE_KEYS.lists() });
    },
  });

  const deleteMedicalCertificate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('medical_certificates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDICAL_CERTIFICATE_KEYS.lists() });
    },
  });

  const getMedicalCertificateById = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await rhSupabase
        .from('medical_certificates')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const getMedicalCertificatesByEmployee = useMutation({
    mutationFn: async (employeeId: string) => {
      const { data, error } = await rhSupabase
        .from('medical_certificates')
        .select('*')
        .eq('employee_id', employeeId)
        .order('data_inicio', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const getMedicalCertificatesByStatus = useMutation({
    mutationFn: async (status: string) => {
      const { data, error } = await rhSupabase
        .from('medical_certificates')
        .select('*')
        .eq('tipo', status)
        .order('data_inicio', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const getPendingMedicalCertificates = useMutation({
    mutationFn: async () => {
      const { data, error } = await rhSupabase
        .from('medical_certificates')
        .select('*')
        .eq('tipo', 'pendente')
        .order('data_inicio', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const approveMedicalCertificate = useMutation({
    mutationFn: async ({ id, approvedBy }: { id: string; approvedBy: string }) => {
      const { data, error } = await rhSupabase
        .from('medical_certificates')
        .update({ 
          tipo: 'aprovado',
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
      queryClient.invalidateQueries({ queryKey: MEDICAL_CERTIFICATE_KEYS.lists() });
    },
  });

  return {
    medicalCertificates,
    medicalCertificate,
    isLoading,
    isLoadingSingle,
    error,
    singleError,
    refetch,
    createMedicalCertificate,
    updateMedicalCertificate,
    deleteMedicalCertificate,
    getMedicalCertificateById,
    getMedicalCertificatesByEmployee,
    getMedicalCertificatesByStatus,
    getPendingMedicalCertificates,
    approveMedicalCertificate,
  };
};