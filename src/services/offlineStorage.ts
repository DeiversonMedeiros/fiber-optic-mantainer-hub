interface OfflineTimeRecord {
  id: string;
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
  created_at: string;
  updated_at: string;
  is_synced: boolean;
}

class OfflineStorageService {
  private dbName = 'PontoOfflineDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store para registros de ponto offline
        if (!db.objectStoreNames.contains('timeRecords')) {
          const store = db.createObjectStore('timeRecords', { keyPath: 'id' });
          store.createIndex('employee_id', 'employee_id', { unique: false });
          store.createIndex('data', 'data', { unique: false });
          store.createIndex('is_synced', 'is_synced', { unique: false });
          store.createIndex('employee_data', ['employee_id', 'data'], { unique: false });
        }

        // Store para fila de sincronização
        if (!db.objectStoreNames.contains('syncQueue')) {
          const store = db.createObjectStore('syncQueue', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async saveTimeRecord(record: Omit<OfflineTimeRecord, 'id' | 'created_at' | 'updated_at' | 'is_synced'>): Promise<string> {
    if (!this.db) await this.init();

    const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const offlineRecord: OfflineTimeRecord = {
      ...record,
      id,
      created_at: now,
      updated_at: now,
      is_synced: false
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['timeRecords'], 'readwrite');
      const store = transaction.objectStore('timeRecords');
      const request = store.put(offlineRecord);

      request.onsuccess = () => {
        // Adicionar à fila de sincronização
        this.addToSyncQueue(id, 'timeRecord', offlineRecord);
        resolve(id);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateTimeRecord(id: string, updates: Partial<OfflineTimeRecord>): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['timeRecords'], 'readwrite');
      const store = transaction.objectStore('timeRecords');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (record) {
          const updatedRecord = {
            ...record,
            ...updates,
            updated_at: new Date().toISOString(),
            is_synced: false
          };
          
          const putRequest = store.put(updatedRecord);
          putRequest.onsuccess = () => {
            this.addToSyncQueue(id, 'timeRecord', updatedRecord);
            resolve();
          };
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Registro não encontrado'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getTimeRecord(employeeId: string, date: string): Promise<OfflineTimeRecord | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['timeRecords'], 'readonly');
      const store = transaction.objectStore('timeRecords');
      
      try {
        const index = store.index('employee_data');
        const request = index.get([employeeId, date]);

        request.onsuccess = () => {
          resolve(request.result || null);
        };
        request.onerror = () => {
          // Se houver erro no índice, tentar busca manual
          const fallbackRequest = store.getAll();
          fallbackRequest.onsuccess = () => {
            const record = fallbackRequest.result.find(r => 
              r.employee_id === employeeId && r.data === date
            );
            resolve(record || null);
          };
          fallbackRequest.onerror = () => reject(request.error);
        };
      } catch (error) {
        // Se houver erro criando o índice, fazer busca manual
        const fallbackRequest = store.getAll();
        fallbackRequest.onsuccess = () => {
          const record = fallbackRequest.result.find(r => 
            r.employee_id === employeeId && r.data === date
          );
          resolve(record || null);
        };
        fallbackRequest.onerror = () => reject(error);
      }
    });
  }

  async getUnsyncedRecords(): Promise<OfflineTimeRecord[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['timeRecords'], 'readonly');
      const store = transaction.objectStore('timeRecords');
      const request = store.getAll();

      request.onsuccess = () => {
        // Filtrar registros não sincronizados
        const unsyncedRecords = request.result.filter(record => !record.is_synced);
        resolve(unsyncedRecords);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async markAsSynced(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['timeRecords'], 'readwrite');
      const store = transaction.objectStore('timeRecords');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (record) {
          record.is_synced = true;
          record.updated_at = new Date().toISOString();
          
          const putRequest = store.put(record);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Registro não encontrado'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  private async addToSyncQueue(id: string, type: string, data: any): Promise<void> {
    if (!this.db) await this.init();

    const syncItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recordId: id,
      type,
      data,
      timestamp: Date.now(),
      attempts: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.put(syncItem);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearOldSyncedRecords(daysOld: number = 30): Promise<void> {
    if (!this.db) await this.init();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffISO = cutoffDate.toISOString();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['timeRecords'], 'readwrite');
      const store = transaction.objectStore('timeRecords');
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result;
        // Filtrar registros sincronizados e antigos
        const recordsToDelete = records.filter(record => 
          record.is_synced && record.updated_at < cutoffISO
        );

        if (recordsToDelete.length === 0) {
          resolve();
          return;
        }

        let deletedCount = 0;
        recordsToDelete.forEach(record => {
          const deleteRequest = store.delete(record.id);
          deleteRequest.onsuccess = () => {
            deletedCount++;
            if (deletedCount === recordsToDelete.length) {
              resolve();
            }
          };
          deleteRequest.onerror = () => reject(deleteRequest.error);
        });
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Método para resetar completamente o banco (útil para debug)
  async resetDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(this.dbName);
      
      deleteRequest.onsuccess = () => {
        this.db = null;
        console.log('Banco de dados resetado com sucesso');
        resolve();
      };
      
      deleteRequest.onerror = () => {
        reject(deleteRequest.error);
      };
      
      deleteRequest.onblocked = () => {
        console.warn('Reset do banco bloqueado - feche outras abas');
        reject(new Error('Reset bloqueado - feche outras abas'));
      };
    });
  }

  // Método para verificar se o banco está funcionando
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.db) await this.init();
      
      // Tentar uma operação simples
      const transaction = this.db!.transaction(['timeRecords'], 'readonly');
      const store = transaction.objectStore('timeRecords');
      const request = store.count();
      
      return new Promise((resolve) => {
        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch (error) {
      return false;
    }
  }
}

export const offlineStorage = new OfflineStorageService();
export type { OfflineTimeRecord };


