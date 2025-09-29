import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { 
  DeficiencyType, 
  DeficiencyTypeInsert, 
  DeficiencyTypeUpdate,
  DeficiencyDegree,
  DeficiencyDegreeInsert,
  DeficiencyDegreeUpdate,
  DependentType,
  DependentTypeInsert,
  DependentTypeUpdate,
  KinshipDegree,
  KinshipDegreeInsert,
  KinshipDegreeUpdate,
  EmployeePcdInfo,
  EmployeePcdInfoInsert,
  EmployeePcdInfoUpdate,
  EmployeeDependent,
  EmployeeDependentInsert,
  EmployeeDependentUpdate
} from '@/integrations/supabase/rh-types';

// ===== TIPOS DE DEFICIÊNCIA =====
export function useDeficiencyTypes(companyId: string) {
  const { data: deficiencyTypes = [], isLoading, error, refetch } = useQuery({
    queryKey: ['deficiency-types', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('rh.deficiency_types')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('codigo');
      if (error) throw error;
      return data as DeficiencyType[];
    },
  });

  const createDeficiencyType = useMutation({
    mutationFn: async (data: DeficiencyTypeInsert) => {
      const { data: result, error } = await rhSupabase
        .from('rh.deficiency_types')
        .insert({ ...data, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return result as DeficiencyType;
    },
    onSuccess: () => {
      refetch();
    },
  });

  const updateDeficiencyType = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DeficiencyTypeUpdate }) => {
      const { data: result, error } = await rhSupabase
        .from('rh.deficiency_types')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result as DeficiencyType;
    },
    onSuccess: () => {
      refetch();
    },
  });

  const deleteDeficiencyType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('rh.deficiency_types')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
    },
  });

  return {
    deficiencyTypes,
    isLoading,
    error,
    createDeficiencyType,
    updateDeficiencyType,
    deleteDeficiencyType,
    refetch,
  };
}

// ===== GRAUS DE DEFICIÊNCIA =====
export function useDeficiencyDegrees(companyId: string) {
  const { data: deficiencyDegrees = [], isLoading, error, refetch } = useQuery({
    queryKey: ['deficiency-degrees', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('rh.deficiency_degrees')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('codigo');
      if (error) throw error;
      return data as DeficiencyDegree[];
    },
  });

  const createDeficiencyDegree = useMutation({
    mutationFn: async (data: DeficiencyDegreeInsert) => {
      const { data: result, error } = await rhSupabase
        .from('rh.deficiency_degrees')
        .insert({ ...data, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return result as DeficiencyDegree;
    },
    onSuccess: () => {
      refetch();
    },
  });

  const updateDeficiencyDegree = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DeficiencyDegreeUpdate }) => {
      const { data: result, error } = await rhSupabase
        .from('rh.deficiency_degrees')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result as DeficiencyDegree;
    },
    onSuccess: () => {
      refetch();
    },
  });

  const deleteDeficiencyDegree = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('rh.deficiency_degrees')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
    },
  });

  return {
    deficiencyDegrees,
    isLoading,
    error,
    createDeficiencyDegree,
    updateDeficiencyDegree,
    deleteDeficiencyDegree,
    refetch,
  };
}

// ===== TIPOS DE DEPENDENTES =====
export function useDependentTypes(companyId: string) {
  const { data: dependentTypes = [], isLoading, error, refetch } = useQuery({
    queryKey: ['dependent-types', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('rh.dependent_types')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('codigo');
      if (error) throw error;
      return data as DependentType[];
    },
  });

  const createDependentType = useMutation({
    mutationFn: async (data: DependentTypeInsert) => {
      const { data: result, error } = await rhSupabase
        .from('rh.dependent_types')
        .insert({ ...data, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return result as DependentType;
    },
    onSuccess: () => {
      refetch();
    },
  });

  const updateDependentType = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DependentTypeUpdate }) => {
      const { data: result, error } = await rhSupabase
        .from('rh.dependent_types')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result as DependentType;
    },
    onSuccess: () => {
      refetch();
    },
  });

  const deleteDependentType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('rh.dependent_types')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
    },
  });

  return {
    dependentTypes,
    isLoading,
    error,
    createDependentType,
    updateDependentType,
    deleteDependentType,
    refetch,
  };
}

// ===== GRAUS DE PARENTESCO =====
export function useKinshipDegrees(companyId: string) {
  const { data: kinshipDegrees = [], isLoading, error, refetch } = useQuery({
    queryKey: ['kinship-degrees', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('rh.kinship_degrees')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('codigo');
      if (error) throw error;
      return data as KinshipDegree[];
    },
  });

  const createKinshipDegree = useMutation({
    mutationFn: async (data: KinshipDegreeInsert) => {
      const { data: result, error } = await rhSupabase
        .from('rh.kinship_degrees')
        .insert({ ...data, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return result as KinshipDegree;
    },
    onSuccess: () => {
      refetch();
    },
  });

  const updateKinshipDegree = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: KinshipDegreeUpdate }) => {
      const { data: result, error } = await rhSupabase
        .from('rh.kinship_degrees')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result as KinshipDegree;
    },
    onSuccess: () => {
      refetch();
    },
  });

  const deleteKinshipDegree = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('rh.kinship_degrees')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
    },
  });

  return {
    kinshipDegrees,
    isLoading,
    error,
    createKinshipDegree,
    updateKinshipDegree,
    deleteKinshipDegree,
    refetch,
  };
}

