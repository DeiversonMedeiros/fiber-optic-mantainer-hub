import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    // Verificar suporte a notificações push
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    }
  }, [isSupported]);

  const subscribeToPush = useCallback(async (): Promise<PushSubscription | null> => {
    if (!isSupported || !user?.id) return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
      });

      setSubscription(subscription);
      return subscription;
    } catch (error) {
      console.error('Erro ao inscrever em push:', error);
      return null;
    }
  }, [isSupported, user?.id]);

  const sendTestNotification = useCallback(async () => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification('🧪 Teste de Notificação', {
      body: 'Se você está vendo esta notificação, o sistema está funcionando!',
      icon: '/icon.svg',
      tag: 'test-notification'
    });

    return true;
  }, [permission, requestPermission]);

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribeToPush,
    sendTestNotification
  };
};
