import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';

export interface AttendanceCorrection {
  id: string;
  company_id: string;
  employee_id: string;
  time_record_id?: string;
  data_original: string;
  hora_entrada_original?: string;
  hora_saida_original?: string;
  hora_entrada_corrigida?: string;
  hora_saida_corrigida?: string;
  justificativa: string;
  status: 'pendente' | 'aprovado' | 'reprovado';
  horario_correcao?: string;
  aprovado_por?: string;
  data_aprovacao?: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface AttendanceCorrectionWithEmployee extends AttendanceCorrection {
  employee_name: string;
  employee_first_name?: string;
  employee_last_name?: string;
}

export function useAttendanceCorrections(companyId: string, status?: 'pendente' | 'aprovado' | 'reprovado') {
  return useQuery({
    queryKey: ['attendance-corrections', companyId, status],
    queryFn: async (): Promise<AttendanceCorrectionWithEmployee[]> => {
      let query = rhSupabase
        .from('rh.attendance_corrections')
        .select(`
          *,
          employees:employee_id (
            nome
          )
        `)
        .eq('company_id', companyId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar correções:', error);
        throw error;
      }

      return data?.map(correction => ({
        ...correction,
        employee_name: correction.employees?.nome || 'Funcionário não encontrado',
        employee_first_name: correction.employees?.nome?.split(' ')[0] || '',
        employee_last_name: correction.employees?.nome?.split(' ').slice(1).join(' ') || '',
        horario_correcao: correction.horario_correcao || correction.created_at
      })) || [];
    },
    enabled: !!companyId
  });
}

export function usePendingAttendanceCorrections(companyId: string) {
  return useAttendanceCorrections(companyId, 'pendente');
}

export function useAttendanceCorrectionApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      correctionId,
      status,
      approvedBy,
      rejectionReason
    }: {
      correctionId: string;
      status: 'aprovado' | 'reprovado';
      approvedBy: string;
      rejectionReason?: string;
    }) => {
      const updateData: any = {
        status,
        aprovado_por: approvedBy,
        data_aprovacao: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: approvedBy
      };

      if (status === 'reprovado' && rejectionReason) {
        updateData.justificativa = rejectionReason;
      }

      const { data, error } = await rhSupabase
        .from('rh.attendance_corrections')
        .update(updateData)
        .eq('id', correctionId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao aprovar/rejeitar correção:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['attendance-corrections'] });
      
      // Se aprovado, também invalidar queries de registros de ponto
      if (data.status === 'aprovado') {
        queryClient.invalidateQueries({ queryKey: ['time-records'] });
      }
    }
  });
}

export function useCreateAttendanceCorrection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      companyId,
      employeeId,
      timeRecordId,
      dataOriginal,
      horaEntradaOriginal,
      horaSaidaOriginal,
      horaEntradaCorrigida,
      horaSaidaCorrigida,
      justificativa,
      createdBy
    }: {
      companyId: string;
      employeeId: string;
      timeRecordId?: string;
      dataOriginal: string;
      horaEntradaOriginal?: string;
      horaSaidaOriginal?: string;
      horaEntradaCorrigida?: string;
      horaSaidaCorrigida?: string;
      justificativa: string;
      createdBy: string;
    }) => {
      const { data, error } = await rhSupabase
        .from('rh.attendance_corrections')
        .insert([{
          company_id: companyId,
          employee_id: employeeId,
          time_record_id: timeRecordId,
          data_original: dataOriginal,
          hora_entrada_original: horaEntradaOriginal,
          hora_saida_original: horaSaidaOriginal,
          hora_entrada_corrigida: horaEntradaCorrigida,
          hora_saida_corrigida: horaSaidaCorrigida,
          justificativa,
          status: 'pendente',
          horario_correcao: new Date().toISOString(),
          created_by: createdBy,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar correção:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      // Invalidar queries de correções
      queryClient.invalidateQueries({ queryKey: ['attendance-corrections'] });
    }
  });
}

export function useAttendanceCorrectionStats(companyId: string) {
  return useQuery({
    queryKey: ['attendance-correction-stats', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('rh.attendance_corrections')
        .select('status')
        .eq('company_id', companyId);

      if (error) {
        console.error('Erro ao carregar estatísticas:', error);
        throw error;
      }

      const stats = data?.reduce((acc, correction) => {
        acc[correction.status] = (acc[correction.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        pending: stats.pendente || 0,
        approved: stats.aprovado || 0,
        rejected: stats.reprovado || 0,
        total: data?.length || 0
      };
    },
    enabled: !!companyId
  });
}
