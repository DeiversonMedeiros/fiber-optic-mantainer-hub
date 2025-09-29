// @ts-nocheck
// Temporary component to replace problematic ones

import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const TempErrorFallback = ({ componentName }: { componentName: string }) => {
  return (
    <Alert>
      <AlertDescription>
        O componente {componentName} está temporariamente indisponível.
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-2"
          onClick={() => window.location.reload()}
        >
          Recarregar Página
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default TempErrorFallback;