// @ts-nocheck
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, X } from 'lucide-react';

const DocumentUploadTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { toast } = useToast();

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    setIsLoading(true);

    try {
      for (const file of files) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setUploadedFiles(prev => [...prev, {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString()
        }]);
      }

      toast({
        title: "Sucesso",
        description: `${files.length} arquivo(s) enviado(s) com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer upload dos arquivos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    toast({
      title: "Arquivo removido",
      description: "Arquivo removido com sucesso",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Documentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <div className="space-y-2">
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-700">
                  Clique para selecionar arquivos
                </span>
              </Label>
              <Input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Arquivos Enviados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="text-red-500"
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
};

export default DocumentUploadTab;