import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Union, UnionInsert, UnionUpdate } from '@/integrations/supabase/rh-types';

const UNION_KEYS = {
  all: ['unions'] as const,
  lists: () => [...UNION_KEYS.all, 'list'] as const,
  list: (filters: string) => [...UNION_KEYS.lists(), { filters }] as const,
  details: () => [...UNION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...UNION_KEYS.details(), id] as const,
  byType: (type: string) => [...UNION_KEYS.all, 'type', type] as const,
  active: () => [...UNION_KEYS.all, 'active'] as const,
  byCompany: (companyId: string) => [...UNION_KEYS.all, 'company', companyId] as const,
};

export const useUnions = (companyId?: string) => {
  const queryClient = useQueryClient();
  
  const { data: unions, isLoading, error } = useQuery({
    queryKey: UNION_KEYS.lists(),
    queryFn: async (): Promise<Union[]> => {
      let query = (supabase as any)
        .schema('rh')
        .from('unions')
        .select('*')
        .order('nome', { ascending: true });
      if (companyId) { query = query.eq('company_id', companyId); }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: union, isLoading: isLoadingSingle, error: singleError } = useQuery({
    queryKey: UNION_KEYS.detail(''),
    queryFn: async (): Promise<Union | null> => {
      const { data, error } = await (supabase as any)
        .schema('rh')
        .from('unions')
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    enabled: false,
  });

  const createUnion = useMutation({
    mutationFn: async (newUnion: Omit<Union, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase as any)
        .schema('rh')
        .from('unions')
        .insert([newUnion])
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UNION_KEYS.lists() });
    },
  });

  const updateUnion = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Union> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .schema('rh')
        .from('unions')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UNION_KEYS.lists() });
    },
  });

  const deleteUnion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .schema('rh')
        .from('unions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UNION_KEYS.lists() });
    },
  });

  const getUnionById = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await (supabase as any)
        .schema('rh')
        .from('unions')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const getUnionsByType = useMutation({
    mutationFn: async (type: string) => {
      const { data, error } = await (supabase as any)
        .schema('rh')
        .from('unions')
        .select('*')
        .eq('tipo', type)
        .order('nome', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const getActiveUnions = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase as any)
        .schema('rh')
        .from('unions')
        .select('*')
        .eq('is_active', true)
        .order('nome', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: UNION_KEYS.lists() });
  };

  return {
    unions: unions || [],
    union,
    isLoading,
    isLoadingSingle,
    error,
    singleError,
    createUnion,
    updateUnion,
    deleteUnion,
    getUnionById,
    getUnionsByType,
    getActiveUnions,
    refetch,
  };
};