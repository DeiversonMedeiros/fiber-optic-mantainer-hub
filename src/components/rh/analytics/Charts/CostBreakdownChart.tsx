import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartData } from '@/services/rh/analytics/AnalyticsService';

interface CostBreakdownChartProps {
  data: ChartData | null;
  isLoading?: boolean;
  className?: string;
}

export function CostBreakdownChart({ data, isLoading = false, className = '' }: CostBreakdownChartProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Top 10 Rubricas por Valor</CardTitle>
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
          <CardTitle>Top 10 Rubricas por Valor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-lg font-medium mb-2">Nenhum Dado Disponível</div>
              <div className="text-sm">Não há dados de rubricas para o período selecionado.</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.data.map((item: any) => item.value || 0));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.data.map((item: any, index: number) => {
            const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            
            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 truncate flex-1 mr-2">
                    {item.name}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(item.value)}
                  </span>
                </div>
                
                {/* Barra de progresso */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                {/* Porcentagem */}
                <div className="text-xs text-gray-500 text-right">
                  {percentage.toFixed(1)}% do total
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Resumo */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total das Rubricas:</span>
            <span className="font-semibold text-gray-900">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(data.data.reduce((sum: number, item: any) => sum + item.value, 0))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

