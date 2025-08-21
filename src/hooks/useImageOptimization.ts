import { useState, useEffect, useCallback, useRef } from 'react';
import { compressImage, validateImageFile, formatFileSize } from '@/lib/imageOptimization';

interface UseImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  enableCompression?: boolean;
  cacheTimeout?: number;
}

interface OptimizedImageData {
  url: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  isCompressed: boolean;
  loading: boolean;
  error: string | null;
}

export function useImageOptimization(
  imageUrl: string,
  options: UseImageOptimizationOptions = {}
) {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'jpeg',
    enableCompression = true,
    cacheTimeout = 5 * 60 * 1000 // 5 minutos
  } = options;

  const [imageData, setImageData] = useState<OptimizedImageData>({
    url: '',
    originalSize: 0,
    optimizedSize: 0,
    compressionRatio: 0,
    isCompressed: false,
    loading: true,
    error: null
  });

  const cacheRef = useRef<Map<string, OptimizedImageData>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  const optimizeImage = useCallback(async (url: string) => {
    // Verificar cache
    const cacheKey = `${url}_${maxWidth}_${maxHeight}_${quality}_${format}`;
    const cached = cacheRef.current.get(cacheKey);
    
    if (cached && Date.now() - (cached as any).timestamp < cacheTimeout) {
      setImageData(cached);
      return;
    }

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setImageData(prev => ({ ...prev, loading: true, error: null }));

      // Fazer fetch da imagem
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const file = new File([blob], 'image.jpg', { type: blob.type });

      // Validar arquivo
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error || 'Arquivo inválido');
      }

      let optimizedUrl = url;
      let originalSize = file.size;
      let optimizedSize = file.size;
      let compressionRatio = 0;
      let isCompressed = false;

      // Comprimir se habilitado
      if (enableCompression) {
        try {
          const optimized = await compressImage(file, {
            maxWidth,
            maxHeight,
            quality,
            format
          });

          optimizedUrl = optimized.url;
          optimizedSize = optimized.optimizedSize;
          compressionRatio = optimized.compressionRatio;
          isCompressed = true;
        } catch (error) {
          console.warn('Falha na compressão, usando imagem original:', error);
        }
      }

      const result: OptimizedImageData = {
        url: optimizedUrl,
        originalSize,
        optimizedSize,
        compressionRatio,
        isCompressed,
        loading: false,
        error: null
      };

      // Armazenar no cache
      cacheRef.current.set(cacheKey, {
        ...result,
        timestamp: Date.now()
      });

      setImageData(result);

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Requisição cancelada
      }

      setImageData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  }, [maxWidth, maxHeight, quality, format, enableCompression, cacheTimeout]);

  useEffect(() => {
    if (!imageUrl) {
      setImageData(prev => ({ ...prev, loading: false }));
      return;
    }

    optimizeImage(imageUrl);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [imageUrl, optimizeImage]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const getFormattedSizes = useCallback(() => ({
    original: formatFileSize(imageData.originalSize),
    optimized: formatFileSize(imageData.optimizedSize),
    saved: formatFileSize(imageData.originalSize - imageData.optimizedSize)
  }), [imageData.originalSize, imageData.optimizedSize]);

  return {
    ...imageData,
    clearCache,
    getFormattedSizes,
    retry: () => optimizeImage(imageUrl)
  };
}

// Hook para múltiplas imagens
export function useMultipleImageOptimization(
  imageUrls: string[],
  options: UseImageOptimizationOptions = {}
) {
  const [results, setResults] = useState<Map<string, OptimizedImageData>>(new Map());

  useEffect(() => {
    const processImages = async () => {
      const newResults = new Map<string, OptimizedImageData>();

      for (const url of imageUrls) {
        if (!url) continue;

        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const file = new File([blob], 'image.jpg', { type: blob.type });

          const validation = validateImageFile(file);
          if (!validation.valid) {
            newResults.set(url, {
              url,
              originalSize: 0,
              optimizedSize: 0,
              compressionRatio: 0,
              isCompressed: false,
              loading: false,
              error: validation.error || 'Arquivo inválido'
            });
            continue;
          }

          let optimizedUrl = url;
          let originalSize = file.size;
          let optimizedSize = file.size;
          let compressionRatio = 0;
          let isCompressed = false;

          if (options.enableCompression) {
            try {
              const optimized = await compressImage(file, {
                maxWidth: options.maxWidth || 1920,
                maxHeight: options.maxHeight || 1080,
                quality: options.quality || 0.8,
                format: options.format || 'jpeg'
              });

              optimizedUrl = optimized.url;
              optimizedSize = optimized.optimizedSize;
              compressionRatio = optimized.compressionRatio;
              isCompressed = true;
            } catch (error) {
              console.warn('Falha na compressão para:', url, error);
            }
          }

          newResults.set(url, {
            url: optimizedUrl,
            originalSize,
            optimizedSize,
            compressionRatio,
            isCompressed,
            loading: false,
            error: null
          });

        } catch (error) {
          newResults.set(url, {
            url,
            originalSize: 0,
            optimizedSize: 0,
            compressionRatio: 0,
            isCompressed: false,
            loading: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

      setResults(newResults);
    };

    processImages();
  }, [imageUrls, options]);

  return results;
}











