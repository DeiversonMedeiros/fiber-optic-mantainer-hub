import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertCircle
} from 'lucide-react';
import { KPIData } from '@/services/rh/analytics/AnalyticsService';

interface KPICardsProps {
  data: KPIData[];
  isLoading?: boolean;
  className?: string;
}

const iconMap = {
  Users: Users,
  DollarSign: DollarSign,
  CheckCircle: CheckCircle,
  Clock: Clock,
  AlertCircle: AlertCircle,
};

const colorMap = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  purple: 'text-purple-600',
  orange: 'text-orange-600',
  red: 'text-red-600',
  gray: 'text-gray-600',
};

const trendMap = {
  up: { icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-100' },
  down: { icon: TrendingDown, color: 'text-red-600', bgColor: 'bg-red-100' },
  stable: { icon: Minus, color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

export function KPICards({ data, isLoading = false, className = '' }: KPICardsProps) {
  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
      default:
        return new Intl.NumberFormat('pt-BR').format(value);
    }
  };

  const formatChange = (change: number, format: string) => {
    const prefix = change > 0 ? '+' : '';
    switch (format) {
      case 'currency':
        return `${prefix}${new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(Math.abs(change))}`;
      case 'percentage':
        return `${prefix}${Math.abs(change).toFixed(1)}%`;
      case 'number':
      default:
        return `${prefix}${new Intl.NumberFormat('pt-BR').format(Math.abs(change))}`;
    }
  };

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nenhum Dado</CardTitle>
            <AlertCircle className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">-</div>
            <p className="text-xs text-muted-foreground">Dados não disponíveis</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {data.map((kpi) => {
        const IconComponent = iconMap[kpi.icon as keyof typeof iconMap] || Users;
        const trend = trendMap[kpi.trend];
        const TrendIcon = trend.icon;

        return (
          <Card key={kpi.id} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.name}
              </CardTitle>
              <IconComponent className={`h-4 w-4 ${colorMap[kpi.color as keyof typeof colorMap] || 'text-gray-600'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatValue(kpi.value, kpi.format)}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <Badge 
                  variant="secondary" 
                  className={`${trend.bgColor} ${trend.color} text-xs px-2 py-1`}
                >
                  <TrendIcon className="h-3 w-3 mr-1" />
                  {formatChange(kpi.change, kpi.format)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  vs período anterior
                </span>
              </div>
            </CardContent>
            
            {/* Indicador de tendência */}
            <div className={`absolute top-0 right-0 w-1 h-full ${
              kpi.trend === 'up' ? 'bg-green-500' : 
              kpi.trend === 'down' ? 'bg-red-500' : 
              'bg-gray-400'
            }`} />
          </Card>
        );
      })}
    </div>
  );
}

