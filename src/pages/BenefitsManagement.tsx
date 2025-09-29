import React from 'react';
import { BenefitsRedirect } from '@/components/rh/BenefitsRedirect';

export default function BenefitsManagementPage() {
  return (
    <BenefitsRedirect 
      fromPage="Gestão de Benefícios" 
      benefitType="all" 
    />
  );
}
