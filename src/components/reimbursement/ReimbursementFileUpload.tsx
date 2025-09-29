import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useReimbursementReceiptUpload } from '@/hooks/useReimbursementUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  Image as ImageIcon,
  File
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReimbursementFileUploadProps {
  userId: string;
  reimbursementId?: string;
  onFilesUploaded?: (files: any[]) => void;
  onFileRemoved?: (filePath: string) => void;
  initialFiles?: string[];
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

interface UploadedFile {
  name: string;
  url: string;
  path: string;
  size: number;
  type: string;
}

export function ReimbursementFileUpload({
  userId,
  reimbursementId,
  onFilesUploaded,
  onFileRemoved,
  initialFiles = [],
  maxFiles = 3,
  disabled = false,
  className
}: ReimbursementFileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  
  const {
    uploadFiles,
    deleteFile,
    validateFile,
    uploading,
    uploadError,
    uploadProgress,
    clearError
  } = useReimbursementReceiptUpload();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled || uploading) return;

    clearError();

    // Verificar limite de arquivos
    const totalFiles = uploadedFiles.length + acceptedFiles.length;
    if (totalFiles > maxFiles) {
      alert(`Máximo de ${maxFiles} arquivos permitidos`);
      return;
    }

    // Validar arquivos
    for (const file of acceptedFiles) {
      const validation = validateFile(file);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
    }

    setPreviewFiles(prev => [...prev, ...acceptedFiles]);

    // Fazer upload dos arquivos
    const result = await uploadFiles(acceptedFiles, userId, reimbursementId);
    
    if (result.success && result.files) {
      setUploadedFiles(prev => [...prev, ...result.files!]);
      setPreviewFiles([]);
      onFilesUploaded?.(result.files);
    }
  }, [userId, reimbursementId, uploadedFiles.length, maxFiles, disabled, uploading, uploadFiles, validateFile, onFilesUploaded, clearError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'application/pdf': ['.pdf']
    },
    maxFiles: maxFiles - uploadedFiles.length,
    disabled: disabled || uploading
  });

  const handleRemoveFile = async (filePath: string, index: number) => {
    if (disabled || uploading) return;

    const success = await deleteFile(filePath);
    if (success) {
      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
      onFileRemoved?.(filePath);
    }
  };

  const handleRemovePreview = (index: number) => {
    setPreviewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4 text-blue-500" />;
    }
    return <File className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Área de Upload */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              isDragActive && "border-primary bg-primary/5",
              uploading && "opacity-50 cursor-not-allowed",
              disabled && "opacity-50 cursor-not-allowed",
              "hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <div className="text-sm text-gray-600">
                {isDragActive ? (
                  <p>Solte os arquivos aqui...</p>
                ) : (
                  <div>
                    <p className="font-medium">
                      Clique para selecionar ou arraste arquivos aqui
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, PDF até 10MB • Máximo {maxFiles} arquivos
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Fazendo upload...</span>
                <span>{uploadProgress.toFixed(0)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Error Alert */}
          {uploadError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Arquivos Enviados */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3 flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              Comprovantes Enviados ({uploadedFiles.length})
            </h4>
            
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={file.path}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file.type)}
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(file.url, '_blank')}
                      disabled={disabled}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFile(file.path, index)}
                      disabled={disabled || uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Arquivos em Preview (antes do upload) */}
      {previewFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Arquivos Selecionados</h4>
            
            <div className="space-y-2">
              {previewFiles.map((file, index) => (
                <div
                  key={`preview-${index}`}
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file.type)}
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemovePreview(index)}
                    disabled={disabled || uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
