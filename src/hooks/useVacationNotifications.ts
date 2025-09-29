import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Tipos para as notificações de férias
export interface VacationNotification {
  id: string;
  company_id: string | null;
  employee_id: string;
  notification_type: 'ferias_disponivel' | 'ferias_vencendo' | 'ferias_vencida' | 'ferias_aprovada' | 'system_log';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date: string | null;
  days_remaining: number | null;
  is_read: boolean;
  is_active: boolean;
  created_at: string;
  read_at: string | null;
  expires_at: string | null;
}

export interface VacationStatus {
  ultima_feria: string | null;
  dias_sem_ferias: number;
  data_vencimento: string | null;
  status_ferias: 'vencida' | 'vencendo' | 'atencao' | 'ok' | 'inativo';
  dias_restantes: number;
  nivel_criticidade: 'low' | 'medium' | 'high' | 'critical';
}

export interface VacationRights {
  tem_direito: boolean;
  dias_trabalhados: number;
  data_direito: string | null;
  dias_restantes: number;
}

// Hook para buscar notificações de férias de um funcionário
export function useVacationNotifications(employeeId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['vacation-notifications', employeeId || user?.id],
    queryFn: async (): Promise<VacationNotification[]> => {
      const targetEmployeeId = employeeId || user?.id;
      if (!targetEmployeeId) return [];

      const { data, error } = await rhSupabase
        .rpc('buscar_notificacoes_ferias', {
          employee_id_param: targetEmployeeId,
          include_inactive: false
        });

      if (error) {
        console.error('Erro ao buscar notificações:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!(employeeId || user?.id),
    refetchInterval: 30000, // Refetch a cada 30 segundos
  });
}

// Hook para contar notificações não lidas
export function useVacationNotificationsCount(employeeId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['vacation-notifications-count', employeeId || user?.id],
    queryFn: async (): Promise<number> => {
      const targetEmployeeId = employeeId || user?.id;
      if (!targetEmployeeId) return 0;

      const { data, error } = await rhSupabase
        .from('rh.vacation_notifications')
        .select('id')
        .eq('employee_id', targetEmployeeId)
        .eq('is_active', true)
        .eq('is_read', false);

      if (error) {
        console.error('Erro ao contar notificações:', error);
        return 0;
      }

      return data?.length || 0;
    },
    enabled: !!(employeeId || user?.id),
    refetchInterval: 30000,
  });
}

// Hook para marcar notificação como lida
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (notificationId: string): Promise<boolean> => {
      const { data, error } = await rhSupabase
        .rpc('marcar_notificacao_lida', {
          notification_id_param: notificationId
        });

      if (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        throw error;
      }

      return data || false;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['vacation-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['vacation-notifications-count'] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível marcar a notificação como lida.",
        variant: "destructive",
      });
    }
  });
}

// Hook para buscar status de férias de um funcionário
export function useVacationStatus(employeeId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['vacation-status', employeeId || user?.id],
    queryFn: async (): Promise<VacationStatus | null> => {
      const targetEmployeeId = employeeId || user?.id;
      if (!targetEmployeeId) return null;

      const { data, error } = await rhSupabase
        .rpc('calcular_status_ferias', {
          employee_id_param: targetEmployeeId
        });

      if (error) {
        console.error('Erro ao buscar status de férias:', error);
        return null;
      }

      return data?.[0] || null;
    },
    enabled: !!(employeeId || user?.id),
    refetchInterval: 60000, // Refetch a cada 1 minuto
  });
}

// Hook para buscar direito a férias de um funcionário
export function useVacationRights(employeeId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['vacation-rights', employeeId || user?.id],
    queryFn: async (): Promise<VacationRights | null> => {
      const targetEmployeeId = employeeId || user?.id;
      if (!targetEmployeeId) return null;

      const { data, error } = await rhSupabase
        .rpc('calcular_direito_ferias', {
          employee_id_param: targetEmployeeId
        });

      if (error) {
        console.error('Erro ao buscar direito a férias:', error);
        return null;
      }

      return data?.[0] || null;
    },
    enabled: !!(employeeId || user?.id),
    refetchInterval: 60000,
  });
}

// Hook para gerar notificações manualmente (para RH)
export function useGenerateVacationNotifications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (employeeId?: string): Promise<number> => {
      const { data, error } = await rhSupabase
        .rpc('gerar_notificacoes_ferias', {
          employee_id_param: employeeId || null
        });

      if (error) {
        console.error('Erro ao gerar notificações:', error);
        throw error;
      }

      return data || 0;
    },
    onSuccess: (notificationsCreated) => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['vacation-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['vacation-notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['vacation-status'] });
      queryClient.invalidateQueries({ queryKey: ['vacation-rights'] });
      queryClient.invalidateQueries({ queryKey: ['vacation-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['vacation-dashboard'] });

      toast({
        title: "Notificações geradas",
        description: `${notificationsCreated} notificações foram criadas.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível gerar as notificações.",
        variant: "destructive",
      });
    }
  });
}

// Hook para marcar múltiplas notificações como lidas
export function useMarkMultipleNotificationsAsRead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (notificationIds: string[]): Promise<void> => {
      const { error } = await rhSupabase
        .from('rh.vacation_notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .in('id', notificationIds);

      if (error) {
        console.error('Erro ao marcar notificações como lidas:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacation-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['vacation-notifications-count'] });
      
      toast({
        title: "Sucesso",
        description: "Notificações marcadas como lidas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível marcar as notificações como lidas.",
        variant: "destructive",
      });
    }
  });
}
