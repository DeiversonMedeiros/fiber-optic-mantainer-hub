import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { rhSupabase } from '@/integrations/supabase/client';
import { 
  BenefitConfiguration,
  BenefitConfigurationInsert,
  BenefitConfigurationUpdate,
  EmployeeBenefitAssignment,
  EmployeeBenefitAssignmentInsert,
  EmployeeBenefitAssignmentUpdate,
  MonthlyBenefitProcessing,
  MonthlyBenefitProcessingInsert,
  MonthlyBenefitProcessingUpdate,
  BenefitPayment,
  BenefitPaymentInsert,
  BenefitPaymentUpdate,
  PaymentMethod,
  PaymentStatus,
  BenefitStatistics,
  BulkPremiacaoImport,
  BulkPremiacaoImportResult,
  ProcessMonthlyBenefitsResult,
  ValidateProcessingResult,
  CreateBulkPaymentsResult
} from '@/integrations/supabase/rh-benefits-unified-types';
import { useToast } from '@/hooks/use-toast';

// =====================================================
// HOOKS PARA CONFIGURAÇÕES DE BENEFÍCIOS
// =====================================================

export function useBenefitConfigurations(companyId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: configurations, isLoading, error } = useQuery<BenefitConfiguration[]>({
    queryKey: ['benefitConfigurations', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('rh.benefit_configurations')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createConfiguration = useMutation({
    mutationFn: async (newConfig: BenefitConfigurationInsert) => {
      const { data, error } = await rhSupabase
        .from('rh.benefit_configurations')
        .insert(newConfig)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benefitConfigurations', companyId] });
      toast({ title: 'Sucesso', description: 'Configuração de benefício criada.' });
    },
    onError: (err) => {
      toast({ title: 'Erro', description: `Falha ao criar configuração: ${err.message}`, variant: 'destructive' });
    },
  });

  const updateConfiguration = useMutation({
    mutationFn: async ({ id, ...updates }: BenefitConfigurationUpdate) => {
      const { data, error } = await rhSupabase
        .from('rh.benefit_configurations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benefitConfigurations', companyId] });
      toast({ title: 'Sucesso', description: 'Configuração de benefício atualizada.' });
    },
    onError: (err) => {
      toast({ title: 'Erro', description: `Falha ao atualizar configuração: ${err.message}`, variant: 'destructive' });
    },
  });

  const deleteConfiguration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('rh.benefit_configurations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benefitConfigurations', companyId] });
      toast({ title: 'Sucesso', description: 'Configuração de benefício excluída.' });
    },
    onError: (err) => {
      toast({ title: 'Erro', description: `Falha ao excluir configuração: ${err.message}`, variant: 'destructive' });
    },
  });

  return {
    configurations,
    isLoading,
    error,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
  };
}

// =====================================================
// HOOKS PARA ATRIBUIÇÕES DE BENEFÍCIOS
// =====================================================

export function useEmployeeBenefitAssignments(companyId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: assignments, isLoading, error } = useQuery<EmployeeBenefitAssignment[]>({
    queryKey: ['employeeBenefitAssignments', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('rh.employee_benefit_assignments')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createAssignment = useMutation({
    mutationFn: async (newAssignment: EmployeeBenefitAssignmentInsert) => {
      const { data, error } = await rhSupabase
        .from('rh.employee_benefit_assignments')
        .insert(newAssignment)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeBenefitAssignments', companyId] });
      toast({ title: 'Sucesso', description: 'Atribuição de benefício criada.' });
    },
    onError: (err) => {
      toast({ title: 'Erro', description: `Falha ao criar atribuição: ${err.message}`, variant: 'destructive' });
    },
  });

  const updateAssignment = useMutation({
    mutationFn: async ({ id, ...updates }: EmployeeBenefitAssignmentUpdate) => {
      const { data, error } = await rhSupabase
        .from('rh.employee_benefit_assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeBenefitAssignments', companyId] });
      toast({ title: 'Sucesso', description: 'Atribuição de benefício atualizada.' });
    },
    onError: (err) => {
      toast({ title: 'Erro', description: `Falha ao atualizar atribuição: ${err.message}`, variant: 'destructive' });
    },
  });

  const deleteAssignment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('rh.employee_benefit_assignments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeBenefitAssignments', companyId] });
      toast({ title: 'Sucesso', description: 'Atribuição de benefício excluída.' });
    },
    onError: (err) => {
      toast({ title: 'Erro', description: `Falha ao excluir atribuição: ${err.message}`, variant: 'destructive' });
    },
  });

  return {
    assignments,
    isLoading,
    error,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  };
}

