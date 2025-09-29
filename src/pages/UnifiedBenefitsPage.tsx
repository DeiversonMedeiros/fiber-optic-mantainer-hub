import React from 'react';
import { useCompany } from '@/hooks/useCompany';
import { UnifiedBenefitsManagement } from '@/components/rh/UnifiedBenefitsManagement';

export default function UnifiedBenefitsPage() {
  const { data: company, isLoading, error } = useCompany();

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </div>
    );
  }

  if (error || !company?.id) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-2">Erro ao carregar dados da empresa</p>
            <p className="text-muted-foreground text-sm">
              {error?.message || 'Empresa não encontrada'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <UnifiedBenefitsManagement companyId={company.id} />
    </div>
  );
}
