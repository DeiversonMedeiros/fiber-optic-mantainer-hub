import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Image, 
  Download, 
  Zap, 
  TrendingUp, 
  Clock,
  HardDrive
} from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  imageCount: number;
  totalImageSize: number;
  compressedImageSize: number;
  compressionRatio: number;
  cacheHitRate: number;
}

interface PerformanceDashboardProps {
  metrics: PerformanceMetrics;
  className?: string;
}

export function PerformanceDashboard({ metrics, className = '' }: PerformanceDashboardProps) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPerformanceColor = (ratio: number): string => {
    if (ratio >= 80) return 'text-green-600';
    if (ratio >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getLoadTimeColor = (time: number): string => {
    if (time <= 1000) return 'text-green-600';
    if (time <= 3000) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        Métricas de Performance
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Tempo de Carregamento */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Tempo de Carregamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-bold ${getLoadTimeColor(metrics.loadTime)}`}>
                {metrics.loadTime.toFixed(0)}ms
              </span>
              <Badge variant={metrics.loadTime <= 1000 ? 'default' : 'secondary'}>
                {metrics.loadTime <= 1000 ? 'Ótimo' : metrics.loadTime <= 3000 ? 'Bom' : 'Lento'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Total de Imagens */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Image className="w-4 h-4" />
              Total de Imagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600">
                {metrics.imageCount}
              </span>
              <Badge variant="outline">
                Carregadas
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Compressão */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Taxa de Compressão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${getPerformanceColor(metrics.compressionRatio)}`}>
                  {metrics.compressionRatio.toFixed(1)}%
                </span>
                <Badge variant={metrics.compressionRatio >= 60 ? 'default' : 'secondary'}>
                  {metrics.compressionRatio >= 60 ? 'Excelente' : 'Boa'}
                </Badge>
              </div>
              <Progress value={metrics.compressionRatio} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Tamanho Original */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Download className="w-4 h-4" />
              Tamanho Original
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-700">
                {formatBytes(metrics.totalImageSize)}
              </span>
              <Badge variant="outline">
                Original
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tamanho Comprimido */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Tamanho Comprimido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-green-600">
                {formatBytes(metrics.compressedImageSize)}
              </span>
              <Badge variant="outline" className="text-green-600">
                Otimizado
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Cache Hit Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Cache Hit Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${getPerformanceColor(metrics.cacheHitRate)}`}>
                  {metrics.cacheHitRate.toFixed(1)}%
                </span>
                <Badge variant={metrics.cacheHitRate >= 80 ? 'default' : 'secondary'}>
                  {metrics.cacheHitRate >= 80 ? 'Excelente' : 'Bom'}
                </Badge>
              </div>
              <Progress value={metrics.cacheHitRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Economia */}
      {metrics.totalImageSize > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-green-800">
              Resumo de Economia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {formatBytes(metrics.totalImageSize - metrics.compressedImageSize)}
                </div>
                <div className="text-sm text-gray-600">Economia de Espaço</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {((metrics.totalImageSize - metrics.compressedImageSize) / metrics.totalImageSize * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Redução de Tamanho</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.imageCount}
                </div>
                <div className="text-sm text-gray-600">Imagens Otimizadas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente compacto para exibição em linha
export function PerformanceSummary({ metrics }: { metrics: PerformanceMetrics }) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1">
        <Clock className="w-4 h-4 text-gray-500" />
        <span>{metrics.loadTime.toFixed(0)}ms</span>
      </div>
      <div className="flex items-center gap-1">
        <Image className="w-4 h-4 text-gray-500" />
        <span>{metrics.imageCount} imagens</span>
      </div>
      <div className="flex items-center gap-1">
        <Zap className="w-4 h-4 text-green-500" />
        <span>{metrics.compressionRatio.toFixed(1)}% comprimido</span>
      </div>
      <div className="flex items-center gap-1">
        <HardDrive className="w-4 h-4 text-blue-500" />
        <span>{formatBytes(metrics.compressedImageSize)}</span>
      </div>
    </div>
  );
}











