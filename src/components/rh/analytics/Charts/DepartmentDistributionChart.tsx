import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartData } from '@/services/rh/analytics/AnalyticsService';

interface DepartmentDistributionChartProps {
  data: ChartData | null;
  isLoading?: boolean;
  className?: string;
}

const colors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
];

export function DepartmentDistributionChart({ data, isLoading = false, className = '' }: DepartmentDistributionChartProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Distribuição por Departamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded animate-pulse flex items-center justify-center">
            <div className="text-gray-500">Carregando gráfico...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Distribuição por Departamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-lg font-medium mb-2">Nenhum Dado Disponível</div>
              <div className="text-sm">Não há dados de funcionários por departamento.</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = data.data.reduce((sum: number, item: any) => sum + (item.value || 0), 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Gráfico de pizza simulado */}
          <div className="relative w-48 h-48 mx-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {data.data.map((item: any, index: number) => {
                const percentage = total > 0 ? (item.value / total) * 100 : 0;
                const angle = (percentage / 100) * 360;
                const radius = 40;
                const circumference = 2 * Math.PI * radius;
                const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = index === 0 ? 0 : 
                  data.data.slice(0, index).reduce((sum: number, prevItem: any) => 
                    sum - ((prevItem.value / total) * circumference), 0
                  );

                return (
                  <circle
                    key={index}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={colors[index % colors.length]}
                    strokeWidth="8"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                );
              })}
            </svg>
            
            {/* Centro do gráfico */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700">{total}</div>
                <div className="text-sm text-gray-500">Funcionários</div>
              </div>
            </div>
          </div>

          {/* Legenda */}
          <div className="space-y-2">
            {data.data.map((item: any, index: number) => {
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
              
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.value} ({percentage}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

