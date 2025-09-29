import { useQuery } from '@tanstack/react-query';
import { coreSupabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Department = Database['core']['Tables']['departments']['Row'];

export const useDepartments = (companyId?: string) => {
  const {
    data: departments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['departments', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await coreSupabase
        .from('departments')
        .select('*')
        .eq('company_id', companyId)
        .order('nome', { ascending: true });

      if (error) throw error;
      return data as Department[];
    },
    enabled: !!companyId,
  });

  return {
    departments,
    isLoading,
    error,
  };
};




