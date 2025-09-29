import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Settings, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { PayrollConfigManagement } from '@/components/rh/PayrollConfigManagement';

const PayrollConfigManagementPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/rh')}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Settings className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Configurações de Folha</h1>
          </div>
          <p className="text-sm text-gray-600">
            Gerencie as configurações de folha de pagamento dos funcionários
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/rh">RH</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Configurações de Folha</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Gestão de Configurações de Folha</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PayrollConfigManagement />
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollConfigManagementPage;













































