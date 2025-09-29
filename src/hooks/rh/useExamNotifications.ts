import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExamNotification {
  id: string;
  employeeId: string;
  employeeName: string;
  examType: string;
  scheduledDate: string;
  daysUntilExpiry: number;
  isOverdue: boolean;
  notificationSent: boolean;
}

interface NotificationConfig {
  daysBeforeNotification: number;
  companyId: string;
}

export const useExamNotifications = () => {
  const queryClient = useQueryClient();

  // Query para buscar exames que precisam de notificação
  const getExamsNeedingNotification = useQuery({
    queryKey: ['periodic-exams', 'notifications', 'pending'],
    queryFn: async (): Promise<ExamNotification[]> => {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const thirtyDaysFromNowStr = thirtyDaysFromNow.toISOString().split('T')[0];

      const { data: exams, error } = await supabase.rpc('get_rh_periodic_exams', {
        p_status: 'agendado'
      });

      if (error) throw error;

      const notifications: ExamNotification[] = (exams || []).map((exam: any) => {
        const scheduledDate = new Date(exam.data_agendada);
        const todayDate = new Date();
        const daysUntilExpiry = Math.ceil((scheduledDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: exam.id,
          employeeId: exam.employee_id,
          employeeName: exam.employee?.nome || 'Nome não encontrado',
          examType: exam.tipo_exame,
          scheduledDate: exam.data_agendada,
          daysUntilExpiry,
          isOverdue: daysUntilExpiry < 0,
          notificationSent: false // Por enquanto, sempre false. Pode ser expandido para incluir histórico de notificações
        };
      });

      return notifications;
    },
  });

  // Query para buscar exames vencidos
  const getOverdueExams = useQuery({
    queryKey: ['periodic-exams', 'notifications', 'overdue'],
    queryFn: async (): Promise<ExamNotification[]> => {
      const today = new Date().toISOString().split('T')[0];

      const { data: exams, error } = await supabase.rpc('get_rh_periodic_exams', {
        p_status: 'agendado'
      });

      if (error) throw error;

      const notifications: ExamNotification[] = (exams || []).map((exam: any) => {
        const scheduledDate = new Date(exam.data_agendada);
        const todayDate = new Date();
        const daysUntilExpiry = Math.ceil((scheduledDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: exam.id,
          employeeId: exam.employee_id,
          employeeName: exam.employee?.nome || 'Nome não encontrado',
          examType: exam.tipo_exame,
          scheduledDate: exam.data_agendada,
          daysUntilExpiry,
          isOverdue: true,
          notificationSent: false
        };
      });

      return notifications;
    },
  });

  // Query para buscar estatísticas de notificações
  const getNotificationStats = useQuery({
    queryKey: ['periodic-exams', 'notifications', 'stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const thirtyDaysFromNowStr = thirtyDaysFromNow.toISOString().split('T')[0];

      // Exames próximos do vencimento (dentro de 30 dias)
      const { data: upcomingExams, error: upcomingError } = await (supabase as any)
        .from('rh.periodic_exams')
        .select('id, data_agendada')
        .eq('status', 'agendado')
        .gte('data_agendada', today)
        .lte('data_agendada', thirtyDaysFromNowStr);

      if (upcomingError) throw upcomingError;

      // Exames vencidos
      const { data: overdueExams, error: overdueError } = await (supabase as any)
        .from('rh.periodic_exams')
        .select('id, data_agendada')
        .eq('status', 'agendado')
        .lt('data_agendada', today);

      if (overdueError) throw overdueError;

      return {
        upcomingCount: upcomingExams?.length || 0,
        overdueCount: overdueExams?.length || 0,
        totalNotifications: (upcomingExams?.length || 0) + (overdueExams?.length || 0)
      };
    },
  });

  // Mutation para marcar notificação como enviada
  const markNotificationSent = useMutation({
    mutationFn: async (examId: string) => {
      // Aqui você pode implementar a lógica para marcar a notificação como enviada
      // Por exemplo, criando um registro em uma tabela de notificações
      // Por enquanto, apenas retornamos sucesso
      return { success: true, examId };
    },
    onSuccess: (data, examId) => {
      toast.success('Notificação marcada como enviada');
      queryClient.invalidateQueries({ queryKey: ['periodic-exams', 'notifications'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao marcar notificação: ${error.message}`);
    }
  });

  // Função para enviar notificação (placeholder - pode ser expandida)
  const sendNotification = async (notification: ExamNotification, type: 'email' | 'sms' | 'system') => {
    // Aqui você pode implementar a lógica real de envio de notificações
    // Por exemplo, integração com serviços de email, SMS, ou notificações do sistema
    
    const message = notification.isOverdue 
      ? `Exame ${notification.examType} do funcionário ${notification.notificationName} está vencido desde ${notification.scheduledDate}`
      : `Exame ${notification.examType} do funcionário ${notification.notificationName} vence em ${notification.daysUntilExpiry} dias (${notification.scheduledDate})`;

    console.log(`Enviando notificação ${type}:`, message);
    
    // Marcar como enviada
    await markNotificationSent.mutateAsync(notification.id);
    
    return { success: true, message };
  };

  // Função para reagendar exame vencido
  const rescheduleOverdueExam = useMutation({
    mutationFn: async ({ 
      examId, 
      newDate, 
      reason 
    }: { 
      examId: string; 
      newDate: string; 
      reason?: string; 
    }) => {
      const { data, error } = await supabase.rpc('update_rh_periodic_exam', {
        p_exam_id: examId,
        p_data_agendada: newDate,
        p_status: 'agendado'
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Exame reagendado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['periodic-exams'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao reagendar exame: ${error.message}`);
    }
  });

  return {
    getExamsNeedingNotification,
    getOverdueExams,
    getNotificationStats,
    markNotificationSent,
    sendNotification,
    rescheduleOverdueExam
  };
};
