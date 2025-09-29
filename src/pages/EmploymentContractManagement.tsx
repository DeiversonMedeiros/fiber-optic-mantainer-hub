import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { EmploymentContractManagement } from '@/components/rh/EmploymentContractManagement';

const EmploymentContractManagementPage = () => {
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
            <FileText className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Contratos de Trabalho</h1>
          </div>
          <p className="text-sm text-gray-600">
            Gerencie os contratos de trabalho dos funcionários
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
            <BreadcrumbPage>Contratos de Trabalho</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Gestão de Contratos de Trabalho</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmploymentContractManagement />
        </CardContent>
      </Card>
    </div>
  );
};

export default EmploymentContractManagementPage;













































