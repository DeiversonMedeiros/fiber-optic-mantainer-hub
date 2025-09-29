import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FinancialIntegrationService, FinancialConfig, GeneratedTitle, TaxGuide, PaymentBatch, CNABFile, AccountingProvision } from '../../services/rh/FinancialIntegrationService';
import { useUserCompany } from '../useUserCompany';

export const useFinancialIntegration = () => {
  const { companyId, isLoading: companyLoading, error: companyError } = useUserCompany();
  const queryClient = useQueryClient();

  // =====================================================
  // CONFIGURAÇÃO FINANCEIRA
  // =====================================================

  const {
    data: financialConfig,
    isLoading: configLoading,
    error: configError
  } = useQuery({
    queryKey: ['financial-config', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const service = new FinancialIntegrationService(companyId);
      return await service.getFinancialConfig();
    },
    enabled: !!companyId && !companyLoading
  });

  const createConfigMutation = useMutation({
    mutationFn: async (config: Omit<FinancialConfig, 'id' | 'created_at' | 'updated_at'>) => {
      if (!companyId) throw new Error('Company ID não encontrado');
      const service = new FinancialIntegrationService(companyId);
      return await service.createFinancialConfig(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-config', companyId] });
    }
  });

  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FinancialConfig> }) => {
      if (!companyId) throw new Error('Company ID não encontrado');
      const service = new FinancialIntegrationService(companyId);
      return await service.updateFinancialConfig(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-config', companyId] });
    }
  });

  // =====================================================
  // TÍTULOS GERADOS
  // =====================================================

  const getGeneratedTitles = useCallback(async (filters?: {
    payroll_calculation_id?: string;
    employee_id?: string;
    status?: string;
    title_type?: string;
  }) => {
    if (!companyId) return [];
    const service = new FinancialIntegrationService(companyId);
    return await service.getGeneratedTitles(filters);
  }, [companyId]);

  const {
    data: generatedTitles,
    isLoading: titlesLoading,
    error: titlesError,
    refetch: refetchTitles
  } = useQuery({
    queryKey: ['generated-titles', companyId],
    queryFn: () => getGeneratedTitles(),
    enabled: !!companyId && !companyLoading
  });

  const generateTitlesMutation = useMutation({
    mutationFn: async (payrollCalculationId: string) => {
      if (!companyId) throw new Error('Company ID não encontrado');
      const service = new FinancialIntegrationService(companyId);
      return await service.generateTitlesFromPayroll(payrollCalculationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-titles', companyId] });
      queryClient.invalidateQueries({ queryKey: ['payroll-calculations', companyId] });
    }
  });

  // =====================================================
  // GUIAS DE RECOLHIMENTO
  // =====================================================

  const getTaxGuides = useCallback(async (filters?: {
    payroll_calculation_id?: string;
    guide_type?: string;
    status?: string;
  }) => {
    if (!companyId) return [];
    const service = new FinancialIntegrationService(companyId);
    return await service.getTaxGuides(filters);
  }, [companyId]);

  const {
    data: taxGuides,
    isLoading: guidesLoading,
    error: guidesError,
    refetch: refetchGuides
  } = useQuery({
    queryKey: ['tax-guides', companyId],
    queryFn: () => getTaxGuides(),
    enabled: !!companyId && !companyLoading
  });

  const generateTaxGuidesMutation = useMutation({
    mutationFn: async (payrollCalculationId: string) => {
      if (!companyId) throw new Error('Company ID não encontrado');
      const service = new FinancialIntegrationService(companyId);
      return await service.generateTaxGuides(payrollCalculationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-guides', companyId] });
      queryClient.invalidateQueries({ queryKey: ['payroll-calculations', companyId] });
    }
  });

  // =====================================================
  // LOTES DE PAGAMENTO
  // =====================================================

  const getPaymentBatches = useCallback(async (filters?: {
    payroll_calculation_id?: string;
    batch_type?: string;
    status?: string;
  }) => {
    if (!companyId) return [];
    const service = new FinancialIntegrationService(companyId);
    return await service.getPaymentBatches(filters);
  }, [companyId]);

  const {
    data: paymentBatches,
    isLoading: batchesLoading,
    error: batchesError,
    refetch: refetchBatches
  } = useQuery({
    queryKey: ['payment-batches', companyId],
    queryFn: () => getPaymentBatches(),
    enabled: !!companyId && !companyLoading
  });

  const createPaymentBatchMutation = useMutation({
    mutationFn: async ({ payrollCalculationId, batchType }: { payrollCalculationId: string; batchType: 'salary' | 'benefits' | 'taxes' | 'mixed' }) => {
      if (!companyId) throw new Error('Company ID não encontrado');
      const service = new FinancialIntegrationService(companyId);
      return await service.createPaymentBatch(payrollCalculationId, batchType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-batches', companyId] });
      queryClient.invalidateQueries({ queryKey: ['payroll-calculations', companyId] });
    }
  });

  // =====================================================
  // ARQUIVOS CNAB
  // =====================================================

  const getCNABFiles = useCallback(async (filters?: {
    payment_batch_id?: string;
    file_type?: string;
    status?: string;
  }) => {
    if (!companyId) return [];
    const service = new FinancialIntegrationService(companyId);
    return await service.getCNABFiles(filters);
  }, [companyId]);

  const {
    data: cnabFiles,
    isLoading: cnabLoading,
    error: cnabError,
    refetch: refetchCNAB
  } = useQuery({
    queryKey: ['cnab-files', companyId],
    queryFn: () => getCNABFiles(),
    enabled: !!companyId && !companyLoading
  });

  const generateCNABFileMutation = useMutation({
    mutationFn: async (paymentBatchId: string) => {
      if (!companyId) throw new Error('Company ID não encontrado');
      const service = new FinancialIntegrationService(companyId);
      return await service.generateCNABFile(paymentBatchId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cnab-files', companyId] });
      queryClient.invalidateQueries({ queryKey: ['payment-batches', companyId] });
    }
  });

  // =====================================================
  // PROVISÕES CONTÁBEIS
  // =====================================================

  const getAccountingProvisions = useCallback(async (filters?: {
    payroll_calculation_id?: string;
    provision_type?: string;
    status?: string;
  }) => {
    if (!companyId) return [];
    const service = new FinancialIntegrationService(companyId);
    return await service.getAccountingProvisions(filters);
  }, [companyId]);

  const {
    data: accountingProvisions,
    isLoading: provisionsLoading,
    error: provisionsError,
    refetch: refetchProvisions
  } = useQuery({
    queryKey: ['accounting-provisions', companyId],
    queryFn: () => getAccountingProvisions(),
    enabled: !!companyId && !companyLoading
  });

  const generateAccountingProvisionsMutation = useMutation({
    mutationFn: async (payrollCalculationId: string) => {
      if (!companyId) throw new Error('Company ID não encontrado');
      const service = new FinancialIntegrationService(companyId);
      return await service.generateAccountingProvisions(payrollCalculationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-provisions', companyId] });
      queryClient.invalidateQueries({ queryKey: ['payroll-calculations', companyId] });
    }
  });

  // =====================================================
  // MÉTODOS DE CONVENIÊNCIA
  // =====================================================

  const generateAllFinancialDocuments = useCallback(async (payrollCalculationId: string) => {
    if (!companyId) throw new Error('Company ID não encontrado');
    
    try {
      // Gerar títulos
      await generateTitlesMutation.mutateAsync(payrollCalculationId);
      
      // Gerar guias de recolhimento
      await generateTaxGuidesMutation.mutateAsync(payrollCalculationId);
      
      // Gerar provisões contábeis
      await generateAccountingProvisionsMutation.mutateAsync(payrollCalculationId);
      
      return true;
    } catch (error) {
      console.error('Erro ao gerar documentos financeiros:', error);
      throw error;
    }
  }, [companyId, generateTitlesMutation, generateTaxGuidesMutation, generateAccountingProvisionsMutation]);

  const createCompletePaymentBatch = useCallback(async (payrollCalculationId: string) => {
    if (!companyId) throw new Error('Company ID não encontrado');
    
    try {
      // Criar lote de pagamento
      const batch = await createPaymentBatchMutation.mutateAsync({
        payrollCalculationId,
        batchType: 'mixed'
      });
      
      if (batch) {
        // Gerar arquivo CNAB
        await generateCNABFileMutation.mutateAsync(batch.id);
      }
      
      return batch;
    } catch (error) {
      console.error('Erro ao criar lote completo de pagamento:', error);
      throw error;
    }
  }, [companyId, createPaymentBatchMutation, generateCNABFileMutation]);

  // =====================================================
  // ESTADOS DE LOADING E ERRO
  // =====================================================

  const isLoading = companyLoading || configLoading || titlesLoading || guidesLoading || batchesLoading || cnabLoading || provisionsLoading;
  
  const error = companyError || configError || titlesError || guidesError || batchesError || cnabError || provisionsError;

  const isGenerating = generateTitlesMutation.isPending || 
                      generateTaxGuidesMutation.isPending || 
                      generateAccountingProvisionsMutation.isPending ||
                      createPaymentBatchMutation.isPending ||
                      generateCNABFileMutation.isPending;

  return {
    // Dados
    financialConfig,
    generatedTitles,
    taxGuides,
    paymentBatches,
    cnabFiles,
    accountingProvisions,
    
    // Estados
    isLoading,
    error,
    isGenerating,
    
    // Configuração
    createConfig: createConfigMutation.mutateAsync,
    updateConfig: updateConfigMutation.mutateAsync,
    
    // Títulos
    generateTitles: generateTitlesMutation.mutateAsync,
    refetchTitles,
    
    // Guias
    generateTaxGuides: generateTaxGuidesMutation.mutateAsync,
    refetchGuides,
    
    // Lotes
    createPaymentBatch: createPaymentBatchMutation.mutateAsync,
    refetchBatches,
    
    // CNAB
    generateCNABFile: generateCNABFileMutation.mutateAsync,
    refetchCNAB,
    
    // Provisões
    generateAccountingProvisions: generateAccountingProvisionsMutation.mutateAsync,
    refetchProvisions,
    
    // Métodos de conveniência
    generateAllFinancialDocuments,
    createCompletePaymentBatch,
    
    // Consultas com filtros
    getGeneratedTitles,
    getTaxGuides,
    getPaymentBatches,
    getCNABFiles,
    getAccountingProvisions
  };
};

