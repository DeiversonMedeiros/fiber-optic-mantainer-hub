import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useConnectivity } from '@/hooks/useConnectivity';

interface ConnectivityStatusProps {
  onSyncClick?: () => void;
  isSyncing?: boolean;
  pendingSyncCount?: number;
}

export const ConnectivityStatus: React.FC<ConnectivityStatusProps> = ({ 
  onSyncClick, 
  isSyncing = false,
  pendingSyncCount = 0
}) => {
  const { isOnline } = useConnectivity();

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      {isOnline ? (
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-green-600" />
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Online
          </Badge>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4 text-red-600" />
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Offline
          </Badge>
        </div>
      )}
      
      {pendingSyncCount > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            {pendingSyncCount} pendente{pendingSyncCount > 1 ? 's' : ''}
          </Badge>
          {isOnline && onSyncClick && (
            <Button
              size="sm"
              variant="outline"
              onClick={onSyncClick}
              disabled={isSyncing}
              className="h-6 px-2 text-xs"
            >
              {isSyncing ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                'Sincronizar'
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};


