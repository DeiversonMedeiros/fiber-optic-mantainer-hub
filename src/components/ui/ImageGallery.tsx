import React, { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, ZoomIn, Download } from 'lucide-react';
import { LazyImage, OptimizedThumbnail, OptimizedFullImage } from './LazyImage';

interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  className?: string;
  maxThumbnails?: number;
  showDownload?: boolean;
  enableCompression?: boolean;
}

export function ImageGallery({
  images,
  className = '',
  maxThumbnails = 6,
  showDownload = true,
  enableCompression = true
}: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const visibleImages = useMemo(() => {
    return images.slice(0, maxThumbnails);
  }, [images, maxThumbnails]);

  const hasMoreImages = images.length > maxThumbnails;

  const handleImageClick = useCallback((index: number) => {
    setSelectedImageIndex(index);
    setIsModalOpen(true);
  }, []);

  const handlePrevious = useCallback(() => {
    setSelectedImageIndex(prev => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  }, [images.length]);

  const handleNext = useCallback(() => {
    setSelectedImageIndex(prev => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  }, [images.length]);

  const handleDownload = useCallback(async () => {
    const image = images[selectedImageIndex];
    if (!image) return;

    try {
      const response = await fetch(image.src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `imagem_${selectedImageIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar imagem:', error);
    }
  }, [images, selectedImageIndex]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isModalOpen) return;

    switch (event.key) {
      case 'ArrowLeft':
        handlePrevious();
        break;
      case 'ArrowRight':
        handleNext();
        break;
      case 'Escape':
        setIsModalOpen(false);
        break;
    }
  }, [isModalOpen, handlePrevious, handleNext]);

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!images || images.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 text-gray-500 ${className}`}>
        <span>Nenhuma imagem disponível</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Grid de Thumbnails */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {visibleImages.map((image, index) => (
          <div key={index} className="relative group">
            <OptimizedThumbnail
              src={image.src}
              alt={image.alt}
              className="w-full h-24 rounded-lg"
              onClick={() => handleImageClick(index)}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
              <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          </div>
        ))}
        
        {/* Indicador de mais imagens */}
        {hasMoreImages && (
          <div className="relative group">
            <div className="w-full h-24 rounded-lg bg-gray-200 flex items-center justify-center">
              <span className="text-sm text-gray-600">
                +{images.length - maxThumbnails} mais
              </span>
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
              <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          </div>
        )}
      </div>

      {/* Modal de Visualização */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <div className="relative h-full">
            {/* Header do Modal */}
            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-white bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                  {selectedImageIndex + 1} de {images.length}
                </span>
                {images[selectedImageIndex]?.caption && (
                  <span className="text-white bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                    {images[selectedImageIndex].caption}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {showDownload && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    className="text-white hover:bg-white hover:text-black"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-white hover:bg-white hover:text-black"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Imagem Principal */}
            <div className="h-full flex items-center justify-center">
              <OptimizedFullImage
                src={images[selectedImageIndex]?.src || ''}
                alt={images[selectedImageIndex]?.alt || ''}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Navegação */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white hover:text-black"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white hover:text-black"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}

            {/* Indicadores de Navegação */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === selectedImageIndex
                        ? 'bg-white'
                        : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente para exibição simples de uma imagem
export function SingleImage({
  src,
  alt,
  className = '',
  showModal = true,
  enableCompression = true
}: {
  src: string;
  alt: string;
  className?: string;
  showModal?: boolean;
  enableCompression?: boolean;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!showModal) {
    return (
      <OptimizedThumbnail
        src={src}
        alt={alt}
        className={className}
      />
    );
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer">
          <OptimizedThumbnail
            src={src}
            alt={alt}
            className={className}
          />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="relative h-full">
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="text-white hover:bg-white hover:text-black"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="h-full flex items-center justify-center">
            <OptimizedFullImage
              src={src}
              alt={alt}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}











