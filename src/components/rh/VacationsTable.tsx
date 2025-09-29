import React from 'react';
import { Vacation } from '@/integrations/supabase/rh-types';
import { EnhancedDataTable } from './EnhancedDataTable';
import { TableActions, ViewAction, EditAction, DeleteAction } from './TableActions';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ColumnDef } from '@tanstack/react-table';

interface VacationsTableProps {
  data: Vacation[];
  onEdit: (item: Vacation) => void;
  onDelete: (item: Vacation) => void;
  onView: (item: Vacation) => void;
  isLoading?: boolean;
}

export function VacationsTable({ 
  data, 
  onEdit, 
  onDelete, 
  onView, 
  isLoading = false 
}: VacationsTableProps) {
  const columns: ColumnDef<Vacation>[] = [
    {
      accessorKey: 'employee_id',
      header: 'Funcionário',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.employee_id || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'ano',
      header: 'Ano',
      cell: ({ row }) => (
        <div className="text-sm">{row.original.ano || '-'}</div>
      ),
    },
    {
      accessorKey: 'periodo',
      header: 'Período',
      cell: ({ row }) => (
        <div className="text-sm">{row.original.periodo || '-'}</div>
      ),
    },
    {
      accessorKey: 'data_inicio',
      header: 'Data Início',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.data_inicio 
            ? format(new Date(row.original.data_inicio), 'dd/MM/yyyy', { locale: ptBR })
            : '-'
          }
        </div>
      ),
    },
    {
      accessorKey: 'data_fim',
      header: 'Data Fim',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.data_fim 
            ? format(new Date(row.original.data_fim), 'dd/MM/yyyy', { locale: ptBR })
            : '-'
          }
        </div>
      ),
    },
    {
      accessorKey: 'dias_ferias',
      header: 'Dias de Férias',
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {row.original.dias_ferias || 0} dias
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => (
        <TableActions
          item={row.original}
          actions={[
            {
              label: 'Visualizar',
              icon: <ViewAction onClick={() => onView(row.original)} />,
              onClick: () => onView(row.original),
            },
            {
              label: 'Editar',
              icon: <EditAction onClick={() => onEdit(row.original)} />,
              onClick: () => onEdit(row.original),
            },
            {
              label: 'Excluir',
              icon: <DeleteAction 
                onClick={() => onDelete(row.original)}
                confirmTitle="Confirmar exclusão das férias"
                confirmDescription={`Tem certeza que deseja excluir as férias? Esta ação não pode ser desfeita.`}
              />,
              onClick: () => onDelete(row.original),
              variant: 'destructive' as const,
              confirm: {
                title: 'Confirmar exclusão das férias',
                description: `Tem certeza que deseja excluir as férias? Esta ação não pode ser desfeita.`,
                confirmText: 'Excluir',
                cancelText: 'Cancelar',
              },
            },
          ]}
          showDropdown={true}
          maxVisibleActions={3}
        />
      ),
    },
  ];

  return (
    <EnhancedDataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      searchPlaceholder="Buscar férias..."
      emptyMessage="Nenhuma férias encontrada"
      title="Férias"
      pageSize={15}
    />
  );
}
