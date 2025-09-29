import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { EmployeeEducation, EmployeeEducationInsert, EmployeeEducationUpdate } from '@/integrations/supabase/rh-types';

const EMPLOYEE_EDUCATION_KEYS = {
  all: ['employee_education'] as const,
  lists: () => [...EMPLOYEE_EDUCATION_KEYS.all, 'list'] as const,
  list: (employeeId: string) => [...EMPLOYEE_EDUCATION_KEYS.lists(), employeeId] as const,
  details: () => [...EMPLOYEE_EDUCATION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...EMPLOYEE_EDUCATION_KEYS.details(), id] as const,
  byEmployee: (employeeId: string) => [...EMPLOYEE_EDUCATION_KEYS.all, 'employee', employeeId] as const,
  byLevel: (employeeId: string, level: string) => [...EMPLOYEE_EDUCATION_KEYS.byEmployee(employeeId), level] as const,
};

export const useEmployeeEducation = (employeeId?: string) => {
  const queryClient = useQueryClient();
  
  const { data: education, isLoading, error } = useQuery({
    queryKey: EMPLOYEE_EDUCATION_KEYS.list(employeeId || ''),
    queryFn: async (): Promise<EmployeeEducation[]> => {
      if (!employeeId) return [];
      
      const { data, error } = await rhSupabase
        .from('employee_education')
        .select('*')
        .eq('employee_id', employeeId)
        .order('ano_conclusao', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!employeeId,
  });

  // Nível mais alto de escolaridade
  const highestEducation = education?.reduce((highest, current) => {
    const levelOrder = {
      'fundamental_incompleto': 1,
      'fundamental_completo': 2,
      'medio_incompleto': 3,
      'medio_completo': 4,
      'superior_incompleto': 5,
      'superior_completo': 6,
      'pos_graduacao': 7,
      'mestrado': 8,
      'doutorado': 9,
      'pos_doutorado': 10,
    };
    
    const currentLevel = levelOrder[current.nivel_escolaridade as keyof typeof levelOrder] || 0;
    const highestLevel = levelOrder[highest.nivel_escolaridade as keyof typeof levelOrder] || 0;
    
    return currentLevel > highestLevel ? current : highest;
  }, education?.[0] || null) || null;

  const createEducation = useMutation({
    mutationFn: async (newEducation: EmployeeEducationInsert) => {
      const { data, error } = await rhSupabase
        .from('employee_education')
        .insert(newEducation)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_EDUCATION_KEYS.byEmployee(variables.employee_id) });
    },
  });

  const updateEducation = useMutation({
    mutationFn: async ({ id, ...updates }: EmployeeEducationUpdate & { id: string }) => {
      const { data, error } = await rhSupabase
        .from('employee_education')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_EDUCATION_KEYS.byEmployee(data.employee_id) });
    },
  });

  const deleteEducation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('employee_education')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (employeeId) {
        queryClient.invalidateQueries({ queryKey: EMPLOYEE_EDUCATION_KEYS.byEmployee(employeeId) });
      }
    },
  });

  return {
    education,
    highestEducation,
    isLoading,
    error,
    createEducation,
    updateEducation,
    deleteEducation,
  };
};




