import React from 'react';
import { DelayReasonsManagement } from '@/components/rh';

const DelayReasonsManagementPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Motivos de Atraso</h1>
        <p className="text-gray-600">Gerencie os motivos de atraso dos funcionários</p>
      </div>
      <DelayReasonsManagement />
    </div>
  );
};

export default DelayReasonsManagementPage;































































