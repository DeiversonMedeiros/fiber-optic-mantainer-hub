import React from 'react';
import { HRDashboard as HRDashboardComponent } from '@/components/rh';
import { useCompany } from '@/hooks/useCompany';

export default function RHDashboardPage() {
  const { data: company, isLoading: companyLoading } = useCompany();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        {companyLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando dados da empresa...</p>
            </div>
          </div>
        ) : company ? (
          <HRDashboardComponent companyId={company.id} />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Erro ao carregar dados da empresa</p>
          </div>
        )}
      </div>
    </div>
  );
}
