import { useQuery } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';

export function useBeneficioElegibilidadeDepartamentos(elegibilidadeId: string) {
  const {
    data: departamentos = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['beneficioElegibilidadeDepartamentos', elegibilidadeId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('beneficio_elegibilidade_departamentos')
        .select(`
          id,
          department_id,
          departments (
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
    departamentos,
    isLoading,
    error,
  };
}
