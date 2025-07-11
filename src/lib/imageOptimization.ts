// Utilitário para otimização de imagens
export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

export interface OptimizedImage {
  file: File;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  url: string;
}

// Cache para thumbnails
const thumbnailCache = new Map<string, string>();
const imageCache = new Map<string, { url: string; timestamp: number }>();

// Configurações padrão
const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: 'jpeg'
};

// Função para comprimir imagem
export async function compressImage(
  file: File, 
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calcular dimensões mantendo proporção
      let { width, height } = img;
      const { maxWidth, maxHeight } = opts;
      
      if (width > maxWidth!) {
        height = (height * maxWidth!) / width;
        width = maxWidth!;
      }
      
      if (height > maxHeight!) {
        width = (width * maxHeight!) / height;
        height = maxHeight!;
      }
      
      // Configurar canvas
      canvas.width = width;
      canvas.height = height;
      
      // Desenhar imagem redimensionada
      ctx!.drawImage(img, 0, 0, width, height);
      
      // Converter para blob com qualidade especificada
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Falha ao comprimir imagem'));
            return;
          }
          
          const optimizedFile = new File([blob], file.name, {
            type: `image/${opts.format}`,
            lastModified: Date.now()
          });
          
          const compressionRatio = (1 - (optimizedFile.size / file.size)) * 100;
          
          const url = URL.createObjectURL(optimizedFile);
          
          resolve({
            file: optimizedFile,
            originalSize: file.size,
            optimizedSize: optimizedFile.size,
            compressionRatio,
            url
          });
        },
        `image/${opts.format}`,
        opts.quality
      );
    };
    
    img.onerror = () => reject(new Error('Falha ao carregar imagem'));
    img.src = URL.createObjectURL(file);
  });
}

// Função para criar thumbnail
export async function createThumbnail(
  file: File, 
  size: number = 150
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calcular dimensões do thumbnail mantendo proporção
      let { width, height } = img;
      
      if (width > height) {
        height = (height * size) / width;
        width = size;
      } else {
        width = (width * size) / height;
        height = size;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Aplicar suavização para melhor qualidade
      ctx!.imageSmoothingEnabled = true;
      ctx!.imageSmoothingQuality = 'high';
      
      ctx!.drawImage(img, 0, 0, width, height);
      
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
      resolve(thumbnailUrl);
    };
    
    img.onerror = () => reject(new Error('Falha ao criar thumbnail'));
    img.src = URL.createObjectURL(file);
  });
}

// Função para obter thumbnail com cache
export async function getThumbnail(url: string, size: number = 150): Promise<string> {
  const cacheKey = `${url}_${size}`;
  
  // Verificar cache
  if (thumbnailCache.has(cacheKey)) {
    return thumbnailCache.get(cacheKey)!;
  }
  
  try {
    // Fazer fetch da imagem
    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], 'image.jpg', { type: blob.type });
    
    // Criar thumbnail
    const thumbnailUrl = await createThumbnail(file, size);
    
    // Armazenar no cache
    thumbnailCache.set(cacheKey, thumbnailUrl);
    
    return thumbnailUrl;
  } catch (error) {
    console.error('Erro ao criar thumbnail:', error);
    return url; // Retornar URL original em caso de erro
  }
}

// Função para limpar cache
export function clearImageCache(): void {
  thumbnailCache.clear();
  imageCache.clear();
}

// Função para obter URL de imagem com cache
export function getCachedImageUrl(url: string): string {
  const cached = imageCache.get(url);
  const now = Date.now();
  
  // Cache válido por 5 minutos
  if (cached && (now - cached.timestamp) < 5 * 60 * 1000) {
    return cached.url;
  }
  
  // Armazenar nova entrada no cache
  imageCache.set(url, { url, timestamp: now });
  return url;
}

// Função para formatar tamanho de arquivo
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Função para validar arquivo de imagem
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Verificar tipo
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Apenas arquivos de imagem são permitidos' };
  }
  
  // Verificar tamanho (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'Arquivo muito grande. Máximo 10MB' };
  }
  
  return { valid: true };
} 