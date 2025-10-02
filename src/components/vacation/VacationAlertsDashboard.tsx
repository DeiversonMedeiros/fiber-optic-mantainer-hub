import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Clock, 
  Users, 
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  Bell,
  Eye,
  EyeOff,
  Download,
  Filter,
  Search,
  CheckCircle,
  Minus
} from 'lucide-react';
import { 
  useVacationAlerts,
  useVacationDashboardMetrics,
  useVacationSystemStats,
  useEmployeesWithOverdueVacations,
  useEmployeesNearVacationExpiry,
  VacationAlert,
  VacationDashboardMetrics
} from '@/hooks/useVacationDashboard';
import { useGenerateVacationNotifications } from '@/hooks/useVacationNotifications';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VacationAlertsDashboardProps {
  companyId?: string;
  className?: string;
  showActions?: boolean;
  onGenerateNotifications?: () => void;
  onExportReport?: () => void;
}

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'critical':
      return {
        icon: AlertTriangle,
        color: 'bg-red-100 text-red-800 border-red-200',
        iconColor: 'text-red-600',
        badgeColor: 'bg-red-500'
      };
    case 'high':
      return {
        icon: Clock,
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        iconColor: 'text-orange-600',
        badgeColor: 'bg-orange-500'
      };
    case 'medium':
      return {
        icon: TrendingUp,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        iconColor: 'text-yellow-600',
        badgeColor: 'bg-yellow-500'
      };
    case 'low':
      return {
        icon: TrendingDown,
        color: 'bg-green-100 text-green-800 border-green-200',
        iconColor: 'text-green-600',
        badgeColor: 'bg-green-500'
      };
    default:
      return {
        icon: Bell,
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        iconColor: 'text-gray-600',
        badgeColor: 'bg-gray-500'
      };
  }
};

