import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CorrectionControl {
  id: string;
  company_id: string;
  year: number;
  month: number;
  correction_enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface SetCorrectionStatusParams {
  companyId: string;
  year: number;
  month: number;
  enabled: boolean;
}

export function useTimeRecordCorrectionControl(companyId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar status de correção para todos os meses de um ano
  const { data: correctionStatuses = [], isLoading, error } = useQuery({
    queryKey: ['time-record-correction-control', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('rh.time_record_correction_control')
        .select('*')
        .eq('company_id', companyId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      return data as CorrectionControl[];
    },
    enabled: !!companyId
  });

  // Buscar status de correção para um mês específico
  const getCorrectionStatus = (year: number, month: number): boolean => {
    const status = correctionStatuses.find(
      s => s.year === year && s.month === month
    );
    return status?.correction_enabled ?? false;
  };

  // Mutation para definir status de correção
  const setCorrectionStatus = useMutation({
    mutationFn: async ({ companyId, year, month, enabled }: SetCorrectionStatusParams) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await rhSupabase.rpc('set_correction_status', {
        company_uuid: companyId,
        target_year: year,
        target_month: month,
        enabled: enabled,
        user_uuid: user.id
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['time-record-correction-control', companyId] 
      });
    }
  });

  // Buscar status de correção usando RPC
  const checkCorrectionStatus = useQuery({
    queryKey: ['correction-status', companyId],
    queryFn: async (year: number, month: number) => {
      const { data, error } = await rhSupabase.rpc('get_correction_status', {
        company_uuid: companyId,
        target_year: year,
        target_month: month
      });

      if (error) throw error;
      return data as boolean;
    },
    enabled: false // Só executa quando chamado manualmente
  });

  return {
    correctionStatuses,
    isLoading,
    error,
    getCorrectionStatus,
    setCorrectionStatus,
    checkCorrectionStatus
  };
}
