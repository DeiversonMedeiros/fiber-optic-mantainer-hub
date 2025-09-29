import React from 'react';
import { EquipmentRentalManagement } from '@/components/rh';
import { useUserCompany } from '@/hooks/useUserCompany';

export default function EquipmentRentalPage() {
  const { data: company, isLoading, error } = useUserCompany();

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">
            Carregando...
          </h1>
        </div>
      </div>
    );
  }

  if (error || !company?.id) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Erro ao carregar dados da empresa
          </h1>
          <p className="text-muted-foreground mt-2">
            {error?.message || 'Empresa não encontrada'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <EquipmentRentalManagement companyId={company.id} />
    </div>
  );
}
