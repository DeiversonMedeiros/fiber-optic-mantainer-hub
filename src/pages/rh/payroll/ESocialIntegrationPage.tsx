import React from 'react';
import { ESocialIntegrationDashboard } from '@/components/rh/payroll/ESocialIntegrationDashboard';
import { useUserCompany } from '@/hooks/useUserCompany';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function ESocialIntegrationPage() {
  const { data: userCompany, isLoading: loadingCompany } = useUserCompany();

  if (loadingCompany) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando dados da empresa...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userCompany) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Usuário não está associado a uma empresa. Entre em contato com o administrador.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!userCompany.is_active) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            A empresa <strong>{userCompany.nome_fantasia || userCompany.razao_social}</strong> está com status inativo. 
            Entre em contato com o administrador para ativar o módulo RH.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <ESocialIntegrationDashboard companyId={userCompany.id} />
    </div>
  );
}
