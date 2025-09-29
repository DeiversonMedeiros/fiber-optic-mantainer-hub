import React from 'react';
import { EnhancedDataTable } from './EnhancedDataTable';
import { TimeRecord, Employee } from '@/integrations/supabase/rh-types';
import { useTimeRecords, useEmployees } from '@/hooks/rh';
import { Badge } from '@/components/ui/badge';
import { TableActions, ViewAction, EditAction, DeleteAction } from './TableActions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Calendar, User } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

export interface TimeRecordTableProps {
  companyId: string;
  onViewRecord?: (record: TimeRecord) => void;
  onEditRecord?: (record: TimeRecord) => void;
  onDeleteRecord?: (record: TimeRecord) => void;
  onApproveRecord?: (record: TimeRecord) => void;
  onRejectRecord?: (record: TimeRecord) => void;
  className?: string;
}

export function TimeRecordTable({
  companyId,
  onViewRecord,
  onEditRecord,
  onDeleteRecord,
  onApproveRecord,
  onRejectRecord,
  className = ''
}: TimeRecordTableProps) {
  const { timeRecords, isLoading, error } = useTimeRecords(companyId);
  const { employees } = useEmployees(companyId);

  // Função para calcular horas trabalhadas
  const calculateWorkedHours = (entry: string, exit: string) => {
    if (!entry || !exit) return 'N/A';
    
    const entryTime = new Date(entry);
    const exitTime = new Date(exit);
    const diffMs = exitTime.getTime() - entryTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return `${diffHours.toFixed(2)}h`;
  };

  // Função para obter nome do funcionário
  const getEmployeeName = (employeeId: string) => {
    const employee = employees?.find(emp => emp.id === employeeId);
    return employee?.nome || 'Funcionário não encontrado';
  };

  const columns: ColumnDef<TimeRecord>[] = [
    {
      accessorKey: 'employee_id',
      header: 'Funcionário',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{getEmployeeName(row.original.employee_id)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'data',
      header: 'Data',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{format(new Date(row.original.data), 'dd/MM/yyyy', { locale: ptBR })}</span>
        </div>
      ),
    },
    {
      accessorKey: 'hora_entrada',
      header: 'Entrada',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-green-600" />
          <span className="font-mono">
            {row.original.hora_entrada ? format(new Date(row.original.hora_entrada), 'HH:mm') : 'N/A'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'hora_saida',
      header: 'Saída',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-red-600" />
          <span className="font-mono">
            {row.original.hora_saida ? format(new Date(row.original.hora_saida), 'HH:mm') : 'N/A'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'horas_trabalhadas',
      header: 'Horas Trabalhadas',
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {calculateWorkedHours(row.original.hora_entrada, row.original.hora_saida)}
        </div>
      ),
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.tipo === 'normal' ? 'Normal' : 'Extra'}
        </Badge>
      ),
    },
    {
      accessorKey: 'justificativa',
      header: 'Justificativa',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          {row.original.justificativa || 'Sem justificativa'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => (
        <TableActions
          item={row.original}
          actions={[
            ...(onViewRecord ? [{
              label: 'Visualizar',
              icon: <ViewAction onClick={() => onViewRecord(row.original)} />,
              onClick: () => onViewRecord(row.original),
            }] : []),
            ...(onEditRecord ? [{
              label: 'Editar',
              icon: <EditAction onClick={() => onEditRecord(row.original)} />,
              onClick: () => onEditRecord(row.original),
            }] : []),
            ...(onDeleteRecord ? [{
              label: 'Excluir',
              icon: <DeleteAction 
                onClick={() => onDeleteRecord(row.original)}
                confirmTitle="Confirmar exclusão do registro"
                confirmDescription={`Tem certeza que deseja excluir o registro de ponto? Esta ação não pode ser desfeita.`}
              />,
              onClick: () => onDeleteRecord(row.original),
              variant: 'destructive' as const,
              confirm: {
                title: 'Confirmar exclusão do registro',
                description: `Tem certeza que deseja excluir o registro de ponto? Esta ação não pode ser desfeita.`,
                confirmText: 'Excluir',
                cancelText: 'Cancelar',
              },
            }] : []),
          ]}
          showDropdown={true}
          maxVisibleActions={3}
        />
      ),
    },
  ];

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-destructive">
          Erro ao carregar registros de ponto: {error.message}
        </div>
      </div>
    );
  }

  return (
    <EnhancedDataTable
      columns={columns}
      data={timeRecords || []}
      isLoading={isLoading}
      searchPlaceholder="Buscar registros..."
      emptyMessage="Nenhum registro de ponto encontrado"
      title="Registros de Ponto"
      className={className}
      pageSize={15}
    />
  );
}