// =====================================================
// HOOKS PARA PROCESSAMENTO MENSAL
// =====================================================

export function useMonthlyBenefitProcessing(companyId: string, month?: number, year?: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = useMemo(() => ['monthlyBenefitProcessing', companyId, month, year], [companyId, month, year]);
  console.log('🔑 Query key:', queryKey);
  console.log('🔍 Hook instance ID:', Math.random().toString(36).substr(2, 9));
  
  const queryFn = useCallback(async () => {
    console.log('🔍 Query parameters:', { companyId, month, year });
    
    let query = rhSupabase
      .from('rh.monthly_benefit_processing')
      .select(`
        *,
        employees!inner(nome, matricula),
        benefit_configurations!inner(name, benefit_type)
      `)
      .eq('company_id', companyId);
    
    if (month) {
      console.log('📅 Filtering by month:', month);
      query = query.eq('month_reference', month);
    }
    if (year) {
      console.log('📅 Filtering by year:', year);
      query = query.eq('year_reference', year);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('❌ Query error:', error);
      throw error;
    }
    
    console.log('📊 Raw data from database:', data);
    console.log('📊 Raw data length:', data?.length);
    
    // Transformar os dados para o formato esperado pelo frontend
    const transformedData = data?.map(item => ({
      ...item,
      employee_name: item.employees?.nome,
      employee_matricula: item.employees?.matricula,
      benefit_name: item.benefit_configurations?.name,
      benefit_type: item.benefit_configurations?.benefit_type
    })) || [];
    
    console.log('🔄 Transformed data:', transformedData);
    console.log('🔄 Transformed data length:', transformedData.length);
    console.log('✅ Returning data to component');
    return transformedData;
  }, [companyId, month, year]);
  
  const { data: processing, isLoading, error } = useQuery<MonthlyBenefitProcessing[]>({
    queryKey,
    queryFn,
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });

  // Log do retorno da query
  console.log('📤 Query result:', { processing, isLoading, error });
  console.log('📤 Processing data type:', typeof processing);
  console.log('📤 Processing is array:', Array.isArray(processing));
  
  // Debug: Verificar se os dados estão sendo retornados corretamente
  if (processing) {
    console.log('✅ Processing data is available:', processing.length, 'items');
  } else {
    console.log('❌ Processing data is undefined or null');
  }

  // Retornar os dados diretamente sem processamento adicional
  return {
    data: processing,
    isLoading,
    error,
    processMonthlyBenefits: useMutation({
      mutationFn: useCallback(async ({ companyId, month, year }: { companyId: string; month: number; year: number }) => {
        const { data, error } = await rhSupabase.rpc('process_monthly_benefits_unified', {
          p_company_id: companyId,
          p_month: month,
          p_year: year
        });
        if (error) throw error;
        return data as ProcessMonthlyBenefitsResult[];
      }, []),
      onSuccess: useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['monthlyBenefitProcessing'] });
        queryClient.invalidateQueries({ queryKey: ['benefitStatistics'] });
        queryClient.refetchQueries({ queryKey: ['monthlyBenefitProcessing'] });
        queryClient.refetchQueries({ queryKey: ['benefitStatistics'] });
        console.log('🔄 Cache invalidated and refetched');
        toast({ title: 'Sucesso', description: 'Benefícios processados com sucesso.' });
      }, [queryClient, toast]),
      onError: useCallback((err) => {
        toast({ title: 'Erro', description: `Falha ao processar benefícios: ${err.message}`, variant: 'destructive' });
      }, [toast]),
    }),
    validateMonthlyBenefits: useMutation({
      mutationFn: useCallback(async ({ 
        companyId, 
        month, 
        year 
      }: { 
        companyId: string; 
        month: number; 
        year: number; 
      }) => {
        const { data, error } = await rhSupabase.rpc('validate_monthly_benefits', {
          p_company_id: companyId,
          p_month: month,
          p_year: year
        });
        if (error) throw error;
        return data;
      }, []),
      onSuccess: useCallback((data) => {
        queryClient.invalidateQueries({ queryKey: ['monthlyBenefitProcessing'] });
        queryClient.invalidateQueries({ queryKey: ['benefitStatistics'] });
        toast({ title: 'Sucesso', description: `${data} benefícios validados com sucesso.` });
      }, [queryClient, toast]),
      onError: useCallback((err) => {
        toast({ title: 'Erro', description: `Falha ao validar benefícios: ${err.message}`, variant: 'destructive' });
      }, [toast]),
    }),
    deleteProcessing: useMutation({
      mutationFn: useCallback(async (id: string) => {
        const { error } = await rhSupabase
          .from('rh.monthly_benefit_processing')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return id;
      }, []),
      onSuccess: useCallback((id) => {
        queryClient.invalidateQueries({ queryKey: ['monthlyBenefitProcessing'] });
        queryClient.invalidateQueries({ queryKey: ['benefitStatistics'] });
        console.log('Item excluído:', id);
      }, [queryClient]),
      onError: useCallback((err) => {
        console.error('Erro ao excluir item:', err);
      }, []),
    }),
    updateProcessing: useMutation({
      mutationFn: useCallback(async ({ id, ...updates }: { id: string; [key: string]: any }) => {
        const { data, error } = await rhSupabase
          .from('rh.monthly_benefit_processing')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }, []),
      onSuccess: useCallback((data) => {
        queryClient.invalidateQueries({ queryKey: ['monthlyBenefitProcessing'] });
        queryClient.invalidateQueries({ queryKey: ['benefitStatistics'] });
        console.log('Item atualizado:', data);
      }, [queryClient]),
      onError: useCallback((err) => {
        console.error('Erro ao atualizar item:', err);
      }, []),
    }),
  };
}

