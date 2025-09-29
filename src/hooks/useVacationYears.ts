import { useQuery } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { VacationYear } from '@/integrations/supabase/rh-types';

export const useVacationYears = (employeeId: string) => {
  return useQuery({
    queryKey: ['vacation-years', employeeId],
    queryFn: async (): Promise<VacationYear[]> => {
      if (!employeeId) return [];
      
      const { data, error } = await rhSupabase
        .rpc('buscar_anos_ferias_disponiveis', {
          employee_id_param: employeeId
        });

      if (error) {
        console.error('Erro ao buscar anos de férias disponíveis:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!employeeId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

















