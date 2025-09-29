import React from 'react';
import { DisciplinaryActionsTab } from '@/components/rh/DisciplinaryActionsTab';
import { useActiveCompany } from '@/hooks/useActiveCompany';

export default function DisciplinaryActionsPage() {
  const { activeCompanyId } = useActiveCompany();

  if (!activeCompanyId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-600 mb-2">
            Nenhuma empresa selecionada
          </div>
          <p className="text-gray-500">
            Selecione uma empresa para acessar as ações disciplinares.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Ações Disciplinares</h1>
        <p className="text-gray-600 mt-2">
          Gerencie advertências, suspensões e outras ações disciplinares dos funcionários.
        </p>
      </div>
      
      <DisciplinaryActionsTab companyId={activeCompanyId} />
    </div>
  );
}




