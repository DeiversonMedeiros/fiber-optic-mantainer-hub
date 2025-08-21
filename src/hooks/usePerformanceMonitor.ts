import { useEffect, useRef, useCallback, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  imageCount: number;
  totalImageSize: number;
  compressedImageSize: number;
  compressionRatio: number;
  cacheHitRate: number;
}

interface UsePerformanceMonitorOptions {
  enableMonitoring?: boolean;
  logToConsole?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export function usePerformanceMonitor(options: UsePerformanceMonitorOptions = {}) {
  const {
    enableMonitoring = true,
    logToConsole = false,
    onMetricsUpdate
  } = options;

  const metricsRef = useRef<PerformanceMetrics>({
    loadTime: 0,
    imageCount: 0,
    totalImageSize: 0,
    compressedImageSize: 0,
    compressionRatio: 0,
    cacheHitRate: 0
  });

  const startTimeRef = useRef<number>(0);
  const imageLoadTimesRef = useRef<number[]>([]);
  const cacheHitsRef = useRef<number>(0);
  const cacheMissesRef = useRef<number>(0);

  const startMonitoring = useCallback(() => {
    if (!enableMonitoring) return;
    startTimeRef.current = performance.now();
  }, [enableMonitoring]);

  const recordImageLoad = useCallback((loadTime: number, originalSize: number, compressedSize: number) => {
    if (!enableMonitoring) return;

    imageLoadTimesRef.current.push(loadTime);
    metricsRef.current.imageCount++;
    metricsRef.current.totalImageSize += originalSize;
    metricsRef.current.compressedImageSize += compressedSize;

    // Calcular taxa de compressão
    if (metricsRef.current.totalImageSize > 0) {
      metricsRef.current.compressionRatio = 
        ((metricsRef.current.totalImageSize - metricsRef.current.compressedImageSize) / 
         metricsRef.current.totalImageSize) * 100;
    }

    // Calcular tempo médio de carregamento
    const avgLoadTime = imageLoadTimesRef.current.reduce((a, b) => a + b, 0) / imageLoadTimesRef.current.length;
    metricsRef.current.loadTime = avgLoadTime;

    // Calcular taxa de cache hit
    const totalCacheAttempts = cacheHitsRef.current + cacheMissesRef.current;
    if (totalCacheAttempts > 0) {
      metricsRef.current.cacheHitRate = (cacheHitsRef.current / totalCacheAttempts) * 100;
    }

    if (logToConsole) {
      console.log('📊 Performance Metrics:', {
        'Tempo de Carregamento Médio': `${avgLoadTime.toFixed(2)}ms`,
        'Total de Imagens': metricsRef.current.imageCount,
        'Tamanho Original': formatBytes(metricsRef.current.totalImageSize),
        'Tamanho Comprimido': formatBytes(metricsRef.current.compressedImageSize),
        'Taxa de Compressão': `${metricsRef.current.compressionRatio.toFixed(1)}%`,
        'Cache Hit Rate': `${metricsRef.current.cacheHitRate.toFixed(1)}%`
      });
    }

    onMetricsUpdate?.(metricsRef.current);
  }, [enableMonitoring, logToConsole, onMetricsUpdate]);

  const recordCacheHit = useCallback(() => {
    if (!enableMonitoring) return;
    cacheHitsRef.current++;
  }, [enableMonitoring]);

  const recordCacheMiss = useCallback(() => {
    if (!enableMonitoring) return;
    cacheMissesRef.current++;
  }, [enableMonitoring]);

  const getMetrics = useCallback(() => {
    return { ...metricsRef.current };
  }, []);

  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      loadTime: 0,
      imageCount: 0,
      totalImageSize: 0,
      compressedImageSize: 0,
      compressionRatio: 0,
      cacheHitRate: 0
    };
    imageLoadTimesRef.current = [];
    cacheHitsRef.current = 0;
    cacheMissesRef.current = 0;
  }, []);

  // Monitorar métricas de performance do navegador
  useEffect(() => {
    if (!enableMonitoring) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          metricsRef.current.loadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
        }
      }
    });

    observer.observe({ entryTypes: ['navigation'] });

    return () => observer.disconnect();
  }, [enableMonitoring]);

  return {
    startMonitoring,
    recordImageLoad,
    recordCacheHit,
    recordCacheMiss,
    getMetrics,
    resetMetrics
  };
}

// Função utilitária para formatar bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Hook para monitorar Core Web Vitals
export function useCoreWebVitals() {
  const [metrics, setMetrics] = useState({
    LCP: 0, // Largest Contentful Paint
    FID: 0, // First Input Delay
    CLS: 0  // Cumulative Layout Shift
  });

  useEffect(() => {
    // Monitorar LCP
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      setMetrics(prev => ({ ...prev, LCP: lastEntry.startTime }));
    });

    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // Monitorar FID
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0];
      setMetrics(prev => ({ ...prev, FID: firstEntry.processingStart - firstEntry.startTime }));
    });

    fidObserver.observe({ entryTypes: ['first-input'] });

    // Monitorar CLS
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      setMetrics(prev => ({ ...prev, CLS: clsValue }));
    });

    clsObserver.observe({ entryTypes: ['layout-shift'] });

    return () => {
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
    };
  }, []);

  return metrics;
}
