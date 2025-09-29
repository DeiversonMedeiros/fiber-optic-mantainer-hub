import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartData } from '@/services/rh/analytics/AnalyticsService';

interface PayrollTrendChartProps {
  data: ChartData | null;
  isLoading?: boolean;
  className?: string;
}

export function PayrollTrendChart({ data, isLoading = false, className = '' }: PayrollTrendChartProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Evolução da Folha de Pagamento</CardTitle>
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
          <CardTitle>Evolução da Folha de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-lg font-medium mb-2">Nenhum Dado Disponível</div>
              <div className="text-sm">Não há dados de folha de pagamento para o período selecionado.</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Simulação de gráfico (em produção, usar biblioteca como Chart.js, Recharts, etc.)
  const maxValue = Math.max(...data.data.map((item: any) => item.value || 0));
  const minValue = Math.min(...data.data.map((item: any) => item.value || 0));
  const range = maxValue - minValue;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 relative">
          {/* Simulação de gráfico de linha */}
          <div className="absolute inset-0 flex items-end justify-between px-4 pb-4">
            {data.data.map((item: any, index: number) => {
              const height = range > 0 ? ((item.value - minValue) / range) * 200 : 100;
              const isLast = index === data.data.length - 1;
              
              return (
                <div key={index} className="flex flex-col items-center space-y-2">
                  {/* Barra do gráfico */}
                  <div className="relative">
                    <div 
                      className="w-8 bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                      style={{ height: `${height}px` }}
                    />
                    {/* Valor no topo */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700 whitespace-nowrap">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        notation: 'compact'
                      }).format(item.value)}
                    </div>
                  </div>
                  
                  {/* Data na base */}
                  <div className="text-xs text-gray-600 text-center">
                    {item.date}
                  </div>
                  
                  {/* Linha conectora para o próximo ponto */}
                  {!isLast && (
                    <div className="absolute top-0 left-8 w-16 h-0.5 bg-blue-300 transform translate-y-1/2" />
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Eixo Y simulado */}
          <div className="absolute left-0 top-0 bottom-4 w-8 flex flex-col justify-between text-xs text-gray-500">
            <div>{new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              notation: 'compact'
            }).format(maxValue)}</div>
            <div>{new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              notation: 'compact'
            }).format(minValue)}</div>
          </div>
        </div>
        
        {/* Legenda */}
        <div className="mt-4 flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Valor da Folha</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

