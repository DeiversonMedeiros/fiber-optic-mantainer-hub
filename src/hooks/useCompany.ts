import { useQuery } from '@tanstack/react-query';
import { coreSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  status: 'active' | 'inactive';
  is_active: boolean;
  razao_social: string;
  nome_fantasia: string | null;
}

export function useCompany() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-company', user?.id],
    queryFn: async (): Promise<Company | null> => {
      if (!user?.id) return null;

      // 1) Pegar a empresa principal do usuário
      const { data: userCompany, error: ucError } = await coreSupabase
        .from('user_companies')
        .select('company_id, is_primary')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .limit(1)
        .single();

      if (ucError || !userCompany?.company_id) return null;

      // 2) Carregar dados da empresa
      const { data: company, error: companyError } = await coreSupabase
        .from('companies')
        .select('id, razao_social, nome_fantasia, cnpj, is_active')
        .eq('id', userCompany.company_id)
        .single();

      if (companyError || !company) return null;

      return {
        id: company.id,
        name: company.nome_fantasia || company.razao_social,
        cnpj: company.cnpj,
        status: company.is_active ? 'active' : 'inactive',
        is_active: company.is_active || false,
        razao_social: company.razao_social,
        nome_fantasia: company.nome_fantasia,
      };
    },
    enabled: !!user?.id,
    retry: 2,
    retryDelay: 1000,
  });
}
