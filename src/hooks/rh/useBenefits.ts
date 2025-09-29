import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { Benefit, BenefitInsert, BenefitUpdate } from '@/integrations/supabase/rh-types-export';

const BENEFIT_KEYS = {
  all: ['benefits'] as const,
  lists: () => [...BENEFIT_KEYS.all, 'list'] as const,
  list: (filters: string) => [...BENEFIT_KEYS.lists(), { filters }] as const,
  details: () => [...BENEFIT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...BENEFIT_KEYS.details(), id] as const,
  byCompany: (companyId: string) => [...BENEFIT_KEYS.all, 'company', companyId] as const,
};

export const useBenefits = (companyId?: string) => {
  const queryClient = useQueryClient();
  
  const { data: benefits, isLoading, error } = useQuery({
    queryKey: BENEFIT_KEYS.lists(),
    queryFn: async (): Promise<Benefit[]> => {
      try {
        let query = rhSupabase.from('benefits')
          .select('*')
          .order('nome');
        if (companyId) { 
          query = query.eq('company_id', companyId); 
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        console.log('✅ useBenefits: Sucesso! Benefícios encontrados:', data?.length || 0);
        return data || [];
      } catch (error) {
        throw error;
      }
    },
    enabled: !!companyId,
  });

  const { data: benefit, isLoading: isLoadingSingle, error: singleError } = useQuery({
    queryKey: BENEFIT_KEYS.detail(''),
    queryFn: async (): Promise<Benefit | null> => {
      const { data, error } = await rhSupabase.from('benefits')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  const createBenefit = useMutation({
    mutationFn: async (newBenefit: Omit<Benefit, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await rhSupabase.from('benefits')
        .insert([newBenefit])
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BENEFIT_KEYS.lists() });
    },
  });

  const updateBenefit = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Benefit> & { id: string }) => {
      const { data, error } = await rhSupabase.from('benefits')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BENEFIT_KEYS.lists() });
    },
  });

  const deleteBenefit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase.from('benefits')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BENEFIT_KEYS.lists() });
    },
  });

  const getBenefitById = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await rhSupabase.from('benefits')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  return {
    benefits: benefits || [],
    benefit,
    isLoading,
    isLoadingSingle,
    error,
    singleError,
    createBenefit,
    updateBenefit,
    deleteBenefit,
    getBenefitById,
  };
};