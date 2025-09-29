import React from 'react';
import { WorkSchedule } from '@/integrations/supabase/rh-types';
import { EnhancedDataTable } from './EnhancedDataTable';
import { TableActions, ViewAction, EditAction, DeleteAction } from './TableActions';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ColumnDef } from '@tanstack/react-table';

interface WorkScheduleTableProps {
  data: WorkSchedule[];
  onEdit: (item: WorkSchedule) => void;
  onDelete: (item: WorkSchedule) => void;
  onView: (item: WorkSchedule) => void;
  isLoading?: boolean;
}

export function WorkScheduleTable({ 
  data, 
  onEdit, 
  onDelete, 
  onView, 
  isLoading = false 
}: WorkScheduleTableProps) {
  const columns: ColumnDef<WorkSchedule>[] = [
    {
      accessorKey: 'nome',
      header: 'Nome da Escala',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.nome}</div>
      ),
    },
    {
      accessorKey: 'hora_entrada',
      header: 'Hora Entrada',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.hora_entrada}
        </div>
      ),
    },
    {
      accessorKey: 'hora_saida',
      header: 'Hora Saída',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.hora_saida}
        </div>
      ),
    },
    {
      accessorKey: 'intervalo_inicio',
      header: 'Intervalo Início',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.intervalo_inicio}
        </div>
      ),
    },
    {
      accessorKey: 'intervalo_fim',
      header: 'Intervalo Fim',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.intervalo_fim}
        </div>
      ),
    },
    {
      accessorKey: 'carga_horaria_semanal',
      header: 'Carga Horária',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.carga_horaria_semanal}h/semana
        </div>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? 'Ativa' : 'Inativa'}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Criada em',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.created_at 
            ? format(new Date(row.original.created_at), 'dd/MM/yyyy', { locale: ptBR })
            : '-'
          }
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
                confirmTitle="Confirmar exclusão da escala"
                confirmDescription={`Tem certeza que deseja excluir a escala "${row.original.nome}"? Esta ação não pode ser desfeita.`}
              />,
              onClick: () => onDelete(row.original),
              variant: 'destructive' as const,
              confirm: {
                title: 'Confirmar exclusão da escala',
                description: `Tem certeza que deseja excluir a escala "${row.original.nome}"? Esta ação não pode ser desfeita.`,
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
      searchPlaceholder="Buscar escalas..."
      emptyMessage="Nenhuma escala encontrada"
      title="Escalas de Trabalho"
      pageSize={15}
    />
  );
}
