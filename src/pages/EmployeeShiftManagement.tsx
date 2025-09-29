import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { EmployeeShiftManagement } from '@/components/rh/EmployeeShiftManagement';

const EmployeeShiftManagementPage = () => {
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
            <Clock className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Turnos de Funcionários</h1>
          </div>
          <p className="text-sm text-gray-600">
            Gerencie os turnos atribuídos aos funcionários
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
            <BreadcrumbPage>Turnos de Funcionários</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Gestão de Turnos de Funcionários</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeShiftManagement />
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeShiftManagementPage;























































































