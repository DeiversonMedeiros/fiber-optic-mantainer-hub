import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UploadOptions {
  bucket: string;
  folder?: string;
  maxSize?: number; // em MB
  allowedTypes?: string[];
}

interface UploadState {
  file: File | null;
  isUploading: boolean;
  progress: number;
  uploadedUrl: string | null;
  error: string | null;
}

export const useSimpleFileUpload = (options: UploadOptions) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    isUploading: false,
    progress: 0,
    uploadedUrl: null,
    error: null
  });

  const validateFile = (file: File): string | null => {
    // Validar tamanho
    if (options.maxSize && file.size > options.maxSize * 1024 * 1024) {
      return `Arquivo muito grande. Máximo permitido: ${options.maxSize}MB`;
    }

    // Validar tipo
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      return `Tipo de arquivo não permitido. Tipos aceitos: ${options.allowedTypes.join(', ')}`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    // Validar arquivo
    const validationError = validateFile(file);
    if (validationError) {
      setUploadState(prev => ({ ...prev, error: validationError }));
      toast.error(validationError);
      return null;
    }

    setUploadState(prev => ({
      ...prev,
      file,
      isUploading: true,
      progress: 0,
      error: null
    }));

    try {
      // Simular progresso
      for (let i = 0; i <= 100; i += 10) {
        setUploadState(prev => ({ ...prev, progress: i }));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = options.folder ? `${options.folder}/${fileName}` : fileName;

      // Upload do arquivo
      const { data, error } = await supabase.storage
        .from(options.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(data.path);

      const publicUrl = urlData.publicUrl;

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        uploadedUrl: publicUrl,
        error: null
      }));

      toast.success('Arquivo carregado com sucesso');
      return publicUrl;

    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao fazer upload do arquivo';
      
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        progress: 0,
        error: errorMessage
      }));

      toast.error(errorMessage);
      return null;
    }
  };

  const removeFile = async (url?: string) => {
    try {
      // Se uma URL foi fornecida, tentar remover o arquivo do storage
      if (url) {
        const path = url.split('/').pop();
        if (path) {
          await supabase.storage
            .from(options.bucket)
            .remove([path]);
        }
      }
    } catch (error) {
      console.warn('Erro ao remover arquivo do storage:', error);
    }

    setUploadState({
      file: null,
      isUploading: false,
      progress: 0,
      uploadedUrl: null,
      error: null
    });
  };

  const reset = () => {
    setUploadState({
      file: null,
      isUploading: false,
      progress: 0,
      uploadedUrl: null,
      error: null
    });
  };

  const setUploadStateManually = (newState: UploadState | ((prev: UploadState) => UploadState)) => {
    setUploadState(newState);
  };

  return {
    uploadState,
    uploadFile,
    removeFile,
    reset,
    validateFile,
    setUploadState: setUploadStateManually
  };
};
