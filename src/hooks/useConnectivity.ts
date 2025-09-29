import { useState, useEffect } from 'react';

interface ConnectivityState {
  isOnline: boolean;
  wasOffline: boolean;
}

export const useConnectivity = () => {
  const [connectivity, setConnectivity] = useState<ConnectivityState>({
    isOnline: navigator.onLine,
    wasOffline: false
  });

  useEffect(() => {
    const handleOnline = () => {
      setConnectivity(prev => ({
        isOnline: true,
        wasOffline: !prev.isOnline
      }));
    };

    const handleOffline = () => {
      setConnectivity(prev => ({
        isOnline: false,
        wasOffline: prev.wasOffline
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return connectivity;
};


