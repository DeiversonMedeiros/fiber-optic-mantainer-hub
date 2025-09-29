import React from 'react';
import { BenefitsRedirect } from '@/components/rh/BenefitsRedirect';

export default function EquipmentRentalPage() {
  return (
    <BenefitsRedirect 
      fromPage="Locação de Equipamentos" 
      benefitType="equipment_rental" 
    />
  );
}
