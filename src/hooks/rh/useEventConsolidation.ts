import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUserCompany } from '@/hooks/useUserCompany';
import { EventConsolidationService } from '@/services/rh/EventConsolidationService';
import type {
  PayrollEvent,
  PayrollEventInsert,
  ConsolidationResult
} from '@/services/rh/EventConsolidationService';

export function useEventConsolidation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { data: userCompany, isLoading: loadingCompany } = useUserCompany();

  if (loadingCompany) {
    return {
      loading: true,
      error: null,
      consolidateEvents: async () => null,
      getEvents: async () => [],
      approveEvents: async () => false,
      rejectEvents: async () => false,
      createEvent: async () => null
    };
  }

  if (!userCompany) {
    throw new Error('Usuário não está associado a uma empresa');
  }

  const consolidationService = new EventConsolidationService(userCompany.id);

  /**
   * Consolida eventos de folha para um período
   */
  const consolidateEvents = useCallback(async (
    period: string,
    employeeIds?: string[]
  ): Promise<ConsolidationResult | null> => {
    try {
      setLoading(true);
      setError(null);

      const result = await consolidationService.consolidatePayrollEvents(period, employeeIds);
      
      toast({
        title: "Sucesso",
        description: `Consolidação concluída: ${result.processed_events} eventos processados`,
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao consolidar eventos';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [consolidationService, toast]);

  /**
   * Busca eventos consolidados
   */
  const getEvents = useCallback(async (
    period: string,
    employeeId?: string,
    eventType?: string,
    status?: string
  ): Promise<PayrollEvent[]> => {
    try {
      setLoading(true);
      setError(null);

      const events = await consolidationService.getConsolidatedEvents(
        period,
        employeeId,
        eventType,
        status
      );

      return events;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar eventos';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      
      return [];
    } finally {
      setLoading(false);
    }
  }, [consolidationService, toast]);

  /**
   * Aprova eventos
   */
  const approveEvents = useCallback(async (
    eventIds: string[],
    approvedBy: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = await consolidationService.approveEvents(eventIds, approvedBy);
      
      if (success) {
        toast({
          title: "Sucesso",
          description: `${eventIds.length} eventos aprovados com sucesso`,
        });
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao aprovar eventos';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [consolidationService, toast]);

  /**
   * Rejeita eventos
   */
  const rejectEvents = useCallback(async (
    eventIds: string[],
    rejectedBy: string,
    reason: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = await consolidationService.rejectEvents(eventIds, rejectedBy, reason);
      
      if (success) {
        toast({
          title: "Sucesso",
          description: `${eventIds.length} eventos rejeitados`,
        });
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao rejeitar eventos';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [consolidationService, toast]);

  /**
   * Cria evento manual
   */
  const createEvent = useCallback(async (
    event: PayrollEventInsert
  ): Promise<PayrollEvent | null> => {
    try {
      setLoading(true);
      setError(null);

      // Implementar criação de evento manual
      // Por enquanto, retorna null
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar evento';
      setError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    error,
    consolidateEvents,
    getEvents,
    approveEvents,
    rejectEvents,
    createEvent
  };
}