// ===== INFORMAÇÕES PCD DOS FUNCIONÁRIOS =====
export function useEmployeePcdInfo(employeeId: string) {
  const { data: pcdInfo, isLoading, error, refetch } = useQuery({
    queryKey: ['employee-pcd-info', employeeId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('rh.employee_pcd_info')
        .select(`
          *,
          deficiency_type:deficiency_types(codigo, descricao),
          deficiency_degree:deficiency_degrees(codigo, descricao)
        `)
        .eq('employee_id', employeeId)
        .eq('is_active', true)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as EmployeePcdInfo | null;
    },
  });

  const createPcdInfo = useMutation({
    mutationFn: async (data: EmployeePcdInfoInsert) => {
      const { data: result, error } = await rhSupabase
        .from('rh.employee_pcd_info')
        .insert(data)
        .select(`
          *,
          deficiency_type:deficiency_types(codigo, descricao),
          deficiency_degree:deficiency_degrees(codigo, descricao)
        `)
        .single();
      if (error) throw error;
      return result as EmployeePcdInfo;
    },
    onSuccess: () => {
      refetch();
    },
  });

  const updatePcdInfo = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EmployeePcdInfoUpdate }) => {
      const { data: result, error } = await rhSupabase
        .from('rh.employee_pcd_info')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          deficiency_type:deficiency_types(codigo, descricao),
          deficiency_degree:deficiency_degrees(codigo, descricao)
        `)
        .single();
      if (error) throw error;
      return result as EmployeePcdInfo;
    },
    onSuccess: () => {
      refetch();
    },
  });

  const deletePcdInfo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('rh.employee_pcd_info')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
    },
  });

  return {
    pcdInfo,
    isLoading,
    error,
    createPcdInfo,
    updatePcdInfo,
    deletePcdInfo,
    refetch,
  };
}

// ===== DEPENDENTES DOS FUNCIONÁRIOS =====
export function useEmployeeDependents(employeeId: string) {
  const { data: dependents = [], isLoading, error, refetch } = useQuery({
    queryKey: ['employee-dependents', employeeId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('rh.employee_dependents')
        .select(`
          *,
          dependent_type:dependent_types(codigo, descricao),
          kinship_degree:kinship_degrees(codigo, descricao),
          deficiency_type:deficiency_types(codigo, descricao),
          deficiency_degree:deficiency_degrees(codigo, descricao)
        `)
        .eq('employee_id', employeeId)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as EmployeeDependent[];
    },
  });

  const createDependent = useMutation({
    mutationFn: async (data: EmployeeDependentInsert) => {
      const { data: result, error } = await rhSupabase
        .from('rh.employee_dependents')
        .insert(data)
        .select(`
          *,
          dependent_type:dependent_types(codigo, descricao),
          kinship_degree:kinship_degrees(codigo, descricao),
          deficiency_type:deficiency_types(codigo, descricao),
          deficiency_degree:deficiency_degrees(codigo, descricao)
        `)
        .single();
      if (error) throw error;
      return result as EmployeeDependent;
    },
    onSuccess: () => {
      refetch();
    },
  });

  const updateDependent = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EmployeeDependentUpdate }) => {
      const { data: result, error } = await rhSupabase
        .from('rh.employee_dependents')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          dependent_type:dependent_types(codigo, descricao),
          kinship_degree:kinship_degrees(codigo, descricao),
          deficiency_type:deficiency_types(codigo, descricao),
          deficiency_degree:deficiency_degrees(codigo, descricao)
        `)
        .single();
      if (error) throw error;
      return result as EmployeeDependent;
    },
    onSuccess: () => {
      refetch();
    },
  });

  const deleteDependent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('rh.employee_dependents')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
    },
  });

  return {
    dependents,
    isLoading,
    error,
    createDependent,
    updateDependent,
    deleteDependent,
    refetch,
  };
}

// ===== HOOKS PARA SELECTS =====
export function useDeficiencyTypesForSelect(companyId: string) {
  const { data: deficiencyTypes = [], isLoading } = useQuery({
    queryKey: ['deficiency-types-select', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('rh.deficiency_types')
        .select('id, codigo, descricao')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('codigo');
      if (error) throw error;
      return data;
    },
  });

  return { deficiencyTypes, isLoading };
}

export function useDeficiencyDegreesForSelect(companyId: string) {
  const { data: deficiencyDegrees = [], isLoading } = useQuery({
    queryKey: ['deficiency-degrees-select', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('rh.deficiency_degrees')
        .select('id, codigo, descricao')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('codigo');
      if (error) throw error;
      return data;
    },
  });

  return { deficiencyDegrees, isLoading };
}

export function useDependentTypesForSelect(companyId: string) {
  const { data: dependentTypes = [], isLoading } = useQuery({
    queryKey: ['dependent-types-select', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('rh.dependent_types')
        .select('id, codigo, descricao')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('codigo');
      if (error) throw error;
      return data;
    },
  });

  return { dependentTypes, isLoading };
}

export function useKinshipDegreesForSelect(companyId: string) {
  const { data: kinshipDegrees = [], isLoading } = useQuery({
    queryKey: ['kinship-degrees-select', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('rh.kinship_degrees')
        .select('id, codigo, descricao')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('codigo');
      if (error) throw error;
      return data;
    },
  });

  return { kinshipDegrees, isLoading };
}



























































