import React from 'react';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PaymentConfigManagement from '@/components/rh/PaymentConfigManagement';
// BenefitsProcessingTool removido - substituído pelo sistema unificado

export default function PaymentManagementPage() {
  const { companies, activeCompanyId, loading } = useActiveCompany();

  const activeCompany = companies.find(company => company.id === activeCompanyId);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhuma empresa selecionada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Pagamentos</h1>
          <p className="text-muted-foreground">
            Configure e gerencie os pagamentos de benefícios da empresa
          </p>
        </div>
      </div>

      <PaymentConfigManagement companyId={activeCompany.id} />
    </div>
  );
}
