import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertTriangle } from 'lucide-react';
import { useVacationNotificationsCount } from '@/hooks/useVacationNotifications';
import { cn } from '@/lib/utils';

interface VacationNotificationBadgeProps {
  employeeId?: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function VacationNotificationBadge({ 
  employeeId, 
  className = '',
  showIcon = true,
  size = 'sm'
}: VacationNotificationBadgeProps) {
  const { data: unreadCount = 0, isLoading } = useVacationNotificationsCount(employeeId);

  if (isLoading) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
      </div>
    );
  }

  if (unreadCount === 0) {
    return null;
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4 text-xs';
      case 'md':
        return 'h-5 w-5 text-sm';
      case 'lg':
        return 'h-6 w-6 text-base';
      default:
        return 'h-4 w-4 text-xs';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3';
      case 'md':
        return 'h-4 w-4';
      case 'lg':
        return 'h-5 w-5';
      default:
        return 'h-3 w-3';
    }
  };

  return (
    <div className={cn("relative", className)}>
      {showIcon && (
        <Bell className={cn("text-muted-foreground", getIconSize())} />
      )}
      <Badge 
        variant="destructive" 
        className={cn(
          "absolute -top-2 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center",
          getSizeClasses()
        )}
      >
        {unreadCount > 99 ? '99+' : unreadCount}
      </Badge>
    </div>
  );
}
