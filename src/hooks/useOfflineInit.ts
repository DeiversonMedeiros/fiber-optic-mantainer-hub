import { useEffect, useState } from 'react';
import { offlineStorage } from '@/services/offlineStorage';
import { syncService } from '@/services/syncService';

export const useOfflineInit = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeOfflineSystem = async () => {
      try {
        console.log('🚀 [OFFLINE] Iniciando sistema offline...');
        
        // Inicializar IndexedDB
        console.log('🔍 [OFFLINE] Inicializando IndexedDB...');
        await offlineStorage.init();
        
        // Verificar se o banco está funcionando
        const isHealthy = await offlineStorage.healthCheck();
        if (!isHealthy) {
          console.warn('IndexedDB não está funcionando corretamente');
        }
        
        // Verificar se há registros para sincronizar
        console.log('🔍 [OFFLINE] Verificando conexão com servidor...');
        const hasConnection = await syncService.checkConnection();
        console.log('🔍 [OFFLINE] Resultado da verificação de conexão:', hasConnection);
        
        if (hasConnection) {
          try {
            // Limpeza periódica de registros antigos (executa apenas uma vez por sessão)
            await syncService.cleanupOldRecords();
          } catch (cleanupError) {
            console.warn('Erro na limpeza de registros antigos (não crítico):', cleanupError);
            // Não falha a inicialização por causa da limpeza
          }
          
          try {
            // Sincronizar registros pendentes
            const unsyncedRecords = await offlineStorage.getUnsyncedRecords();
            if (unsyncedRecords.length > 0) {
              console.log(`Encontrados ${unsyncedRecords.length} registros para sincronizar`);
              // A sincronização será feita automaticamente pelo hook useOfflineTimeRecords
            }
          } catch (syncError) {
            console.warn('Erro ao verificar registros pendentes (não crítico):', syncError);
            // Não falha a inicialização por causa da verificação
          }
        }
        
        console.log('✅ [OFFLINE] Sistema offline inicializado com sucesso');
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ [OFFLINE] Erro ao inicializar sistema offline:', error);
        setInitError(error instanceof Error ? error.message : 'Erro desconhecido');
        setIsInitialized(true); // Mesmo com erro, permitir uso offline
      }
    };

    initializeOfflineSystem();
  }, []);

  return { isInitialized, initError };
};

