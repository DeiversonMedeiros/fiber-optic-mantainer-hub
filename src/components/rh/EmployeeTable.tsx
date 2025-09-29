import React, { useState } from 'react';
import { EnhancedDataTable } from './EnhancedDataTable';
import { TableActions, ViewAction, EditAction, DeleteAction, EmployeeStatusAction } from './TableActions';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Employee } from '@/integrations/supabase/rh-types';
import { useEmployees } from '@/hooks/rh';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Edit, Trash2 } from 'lucide-react';

export interface EmployeeTableProps {
  companyId: string;
  onViewEmployee?: (employee: Employee) => void;
  onEditEmployee?: (employee: Employee) => void;
  onDeleteEmployee?: (employee: Employee) => void;
  onStatusChange?: (employee: Employee, newStatus: string) => void;
  className?: string;
}

export function EmployeeTable({
  companyId,
  onViewEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onStatusChange,
  className = '',
}: EmployeeTableProps) {
  const {
    employees,
    isLoading,
    error,
    changeEmployeeStatus,
  } = useEmployees(companyId);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleStatusChange = async (employee: Employee, newStatus: string) => {
    try {
      await changeEmployeeStatus.mutateAsync({ id: employee.id, status: newStatus });
      onStatusChange?.(employee, newStatus);
    } catch (error) {
      console.error('Erro ao alterar status do funcionário:', error);
    }
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (!onDeleteEmployee) return;
    
    try {
      setDeletingId(employee.id);
      await onDeleteEmployee(employee);
    } finally {
      setDeletingId(null);
    }
  };

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: 'nome',
      header: 'Funcionário',
      cell: ({ row }) => {
        const employee = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(employee.nome)}&background=random`} />
              <AvatarFallback>{employee.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{employee.nome}</span>
              {employee.matricula && (
                <span className="text-sm text-muted-foreground">Matrícula: {employee.matricula}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'cpf',
      header: 'CPF',
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return value ? (
          <span className="font-mono text-sm">
            {value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
          </span>
        ) : '-';
      },
    },
    {
      accessorKey: 'data_nascimento',
      header: 'Data de Nascimento',
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return value ? new Date(value).toLocaleDateString('pt-BR') : '-';
      },
    },
    {
      accessorKey: 'data_admissao',
      header: 'Data de Admissão',
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return value ? new Date(value).toLocaleDateString('pt-BR') : '-';
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const employee = row.original;
        return (
          <EmployeeStatusAction
            status={employee.status || 'ativo'}
            onChangeStatus={(newStatus) => handleStatusChange(employee, newStatus)}
            disabled={changeEmployeeStatus.isPending}
          />
        );
      },
    },
    {
      accessorKey: 'position',
      header: 'Cargo',
      cell: ({ getValue }) => {
        const value = getValue() as any;
        return value ? (
          <div className="flex flex-col">
            <span className="font-medium">{value.nome}</span>
            <span className="text-sm text-muted-foreground">{value.codigo}</span>
          </div>
        ) : '-';
      },
    },
    {
      accessorKey: 'cost_center',
      header: 'Centro de Custo',
      cell: ({ getValue }) => {
        const value = getValue() as any;
        return value ? value.nome : '-';
      },
    },
    {
      accessorKey: 'project',
      header: 'Projeto',
      cell: ({ getValue }) => {
        const value = getValue() as any;
        return value ? value.nome : '-';
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const employee = row.original;
        return actions(employee);
      },
    },
  ];

  const actions = (employee: Employee) => (
    <TableActions
      item={employee}
      actions={[
        {
          label: 'Visualizar',
          icon: <Eye className="h-4 w-4" />,
          onClick: () => onViewEmployee?.(employee),
        },
        {
          label: 'Editar',
          icon: <Edit className="h-4 w-4" />,
          onClick: () => onEditEmployee?.(employee),
        },
        {
          label: 'Excluir',
          icon: <Trash2 className="h-4 w-4" />,
          onClick: () => handleDeleteEmployee(employee),
          variant: 'destructive',
          confirm: {
            title: 'Confirmar exclusão do funcionário',
            description: `Tem certeza que deseja excluir o funcionário "${employee.nome}"? Esta ação não pode ser desfeita.`,
            confirmText: 'Excluir',
            cancelText: 'Cancelar',
          },
        },
      ]}
      showDropdown={false}
      maxVisibleActions={3}
    />
  );

  const handleExport = () => {
    // Implementar exportação para Excel/CSV
    console.log('Exportando funcionários...');
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-destructive">
          Erro ao carregar funcionários: {error.message}
        </div>
      </div>
    );
  }

  return (
    <EnhancedDataTable
      columns={columns}
      data={employees || []}
      isLoading={isLoading}
      emptyMessage="Nenhum funcionário encontrado"
      searchPlaceholder="Buscar funcionários..."
      title="Funcionários"
      className={className}
      pageSize={15}
    />
  );
}

// Componente para exibir estatísticas dos funcionários
export function EmployeeStats({ companyId }: { companyId: string }) {
  const { employees, activeEmployees } = useEmployees(companyId);

  if (!employees) return null;

  const totalEmployees = employees.length;
  const activeCount = activeEmployees?.length || 0;
  const inactiveCount = totalEmployees - activeCount;

  const statusCounts = employees.reduce((acc, employee) => {
    const status = employee.status || 'ativo';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{totalEmployees}</p>
          </div>
          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-sm font-bold">T</span>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Ativos</p>
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          </div>
          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 text-sm font-bold">A</span>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Inativos</p>
            <p className="text-2xl font-bold text-red-600">{inactiveCount}</p>
          </div>
          <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-sm font-bold">I</span>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Demitidos</p>
            <p className="text-2xl font-bold text-orange-600">{statusCounts.demitido || 0}</p>
          </div>
          <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-orange-600 text-sm font-bold">D</span>
          </div>
        </div>
      </div>
    </div>
  );
}
