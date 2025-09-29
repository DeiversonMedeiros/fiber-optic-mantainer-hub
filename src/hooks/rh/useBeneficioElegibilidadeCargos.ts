import { useQuery } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';

export function useBeneficioElegibilidadeCargos(elegibilidadeId: string) {
  const {
    data: cargos = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['beneficioElegibilidadeCargos', elegibilidadeId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('beneficio_elegibilidade_cargos')
        .select(`
          id,
          position_id,
          positions (
            nome
          )
        `)
        .eq('elegibilidade_id', elegibilidadeId);

      if (error) throw error;
      return data as any[];
    },
    enabled: !!elegibilidadeId,
  });

  return {
    cargos,
    isLoading,
    error,
  };
}
