// @ts-nocheck
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useAuth } from '@/hooks/useAuth';
import { CompaniesService, Company } from '@/services/core/companiesService';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface CompanyLogoUploadProps {
  company: Company;
  onLogoUpdated?: () => void;
}

export function CompanyLogoUpload({ company, onLogoUpdated }: CompanyLogoUploadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [logoUrl, setLogoUrl] = useState(company.logo_url || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const { uploadFiles } = useImageUpload({
    bucket: 'company-logos',
    compressionOptions: {
      maxWidth: 200,
      maxHeight: 100,
      quality: 0.8,
    },
  });

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoUrl(e.target.value);
  };

  const handleSaveUrl = async () => {
    if (!logoUrl.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira uma URL válida',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    try {
      await CompaniesService.update(company.id, { logo_url: logoUrl });
      
      // Invalidar cache das empresas
      await queryClient.invalidateQueries({ queryKey: ['core', 'companies'] });
      
      toast({
        title: 'Sucesso',
        description: 'Logo da empresa atualizada com sucesso!',
      });
      
      onLogoUpdated?.();
    } catch (error) {
      console.error('Erro ao atualizar logo:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar logo da empresa',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user?.id) return;

    try {
      const uploadedFiles = await uploadFiles(Array.from(files), user.id, `companies/${company.id}`);
      
      if (uploadedFiles.length > 0) {
        const newLogoUrl = uploadedFiles[0].publicUrl;
        setLogoUrl(newLogoUrl);
        
        // Salvar automaticamente após upload
        await CompaniesService.update(company.id, { logo_url: newLogoUrl });
        
        // Invalidar cache das empresas
        await queryClient.invalidateQueries({ queryKey: ['core', 'companies'] });
        
        toast({
          title: 'Sucesso',
          description: 'Logo enviada e salva com sucesso!',
        });
        
        onLogoUpdated?.();
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao fazer upload da logo',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveLogo = async () => {
    setIsUpdating(true);
    try {
      await CompaniesService.update(company.id, { logo_url: null });
      setLogoUrl('');
      
      // Invalidar cache das empresas
      await queryClient.invalidateQueries({ queryKey: ['core', 'companies'] });
      
      toast({
        title: 'Sucesso',
        description: 'Logo removida com sucesso!',
      });
      
      onLogoUpdated?.();
    } catch (error) {
      console.error('Erro ao remover logo:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover logo da empresa',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Logo da Empresa
        </CardTitle>
        <CardDescription>
          Gerencie a logo da empresa {company.nome_fantasia || company.razao_social}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview da Logo Atual */}
        {logoUrl && (
          <div className="space-y-2">
            <Label>Preview:</Label>
            <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-center">
              <img
                src={logoUrl}
                alt={`Logo ${company.nome_fantasia || company.razao_social}`}
                className="max-h-20 max-w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

        {/* Upload de Arquivo */}
        <div className="space-y-2">
          <Label htmlFor="logo-upload">Upload de Arquivo:</Label>
          <div className="flex items-center gap-2">
            <Input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="flex-1"
            />
            <Upload className="h-4 w-4 text-gray-500" />
          </div>
          <p className="text-xs text-gray-500">
            Formatos aceitos: JPG, PNG, GIF. Tamanho recomendado: 200x100px
          </p>
        </div>

        {/* Ou URL Externa */}
        <div className="space-y-2">
          <Label htmlFor="logo-url">Ou URL Externa:</Label>
          <Input
            id="logo-url"
            type="url"
            placeholder="https://exemplo.com/logo.png"
            value={logoUrl}
            onChange={handleUrlChange}
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2">
          <Button 
            onClick={handleSaveUrl} 
            disabled={isUpdating}
            className="flex-1"
          >
            {isUpdating ? 'Salvando...' : 'Salvar URL'}
          </Button>
          {logoUrl && (
            <Button 
              variant="outline" 
              onClick={handleRemoveLogo}
              disabled={isUpdating}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
