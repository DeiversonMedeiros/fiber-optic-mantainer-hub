import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { RateiosManagement } from '@/components/rh/RateiosManagement';

export default function RateiosPage() {
  const { user } = useAuth();

  if (!user) {
    return <div>Carregando...</div>;
  }

  return <RateiosManagement companyId={user.company_id} />;
}
