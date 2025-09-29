import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { coreSupabase } from '@/integrations/supabase/client';
import { ConveniosEmpresasManagement } from '@/components/rh';

export default function ConveniosPage() {
  const { user } = useAuth();

  const { data: userCompany, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['userCompany', user?.id],
    queryFn: async () => {
      const { data, error } = await coreSupabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  if (isLoadingCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!userCompany?.company_id) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive">Usuário não associado a nenhuma empresa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <ConveniosEmpresasManagement companyId={userCompany.company_id} />
    </div>
  );
}
