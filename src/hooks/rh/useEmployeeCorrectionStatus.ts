import { useQuery } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';

export function useEmployeeCorrectionStatus(year?: number, month?: number) {
  const { user } = useAuth();
  const { data: company } = useCompany();

  // Usar ano e mês fornecidos ou mês atual como fallback
  const targetYear = year ?? new Date().getFullYear();
  const targetMonth = month ?? new Date().getMonth() + 1;

  // Verificar se a correção está liberada para o mês especificado
  const { data: correctionEnabled = false, isLoading, error } = useQuery({
    queryKey: ['employee-correction-status', company?.id, targetYear, targetMonth],
    queryFn: async () => {
      if (!company?.id) return false;

      const { data, error } = await rhSupabase.rpc('get_correction_status', {
        company_uuid: company.id,
        target_year: targetYear,
        target_month: targetMonth
      });

      if (error) throw error;
      return data as boolean;
    },
    enabled: !!company?.id,
    refetchInterval: 5 * 60 * 1000, // Refetch a cada 5 minutos
  });

  return {
    correctionEnabled,
    isLoading,
    error
  };
}
