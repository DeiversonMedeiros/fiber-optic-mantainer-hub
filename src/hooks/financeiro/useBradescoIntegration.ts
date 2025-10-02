// @ts-nocheck
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BradescoIntegrationService, BradescoConfig, BankTransaction, BankStatement, PaymentBatch, PaymentBatchItem } from '../../services/financeiro/BradescoIntegrationService';
import { useUserCompany } from '../useUserCompany';
import { supabase } from '../../integrations/supabase/client';

export const useBradescoIntegration = () => {
  const { companyId, isLoading: companyLoading, error: companyError } = useUserCompany();
  const queryClient = useQueryClient();

  // =====================================================
  // CONFIGURAÇÃO
  // =====================================================

  const {
    data: bradescoConfig,
    isLoading: configLoading,
    error: configError
  } = useQuery({
    queryKey: ['bradesco-config', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const service = new BradescoIntegrationService(companyId);
      return await service.getConfig();
    },
    enabled: !!companyId && !companyLoading
  });

  const createConfigMutation = useMutation({
    mutationFn: async (config: Omit<BradescoConfig, 'id' | 'created_at' | 'updated_at'>) => {
      if (!companyId) throw new Error('Company ID não encontrado');
      const service = new BradescoIntegrationService(companyId);
      return await service.createConfig(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bradesco-config', companyId] });
    }
  });

  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BradescoConfig> }) => {
      if (!companyId) throw new Error('Company ID não encontrado');
      const service = new BradescoIntegrationService(companyId);
      return await service.updateConfig(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bradesco-config', companyId] });
    }
  });

  // =====================================================
  // AUTENTICAÇÃO
  // =====================================================

  const authenticateMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('Company ID não encontrado');
      const service = new BradescoIntegrationService(companyId);
      return await service.authenticate();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bradesco-config', companyId] });
    }
  });

  // =====================================================
  // TRANSAÇÕES
  // =====================================================

  const getTransactions = useCallback(async (filters?: {
    transaction_type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    if (!companyId) return [];
    const service = new BradescoIntegrationService(companyId);
    return await service.getTransactions(filters);
  }, [companyId]);

  const {
    data: transactions,
    isLoading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: ['bradesco-transactions', companyId],
    queryFn: () => getTransactions(),
    enabled: !!companyId && !companyLoading
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: Omit<BankTransaction, 'id' | 'company_id' | 'config_id' | 'created_at' | 'updated_at'>) => {
      if (!companyId) throw new Error('Company ID não encontrado');
      const service = new BradescoIntegrationService(companyId);
      return await service.createTransaction(transactionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bradesco-transactions', companyId] });
    }
  });

  const processTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      if (!companyId) throw new Error('Company ID não encontrado');
      const service = new BradescoIntegrationService(companyId);
      return await service.processTransaction(transactionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bradesco-transactions', companyId] });
    }
  });

  // =====================================================
  // EXTRATOS BANCÁRIOS
  // =====================================================

  const getBankStatements = useCallback(async (filters?: {
    start_date?: string;
    end_date?: string;
    sync_status?: string;
  }) => {
    if (!companyId) return [];
    const service = new BradescoIntegrationService(companyId);
    return await service.getBankStatements(filters);
  }, [companyId]);

  const {
    data: bankStatements,
    isLoading: statementsLoading,
    error: statementsError,
    refetch: refetchStatements
  } = useQuery({
    queryKey: ['bradesco-statements', companyId],
    queryFn: () => getBankStatements(),
    enabled: !!companyId && !companyLoading
  });

  const syncBankStatementMutation = useMutation({
    mutationFn: async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
      if (!companyId) throw new Error('Company ID não encontrado');
      const service = new BradescoIntegrationService(companyId);
      return await service.syncBankStatement(startDate, endDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bradesco-statements', companyId] });
    }
  });

  // =====================================================
  // LOTES DE PAGAMENTO
  // =====================================================

  const getPaymentBatches = useCallback(async (filters?: {
    batch_type?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    if (!companyId) return [];
    const service = new BradescoIntegrationService(companyId);
    return await service.getPaymentBatches(filters);
  }, [companyId]);

  const {
    data: paymentBatches,
    isLoading: batchesLoading,
    error: batchesError,
    refetch: refetchBatches
  } = useQuery({
    queryKey: ['bradesco-payment-batches', companyId],
    queryFn: () => getPaymentBatches(),
    enabled: !!companyId && !companyLoading
  });

  const createPaymentBatchMutation = useMutation({
    mutationFn: async (batchData: Omit<PaymentBatch, 'id' | 'company_id' | 'config_id' | 'created_at' | 'updated_at'>) => {
      if (!companyId) throw new Error('Company ID não encontrado');
      const service = new BradescoIntegrationService(companyId);
      return await service.createPaymentBatch(batchData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bradesco-payment-batches', companyId] });
    }
  });

  const addPaymentToBatchMutation = useMutation({
    mutationFn: async ({ batchId, paymentData }: { batchId: string; paymentData: Omit<PaymentBatchItem, 'id' | 'company_id' | 'batch_id' | 'created_at' | 'updated_at'> }) => {
      if (!companyId) throw new Error('Company ID não encontrado');
      const service = new BradescoIntegrationService(companyId);
      return await service.addPaymentToBatch(batchId, paymentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bradesco-payment-batches', companyId] });
    }
  });

  const submitPaymentBatchMutation = useMutation({
    mutationFn: async (batchId: string) => {
      if (!companyId) throw new Error('Company ID não encontrado');
      const service = new BradescoIntegrationService(companyId);
      return await service.submitPaymentBatch(batchId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bradesco-payment-batches', companyId] });
    }
  });

  const generateCNABFileMutation = useMutation({
    mutationFn: async (batchId: string) => {
      if (!companyId) throw new Error('Company ID não encontrado');
      const service = new BradescoIntegrationService(companyId);
      return await service.generateCNABFile(batchId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bradesco-payment-batches', companyId] });
    }
  });

  // =====================================================
  // LOGS DE INTEGRAÇÃO
  // =====================================================

  const getIntegrationLogs = useCallback(async (filters?: {
    log_level?: string;
    log_type?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    if (!companyId) return [];
    const service = new BradescoIntegrationService(companyId);
    return await service.getIntegrationLogs(filters);
  }, [companyId]);

  const {
    data: integrationLogs,
    isLoading: logsLoading,
    error: logsError,
    refetch: refetchLogs
  } = useQuery({
    queryKey: ['bradesco-integration-logs', companyId],
    queryFn: () => getIntegrationLogs(),
    enabled: !!companyId && !companyLoading
  });

  const logIntegrationMutation = useMutation({
    mutationFn: async (logData: {
      log_level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
      log_type: 'auth' | 'api' | 'cnab' | 'webhook' | 'sync' | 'payment' | 'error';
      message: string;
      request_id?: string;
      endpoint?: string;
      method?: string;
      request_data?: any;
      response_data?: any;
      error_code?: string;
      error_message?: string;
      stack_trace?: string;
      duration_ms?: number;
    }) => {
      if (!companyId) throw new Error('Company ID não encontrado');
      const service = new BradescoIntegrationService(companyId);
      return await service.logIntegration(logData);
    }
  });

  // =====================================================
  // MÉTODOS DE CONVENIÊNCIA
  // =====================================================

  const createCompletePaymentBatch = useCallback(async (batchData: {
    batch_type: 'salary' | 'supplier' | 'tax' | 'mixed';
    description: string;
    payments: Array<{
      payment_type: 'transfer' | 'pix' | 'ted' | 'doc';
      amount: number;
      description: string;
      beneficiary_name: string;
      beneficiary_document: string;
      beneficiary_bank_code?: string;
      beneficiary_agency?: string;
      beneficiary_account?: string;
      beneficiary_account_digit?: string;
      pix_key?: string;
      pix_key_type?: string;
    }>;
  }) => {
    if (!companyId) throw new Error('Company ID não encontrado');
    
    try {
      // Criar lote
      const batch = await createPaymentBatchMutation.mutateAsync({
        batch_number: `LOTE-${Date.now()}`,
        batch_type: batchData.batch_type,
        description: batchData.description,
        total_amount: batchData.payments.reduce((sum, p) => sum + p.amount, 0),
        total_transactions: batchData.payments.length,
        processed_amount: 0,
        processed_transactions: 0,
        status: 'pending'
      });

      if (batch) {
        // Adicionar pagamentos ao lote
        for (const payment of batchData.payments) {
          await addPaymentToBatchMutation.mutateAsync({
            batchId: batch.id,
            paymentData: payment
          });
        }

        return batch;
      }

      return null;
    } catch (error) {
      console.error('Erro ao criar lote completo de pagamento:', error);
      throw error;
    }
  }, [companyId, createPaymentBatchMutation, addPaymentToBatchMutation]);

  const processPayrollBatch = useCallback(async (payrollCalculationId: string) => {
    if (!companyId) throw new Error('Company ID não encontrado');
    
    try {
      // Buscar dados da folha de pagamento
      const { data: payroll, error: payrollError } = await supabase
        .from('payroll_calculations')
        .select(`
          *,
          payroll_calculation_items (
            *,
            employee:employee_id (
              id,
              name,
              cpf,
              bank_account,
              bank_agency,
              bank_account_number
            )
          )
        `)
        .eq('id', payrollCalculationId)
        .eq('company_id', companyId)
        .single();

      if (payrollError || !payroll) {
        throw new Error('Folha de pagamento não encontrada');
      }

      // Criar lote de pagamento da folha
      const batch = await createCompletePaymentBatch({
        batch_type: 'salary',
        description: `Folha de Pagamento - ${payroll.reference_period}`,
        payments: payroll.payroll_calculation_items?.map(item => ({
          payment_type: 'transfer',
          amount: item.salary_amount,
          description: `Salário - ${item.employee?.name || 'Funcionário'}`,
          beneficiary_name: item.employee?.name || 'Funcionário',
          beneficiary_document: item.employee?.cpf || '',
          beneficiary_bank_code: '237', // Bradesco
          beneficiary_agency: item.employee?.bank_agency || '',
          beneficiary_account: item.employee?.bank_account_number || '',
          beneficiary_account_digit: ''
        })) || []
      });

      return batch;
    } catch (error) {
      console.error('Erro ao processar lote da folha:', error);
      throw error;
    }
  }, [companyId, createCompletePaymentBatch]);

  // =====================================================
  // ESTADOS DE LOADING E ERRO
  // =====================================================

  const isLoading = companyLoading || configLoading || transactionsLoading || statementsLoading || batchesLoading || logsLoading;
  
  const error = companyError || configError || transactionsError || statementsError || batchesError || logsError;

  const isProcessing = authenticateMutation.isPending || 
                      createTransactionMutation.isPending || 
                      processTransactionMutation.isPending ||
                      syncBankStatementMutation.isPending ||
                      createPaymentBatchMutation.isPending ||
                      addPaymentToBatchMutation.isPending ||
                      submitPaymentBatchMutation.isPending ||
                      generateCNABFileMutation.isPending;

  return {
    // Dados
    bradescoConfig,
    transactions,
    bankStatements,
    paymentBatches,
    integrationLogs,
    
    // Estados
    isLoading,
    error,
    isProcessing,
    
    // Configuração
    createConfig: createConfigMutation.mutateAsync,
    updateConfig: updateConfigMutation.mutateAsync,
    
    // Autenticação
    authenticate: authenticateMutation.mutateAsync,
    
    // Transações
    createTransaction: createTransactionMutation.mutateAsync,
    processTransaction: processTransactionMutation.mutateAsync,
    refetchTransactions,
    
    // Extratos
    syncBankStatement: syncBankStatementMutation.mutateAsync,
    refetchStatements,
    
    // Lotes
    createPaymentBatch: createPaymentBatchMutation.mutateAsync,
    addPaymentToBatch: addPaymentToBatchMutation.mutateAsync,
    submitPaymentBatch: submitPaymentBatchMutation.mutateAsync,
    generateCNABFile: generateCNABFileMutation.mutateAsync,
    refetchBatches,
    
    // Logs
    logIntegration: logIntegrationMutation.mutateAsync,
    refetchLogs,
    
    // Métodos de conveniência
    createCompletePaymentBatch,
    processPayrollBatch,
    
    // Consultas com filtros
    getTransactions,
    getBankStatements,
    getPaymentBatches,
    getIntegrationLogs
  };
};