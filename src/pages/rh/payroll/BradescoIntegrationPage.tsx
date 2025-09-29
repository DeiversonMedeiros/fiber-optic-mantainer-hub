import React from 'react';
import { useParams } from 'react-router-dom';
import { BradescoIntegrationDashboard } from '@/components/rh/payroll/BradescoIntegrationDashboard';

const BradescoIntegrationPage: React.FC = () => {
  const { payrollCalculationId } = useParams<{ payrollCalculationId?: string }>();

  return (
    <div className="container mx-auto p-6">
      <BradescoIntegrationDashboard payrollCalculationId={payrollCalculationId} />
    </div>
  );
};

export default BradescoIntegrationPage;