// =====================================================
// HOOKS PARA PAGAMENTOS
// =====================================================

export function useBenefitPayments(companyId: string, month?: number, year?: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: payments, isLoading, error } = useQuery<BenefitPayment[]>({
    queryKey: ['benefitPayments', companyId, month, year],
    queryFn: async () => {
      console.log('🔍 Payments query parameters:', { companyId, month, year });
      
      // Buscar benefícios validados da tabela de processamento
      let query = rhSupabase
        .from('rh.monthly_benefit_processing')
        .select(`
          *,
          employees!inner(nome, matricula),
          benefit_configurations!inner(name, benefit_type)
        `)
        .eq('company_id', companyId)
        .eq('status', 'validated');
      
      if (month) {
        console.log('📅 Filtering payments by month:', month);
        query = query.eq('month_reference', month);
      }
      if (year) {
        console.log('📅 Filtering payments by year:', year);
        query = query.eq('year_reference', year);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Payments query error:', error);
        throw error;
      }
      
      console.log('📊 Raw payments data:', data);
      console.log('📊 Raw payments data length:', data?.length);
      
      // Transformar para o formato de pagamentos
      const transformedData = data?.map(item => ({
        id: item.id,
        processing_id: item.id, // Usando o mesmo ID como processing_id
        company_id: item.company_id,
        payment_method: 'flash' as PaymentMethod, // Valor padrão
        payment_status: 'pending' as PaymentStatus,
        payment_value: item.final_value || 0,
        transaction_id: null,
        payment_date: null,
        employee_name: item.employees?.nome || '',
        employee_document: item.employees?.matricula || '',
        bank_account_data: null,
        created_at: item.created_at,
        updated_at: item.updated_at,
        created_by: null,
        updated_by: null,
        processing: {
          id: item.id,
          company_id: item.company_id,
          employee_id: item.employee_id,
          benefit_config_id: item.benefit_config_id,
          month_reference: item.month_reference,
          year_reference: item.year_reference,
          base_value: item.base_value,
          work_days: item.work_days,
          absence_days: item.absence_days,
          discount_value: item.discount_value,
          final_value: item.final_value,
          production_value: item.production_value,
          production_percentage: item.production_percentage,
          status: item.status,
          processed_at: item.processed_at,
          validated_at: item.validated_at,
          validated_by: item.validated_by,
          calculation_details: item.calculation_details,
          notes: item.notes,
          created_at: item.created_at,
          updated_at: item.updated_at,
          employee_name: item.employees?.nome,
          employee_matricula: item.employees?.matricula,
          benefit_name: item.benefit_configurations?.name,
          benefit_type: item.benefit_configurations?.benefit_type
        }
      })) || [];
      
      console.log('🔄 Transformed payments data:', transformedData);
      console.log('🔄 Transformed payments data length:', transformedData.length);
      console.log('✅ Returning payments data to component');
      
      return transformedData;
    },
    enabled: !!companyId,
  });

  console.log('🔍 useBenefitPayments hook result:');
  console.log('📊 payments:', payments);
  console.log('📊 payments length:', payments?.length);
  console.log('⏳ isLoading:', isLoading);
  console.log('❌ error:', error);

  const createBulkPayments = useMutation({
    mutationFn: async ({ 
      companyId, 
      month, 
      year, 
      paymentMethod, 
      employeeIds 
    }: { 
      companyId: string; 
      month: number; 
      year: number; 
      paymentMethod: string; 
      employeeIds?: string[] 
    }) => {
      const { data, error } = await rhSupabase.rpc('create_bulk_benefit_payments', {
        p_company_id: companyId,
        p_month: month,
        p_year: year,
        p_payment_method: paymentMethod,
        p_employee_ids: employeeIds || null
      });
      if (error) throw error;
      return data as CreateBulkPaymentsResult[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benefitPayments', companyId, month, year] });
      queryClient.invalidateQueries({ queryKey: ['monthlyBenefitProcessing', companyId, month, year] });
      toast({ title: 'Sucesso', description: 'Pagamentos criados com sucesso.' });
    },
    onError: (err) => {
      toast({ title: 'Erro', description: `Falha ao criar pagamentos: ${err.message}`, variant: 'destructive' });
    },
  });

  const updatePayment = useMutation({
    mutationFn: async ({ id, ...updates }: BenefitPaymentUpdate) => {
      const { data, error } = await rhSupabase
        .from('rh.benefit_payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benefitPayments', companyId, month, year] });
      toast({ title: 'Sucesso', description: 'Pagamento atualizado.' });
    },
    onError: (err) => {
      toast({ title: 'Erro', description: `Falha ao atualizar pagamento: ${err.message}`, variant: 'destructive' });
    },
  });

  return {
    payments,
    isLoading,
    error,
    createBulkPayments,
    updatePayment,
  };
}

