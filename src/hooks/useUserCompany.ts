import { useQuery } from '@tanstack/react-query';
import { coreSupabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useUserCompany() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-company', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Buscar informações do usuário diretamente da tabela users
      const { data: userProfile, error: profileError } = await coreSupabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Erro ao buscar perfil do usuário:', profileError);
        throw profileError;
      }
      
      if (!userProfile?.company_id) {
        throw new Error('Usuário não está associado a uma empresa');
      }
      
      const { data: companyData, error: companyError } = await coreSupabase
        .from('companies')
        .select('id, razao_social, nome_fantasia, cnpj, is_active')
        .eq('id', userProfile.company_id)
        .single();
      
      if (companyError) throw companyError;
      
      return companyData;
    },
    enabled: !!user?.id,
  });
}


