// @ts-nocheck
import React from 'react';
import { Payroll } from '@/integrations/supabase/rh-types';
import { EnhancedDataTable } from './EnhancedDataTable';
import { TableActions } from './TableActions';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PayrollTableProps {
  data: Payroll[];
  onEdit: (item: Payroll) => void;
  onDelete: (item: Payroll) => void;
  onView: (item: Payroll) => void;
  isLoading?: boolean;
}

export function PayrollTable({ 
  data, 
  onEdit, 
  onDelete, 
  onView, 
  isLoading = false 
}: PayrollTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const columns = [
    {
      accessorKey: 'competencia',
      header: 'Competência',
      cell: ({ row }: { row: { original: Payroll } }) => (
        <div className="font-medium">
          {row.original.competencia ? 
            format(new Date(row.original.competencia + '-01'), 'MMM/yyyy', { locale: ptBR })
            : '-'
          }
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: Payroll } }) => {
        const status = row.original.status;
        let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
        let label = status;

        switch (status) {
          case 'rascunho':
            variant = "secondary";
            label = "Rascunho";
            break;
          case 'calculada':
            variant = "outline";
            label = "Calculada";
            break;
          case 'aprovada':
            variant = "default";
            label = "Aprovada";
            break;
          case 'processada':
            variant = "default";
            label = "Processada";
            break;
          case 'cancelada':
            variant = "destructive";
            label = "Cancelada";
            break;
        }

        return (
          <Badge variant={variant}>
            {label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'total_funcionarios',
      header: 'Funcionários',
      cell: ({ row }: { row: { original: Payroll } }) => (
        <div className="text-sm">
          {row.original.total_funcionarios || 0}
        </div>
      ),
    },
    {
      accessorKey: 'total_proventos',
      header: 'Total Proventos',
      cell: ({ row }: { row: { original: Payroll } }) => (
        <div className="text-sm font-medium text-green-600">
          {formatCurrency(row.original.total_proventos || 0)}
        </div>
      ),
    },
    {
      accessorKey: 'total_descontos',
      header: 'Total Descontos',
      cell: ({ row }: { row: { original: Payroll } }) => (
        <div className="text-sm font-medium text-red-600">
          {formatCurrency(row.original.total_descontos || 0)}
        </div>
      ),
    },
    {
      accessorKey: 'total_liquido',
      header: 'Total Líquido',
      cell: ({ row }: { row: { original: Payroll } }) => (
        <div className="text-sm font-bold">
          {formatCurrency(row.original.total_liquido || 0)}
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Criada em',
      cell: ({ row }: { row: { original: Payroll } }) => (
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
      cell: ({ row }: { row: { original: Payroll } }) => (
        <TableActions
          item={row.original}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          viewLabel="Ver Detalhes"
          editLabel="Editar Folha"
          deleteLabel="Excluir Folha"
          disableEdit={row.original.status === 'processada' || row.original.status === 'cancelada'}
          disableDelete={row.original.status === 'processada'}
        />
      ),
    },
  ];

  return (
    <EnhancedDataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      emptyMessage="Nenhuma folha de pagamento encontrada"
      searchPlaceholder="Buscar folhas..."
      title="Folhas de Pagamento"
    />
  );
}
