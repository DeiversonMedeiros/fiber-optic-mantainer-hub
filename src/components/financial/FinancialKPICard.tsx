import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface FinancialKPICardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'default' | 'green' | 'red' | 'yellow' | 'blue' | 'orange';
  loading?: boolean;
}

const colorClasses = {
  default: 'text-foreground',
  green: 'text-green-600',
  red: 'text-red-600',
  yellow: 'text-yellow-600',
  blue: 'text-blue-600',
  orange: 'text-orange-600',
};

export function FinancialKPICard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = 'default',
  loading = false,
}: FinancialKPICardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted animate-pulse rounded" />
          {description && (
            <div className="h-4 bg-muted animate-pulse rounded mt-2" />
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClasses[color]}`}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <span className={`text-xs ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              vs período anterior
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



