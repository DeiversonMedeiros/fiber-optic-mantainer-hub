import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { notificationService, TimeReminder } from '@/services/notificationService';

interface TimeReminderSettings {
  enabled: boolean;
  entrada_reminder: boolean;
  saida_reminder: boolean;
  intervalo_reminder: boolean;
  entrada_time: string;
  saida_time: string;
  intervalo_inicio_time: string;
  intervalo_fim_time: string;
  custom_message: string;
}

const defaultSettings: TimeReminderSettings = {
  enabled: true,
  entrada_reminder: true,
  saida_reminder: true,
  intervalo_reminder: true,
  entrada_time: '08:00',
  saida_time: '17:00',
  intervalo_inicio_time: '12:00',
  intervalo_fim_time: '13:00',
  custom_message: ''
};

export const useTimeReminders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // Buscar configurações de lembrete do usuário (usando localStorage por enquanto)
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['time-reminder-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return defaultSettings;
      
      try {
        // Tentar buscar do banco primeiro
        const { data, error } = await rhSupabase
          .from('core.user_settings')
          .select('time_reminder_settings')
          .eq('user_id', user.id)
          .eq('setting_type', 'time_reminders')
          .maybeSingle();
        
        if (error) {
          console.warn('Erro ao buscar configurações do banco, usando localStorage:', error);
          // Fallback para localStorage
          const localData = localStorage.getItem(`time_reminder_settings_${user.id}`);
          return localData ? JSON.parse(localData) : defaultSettings;
        }
        
        return data?.time_reminder_settings || defaultSettings;
      } catch (error) {
        console.warn('Erro ao buscar configurações, usando localStorage:', error);
        // Fallback para localStorage
        const localData = localStorage.getItem(`time_reminder_settings_${user.id}`);
        return localData ? JSON.parse(localData) : defaultSettings;
      }
    },
    enabled: !!user?.id
  });

  // Buscar escala de trabalho do funcionário
  const { data: workSchedule } = useQuery({
    queryKey: ['work-shift', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      try {
        // Primeiro tentar buscar através de employee_shifts
        const { data: employeeShift, error: employeeShiftError } = await rhSupabase
          .from('rh.employee_shifts')
          .select(`
            *,
            shift:work_shifts(*)
          `)
          .eq('employee_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (employeeShiftError) {
          console.warn('Erro ao buscar employee_shifts, tentando fallback:', employeeShiftError);
          // Fallback: buscar diretamente work_shifts (escala padrão da empresa)
          const { data: defaultShift, error: defaultShiftError } = await rhSupabase
            .from('rh.work_shifts')
            .select('*')
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
          
          if (defaultShiftError) throw defaultShiftError;
          return defaultShift;
        }
        
        return employeeShift?.shift || null;
      } catch (error) {
        console.warn('Erro ao buscar escala de trabalho:', error);
        return null;
      }
    },
    enabled: !!user?.id
  });

  // Mutation para salvar configurações
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: TimeReminderSettings) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      try {
        // Tentar salvar no banco primeiro
        const { error } = await rhSupabase
          .from('core.user_settings')
          .upsert({
            user_id: user.id,
            setting_type: 'time_reminders',
            time_reminder_settings: newSettings,
            updated_at: new Date().toISOString()
          });
        
        if (error) {
          console.warn('Erro ao salvar no banco, usando localStorage:', error);
          // Fallback para localStorage
          localStorage.setItem(`time_reminder_settings_${user.id}`, JSON.stringify(newSettings));
        }
      } catch (error) {
        console.warn('Erro ao salvar configurações, usando localStorage:', error);
        // Fallback para localStorage
        localStorage.setItem(`time_reminder_settings_${user.id}`, JSON.stringify(newSettings));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-reminder-settings'] });
    }
  });

  // Inicializar serviço de notificações
  useEffect(() => {
    const initializeNotifications = async () => {
      await notificationService.initialize();
      setIsInitialized(true);
    };

    initializeNotifications();
  }, []);

  // Gerar lembretes baseados nas configurações
  const generateReminders = useCallback((): TimeReminder[] => {
    if (!user?.id || !settings) return [];

    const reminders: TimeReminder[] = [];

    // Usar escala de trabalho se disponível, senão usar configurações
    const schedule = workSchedule || {
      hora_inicio: settings.entrada_time,
      hora_fim: settings.saida_time,
      hora_intervalo_inicio: settings.intervalo_inicio_time,
      hora_intervalo_fim: settings.intervalo_fim_time
    };

    // Lembrete de entrada
    if (settings.entrada_reminder && schedule.hora_inicio) {
      const startTime = new Date(`2000-01-01T${schedule.hora_inicio}`);
      startTime.setMinutes(startTime.getMinutes() - 5); // 5 min antes
      
      reminders.push({
        id: `${user.id}-entrada`,
        employee_id: user.id,
        type: 'entrada',
        time: startTime.toTimeString().slice(0, 5),
        enabled: settings.enabled,
        message: settings.custom_message || 'Não esqueça de registrar sua entrada!',
        days_of_week: [1, 2, 3, 4, 5] // Segunda a sexta
      });
    }

    // Lembrete de saída
    if (settings.saida_reminder && schedule.hora_fim) {
      reminders.push({
        id: `${user.id}-saida`,
        employee_id: user.id,
        type: 'saida',
        time: schedule.hora_fim.slice(0, 5),
        enabled: settings.enabled,
        message: settings.custom_message || 'Hora de registrar sua saída!',
        days_of_week: [1, 2, 3, 4, 5]
      });
    }

    // Lembrete de intervalo início
    if (settings.intervalo_reminder && schedule.hora_intervalo_inicio) {
      reminders.push({
        id: `${user.id}-intervalo-inicio`,
        employee_id: user.id,
        type: 'intervalo_inicio',
        time: schedule.hora_intervalo_inicio.slice(0, 5),
        enabled: settings.enabled,
        message: settings.custom_message || 'Hora do intervalo - registre o início!',
        days_of_week: [1, 2, 3, 4, 5]
      });
    }

    // Lembrete de intervalo fim
    if (settings.intervalo_reminder && schedule.hora_intervalo_fim) {
      reminders.push({
        id: `${user.id}-intervalo-fim`,
        employee_id: user.id,
        type: 'intervalo_fim',
        time: schedule.hora_intervalo_fim.slice(0, 5),
        enabled: settings.enabled,
        message: settings.custom_message || 'Fim do intervalo - registre o retorno!',
        days_of_week: [1, 2, 3, 4, 5]
      });
    }

    return reminders;
  }, [user?.id, settings, workSchedule]);

  // Agendar lembretes
  useEffect(() => {
    if (!isInitialized || !settings?.enabled) {
      notificationService.clearScheduledReminders();
      return;
    }

    const reminders = generateReminders();
    notificationService.scheduleReminders(reminders);

    return () => {
      notificationService.clearScheduledReminders();
    };
  }, [isInitialized, settings, generateReminders]);

  // Função para salvar configurações
  const saveSettings = useCallback(async (newSettings: TimeReminderSettings) => {
    await saveSettingsMutation.mutateAsync(newSettings);
  }, [saveSettingsMutation]);

  // Função para solicitar permissão
  const requestPermission = useCallback(async (): Promise<boolean> => {
    return await notificationService.requestPermission();
  }, []);

  // Função para testar notificação
  const testNotification = useCallback(async () => {
    if (!notificationService.canNotify()) {
      const granted = await notificationService.requestPermission();
      if (!granted) return false;
    }

    await notificationService.showNotification(
      '🧪 Teste de Notificação',
      {
        body: 'Se você está vendo esta mensagem, as notificações estão funcionando!',
        tag: 'test-notification'
      }
    );
    
    return true;
  }, []);

  return {
    settings: settings || defaultSettings,
    isLoading: settingsLoading,
    isInitialized,
    permission: notificationService.getPermissionStatus(),
    canNotify: notificationService.canNotify(),
    saveSettings,
    requestPermission,
    testNotification,
    workSchedule
  };
};
