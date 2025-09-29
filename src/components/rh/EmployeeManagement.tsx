// @ts-nocheck
import React, { useState } from 'react';
import { FormModal } from './FormModal';
import { EmployeeTable, EmployeeStats } from './EmployeeTable';
import { EmployeeForm } from './EmployeeForm';
import { EmployeeDetailsTabs } from './EmployeeDetailsTabs';
import { Employee, EmployeeInsert, EmployeeUpdate } from '@/integrations/supabase/rh-types';
import { useEmployees } from '@/hooks/rh';
import { Button } from '@/components/ui/button';
import { Plus, Users, Calendar, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface EmployeeManagementProps {
  companyId: string;
  className?: string;
}

export function EmployeeManagement({ companyId, className = '' }: EmployeeManagementProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Debug: verificar se o companyId está sendo passado
  console.log('EmployeeManagement - companyId:', companyId);

  const {
    createEmployee,
    updateEmployee,
    deleteEmployee,
  } = useEmployees(companyId);

  // Handlers para modais
  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setIsAddModalOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsEditModalOpen(true);
  };

  const handleViewEmployee = (employee: Employee) => {
    console.log('handleViewEmployee - abrindo modal para funcionário:', employee.nome);
    setSelectedEmployee(employee);
    setIsViewModalOpen(true);
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    try {
      await deleteEmployee.mutateAsync(employee.id);
      // Sucesso - a tabela será atualizada automaticamente
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
    }
  };

  const handleStatusChange = (employee: Employee, newStatus: string) => {
    console.log(`Status do funcionário ${employee.nome} alterado para: ${newStatus}`);
  };

  // Handlers para formulários
  const handleCreateEmployee = async (data: EmployeeInsert) => {
    try {
      await createEmployee.mutateAsync(data);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar funcionário:', error);
      throw error;
    }
  };

  const handleUpdateEmployee = async (data: EmployeeUpdate) => {
    if (!editingEmployee) return;
    
    try {
      await updateEmployee.mutateAsync({ id: editingEmployee.id, ...data });
      setIsEditModalOpen(false);
      setEditingEmployee(null);
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      throw error;
    }
  };

  // Dashboard cards
  const DashboardCard = ({ title, value, icon, color }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`h-4 w-4 ${color}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Funcionários</h1>
          <p className="text-muted-foreground">
            Gerencie todos os funcionários da empresa
          </p>
        </div>
        <Button onClick={handleAddEmployee} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Novo Funcionário
        </Button>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total de Funcionários"
          value="0"
          icon={<Users className="h-4 w-4" />}
          color="text-blue-600"
        />
        <DashboardCard
          title="Funcionários Ativos"
          value="0"
          icon={<Users className="h-4 w-4" />}
          color="text-green-600"
        />
        <DashboardCard
          title="Férias Pendentes"
          value="0"
          icon={<Calendar className="h-4 w-4" />}
          color="text-orange-600"
        />
        <DashboardCard
          title="Horas Extras"
          value="0h"
          icon={<Clock className="h-4 w-4" />}
          color="text-purple-600"
        />
      </div>

      {/* Estatísticas */}
      <EmployeeStats companyId={companyId} />

      {/* Tabela de Funcionários */}
      <EmployeeTable
        companyId={companyId}
        onViewEmployee={handleViewEmployee}
        onEditEmployee={handleEditEmployee}
        onDeleteEmployee={handleDeleteEmployee}
        onStatusChange={handleStatusChange}
      />

      {/* Modal de Adicionar Funcionário */}
      <FormModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Novo Funcionário"
        description="Preencha os dados para cadastrar um novo funcionário"
        onSubmit={handleCreateEmployee}
        onCancel={() => setIsAddModalOpen(false)}
        loading={createEmployee.isPending}
        size="xl"
      >
        <EmployeeForm
          companyId={companyId}
          onSubmit={handleCreateEmployee}
          onCancel={() => setIsAddModalOpen(false)}
          loading={createEmployee.isPending}
          showButtons={false} // Não mostra botões no modal
        />
      </FormModal>

      {/* Modal de Editar Funcionário */}
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Funcionário"
        description="Atualize os dados do funcionário"
        onSubmit={handleUpdateEmployee}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingEmployee(null);
        }}
        loading={updateEmployee.isPending}
        size="xl"
      >
        {editingEmployee && (
          <EmployeeForm
            employee={editingEmployee}
            companyId={companyId}
            onSubmit={handleUpdateEmployee}
            onCancel={() => {
              setIsEditModalOpen(false);
              setEditingEmployee(null);
            }}
            loading={updateEmployee.isPending}
            showButtons={false} // Não mostra botões no modal
          />
        )}
      </FormModal>

      {/* Modal de Visualizar Funcionário */}
      <FormModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        title="Detalhes do Funcionário"
        description="Visualize as informações completas do funcionário"
        onCancel={() => {
          setIsViewModalOpen(false);
          setSelectedEmployee(null);
        }}
        size="lg"
        showCloseButton={true}
      >
        {selectedEmployee && (
          <EmployeeDetailsTabs 
            employee={selectedEmployee} 
            companyId={companyId}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee.mutateAsync}
            loading={updateEmployee.isPending}
          />
        )}
      </FormModal>
    </div>
  );
}

// Componente de exemplo para uso em outras páginas
export function EmployeeManagementPage({ companyId }: { companyId: string }) {
  return (
    <div className="container mx-auto py-6 px-4">
      <EmployeeManagement companyId={companyId} />
    </div>
  );
}





