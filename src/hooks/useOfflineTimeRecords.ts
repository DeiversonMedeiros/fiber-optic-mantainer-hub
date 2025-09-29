import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useConnectivity } from './useConnectivity';
import { offlineStorage, OfflineTimeRecord } from '@/services/offlineStorage';
import { syncService } from '@/services/syncService';

interface TimeRecordData {
  employee_id: string;
  data: string;
  tipo: 'normal' | 'correcao' | 'feriado';
  hora_entrada?: string;
  hora_saida?: string;
  intervalo_inicio?: string;
  intervalo_fim?: string;
  hora_adicional_inicio?: string;
  hora_adicional_fim?: string;
  observacoes?: string;
}

export const useOfflineTimeRecords = (selectedDate: string) => {
  const { user } = useAuth();
  const { isOnline, wasOffline } = useConnectivity();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Buscar registro online
  const { data: onlineRecord, isLoading: isLoadingOnline } = useQuery({
    queryKey: ['time-record-online', user?.id, selectedDate],
    queryFn: async () => {
      if (!user?.id || !isOnline) return null;
      
      const { data, error } = await rhSupabase
        .from('time_records')
        .select('*')
        .eq('employee_id', user.id)
        .eq('data', selectedDate)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && isOnline,
    staleTime: 30000, // 30 segundos
  });

  // Buscar registro offline
  const { data: offlineRecord, isLoading: isLoadingOffline } = useQuery({
    queryKey: ['time-record-offline', user?.id, selectedDate],
    queryFn: async () => {
      if (!user?.id) return null;
      return await offlineStorage.getTimeRecord(user.id, selectedDate);
    },
    enabled: !!user?.id,
  });

  // Sincronização automática quando voltar online
  useEffect(() => {
    if (isOnline && wasOffline) {
      syncPendingRecords();
    }
  }, [isOnline, wasOffline]);

  // Atualizar contador de registros pendentes
  useEffect(() => {
    const updatePendingCount = async () => {
      if (!user?.id) return;
      
      try {
        const unsyncedRecords = await offlineStorage.getUnsyncedRecords();
        setPendingSyncCount(unsyncedRecords.length);
      } catch (error) {
        console.error('Erro ao contar registros pendentes:', error);
        // Em caso de erro, definir contador como 0 para não quebrar a UI
        setPendingSyncCount(0);
      }
    };

    updatePendingCount();
    
    // Atualizar contador periodicamente
    const interval = setInterval(updatePendingCount, 30000); // A cada 30 segundos
    return () => clearInterval(interval);
  }, [user?.id, offlineRecord, onlineRecord]);

  // Listener para mudanças no status de sincronização
  useEffect(() => {
    const handleSyncStatusChange = (syncing: boolean) => {
      setIsSyncing(syncing);
    };

    syncService.addSyncListener(handleSyncStatusChange);
    return () => syncService.removeSyncListener(handleSyncStatusChange);
  }, []);

  const syncPendingRecords = useCallback(async () => {
    try {
      const result = await syncService.syncAllPendingRecords();
      
      if (result.success > 0) {
        // Invalidar queries para atualizar dados
        queryClient.invalidateQueries({ queryKey: ['time-record-online'] });
        queryClient.invalidateQueries({ queryKey: ['time-record-offline'] });
      }
      
      return result;
    } catch (error) {
      console.error('Erro na sincronização:', error);
      throw error;
    }
  }, [queryClient]);

  const registerTimeRecord = useCallback(async (
    tipo: 'entrada' | 'saida' | 'intervalo_inicio' | 'intervalo_fim' | 'hora_adicional_inicio' | 'hora_adicional_fim',
    currentTime: Date
  ) => {
    if (!user?.id) throw new Error('Usuário não autenticado');

    const timeString = currentTime.toTimeString().split(' ')[0];
    const recordData: TimeRecordData = {
      employee_id: user.id,
      data: selectedDate,
      tipo: 'normal'
    };

    // Determinar qual campo atualizar
    switch (tipo) {
      case 'entrada':
        recordData.hora_entrada = timeString;
        break;
      case 'saida':
        recordData.hora_saida = timeString;
        break;
      case 'intervalo_inicio':
        recordData.intervalo_inicio = timeString;
        break;
      case 'intervalo_fim':
        recordData.intervalo_fim = timeString;
        break;
      case 'hora_adicional_inicio':
        recordData.hora_adicional_inicio = timeString;
        break;
      case 'hora_adicional_fim':
        recordData.hora_adicional_fim = timeString;
        break;
    }

    if (isOnline) {
      // Tentar salvar online primeiro
      try {
        if (onlineRecord) {
          // Atualizar registro existente
          const updates: any = {};
          switch (tipo) {
            case 'entrada':
              updates.hora_entrada = timeString;
              break;
            case 'saida':
              updates.hora_saida = timeString;
              break;
            case 'intervalo_inicio':
              updates.intervalo_inicio = timeString;
              break;
            case 'intervalo_fim':
              updates.intervalo_fim = timeString;
              break;
            case 'hora_adicional_inicio':
              updates.hora_adicional_inicio = timeString;
              break;
            case 'hora_adicional_fim':
              updates.hora_adicional_fim = timeString;
              break;
          }

          const { error } = await rhSupabase
            .from('time_records')
            .update(updates)
            .eq('id', onlineRecord.id);

          if (error) throw error;
        } else {
          // Criar novo registro
          const { error } = await rhSupabase
            .from('time_records')
            .insert([recordData]);

          if (error) throw error;
        }

        // Invalidar queries para atualizar dados
        queryClient.invalidateQueries({ queryKey: ['time-record-online'] });
        
        return { success: true, offline: false };
      } catch (error) {
        console.warn('Erro ao salvar online, salvando offline:', error);
        // Se falhar online, salvar offline
      }
    }

    // Salvar offline
    try {
      if (offlineRecord) {
        // Atualizar registro offline existente
        const updates: Partial<OfflineTimeRecord> = {};
        switch (tipo) {
          case 'entrada':
            updates.hora_entrada = timeString;
            break;
          case 'saida':
            updates.hora_saida = timeString;
            break;
          case 'intervalo_inicio':
            updates.intervalo_inicio = timeString;
            break;
          case 'intervalo_fim':
            updates.intervalo_fim = timeString;
            break;
          case 'hora_adicional_inicio':
            updates.hora_adicional_inicio = timeString;
            break;
          case 'hora_adicional_fim':
            updates.hora_adicional_fim = timeString;
            break;
        }

        await offlineStorage.updateTimeRecord(offlineRecord.id, updates);
      } else {
        // Criar novo registro offline
        await offlineStorage.saveTimeRecord(recordData);
      }

      // Invalidar query offline
      queryClient.invalidateQueries({ queryKey: ['time-record-offline'] });
      
      return { success: true, offline: true };
    } catch (error) {
      console.error('Erro ao salvar offline:', error);
      throw error;
    }
  }, [user?.id, selectedDate, isOnline, onlineRecord, offlineRecord, queryClient]);

  // Determinar qual registro usar (prioridade: online se disponível, senão offline)
  const currentRecord = isOnline && onlineRecord ? onlineRecord : offlineRecord;
  const isLoading = isOnline ? isLoadingOnline : isLoadingOffline;
  const isOfflineMode = !isOnline || (offlineRecord && !onlineRecord);

  return {
    record: currentRecord,
    isLoading,
    isOfflineMode,
    isSyncing,
    pendingSyncCount,
    registerTimeRecord,
    syncPendingRecords,
    canRegisterEntrada: () => !currentRecord?.hora_entrada,
    canRegisterSaida: () => currentRecord?.hora_entrada && !currentRecord?.hora_saida,
    canRegisterIntervaloInicio: () => currentRecord?.hora_entrada && !currentRecord?.hora_saida && !currentRecord?.intervalo_inicio,
    canRegisterIntervaloFim: () => currentRecord?.intervalo_inicio && !currentRecord?.intervalo_fim && !currentRecord?.hora_saida,
  };
};


