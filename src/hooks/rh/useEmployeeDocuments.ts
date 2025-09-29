import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { EmployeeDocument, EmployeeDocumentInsert, EmployeeDocumentUpdate } from '@/integrations/supabase/rh-types';

const EMPLOYEE_DOCUMENTS_KEYS = {
  all: ['employee_documents'] as const,
  lists: () => [...EMPLOYEE_DOCUMENTS_KEYS.all, 'list'] as const,
  list: (employeeId: string) => [...EMPLOYEE_DOCUMENTS_KEYS.lists(), employeeId] as const,
  details: () => [...EMPLOYEE_DOCUMENTS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...EMPLOYEE_DOCUMENTS_KEYS.details(), id] as const,
  byEmployee: (employeeId: string) => [...EMPLOYEE_DOCUMENTS_KEYS.all, 'employee', employeeId] as const,
};

export const useEmployeeDocuments = (employeeId?: string) => {
  const queryClient = useQueryClient();
  
  const { data: documents, isLoading, error } = useQuery({
    queryKey: EMPLOYEE_DOCUMENTS_KEYS.list(employeeId || ''),
    queryFn: async (): Promise<EmployeeDocument[]> => {
      if (!employeeId) return [];
      
      const { data, error } = await rhSupabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!employeeId,
  });

  const createDocument = useMutation({
    mutationFn: async (newDocument: EmployeeDocumentInsert) => {
      const { data, error } = await rhSupabase
        .from('employee_documents')
        .insert(newDocument)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_DOCUMENTS_KEYS.byEmployee(variables.employee_id) });
    },
  });

  const updateDocument = useMutation({
    mutationFn: async ({ id, ...updates }: EmployeeDocumentUpdate & { id: string }) => {
      const { data, error } = await rhSupabase
        .from('employee_documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_DOCUMENTS_KEYS.byEmployee(data.employee_id) });
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('employee_documents')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (employeeId) {
        queryClient.invalidateQueries({ queryKey: EMPLOYEE_DOCUMENTS_KEYS.byEmployee(employeeId) });
      }
    },
  });

  return {
    documents,
    isLoading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
  };
};




