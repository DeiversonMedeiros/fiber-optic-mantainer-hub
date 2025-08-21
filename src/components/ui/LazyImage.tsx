import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageOff } from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
  onClick?: () => void;
  priority?: boolean;
  sizes?: string;
}

export function LazyImage({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder,
  onLoad,
  onError,
  onClick,
  priority = false,
  sizes = '100vw'
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (priority) return; // Não usar observer para imagens prioritárias

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Carregar 50px antes de entrar na viewport
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [priority]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // Placeholder inteligente baseado na URL
  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    
    // Gerar placeholder baseado no hash da URL
    const hash = src.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const colors = [
      'bg-blue-100', 'bg-green-100', 'bg-yellow-100', 
      'bg-red-100', 'bg-purple-100', 'bg-pink-100'
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  if (hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}
        style={{ width, height }}
      >
        <div className="flex flex-col items-center space-y-2">
          <ImageOff className="w-8 h-8" />
          <span className="text-xs">Erro ao carregar</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Placeholder/Skeleton */}
      {!isLoaded && (
        <div className={`absolute inset-0 ${getPlaceholder()}`}>
          <Skeleton className="w-full h-full" />
        </div>
      )}
      
      {/* Imagem */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          width={width}
          height={height}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
          onClick={onClick}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </div>
  );
}

// Componente otimizado para thumbnails
export function OptimizedThumbnail({
  src,
  alt,
  className = '',
  onClick
}: {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <LazyImage
      src={src}
      alt={alt}
      className={`object-cover cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      width={150}
      height={150}
      onClick={onClick}
    />
  );
}

// Componente otimizado para imagens completas
export function OptimizedFullImage({
  src,
  alt,
  className = ''
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <LazyImage
      src={src}
      alt={alt}
      className={`w-full h-auto object-contain ${className}`}
      priority={true}
    />
  );
}











