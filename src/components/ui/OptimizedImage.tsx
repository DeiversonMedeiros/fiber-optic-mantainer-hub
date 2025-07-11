import React, { useState, useEffect } from 'react';
import { getThumbnail, getCachedImageUrl } from '@/lib/imageOptimization';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  thumbnailSize?: number;
  showFullImage?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  onClick?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  thumbnailSize = 150,
  showFullImage = false,
  onLoad,
  onError,
  onClick
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fullImageLoaded, setFullImageLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);

        // Se showFullImage é true, carregar imagem completa
        if (showFullImage) {
          const cachedUrl = getCachedImageUrl(src);
          setImageSrc(cachedUrl);
        } else {
          // Carregar thumbnail
          const thumbnailUrl = await getThumbnail(src, thumbnailSize);
          if (mounted) {
            setImageSrc(thumbnailUrl);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar imagem:', err);
        if (mounted) {
          setError(true);
          onError?.();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [src, thumbnailSize, showFullImage, onError]);

  const handleImageLoad = () => {
    setLoading(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setError(true);
    setLoading(false);
    onError?.();
  };

  if (loading) {
    return (
      <Skeleton className={`animate-pulse bg-gray-200 ${className}`} />
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-500 ${className}`}>
        <span className="text-xs">Erro ao carregar imagem</span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onLoad={handleImageLoad}
      onError={handleImageError}
      onClick={onClick}
      loading="lazy"
    />
  );
}

// Componente para exibição em lista com thumbnail
export function ThumbnailImage({
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
    <OptimizedImage
      src={src}
      alt={alt}
      className={`object-cover cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      thumbnailSize={150}
      onClick={onClick}
    />
  );
}

// Componente para exibição completa
export function FullImage({
  src,
  alt,
  className = ''
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={`w-full h-auto object-contain ${className}`}
      showFullImage={true}
    />
  );
} 