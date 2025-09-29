import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { 
  ESocialCategory, 
  ESocialCategoryInsert, 
  ESocialCategoryUpdate,
  ESocialLeaveType,
  ESocialLeaveTypeInsert,
  ESocialLeaveTypeUpdate,
  ESocialNaturezaRubrica,
  ESocialNaturezaRubricaInsert,
  ESocialNaturezaRubricaUpdate,
  ESocialBenefitType,
  ESocialBenefitTypeInsert,
  ESocialBenefitTypeUpdate
} from '@/integrations/supabase/rh-types';

interface UseESocialCatalogsProps {
  companyId: string;
}

// Hook para categorias eSocial
export function useESocialCategories({ companyId }: UseESocialCatalogsProps) {
  const queryClient = useQueryClient();

  const {
    data: categories = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['esocial-categories', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('esocial_categories')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('codigo');

      if (error) throw error;
      return data as ESocialCategory[];
    },
  });

  const createCategory = useMutation({
    mutationFn: async (data: ESocialCategoryInsert) => {
      const { data: result, error } = await rhSupabase
        .from('esocial_categories')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esocial-categories', companyId] });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ESocialCategoryUpdate }) => {
      const { data: result, error } = await rhSupabase
        .from('esocial_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esocial-categories', companyId] });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('esocial_categories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esocial-categories', companyId] });
    },
  });

  return {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch,
  };
}

// Hook para motivos de afastamento
export function useESocialLeaveTypes({ companyId }: UseESocialCatalogsProps) {
  const queryClient = useQueryClient();

  const {
    data: leaveTypes = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['esocial-leave-types', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('esocial_leave_types')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('codigo');

      if (error) throw error;
      return data as ESocialLeaveType[];
    },
  });

  const createLeaveType = useMutation({
    mutationFn: async (data: ESocialLeaveTypeInsert) => {
      const { data: result, error } = await rhSupabase
        .from('esocial_leave_types')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esocial-leave-types', companyId] });
    },
  });

  const updateLeaveType = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ESocialLeaveTypeUpdate }) => {
      const { data: result, error } = await rhSupabase
        .from('esocial_leave_types')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esocial-leave-types', companyId] });
    },
  });

  const deleteLeaveType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('esocial_leave_types')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esocial-leave-types', companyId] });
    },
  });

  return {
    leaveTypes,
    isLoading,
    error,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
    refetch,
  };
}

// Hook para naturezas de rubricas
export function useESocialNaturezasRubricas({ companyId }: UseESocialCatalogsProps) {
  const queryClient = useQueryClient();

  const {
    data: naturezas = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['esocial-naturezas-rubricas', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('esocial_naturezas_rubricas')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('codigo');

      if (error) throw error;
      return data as ESocialNaturezaRubrica[];
    },
  });

  const createNatureza = useMutation({
    mutationFn: async (data: ESocialNaturezaRubricaInsert) => {
      const { data: result, error } = await rhSupabase
        .from('esocial_naturezas_rubricas')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esocial-naturezas-rubricas', companyId] });
    },
  });

  const updateNatureza = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ESocialNaturezaRubricaUpdate }) => {
      const { data: result, error } = await rhSupabase
        .from('esocial_naturezas_rubricas')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esocial-naturezas-rubricas', companyId] });
    },
  });

  const deleteNatureza = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('esocial_naturezas_rubricas')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esocial-naturezas-rubricas', companyId] });
    },
  });

  return {
    naturezas,
    isLoading,
    error,
    createNatureza,
    updateNatureza,
    deleteNatureza,
    refetch,
  };
}

// Hook para tipos de benefícios
export function useESocialBenefitTypes({ companyId }: UseESocialCatalogsProps) {
  const queryClient = useQueryClient();

  const {
    data: benefitTypes = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['esocial-benefit-types', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('esocial_benefit_types')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('codigo');

      if (error) throw error;
      return data as ESocialBenefitType[];
    },
  });

  const createBenefitType = useMutation({
    mutationFn: async (data: ESocialBenefitTypeInsert) => {
      const { data: result, error } = await rhSupabase
        .from('esocial_benefit_types')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esocial-benefit-types', companyId] });
    },
  });

  const updateBenefitType = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ESocialBenefitTypeUpdate }) => {
      const { data: result, error } = await rhSupabase
        .from('esocial_benefit_types')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esocial-benefit-types', companyId] });
    },
  });

  const deleteBenefitType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('esocial_benefit_types')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esocial-benefit-types', companyId] });
    },
  });

  return {
    benefitTypes,
    isLoading,
    error,
    createBenefitType,
    updateBenefitType,
    deleteBenefitType,
    refetch,
  };
}