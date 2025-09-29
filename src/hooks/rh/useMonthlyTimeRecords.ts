import { useQuery } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';

export interface TimeRecord {
  id: string;
  company_id: string;
  employee_id: string;
  data: string;
  hora_entrada: string | null;
  hora_saida: string | null;
  intervalo_inicio: string | null;
  intervalo_fim: string | null;
  tipo: string | null;
  justificativa: string | null;
  aprovado_por: string | null;
  created_at: string;
  hora_adicional_inicio: string | null;
  hora_adicional_fim: string | null;
}

export interface DelayReason {
  id: string;
  codigo: string;
  descricao: string;
  categoria: string;
  is_active: boolean;
  requires_justification: boolean;
  requires_medical_certificate: boolean;
}

export function useMonthlyTimeRecords(year: number, month: number) {
  const { user } = useAuth();
  const { data: company } = useCompany();

  // Buscar registros do mês
  const { data: timeRecords = [], isLoading: recordsLoading, error: recordsError } = useQuery({
    queryKey: ['monthly-time-records', user?.id, year, month],
    queryFn: async () => {
      if (!user?.id || !company?.id) return [];

      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data, error } = await rhSupabase
        .from('time_records')
        .select('*')
        .eq('employee_id', user.id)
        .eq('company_id', company.id)
        .gte('data', startDate)
        .lte('data', endDate)
        .order('data', { ascending: true });

      if (error) throw error;
      return data as TimeRecord[];
    },
    enabled: !!user?.id && !!company?.id
  });

  // Buscar motivos de atraso/justificativas
  const { data: delayReasons = [], isLoading: reasonsLoading } = useQuery({
    queryKey: ['delay-reasons', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];

      const { data, error } = await rhSupabase
        .from('rh.delay_reasons')
        .select('*')
        .eq('company_id', company.id)
        .eq('is_active', true)
        .order('categoria', { ascending: true })
        .order('codigo', { ascending: true });

      if (error) throw error;
      return data as DelayReason[];
    },
    enabled: !!company?.id
  });

  // Criar mapa de registros por data
  const recordsByDate = timeRecords.reduce((acc, record) => {
    acc[record.data] = record;
    return acc;
  }, {} as Record<string, TimeRecord>);

  return {
    timeRecords,
    recordsByDate,
    delayReasons,
    isLoading: recordsLoading || reasonsLoading,
    error: recordsError
  };
}
