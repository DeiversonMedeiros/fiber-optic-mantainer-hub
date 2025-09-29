import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnalyticsService, AnalyticsFilters, KPIData, ChartData, DashboardConfig, ReportTemplate, UserPreferences, DashboardAlert } from '@/services/rh/analytics/AnalyticsService';
import { ReportGeneratorService, ReportGenerationOptions, ReportHistory } from '@/services/rh/analytics/ReportGeneratorService';
import { useUserCompany } from '@/hooks/useUserCompany';
import { useToast } from '@/hooks/use-toast';

// =====================================================
// HOOK PRINCIPAL DE ANALYTICS
// =====================================================

export const useAnalytics = () => {
  const { data: userCompany } = useUserCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analyticsService = userCompany ? new AnalyticsService(userCompany.id) : null;
  const reportService = userCompany ? new ReportGeneratorService(userCompany.id) : null;

  // =====================================================
  // KPIs E MÉTRICAS
  // =====================================================

  const useKPIs = (filters: AnalyticsFilters) => {
    return useQuery({
      queryKey: ['analytics', 'kpis', userCompany?.id, filters],
      queryFn: () => analyticsService?.getKPIs(filters) || Promise.resolve([]),
      enabled: !!analyticsService,
      staleTime: 5 * 60 * 1000, // 5 minutos
    });
  };

  const usePayrollTrendChart = (filters: AnalyticsFilters) => {
    return useQuery({
      queryKey: ['analytics', 'payroll-trend', userCompany?.id, filters],
      queryFn: () => analyticsService?.getPayrollTrendChart(filters) || Promise.resolve(null),
      enabled: !!analyticsService,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useDepartmentDistributionChart = (filters: AnalyticsFilters) => {
    return useQuery({
      queryKey: ['analytics', 'department-distribution', userCompany?.id, filters],
      queryFn: () => analyticsService?.getDepartmentDistributionChart(filters) || Promise.resolve(null),
      enabled: !!analyticsService,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useCostBreakdownChart = (filters: AnalyticsFilters) => {
    return useQuery({
      queryKey: ['analytics', 'cost-breakdown', userCompany?.id, filters],
      queryFn: () => analyticsService?.getCostBreakdownChart(filters) || Promise.resolve(null),
      enabled: !!analyticsService,
      staleTime: 5 * 60 * 1000,
    });
  };

  // =====================================================
  // CONFIGURAÇÕES DE DASHBOARD
  // =====================================================

  const useDashboardConfigs = () => {
    return useQuery({
      queryKey: ['analytics', 'dashboard-configs', userCompany?.id],
      queryFn: () => analyticsService?.getDashboardConfigs() || Promise.resolve([]),
      enabled: !!analyticsService,
    });
  };

  const saveDashboardConfig = useMutation({
    mutationFn: (config: Omit<DashboardConfig, 'id' | 'createdAt' | 'updatedAt'>) => 
      analyticsService?.saveDashboardConfig(config) || Promise.reject('Serviço não disponível'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard-configs'] });
      toast({
        title: 'Sucesso!',
        description: 'Configuração de dashboard salva com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro!',
        description: 'Não foi possível salvar a configuração do dashboard.',
        variant: 'destructive',
      });
    },
  });

  const updateDashboardConfig = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<DashboardConfig> }) => 
      analyticsService?.updateDashboardConfig(id, updates) || Promise.reject('Serviço não disponível'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard-configs'] });
      toast({
        title: 'Sucesso!',
        description: 'Configuração de dashboard atualizada com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro!',
        description: 'Não foi possível atualizar a configuração do dashboard.',
        variant: 'destructive',
      });
    },
  });

  const deleteDashboardConfig = useMutation({
    mutationFn: (id: string) => 
      analyticsService?.deleteDashboardConfig(id) || Promise.reject('Serviço não disponível'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard-configs'] });
      toast({
        title: 'Sucesso!',
        description: 'Configuração de dashboard removida com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro!',
        description: 'Não foi possível remover a configuração do dashboard.',
        variant: 'destructive',
      });
    },
  });

  // =====================================================
  // TEMPLATES DE RELATÓRIOS
  // =====================================================

  const useReportTemplates = () => {
    return useQuery({
      queryKey: ['analytics', 'report-templates', userCompany?.id],
      queryFn: () => analyticsService?.getReportTemplates() || Promise.resolve([]),
      enabled: !!analyticsService,
    });
  };

  const saveReportTemplate = useMutation({
    mutationFn: (template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>) => 
      analyticsService?.saveReportTemplate(template) || Promise.reject('Serviço não disponível'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'report-templates'] });
      toast({
        title: 'Sucesso!',
        description: 'Template de relatório salvo com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro!',
        description: 'Não foi possível salvar o template de relatório.',
        variant: 'destructive',
      });
    },
  });

  // =====================================================
  // PREFERÊNCIAS DO USUÁRIO
  // =====================================================

  const useUserPreferences = () => {
    return useQuery({
      queryKey: ['analytics', 'user-preferences', userCompany?.id],
      queryFn: () => analyticsService?.getUserPreferences() || Promise.resolve(null),
      enabled: !!analyticsService,
    });
  };

  const saveUserPreferences = useMutation({
    mutationFn: (preferences: Partial<UserPreferences>) => 
      analyticsService?.saveUserPreferences(preferences) || Promise.reject('Serviço não disponível'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'user-preferences'] });
      toast({
        title: 'Sucesso!',
        description: 'Preferências salvas com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro!',
        description: 'Não foi possível salvar as preferências.',
        variant: 'destructive',
      });
    },
  });

  // =====================================================
  // ALERTAS
  // =====================================================

  const useDashboardAlerts = () => {
    return useQuery({
      queryKey: ['analytics', 'dashboard-alerts', userCompany?.id],
      queryFn: () => analyticsService?.getDashboardAlerts() || Promise.resolve([]),
      enabled: !!analyticsService,
      refetchInterval: 30000, // Atualizar a cada 30 segundos
    });
  };

  const markAlertAsRead = useMutation({
    mutationFn: (alertId: string) => 
      analyticsService?.markAlertAsRead(alertId) || Promise.reject('Serviço não disponível'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard-alerts'] });
    },
    onError: (error) => {
      toast({
        title: 'Erro!',
        description: 'Não foi possível marcar o alerta como lido.',
        variant: 'destructive',
      });
    },
  });

  // =====================================================
  // GERAÇÃO DE RELATÓRIOS
  // =====================================================

  const useReportHistory = () => {
    return useQuery({
      queryKey: ['analytics', 'report-history', userCompany?.id],
      queryFn: () => reportService?.getReportHistory() || Promise.resolve([]),
      enabled: !!reportService,
    });
  };

  const generatePayrollReport = useMutation({
    mutationFn: (options: ReportGenerationOptions) => 
      reportService?.generatePayrollReport(options) || Promise.reject('Serviço não disponível'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'report-history'] });
      toast({
        title: 'Relatório Gerado!',
        description: 'O relatório de folha de pagamento foi gerado com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro!',
        description: 'Não foi possível gerar o relatório de folha de pagamento.',
        variant: 'destructive',
      });
    },
  });

  const generateComplianceReport = useMutation({
    mutationFn: (options: ReportGenerationOptions) => 
      reportService?.generateComplianceReport(options) || Promise.reject('Serviço não disponível'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'report-history'] });
      toast({
        title: 'Relatório Gerado!',
        description: 'O relatório de conformidade foi gerado com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro!',
        description: 'Não foi possível gerar o relatório de conformidade.',
        variant: 'destructive',
      });
    },
  });

  const downloadReport = useMutation({
    mutationFn: (reportId: string) => 
      reportService?.downloadReport(reportId) || Promise.reject('Serviço não disponível'),
    onSuccess: (blob) => {
      // Criar link de download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Download Iniciado!',
        description: 'O download do relatório foi iniciado.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro!',
        description: 'Não foi possível baixar o relatório.',
        variant: 'destructive',
      });
    },
  });

  const deleteReport = useMutation({
    mutationFn: (reportId: string) => 
      reportService?.deleteReport(reportId) || Promise.reject('Serviço não disponível'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics', 'report-history'] });
      toast({
        title: 'Sucesso!',
        description: 'Relatório removido com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro!',
        description: 'Não foi possível remover o relatório.',
        variant: 'destructive',
      });
    },
  });

  // =====================================================
  // CACHE E PERFORMANCE
  // =====================================================

  const invalidateAnalyticsCache = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  };

  const prefetchAnalyticsData = (filters: AnalyticsFilters) => {
    if (!analyticsService) return;

    queryClient.prefetchQuery({
      queryKey: ['analytics', 'kpis', userCompany?.id, filters],
      queryFn: () => analyticsService.getKPIs(filters),
      staleTime: 5 * 60 * 1000,
    });

    queryClient.prefetchQuery({
      queryKey: ['analytics', 'payroll-trend', userCompany?.id, filters],
      queryFn: () => analyticsService.getPayrollTrendChart(filters),
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    // KPIs e Gráficos
    useKPIs,
    usePayrollTrendChart,
    useDepartmentDistributionChart,
    useCostBreakdownChart,
    
    // Configurações de Dashboard
    useDashboardConfigs,
    saveDashboardConfig,
    updateDashboardConfig,
    deleteDashboardConfig,
    
    // Templates de Relatórios
    useReportTemplates,
    saveReportTemplate,
    
    // Preferências do Usuário
    useUserPreferences,
    saveUserPreferences,
    
    // Alertas
    useDashboardAlerts,
    markAlertAsRead,
    
    // Geração de Relatórios
    useReportHistory,
    generatePayrollReport,
    generateComplianceReport,
    downloadReport,
    deleteReport,
    
    // Cache e Performance
    invalidateAnalyticsCache,
    prefetchAnalyticsData,
  };
};

