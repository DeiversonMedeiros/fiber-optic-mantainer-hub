import React from 'react';
import { Benefit } from '@/integrations/supabase/rh-types';
import { EnhancedDataTable } from './EnhancedDataTable';
import { TableActions, ViewAction, EditAction, DeleteAction } from './TableActions';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ColumnDef } from '@tanstack/react-table';

interface BenefitsTableProps {
  data: Benefit[];
  onEdit: (item: Benefit) => void;
  onDelete: (item: Benefit) => void;
  onView: (item: Benefit) => void;
  isLoading?: boolean;
}

export function BenefitsTable({ 
  data, 
  onEdit, 
  onDelete, 
  onView, 
  isLoading = false 
}: BenefitsTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const columns: ColumnDef<Benefit>[] = [
    {
      accessorKey: 'nome',
      header: 'Nome do Benefício',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.nome}</div>
      ),
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.tipo === 'valor_fixo' ? 'Valor Fixo' : 
           row.original.tipo === 'percentual' ? 'Percentual' : 'Flexível'}
        </Badge>
      ),
    },
    {
      accessorKey: 'valor',
      header: 'Valor',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.tipo === 'valor_fixo' 
            ? formatCurrency(row.original.valor || 0)
            : row.original.tipo === 'percentual'
            ? `${row.original.percentual || 0}%`
            : 'Flexível'
          }
        </div>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Criado em',
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
                confirmTitle="Confirmar exclusão do benefício"
                confirmDescription={`Tem certeza que deseja excluir o benefício "${row.original.nome}"? Esta ação não pode ser desfeita.`}
              />,
              onClick: () => onDelete(row.original),
              variant: 'destructive' as const,
              confirm: {
                title: 'Confirmar exclusão do benefício',
                description: `Tem certeza que deseja excluir o benefício "${row.original.nome}"? Esta ação não pode ser desfeita.`,
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
      searchPlaceholder="Buscar benefícios..."
      emptyMessage="Nenhum benefício encontrado"
      title="Benefícios"
      pageSize={15}
    />
  );
}
