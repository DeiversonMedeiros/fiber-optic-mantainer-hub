import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PendingCounts {
  adjustments: number;
  preventivas: number;
  vistoria: number;
}

export const usePendingCounts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pending-counts', user?.id],
    queryFn: async (): Promise<PendingCounts> => {
      if (!user?.id) {
        return { adjustments: 0, preventivas: 0, vistoria: 0 };
      }

      // Buscar adequações pendentes (relatórios com status 'em_adequacao' atribuídos ao usuário)
      const { count: adjustmentsCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'em_adequacao')
        .eq('assigned_to', user.id);

      // Buscar preventivas pendentes (inspection_reports com status 'pendente' atribuídos ao usuário)
      const { count: preventivasCount } = await supabase
        .from('inspection_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente')
        .eq('assigned_to', user.id);

      // Buscar vistorias pendentes (preventive_schedule não concluídas atribuídas ao usuário)
      const { count: vistoriaCount } = await supabase
        .from('preventive_schedule')
        .select('*', { count: 'exact', head: true })
        .eq('is_completed', false)
        .eq('inspector_id', user.id);

      return {
        adjustments: adjustmentsCount || 0,
        preventivas: preventivasCount || 0,
        vistoria: vistoriaCount || 0,
      };
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch a cada 30 segundos
  });
}; 