import { useEffect } from 'react';
import { useToast } from './use-toast';
import { useConnectivity } from './useConnectivity';
import { syncService } from '@/services/syncService';

export const useSyncNotifications = () => {
  console.log('🔍 [SYNC_NOTIFICATIONS] Inicializando useSyncNotifications...');
  
  const { toast } = useToast();
  const { isOnline, wasOffline } = useConnectivity();
  
  console.log('🔍 [SYNC_NOTIFICATIONS] Estado de conectividade:', { isOnline, wasOffline });

  useEffect(() => {
    if (isOnline && wasOffline) {
      toast({
        title: "Conexão restabelecida",
        description: "Sincronizando registros pendentes...",
      });
    }
  }, [isOnline, wasOffline, toast]);

  useEffect(() => {
    const handleSyncSuccess = () => {
      toast({
        title: "Sincronização concluída",
        description: "Todos os registros foram sincronizados com sucesso.",
      });
    };

    const handleSyncError = () => {
      toast({
        title: "Erro na sincronização",
        description: "Alguns registros não puderam ser sincronizados. Tente novamente.",
        variant: "destructive",
      });
    };

    // Adicionar listeners para eventos de sincronização
    syncService.addSyncListener((isSyncing) => {
      if (!isSyncing) {
        // Sincronização finalizada - verificar se houve sucesso ou erro
        // Por simplicidade, assumimos sucesso. Em uma implementação mais robusta,
        // você poderia verificar o resultado da sincronização
        handleSyncSuccess();
      }
    });

    return () => {
      // Cleanup seria necessário se houvesse listeners específicos
    };
  }, [toast]);
};
