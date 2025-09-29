import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  Download, 
  Settings, 
  RefreshCw, 
  Calendar,
  Filter,
  Bell,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useUserCompany } from '@/hooks/useUserCompany';
import { useAnalytics } from '@/hooks/rh/analytics/useAnalytics';
import { KPICards } from '@/components/rh/analytics/KPICards';
import { PayrollTrendChart } from '@/components/rh/analytics/Charts/PayrollTrendChart';
import { DepartmentDistributionChart } from '@/components/rh/analytics/Charts/DepartmentDistributionChart';
import { CostBreakdownChart } from '@/components/rh/analytics/Charts/CostBreakdownChart';
import { AnalyticsFilters } from '@/services/rh/analytics/AnalyticsService';

export default function PayrollAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState<AnalyticsFilters>({
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    periodEnd: new Date().toISOString().split('T')[0],
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: userCompany, isLoading: loadingCompany } = useUserCompany();
  const {
    useKPIs,
    usePayrollTrendChart,
    useDepartmentDistributionChart,
    useCostBreakdownChart,
    useDashboardAlerts,
    markAlertAsRead,
    generatePayrollReport,
    generateComplianceReport,
    useReportHistory,
    downloadReport,
    deleteReport,
  } = useAnalytics();

  // Queries
  const { data: kpis, isLoading: kpisLoading } = useKPIs(filters);
  const { data: trendChart, isLoading: trendLoading } = usePayrollTrendChart(filters);
  const { data: departmentChart, isLoading: departmentLoading } = useDepartmentDistributionChart(filters);
  const { data: costChart, isLoading: costLoading } = useCostBreakdownChart(filters);
  const { data: alerts, isLoading: alertsLoading } = useDashboardAlerts();
  const { data: reportHistory, isLoading: historyLoading } = useReportHistory();

  // Mutations
  const markAlertAsReadMutation = markAlertAsRead;
  const generatePayrollReportMutation = generatePayrollReport;
  const generateComplianceReportMutation = generateComplianceReport;
  const downloadReportMutation = downloadReport;
  const deleteReportMutation = deleteReport;

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleFilterChange = (newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleGenerateReport = async (type: 'payroll' | 'compliance') => {
    const options = {
      format: 'pdf' as const,
      filters,
      includeCharts: true,
      includeDetails: true,
    };

    if (type === 'payroll') {
      generatePayrollReportMutation.mutate(options);
    } else {
      generateComplianceReportMutation.mutate(options);
    }
  };

  const handleDownloadReport = (reportId: string) => {
    downloadReportMutation.mutate(reportId);
  };

  const handleDeleteReport = (reportId: string) => {
    deleteReportMutation.mutate(reportId);
  };

  const handleMarkAlertAsRead = (alertId: string) => {
    markAlertAsReadMutation.mutate(alertId);
  };

  // =====================================================
  // RENDER HELPERS
  // =====================================================

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800', label: 'Concluído' },
      generating: { color: 'bg-blue-100 text-blue-800', label: 'Gerando' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Falhou' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.completed;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

  if (loadingCompany) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userCompany) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Usuário não está associado a uma empresa. Entre em contato com o administrador.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics de Folha de Pagamento</h1>
          <p className="text-muted-foreground">
            Dashboards e relatórios inteligentes para análise de dados
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Filtros de Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Data Inicial</label>
                <input
                  type="date"
                  value={filters.periodStart}
                  onChange={(e) => handleFilterChange({ periodStart: e.target.value })}
                  className="w-full mt-1 p-2 border rounded"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Data Final</label>
                <input
                  type="date"
                  value={filters.periodEnd}
                  onChange={(e) => handleFilterChange({ periodEnd: e.target.value })}
                  className="w-full mt-1 p-2 border rounded"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={() => setShowFilters(false)}
                  className="w-full"
                >
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 3).map((alert) => (
            <Alert key={alert.id} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
              <Bell className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <strong>{alert.title}</strong>
                  <p className="text-sm mt-1">{alert.message}</p>
                </div>
                {!alert.isRead && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkAlertAsRead(alert.id)}
                  >
                    Marcar como Lido
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alertas
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Tab Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* KPIs */}
          <KPICards data={kpis || []} isLoading={kpisLoading} />

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PayrollTrendChart 
              data={trendChart} 
              isLoading={trendLoading} 
            />
            <DepartmentDistributionChart 
              data={departmentChart} 
              isLoading={departmentLoading} 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CostBreakdownChart 
              data={costChart} 
              isLoading={costLoading} 
            />
            
            {/* Card de Ações Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => handleGenerateReport('payroll')}
                  disabled={generatePayrollReportMutation.isPending}
                  className="w-full justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Relatório de Folha
                </Button>
                <Button 
                  onClick={() => handleGenerateReport('compliance')}
                  disabled={generateComplianceReportMutation.isPending}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Gerar Relatório de Conformidade
                </Button>
                <Button 
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Relatórios */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Relatórios</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border rounded animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              ) : reportHistory && reportHistory.length > 0 ? (
                <div className="space-y-3">
                  {reportHistory.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded">
                      <div className="flex items-center space-x-4">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium">{report.reportName}</div>
                          <div className="text-sm text-gray-500">
                            {formatDate(report.generatedAt)} • {report.reportType}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(report.status)}
                        {report.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadReport(report.id)}
                            disabled={downloadReportMutation.isPending}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteReport(report.id)}
                          disabled={deleteReportMutation.isPending}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum relatório gerado ainda</p>
                  <p className="text-sm">Gere seu primeiro relatório usando as ações rápidas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Alertas */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alertas e Notificações</CardTitle>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="p-4 border rounded animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : alerts && alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <Alert key={alert.id} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                      <Bell className="h-4 w-4" />
                      <AlertDescription className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-sm mt-1">{alert.message}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(alert.createdAt)}
                          </div>
                        </div>
                        {!alert.isRead && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAlertAsRead(alert.id)}
                          >
                            Marcar como Lido
                          </Button>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum alerta no momento</p>
                  <p className="text-sm">Você será notificado quando houver alertas importantes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Configurações */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Configurações em desenvolvimento</p>
                <p className="text-sm">Em breve você poderá personalizar seu dashboard</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

