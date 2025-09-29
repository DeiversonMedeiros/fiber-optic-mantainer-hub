import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CompaniesService, Company } from '@/services/core/companiesService';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, Save, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CompanyCodeManagerProps {
  company: Company;
  onCodeUpdated?: () => void;
}

export function CompanyCodeManager({ company, onCodeUpdated }: CompanyCodeManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [codigoEmpresa, setCodigoEmpresa] = useState(company.codigo_empresa || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSaveCode = async () => {
    // Validações
    if (!codigoEmpresa.trim()) {
      toast({
        title: 'Erro',
        description: 'O código da empresa é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    if (!/^\d{2}$/.test(codigoEmpresa)) {
      toast({
        title: 'Erro',
        description: 'O código deve ter exatamente 2 dígitos (ex: 01, 02, 03)',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    try {
      await CompaniesService.update(company.id, { codigo_empresa: codigoEmpresa });
      
      // Invalidar cache das empresas
      await queryClient.invalidateQueries({ queryKey: ['core', 'companies'] });
      
      toast({
        title: 'Sucesso',
        description: `Código da empresa atualizado para: ${codigoEmpresa}`,
      });
      
      onCodeUpdated?.();
    } catch (error) {
      console.error('Erro ao atualizar código da empresa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar código da empresa',
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
          <Building2 className="h-5 w-5" />
          Código da Empresa
        </CardTitle>
        <CardDescription>
          Configure o código para geração automática de matrículas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações da Empresa */}
        <div className="space-y-2">
          <Label>Empresa:</Label>
          <p className="text-sm font-medium text-gray-700">
            {company.nome_fantasia || company.razao_social}
          </p>
        </div>

        {/* Campo do Código */}
        <div className="space-y-2">
          <Label htmlFor="codigo-empresa">Código da Empresa:</Label>
          <Input
            id="codigo-empresa"
            type="text"
            placeholder="01"
            value={codigoEmpresa}
            onChange={(e) => setCodigoEmpresa(e.target.value.replace(/\D/g, '').slice(0, 2))}
            maxLength={2}
            className="text-center text-lg font-mono"
          />
          <p className="text-xs text-gray-500">
            Código de 2 dígitos para identificação da empresa (01-99)
          </p>
        </div>

        {/* Exemplo de Matrícula */}
        {codigoEmpresa && (
          <div className="space-y-2">
            <Label>Exemplo de Matrícula:</Label>
            <div className="bg-gray-50 border rounded-lg p-3">
              <p className="text-sm text-gray-600">
                Próximas matrículas serão geradas como:
              </p>
              <div className="flex gap-2 mt-2">
                <span className="font-mono text-lg font-bold text-blue-600">
                  {codigoEmpresa}0001
                </span>
                <span className="font-mono text-lg font-bold text-blue-600">
                  {codigoEmpresa}0002
                </span>
                <span className="font-mono text-lg font-bold text-blue-600">
                  {codigoEmpresa}0003
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Aviso sobre impacto */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> Alterar o código da empresa pode afetar a geração de novas matrículas. 
            Matrículas existentes não serão alteradas automaticamente.
          </AlertDescription>
        </Alert>

        {/* Botão de Salvar */}
        <Button 
          onClick={handleSaveCode} 
          disabled={isUpdating || codigoEmpresa === company.codigo_empresa}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {isUpdating ? 'Salvando...' : 'Salvar Código'}
        </Button>
      </CardContent>
    </Card>
  );
}
