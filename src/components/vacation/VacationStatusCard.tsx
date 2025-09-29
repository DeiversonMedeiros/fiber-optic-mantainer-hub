import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  User
} from 'lucide-react';
import { 
  useVacationStatus, 
  useVacationRights,
  VacationStatus,
  VacationRights
} from '@/hooks/useVacationNotifications';
import { cn } from '@/lib/utils';

interface VacationStatusCardProps {
  employeeId?: string;
  className?: string;
  showActions?: boolean;
  onScheduleVacation?: () => void;
  onViewDetails?: () => void;
}

const getStatusConfig = (status: string, daysRemaining: number) => {
  switch (status) {
    case 'vencida':
      return {
        icon: AlertTriangle,
        color: 'bg-red-100 text-red-800 border-red-200',
        iconColor: 'text-red-600',
        label: 'Férias Vencidas',
        description: 'Você deve tirar férias IMEDIATAMENTE',
        urgency: 'critical'
      };
    case 'vencendo':
      return {
        icon: Clock,
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        iconColor: 'text-orange-600',
        label: 'Férias Vencendo',
        description: `${daysRemaining} dias restantes`,
        urgency: 'high'
      };
    case 'atencao':
      return {
        icon: TrendingUp,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        iconColor: 'text-yellow-600',
        label: 'Atenção',
        description: `${daysRemaining} dias para vencimento`,
        urgency: 'medium'
      };
    case 'ok':
      return {
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800 border-green-200',
        iconColor: 'text-green-600',
        label: 'Em Dia',
        description: 'Suas férias estão em conformidade',
        urgency: 'low'
      };
    case 'inativo':
      return {
        icon: User,
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        iconColor: 'text-gray-600',
        label: 'Inativo',
        description: 'Funcionário inativo',
        urgency: 'low'
      };
    default:
      return {
        icon: Info,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        iconColor: 'text-blue-600',
        label: 'Status Desconhecido',
        description: 'Não foi possível determinar o status',
        urgency: 'low'
      };
  }
};

const getRightsConfig = (hasRights: boolean, daysWorked: number) => {
  if (!hasRights) {
    const daysToRight = 365 - daysWorked;
    return {
      icon: TrendingUp,
      color: 'bg-blue-100 text-blue-800',
      iconColor: 'text-blue-600',
      label: 'Sem Direito',
      description: `${daysToRight} dias para ter direito`,
      progress: (daysWorked / 365) * 100
    };
  }

  return {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800',
    iconColor: 'text-green-600',
    label: 'Com Direito',
    description: 'Você tem direito a férias',
    progress: 100
  };
};

interface StatusItemProps {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  value: string | number;
  description?: string;
  className?: string;
}

const StatusItem: React.FC<StatusItemProps> = ({
  icon: Icon,
  iconColor,
  label,
  value,
  description,
  className = ''
}) => (
  <div className={cn("flex items-center space-x-3", className)}>
    <Icon className={cn("h-5 w-5", iconColor)} />
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  </div>
);

const ProgressBar: React.FC<{ progress: number; className?: string }> = ({ 
  progress, 
  className = '' 
}) => (
  <div className={cn("w-full bg-gray-200 rounded-full h-2", className)}>
    <div 
      className="bg-primary h-2 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
    />
  </div>
);

export function VacationStatusCard({ 
  employeeId, 
  className = '',
  showActions = true,
  onScheduleVacation,
  onViewDetails
}: VacationStatusCardProps) {
  const { 
    data: vacationStatus, 
    isLoading: statusLoading, 
    error: statusError 
  } = useVacationStatus(employeeId);

  const { 
    data: vacationRights, 
    isLoading: rightsLoading, 
    error: rightsError 
  } = useVacationRights(employeeId);

  const isLoading = statusLoading || rightsLoading;
  const hasError = statusError || rightsError;

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Calendar className="h-5 w-5" />
            <span>Status das Férias</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Carregando status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasError) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Calendar className="h-5 w-5" />
            <span>Status das Férias</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600">Erro ao carregar status</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!vacationStatus || !vacationRights) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Calendar className="h-5 w-5" />
            <span>Status das Férias</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Info className="h-6 w-6 text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Nenhum dado disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = getStatusConfig(vacationStatus.status_ferias, vacationStatus.dias_restantes);
  const rightsConfig = getRightsConfig(vacationRights.tem_direito, vacationRights.dias_trabalhados);
  const StatusIcon = statusConfig.icon;
  const RightsIcon = rightsConfig.icon;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Status das Férias</span>
          </div>
          <Badge className={statusConfig.color}>
            {statusConfig.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Principal */}
        <div className={cn(
          "border rounded-lg p-4",
          statusConfig.color
        )}>
          <div className="flex items-center space-x-3 mb-2">
            <StatusIcon className={cn("h-6 w-6", statusConfig.iconColor)} />
            <div className="flex-1">
              <h3 className="font-medium text-sm">{statusConfig.label}</h3>
              <p className="text-xs">{statusConfig.description}</p>
            </div>
          </div>
        </div>

        {/* Direito a Férias */}
        <div className={cn(
          "border rounded-lg p-4",
          rightsConfig.color
        )}>
          <div className="flex items-center space-x-3 mb-2">
            <RightsIcon className={cn("h-5 w-5", rightsConfig.iconColor)} />
            <div className="flex-1">
              <h4 className="font-medium text-sm">{rightsConfig.label}</h4>
              <p className="text-xs">{rightsConfig.description}</p>
            </div>
          </div>
          <ProgressBar progress={rightsConfig.progress} />
        </div>

        {/* Detalhes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatusItem
            icon={Clock}
            iconColor="text-blue-600"
            label="Dias Trabalhados"
            value={vacationRights.dias_trabalhados}
            description="Dias desde a admissão"
          />
          
          {vacationStatus.ultima_feria && (
            <StatusItem
              icon={Calendar}
              iconColor="text-green-600"
              label="Última Férias"
              value={new Date(vacationStatus.ultima_feria).toLocaleDateString('pt-BR')}
              description="Data de fim da última férias"
            />
          )}
          
          {vacationStatus.data_vencimento && (
            <StatusItem
              icon={AlertTriangle}
              iconColor="text-orange-600"
              label="Vencimento"
              value={new Date(vacationStatus.data_vencimento).toLocaleDateString('pt-BR')}
              description="Data limite para tirar férias"
            />
          )}
          
          <StatusItem
            icon={TrendingDown}
            iconColor="text-purple-600"
            label="Dias Sem Férias"
            value={vacationStatus.dias_sem_ferias}
            description="Dias desde a última férias"
          />
        </div>

        {/* Ações */}
        {showActions && (
          <div className="flex space-x-2 pt-2 border-t">
            {vacationRights.tem_direito && (
              <Button
                size="sm"
                onClick={onScheduleVacation}
                className="flex-1"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Agendar Férias
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onViewDetails}
              className="flex-1"
            >
              <Info className="h-4 w-4 mr-2" />
              Ver Detalhes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
