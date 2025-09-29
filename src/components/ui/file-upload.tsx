import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './button';
import { Progress } from './progress';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile?: File | null;
  uploadedUrl?: string | null;
  isUploading?: boolean;
  uploadProgress?: number;
  accept?: string;
  maxSize?: number; // em MB
  className?: string;
  disabled?: boolean;
  error?: string;
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  selectedFile,
  uploadedUrl,
  isUploading = false,
  uploadProgress = 0,
  accept = '.pdf',
  maxSize = 10,
  className,
  disabled = false,
  error
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Validar tipo de arquivo
    if (file.type !== 'application/pdf') {
      alert('Apenas arquivos PDF são permitidos');
      return;
    }

    // Validar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      alert(`Arquivo muito grande. Máximo permitido: ${maxSize}MB`);
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (selectedFile || uploadedUrl) {
      return <FileText className="w-8 h-8 text-blue-600" />;
    }
    return <Upload className="w-8 h-8 text-gray-400" />;
  };

  const getStatusIcon = () => {
    if (error) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    if (uploadedUrl) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return null;
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
          {
            "border-blue-400 bg-blue-50": dragActive,
            "border-gray-300 hover:border-gray-400": !dragActive && !disabled,
            "border-red-300 bg-red-50": error,
            "border-green-300 bg-green-50": uploadedUrl,
            "cursor-not-allowed opacity-50": disabled || isUploading,
            "border-blue-300 bg-blue-50": selectedFile && !uploadedUrl
          }
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        
        <div className="flex flex-col items-center space-y-4">
          {getFileIcon()}
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-900">
              {selectedFile ? selectedFile.name : uploadedUrl ? 'Arquivo carregado' : 'Arraste o arquivo PDF aqui'}
            </p>
            
            {selectedFile && !uploadedUrl && (
              <p className="text-xs text-gray-500">
                {formatFileSize(selectedFile.size)} • {selectedFile.type}
              </p>
            )}
            
            {!selectedFile && !uploadedUrl && (
              <p className="text-xs text-gray-500">
                ou clique para selecionar • Máximo {maxSize}MB
              </p>
            )}
          </div>

          {isUploading && (
            <div className="w-full space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-gray-500">
                Enviando... {uploadProgress}%
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-2 text-red-600">
              {getStatusIcon()}
              <p className="text-sm">{error}</p>
            </div>
          )}

          {uploadedUrl && (
            <div className="flex items-center space-x-2 text-green-600">
              {getStatusIcon()}
              <p className="text-sm">Arquivo carregado com sucesso</p>
            </div>
          )}
        </div>
      </div>

      {(selectedFile || uploadedUrl) && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {selectedFile ? selectedFile.name : 'Arquivo carregado'}
            </span>
            {selectedFile && (
              <span className="text-xs text-gray-400">
                ({formatFileSize(selectedFile.size)})
              </span>
            )}
          </div>
          
          <div className="flex space-x-2">
            {uploadedUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(uploadedUrl, '_blank')}
              >
                Visualizar
              </Button>
            )}
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onFileRemove}
              disabled={disabled || isUploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
