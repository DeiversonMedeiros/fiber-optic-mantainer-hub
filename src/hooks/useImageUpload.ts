import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  compressImage, 
  validateImageFile, 
  formatFileSize,
  type ImageOptimizationOptions 
} from '@/lib/imageOptimization';

export interface UploadedFile {
  name: string;
  url: string;
  path: string;
  size: number;
  type: string;
  thumbnailUrl?: string;
  originalSize?: number;
  compressionRatio?: number;
}

export interface UseImageUploadOptions {
  bucket: string;
  maxFiles?: number;
  maxFileSize?: number;
  compressionOptions?: ImageOptimizationOptions;
  createThumbnails?: boolean;
}

export function useImageUpload(options: UseImageUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const uploadFiles = useCallback(async (
    files: File[], 
    userId: string,
    customPath?: string
  ): Promise<UploadedFile[]> => {
    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const uploaded: UploadedFile[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validar arquivo
        const validation = validateImageFile(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // Comprimir imagem
        console.log(`🔄 Comprimindo arquivo ${i + 1}/${totalFiles}: ${file.name}`);
        const optimized = await compressImage(file, options.compressionOptions);
        
        console.log(`📊 Compressão: ${formatFileSize(optimized.originalSize)} → ${formatFileSize(optimized.optimizedSize)} (${optimized.compressionRatio.toFixed(1)}% redução)`);

        // Gerar caminho do arquivo
        const timestamp = Date.now();
        const basePath = customPath || `uploads/${userId}`;
        const filePath = `${basePath}/${timestamp}_${file.name}`;

        // Upload para Supabase
        console.log(`📤 Fazendo upload: ${filePath}`);
        const { data, error } = await supabase.storage
          .from(options.bucket)
          .upload(filePath, optimized.file, { upsert: false });

        if (error) {
          console.error('❌ Erro no upload:', error);
          throw error;
        }

        // Obter URL pública
        const { data: publicUrl } = supabase.storage
          .from(options.bucket)
          .getPublicUrl(filePath);

        // Criar thumbnail se solicitado
        let thumbnailUrl: string | undefined;
        if (options.createThumbnails) {
          try {
            thumbnailUrl = await createThumbnail(optimized.file);
          } catch (error) {
            console.warn('⚠️ Erro ao criar thumbnail:', error);
          }
        }

        uploaded.push({
          name: file.name,
          url: publicUrl.publicUrl,
          path: filePath,
          size: optimized.optimizedSize,
          type: optimized.file.type,
          thumbnailUrl,
          originalSize: optimized.originalSize,
          compressionRatio: optimized.compressionRatio
        });

        // Atualizar progresso
        setUploadProgress(((i + 1) / totalFiles) * 100);
      }

      console.log(`✅ Upload concluído: ${uploaded.length} arquivos`);
      return uploaded;

    } catch (error: any) {
      console.error('❌ Erro no upload:', error);
      setUploadError(error.message || 'Erro ao fazer upload');
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [options]);

  const validateFiles = useCallback((files: File[]): { valid: boolean; error?: string } => {
    // Verificar número máximo de arquivos
    if (options.maxFiles && files.length > options.maxFiles) {
      return { 
        valid: false, 
        error: `Máximo de ${options.maxFiles} arquivos permitidos` 
      };
    }

    // Verificar tamanho dos arquivos
    if (options.maxFileSize) {
      for (const file of files) {
        if (file.size > options.maxFileSize) {
          return { 
            valid: false, 
            error: `Arquivo "${file.name}" excede ${formatFileSize(options.maxFileSize)}` 
          };
        }
      }
    }

    // Validar cada arquivo
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        return validation;
      }
    }

    return { valid: true };
  }, [options]);

  return {
    uploadFiles,
    validateFiles,
    uploading,
    uploadError,
    uploadProgress,
    clearError: () => setUploadError(null)
  };
}

// Função auxiliar para criar thumbnail
async function createThumbnail(file: File, size: number = 150): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
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