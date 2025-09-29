import React from 'react';
import { useParams } from 'react-router-dom';
import { FinancialIntegrationDashboard } from '@/components/rh/payroll/FinancialIntegrationDashboard';

const FinancialIntegrationPage: React.FC = () => {
  const { payrollCalculationId } = useParams<{ payrollCalculationId?: string }>();

  return (
    <div className="container mx-auto p-6">
      <FinancialIntegrationDashboard payrollCalculationId={payrollCalculationId} />
    </div>
  );
};

export default FinancialIntegrationPage;
