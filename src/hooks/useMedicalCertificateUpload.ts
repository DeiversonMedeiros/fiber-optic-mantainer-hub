import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MedicalCertificateUploadOptions {
  maxFileSize?: number; // em bytes
  allowedTypes?: string[];
  maxFiles?: number;
}

export interface UploadedMedicalFile {
  name: string;
  url: string;
  path: string;
  size: number;
  type: string;
}

export interface UploadResult {
  success: boolean;
  files?: UploadedMedicalFile[];
  error?: string;
}

export function useMedicalCertificateUpload(options: MedicalCertificateUploadOptions = {}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const defaultOptions: Required<MedicalCertificateUploadOptions> = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxFiles: 3
  };

  const config = { ...defaultOptions, ...options };

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Verificar tipo do arquivo
    if (!config.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de arquivo não permitido: ${file.type}. Tipos aceitos: ${config.allowedTypes.join(', ')}`
      };
    }

    // Verificar tamanho do arquivo
    if (file.size > config.maxFileSize) {
      return {
        valid: false,
        error: `Arquivo muito grande: ${formatFileSize(file.size)}. Tamanho máximo: ${formatFileSize(config.maxFileSize)}`
      };
    }

    return { valid: true };
  }, [config]);

  const uploadFiles = useCallback(async (
    files: File[],
    userId: string,
    certificateId?: string
  ): Promise<UploadResult> => {
    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Validar número de arquivos
      if (files.length > config.maxFiles) {
        throw new Error(`Máximo de ${config.maxFiles} arquivos permitidos`);
      }

      // Validar cada arquivo
      for (const file of files) {
        const validation = validateFile(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }

      const uploadedFiles: UploadedMedicalFile[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Gerar caminho único para o arquivo
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = `certificates/${userId}/${fileName}`;

        // Se há um ID de atestado específico, incluir na estrutura de pastas
        const finalPath = certificateId 
          ? `certificates/${userId}/${certificateId}/${fileName}`
          : filePath;

        console.log(`📤 Fazendo upload do atestado ${i + 1}/${totalFiles}: ${file.name}`);
        
        // Upload para Supabase Storage
        const { data, error } = await supabase.storage
          .from('medical-certificates')
          .upload(finalPath, file, { 
            upsert: false,
            cacheControl: '3600'
          });

        if (error) {
          console.error('❌ Erro no upload:', error);
          throw new Error(`Erro ao fazer upload do atestado "${file.name}": ${error.message}`);
        }

        // Obter URL pública
        const { data: publicUrl } = supabase.storage
          .from('medical-certificates')
          .getPublicUrl(finalPath);

        // Adicionar arquivo à lista de uploads
        uploadedFiles.push({
          name: file.name,
          url: publicUrl.publicUrl,
          path: finalPath,
          size: file.size,
          type: file.type
        });

        // Atualizar progresso
        setUploadProgress(((i + 1) / totalFiles) * 100);
      }

      console.log(`✅ Upload de atestados concluído: ${uploadedFiles.length} arquivo(s) enviado(s)`);
      
      return {
        success: true,
        files: uploadedFiles
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no upload';
      setUploadError(errorMessage);
      console.error('❌ Erro no upload de atestados médicos:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [config, validateFile]);

  const deleteFile = useCallback(async (filePath: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from('medical-certificates')
        .remove([filePath]);

      if (error) {
        console.error('❌ Erro ao deletar atestado:', error);
        return false;
      }

      console.log('✅ Atestado deletado com sucesso:', filePath);
      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar atestado:', error);
      return false;
    }
  }, []);

  const getFileUrl = useCallback((filePath: string): string => {
    const { data } = supabase.storage
      .from('medical-certificates')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }, []);

  return {
    uploadFiles,
    deleteFile,
    getFileUrl,
    validateFile,
    uploading,
    uploadError,
    uploadProgress,
    clearError: () => setUploadError(null)
  };
}

// Função auxiliar para formatar tamanho de arquivo
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Hook específico para atestados médicos com validações específicas
export function useMedicalCertificateUpload() {
  return useMedicalCertificateUpload({
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf'
    ],
    maxFiles: 2 // Máximo 2 atestados por solicitação
  });
}