const AlertCard: React.FC<{
  alert: VacationAlert;
  onMarkAsRead?: (id: string) => void;
}> = ({ alert, onMarkAsRead }) => {
  const priorityConfig = getPriorityConfig(alert.priority);
  const Icon = priorityConfig.icon;

  return (
    <div className={cn(
      "border rounded-lg p-4 transition-all duration-200 hover:shadow-md",
      priorityConfig.color
    )}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Icon className={cn("h-4 w-4", priorityConfig.iconColor)} />
          <Badge 
            variant="default" 
            className={cn("text-white", priorityConfig.badgeColor)}
          >
            {alert.priority}
          </Badge>
        </div>
        {onMarkAsRead && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMarkAsRead(alert.funcionario)}
            className="h-6 w-6 p-0"
          >
            <Eye className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      <h4 className="font-medium text-sm mb-1">{alert.funcionario}</h4>
      <p className="text-xs text-gray-600 mb-2">{alert.message}</p>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {alert.days_remaining > 0
            ? `${alert.days_remaining} dias restantes`
            : alert.days_remaining === 0
            ? 'Vence hoje'
            : `${Math.abs(alert.days_remaining)} dias em atraso`
          }
        </span>
        <span>{alert.email}</span>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: number;
  icon: React.ElementType;
  iconColor: string;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}> = ({ title, value, icon: Icon, iconColor, description, trend }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-green-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex flex-col items-end">
            <Icon className={cn("h-8 w-8", iconColor)} />
            {trend && (
              <div className="flex items-center mt-1">
                {getTrendIcon()}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function VacationAlertsDashboard({ 
  companyId, 
  className = '',
  showActions = true,
  onGenerateNotifications,
  onExportReport
}: VacationAlertsDashboardProps) {
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const { toast } = useToast();

  const { 
    data: alerts = [], 
    isLoading: alertsLoading 
  } = useVacationAlerts(companyId);

  const { 
    data: metrics, 
    isLoading: metricsLoading 
  } = useVacationDashboardMetrics(companyId);

  const { 
    data: systemStats, 
    isLoading: statsLoading 
  } = useVacationSystemStats();

  const { 
    data: overdueEmployees = [], 
    isLoading: overdueLoading 
  } = useEmployeesWithOverdueVacations(companyId);

  const { 
    data: nearExpiryEmployees = [], 
    isLoading: nearExpiryLoading 
  } = useEmployeesNearVacationExpiry(companyId);

  const generateNotificationsMutation = useGenerateVacationNotifications();

  const isLoading = alertsLoading || metricsLoading || statsLoading;

  const handleGenerateNotifications = async () => {
    try {
      await generateNotificationsMutation.mutateAsync(undefined);
      if (onGenerateNotifications) {
        onGenerateNotifications();
      }
    } catch (error) {
      console.error('Erro ao gerar notificações:', error);
    }
  };

  const handleExportReport = () => {
    if (onExportReport) {
      onExportReport();
    } else {
      toast({
        title: "Exportar Relatório",
        description: "Funcionalidade de exportação será implementada em breve.",
      });
    }
  };

  // Filtrar alertas
  const filteredAlerts = alerts.filter(alert => {
    if (filterPriority !== 'all' && alert.priority !== filterPriority) {
      return false;
    }
    if (showOverdueOnly && alert.priority !== 'critical') {
      return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Dashboard de Alertas de Férias</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header com Ações */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Alertas de Férias</h2>
          <p className="text-muted-foreground">
            Monitore alertas críticos e conformidade de férias
          </p>
        </div>
        {showActions && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportReport}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button
              size="sm"
              onClick={handleGenerateNotifications}
              disabled={generateNotificationsMutation.isPending}
            >
              <RefreshCw className={cn(
                "h-4 w-4 mr-2",
                generateNotificationsMutation.isPending && "animate-spin"
              )} />
              Gerar Notificações
            </Button>
          </div>
        )}
      </div>

      {/* Métricas Principais */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total de Funcionários"
            value={metrics.total_funcionarios}
            icon={Users}
            iconColor="text-blue-600"
            description="Funcionários ativos"
          />
          <MetricCard
            title="Férias Vencidas"
            value={metrics.ferias_vencidas}
            icon={AlertTriangle}
            iconColor="text-red-600"
            description="Requer ação imediata"
            trend={metrics.ferias_vencidas > 0 ? 'up' : 'neutral'}
          />
          <MetricCard
            title="Férias Vencendo"
            value={metrics.ferias_vencendo}
            icon={Clock}
            iconColor="text-orange-600"
            description="Próximos 3 meses"
            trend={metrics.ferias_vencendo > 0 ? 'up' : 'neutral'}
          />
          <MetricCard
            title="Em Conformidade"
            value={metrics.ferias_ok}
            icon={Calendar}
            iconColor="text-green-600"
            description="Férias em dia"
            trend={metrics.ferias_ok > metrics.total_funcionarios * 0.8 ? 'down' : 'neutral'}
          />
        </div>
      )}

      {/* Status do Sistema */}
      {systemStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Status do Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {systemStats.notificacoes_ativas}
                </p>
                <p className="text-sm text-muted-foreground">Notificações Ativas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {systemStats.notificacoes_criticas}
                </p>
                <p className="text-sm text-muted-foreground">Alertas Críticos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {systemStats.funcionarios_com_direito}
                </p>
                <p className="text-sm text-muted-foreground">Com Direito a Férias</p>
              </div>
            </div>
            {systemStats.ultima_execucao && (
              <div className="mt-4 pt-4 border-t text-center">
                <p className="text-xs text-muted-foreground">
                  Última verificação: {new Date(systemStats.ultima_execucao).toLocaleString('pt-BR')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Prioridade:</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="all">Todas</option>
                <option value="critical">Críticas</option>
                <option value="high">Altas</option>
                <option value="medium">Médias</option>
                <option value="low">Baixas</option>
              </select>
            </div>
            <Button
              variant={showOverdueOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOverdueOnly(!showOverdueOnly)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Apenas Vencidas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alertas Críticos */}
      {filteredAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span>Alertas Críticos</span>
                <Badge variant="destructive">{filteredAlerts.length}</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAlerts.slice(0, 6).map((alert) => (
                <AlertCard
                  key={`${alert.funcionario}-${alert.created_at}`}
                  alert={alert}
                />
              ))}
            </div>
            {filteredAlerts.length > 6 && (
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  E mais {filteredAlerts.length - 6} alertas...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resumo de Conformidade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Funcionários com Férias Vencidas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Férias Vencidas</span>
              <Badge variant="destructive">{overdueEmployees.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueEmployees.length > 0 ? (
              <div className="space-y-2">
                {overdueEmployees.slice(0, 5).map((employee) => (
                  <div key={employee.employee_id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <div>
                      <p className="font-medium text-sm">{employee.employee_name}</p>
                      <p className="text-xs text-red-600">
                        {Math.abs(employee.dias_restantes)} dias em atraso
                      </p>
                    </div>
                  </div>
                ))}
                {overdueEmployees.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    E mais {overdueEmployees.length - 5} funcionários...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-green-600">Nenhuma férias vencida!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Funcionários Próximos do Vencimento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span>Próximos do Vencimento</span>
              <Badge variant="secondary">{nearExpiryEmployees.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nearExpiryEmployees.length > 0 ? (
              <div className="space-y-2">
                {nearExpiryEmployees.slice(0, 5).map((employee) => (
                  <div key={employee.employee_id} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                    <div>
                      <p className="font-medium text-sm">{employee.employee_name}</p>
                      <p className="text-xs text-orange-600">
                        {employee.dias_restantes} dias restantes
                      </p>
                    </div>
                  </div>
                ))}
                {nearExpiryEmployees.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    E mais {nearExpiryEmployees.length - 5} funcionários...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-green-600">Nenhum funcionário próximo do vencimento!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
