import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/rh-client';
import { 
  EmployeeDependent, 
  EmployeeDependentInsert, 
  EmployeeDependentUpdate,
  DependentType,
  KinshipDegree,
  DeficiencyType,
  DeficiencyDegree
} from '@/integrations/supabase/rh-types';

export function useEmployeeDependents(employeeId: string) {
  const queryClient = useQueryClient();

  // Buscar dependentes do funcionário
  const {
    data: dependents = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['employee-dependents', employeeId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('employee_dependents')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EmployeeDependent[];
    },
    enabled: !!employeeId,
  });

  // Buscar tipos de dependente
  const { data: dependentTypes = [] } = useQuery({
    queryKey: ['dependent-types'],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('dependent_types')
        .select('*')
        .eq('is_active', true)
        .order('descricao');

      if (error) throw error;
      return data as DependentType[];
    },
  });

  // Buscar graus de parentesco
  const { data: kinshipDegrees = [] } = useQuery({
    queryKey: ['kinship-degrees'],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('kinship_degrees')
        .select('*')
        .eq('is_active', true)
        .order('descricao');

      if (error) throw error;
      return data as KinshipDegree[];
    },
  });

  // Buscar tipos de deficiência
  const { data: deficiencyTypes = [] } = useQuery({
    queryKey: ['deficiency-types'],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('deficiency_types')
        .select('*')
        .eq('is_active', true)
        .order('descricao');

      if (error) throw error;
      return data as DeficiencyType[];
    },
  });

  // Buscar graus de deficiência
  const { data: deficiencyDegrees = [] } = useQuery({
    queryKey: ['deficiency-degrees'],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('deficiency_degrees')
        .select('*')
        .eq('is_active', true)
        .order('descricao');

      if (error) throw error;
      return data as DeficiencyDegree[];
    },
  });

  // Criar dependente
  const createDependent = useMutation({
    mutationFn: async (data: EmployeeDependentInsert) => {
      const { data: result, error } = await rhSupabase
        .from('employee_dependents')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result as EmployeeDependent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-dependents', employeeId] });
    },
  });

  // Atualizar dependente
  const updateDependent = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & EmployeeDependentUpdate) => {
      const { data: result, error } = await rhSupabase
        .from('employee_dependents')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as EmployeeDependent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-dependents', employeeId] });
    },
  });

  // Deletar dependente
  const deleteDependent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('employee_dependents')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-dependents', employeeId] });
    },
  });

  return {
    dependents,
    dependentTypes,
    kinshipDegrees,
    deficiencyTypes,
    deficiencyDegrees,
    isLoading,
    error,
    createDependent,
    updateDependent,
    deleteDependent,
  };
}
