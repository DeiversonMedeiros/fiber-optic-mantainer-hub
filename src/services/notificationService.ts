interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

interface TimeReminder {
  id: string;
  employee_id: string;
  type: 'entrada' | 'saida' | 'intervalo_inicio' | 'intervalo_fim';
  time: string; // HH:MM format
  enabled: boolean;
  message: string;
  days_of_week: number[]; // 0-6 (domingo-sábado)
}

class NotificationService {
  private permission: NotificationPermission = {
    granted: false,
    denied: false,
    default: false
  };

  async initialize(): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações');
      return;
    }

    // Verificar permissão atual
    this.updatePermissionStatus();

    // Solicitar permissão se não foi concedida
    if (Notification.permission === 'default') {
      await this.requestPermission();
    }
  }

  private updatePermissionStatus(): void {
    if (!('Notification' in window)) return;

    this.permission = {
      granted: Notification.permission === 'granted',
      denied: Notification.permission === 'denied',
      default: Notification.permission === 'default'
    };
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;

    try {
      const permission = await Notification.requestPermission();
      this.updatePermissionStatus();
      return permission === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificação:', error);
      return false;
    }
  }

  getPermissionStatus(): NotificationPermission {
    return { ...this.permission };
  }

  canNotify(): boolean {
    return this.permission.granted && 'Notification' in window;
  }

  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!this.canNotify()) {
      console.warn('Notificações não estão disponíveis ou permitidas');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: 'ponto-reminder', // Evita múltiplas notificações
        requireInteraction: true, // Mantém a notificação visível
        silent: false,
        ...options
      });

      // Auto-fechar após 10 segundos
      setTimeout(() => {
        notification.close();
      }, 10000);

      // Fechar ao clicar
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

    } catch (error) {
      console.error('Erro ao exibir notificação:', error);
    }
  }

  async showTimeReminder(reminder: TimeReminder): Promise<void> {
    if (!reminder.enabled) return;

    const title = '⏰ Lembrete de Ponto';
    const body = reminder.message || this.getDefaultReminderMessage(reminder.type);
    
    await this.showNotification(title, {
      body,
      tag: `ponto-${reminder.type}-${reminder.id}`,
      data: {
        type: 'time_reminder',
        reminder_id: reminder.id,
        action: reminder.type
      }
    });
  }

  private getDefaultReminderMessage(type: string): string {
    switch (type) {
      case 'entrada':
        return 'Não esqueça de registrar sua entrada!';
      case 'saida':
        return 'Hora de registrar sua saída!';
      case 'intervalo_inicio':
        return 'Hora do intervalo - registre o início!';
      case 'intervalo_fim':
        return 'Fim do intervalo - registre o retorno!';
      default:
        return 'Lembrete de registro de ponto';
    }
  }

  // Verificar se é um dia útil
  isWorkDay(date: Date = new Date()): boolean {
    const dayOfWeek = date.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Segunda a sexta
  }

  // Verificar se é hora de enviar lembrete
  shouldSendReminder(reminder: TimeReminder, currentTime: Date = new Date()): boolean {
    if (!reminder.enabled) return false;

    // Verificar dia da semana
    const currentDay = currentTime.getDay();
    if (!reminder.days_of_week.includes(currentDay)) return false;

    // Verificar horário
    const currentTimeStr = currentTime.toTimeString().slice(0, 5); // HH:MM
    const reminderTime = reminder.time;

    // Considerar uma janela de 5 minutos antes do horário
    const [currentHour, currentMinute] = currentTimeStr.split(':').map(Number);
    const [reminderHour, reminderMinute] = reminderTime.split(':').map(Number);

    const currentMinutes = currentHour * 60 + currentMinute;
    const reminderMinutes = reminderHour * 60 + reminderMinute;
    const windowMinutes = 5; // 5 minutos de janela

    return currentMinutes >= (reminderMinutes - windowMinutes) && 
           currentMinutes <= reminderMinutes;
  }

  // Agendar lembretes baseados no horário de trabalho
  scheduleReminders(reminders: TimeReminder[]): void {
    // Limpar agendamentos anteriores
    this.clearScheduledReminders();

    // Verificar lembretes a cada minuto
    const interval = setInterval(() => {
      const now = new Date();
      
      for (const reminder of reminders) {
        if (this.shouldSendReminder(reminder, now)) {
          this.showTimeReminder(reminder);
        }
      }
    }, 60000); // Verificar a cada minuto

    // Armazenar o interval para poder cancelar depois
    (this as any).reminderInterval = interval;
  }

  clearScheduledReminders(): void {
    if ((this as any).reminderInterval) {
      clearInterval((this as any).reminderInterval);
      (this as any).reminderInterval = null;
    }
  }

  // Método para criar lembretes padrão baseados na escala de trabalho
  createDefaultReminders(employeeId: string, workShift: any): TimeReminder[] {
    const reminders: TimeReminder[] = [];

    if (!workShift) return reminders;

    // Lembrete de entrada (5 min antes) - usar hora_inicio da work_shifts
    if (workShift.hora_inicio) {
      const startTime = new Date(`2000-01-01T${workShift.hora_inicio}`);
      startTime.setMinutes(startTime.getMinutes() - 5);
      
      reminders.push({
        id: `${employeeId}-entrada`,
        employee_id: employeeId,
        type: 'entrada',
        time: startTime.toTimeString().slice(0, 5),
        enabled: true,
        message: 'Não esqueça de registrar sua entrada!',
        days_of_week: [1, 2, 3, 4, 5] // Segunda a sexta
      });
    }

    // Lembrete de saída - usar hora_fim da work_shifts
    if (workShift.hora_fim) {
      reminders.push({
        id: `${employeeId}-saida`,
        employee_id: employeeId,
        type: 'saida',
        time: workShift.hora_fim.slice(0, 5),
        enabled: true,
        message: 'Hora de registrar sua saída!',
        days_of_week: [1, 2, 3, 4, 5]
      });
    }

    // Lembrete de intervalo início - usar hora_intervalo_inicio se existir
    if (workShift.hora_intervalo_inicio) {
      reminders.push({
        id: `${employeeId}-intervalo-inicio`,
        employee_id: employeeId,
        type: 'intervalo_inicio',
        time: workShift.hora_intervalo_inicio.slice(0, 5),
        enabled: true,
        message: 'Hora do intervalo - registre o início!',
        days_of_week: [1, 2, 3, 4, 5]
      });
    }

    // Lembrete de intervalo fim - usar hora_intervalo_fim se existir
    if (workShift.hora_intervalo_fim) {
      reminders.push({
        id: `${employeeId}-intervalo-fim`,
        employee_id: employeeId,
        type: 'intervalo_fim',
        time: workShift.hora_intervalo_fim.slice(0, 5),
        enabled: true,
        message: 'Fim do intervalo - registre o retorno!',
        days_of_week: [1, 2, 3, 4, 5]
      });
    }

    return reminders;
  }

  // Verificar se já foi enviado lembrete hoje
  hasReminderBeenSentToday(reminderId: string): boolean {
    const key = `reminder_sent_${reminderId}_${new Date().toDateString()}`;
    return localStorage.getItem(key) === 'true';
  }

  // Marcar lembrete como enviado
  markReminderAsSent(reminderId: string): void {
    const key = `reminder_sent_${reminderId}_${new Date().toDateString()}`;
    localStorage.setItem(key, 'true');
  }

  // Limpar marcações de lembrete enviado (útil para debug)
  clearReminderHistory(): void {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('reminder_sent_')
    );
    keys.forEach(key => localStorage.removeItem(key));
  }
}

export const notificationService = new NotificationService();
export type { TimeReminder, NotificationPermission };