// =====================================================
// HOOKS PARA ESTATÍSTICAS
// =====================================================

export function useBenefitStatistics(companyId: string, month?: number, year?: number) {
  const { data: statistics, isLoading, error } = useQuery<BenefitStatistics[]>({
    queryKey: ['benefitStatistics', companyId, month, year],
    queryFn: async () => {
      const { data, error } = await rhSupabase.rpc('get_benefits_statistics', {
        p_company_id: companyId,
        p_month: month || null,
        p_year: year || null
      });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  return {
    statistics,
    isLoading,
    error,
  };
}

// =====================================================
// HOOKS PARA IMPORTAÇÃO EM MASSA
// =====================================================

export function useBulkPremiacaoImport(companyId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const importBulkPremiacoes = useMutation({
    mutationFn: async (premiacoes: BulkPremiacaoImport[]) => {
      const { data, error } = await rhSupabase.rpc('import_bulk_premiacoes', {
        p_company_id: companyId,
        p_premiacoes: JSON.stringify(premiacoes)
      });
      if (error) throw error;
      return data as BulkPremiacaoImportResult[];
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      
      queryClient.invalidateQueries({ queryKey: ['employeeBenefitAssignments', companyId] });
      
      if (errorCount === 0) {
        toast({ title: 'Sucesso', description: `${successCount} premiações importadas com sucesso.` });
      } else {
        toast({ 
          title: 'Importação concluída', 
          description: `${successCount} sucessos, ${errorCount} erros. Verifique os detalhes.`,
          variant: 'destructive'
        });
      }
    },
    onError: (err) => {
      toast({ title: 'Erro', description: `Falha na importação: ${err.message}`, variant: 'destructive' });
    },
  });

  return {
    importBulkPremiacoes,
  };
}
