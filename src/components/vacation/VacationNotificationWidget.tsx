import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Bell,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { 
  useVacationNotifications, 
  useVacationNotificationsCount,
  useMarkNotificationAsRead,
  useMarkMultipleNotificationsAsRead,
  VacationNotification
} from '@/hooks/useVacationNotifications';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VacationNotificationWidgetProps {
  employeeId?: string;
  className?: string;
}

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'critical':
      return {
        icon: AlertTriangle,
        color: 'bg-red-100 text-red-800 border-red-200',
        iconColor: 'text-red-600',
        badgeColor: 'bg-red-500'
      };
    case 'high':
      return {
        icon: Clock,
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        iconColor: 'text-orange-600',
        badgeColor: 'bg-orange-500'
      };
    case 'medium':
      return {
        icon: Calendar,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        iconColor: 'text-yellow-600',
        badgeColor: 'bg-yellow-500'
      };
    case 'low':
      return {
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800 border-green-200',
        iconColor: 'text-green-600',
        badgeColor: 'bg-green-500'
      };
    default:
      return {
        icon: Info,
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        iconColor: 'text-gray-600',
        badgeColor: 'bg-gray-500'
      };
  }
};

const getTypeConfig = (type: string) => {
  switch (type) {
    case 'ferias_disponivel':
      return { label: 'Férias Disponíveis', icon: Calendar };
    case 'ferias_vencendo':
      return { label: 'Férias Vencendo', icon: Clock };
    case 'ferias_vencida':
      return { label: 'Férias Vencidas', icon: AlertTriangle };
    case 'ferias_aprovada':
      return { label: 'Férias Aprovadas', icon: CheckCircle };
    case 'system_log':
      return { label: 'Sistema', icon: Info };
    default:
      return { label: 'Notificação', icon: Bell };
  }
};

const NotificationCard: React.FC<{
  notification: VacationNotification;
  onMarkAsRead: (id: string) => void;
}> = ({ notification, onMarkAsRead }) => {
  const priorityConfig = getPriorityConfig(notification.priority);
  const typeConfig = getTypeConfig(notification.notification_type);
  const Icon = priorityConfig.icon;
  const TypeIcon = typeConfig.icon;

  return (
    <div className={cn(
      "border rounded-lg p-4 transition-all duration-200 hover:shadow-md",
      notification.is_read ? "opacity-60" : "",
      priorityConfig.color
    )}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <TypeIcon className={cn("h-4 w-4", priorityConfig.iconColor)} />
          <Badge variant="outline" className={priorityConfig.color}>
            {typeConfig.label}
          </Badge>
          <Badge 
            variant="solid" 
            className={cn("text-white", priorityConfig.badgeColor)}
          >
            {notification.priority}
          </Badge>
        </div>
        {!notification.is_read && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMarkAsRead(notification.id)}
            className="h-6 w-6 p-0"
          >
            <Eye className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      <h4 className="font-medium text-sm mb-1">{notification.title}</h4>
      <p className="text-xs text-gray-600 mb-2">{notification.message}</p>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {notification.days_remaining !== null && notification.days_remaining > 0
            ? `${notification.days_remaining} dias restantes`
            : notification.days_remaining === 0
            ? 'Vence hoje'
            : notification.days_remaining !== null
            ? `${Math.abs(notification.days_remaining)} dias em atraso`
            : ''
          }
        </span>
        <span>
          {new Date(notification.created_at).toLocaleDateString('pt-BR')}
        </span>
      </div>
    </div>
  );
};

export function VacationNotificationWidget({ 
  employeeId, 
  className = '' 
}: VacationNotificationWidgetProps) {
  const [showAll, setShowAll] = useState(false);
  const { toast } = useToast();

  const { 
    data: notifications = [], 
    isLoading, 
    error 
  } = useVacationNotifications(employeeId);

  const { data: unreadCount = 0 } = useVacationNotificationsCount(employeeId);
  
  const markAsReadMutation = useMarkNotificationAsRead();
  const markMultipleAsReadMutation = useMarkMultipleNotificationsAsRead();

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.is_read);
    if (unreadNotifications.length === 0) return;

    try {
      await markMultipleAsReadMutation.mutateAsync(
        unreadNotifications.map(n => n.id)
      );
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const displayedNotifications = showAll ? notifications : notifications.slice(0, 3);
  const hasMoreNotifications = notifications.length > 3;

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Bell className="h-5 w-5" />
            <span>Notificações de Férias</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Carregando notificações...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Bell className="h-5 w-5" />
            <span>Notificações de Férias</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600">Erro ao carregar notificações</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Bell className="h-5 w-5" />
            <span>Notificações de Férias</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Nenhuma notificação pendente</p>
            <p className="text-xs text-gray-500">Todas as suas férias estão em dia!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Bell className="h-5 w-5" />
            <span>Notificações de Férias</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkAllAsRead}
                disabled={markMultipleAsReadMutation.isPending}
                className="text-xs"
              >
                <EyeOff className="h-3 w-3 mr-1" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayedNotifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onMarkAsRead={handleMarkAsRead}
          />
        ))}
        
        {hasMoreNotifications && (
          <div className="text-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-xs"
            >
              {showAll ? 'Ver menos' : `Ver mais ${notifications.length - 3} notificações`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
