import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { RecruitmentManagement } from '@/components/rh';
import { AppLayout } from '@/components/layout/AppLayout';

export default function RecruitmentManagementPage() {
  const { user } = useAuth();

  // Por enquanto, usar um company_id fixo para desenvolvimento
  const companyId = 'company_1';

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <RecruitmentManagement companyId={companyId} />
      </div>
    </AppLayout>
  );
}
