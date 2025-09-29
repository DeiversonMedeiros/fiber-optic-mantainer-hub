// @ts-nocheck
import React from 'react';
import { FuncionarioConvenio } from '@/integrations/supabase/rh-types';
import { DataTable } from './DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Stethoscope, Calendar, DollarSign } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

interface FuncionarioConveniosTableProps {
  data: FuncionarioConvenio[];
  onEdit: (convenio: FuncionarioConvenio) => void;
  onDelete: (convenio: FuncionarioConvenio) => void;
  onView: (convenio: FuncionarioConvenio) => void;
  isLoading?: boolean;
}

export function FuncionarioConveniosTable({
  data,
  onEdit,
  onDelete,
  onView,
  isLoading = false,
}: FuncionarioConveniosTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'Ativo';
      case 'suspenso':
        return 'Suspenso';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'default';
      case 'suspenso':
        return 'secondary';
      case 'cancelado':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const columns = [
    {
      accessorKey: 'convenios_planos.convenios_empresas.nome',
      header: 'Convênio',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-blue-600" />
          <span className="font-medium">
            {row.original.convenios_planos?.convenios_empresas?.nome || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'convenios_planos.nome',
      header: 'Plano',
      cell: ({ row }: { row: any }) => (
        <span className="text-sm">
          {row.original.convenios_planos?.nome || 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'data_inicio',
      header: 'Data Início',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {new Date(row.getValue('data_inicio')).toLocaleDateString('pt-BR')}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'data_fim',
      header: 'Data Fim',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {row.getValue('data_fim') 
              ? new Date(row.getValue('data_fim')).toLocaleDateString('pt-BR')
              : 'Não definida'
            }
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'valor_titular',
      header: 'Valor Titular',
      cell: ({ row }: { row: any }) => (
        <span className="font-medium">
          {formatCurrency(row.getValue('valor_titular') || 0)}
        </span>
      ),
    },
    {
      accessorKey: 'valor_dependentes',
      header: 'Valor Dependentes',
      cell: ({ row }: { row: any }) => (
        <span className="font-medium">
          {formatCurrency(row.getValue('valor_dependentes') || 0)}
        </span>
      ),
    },
    {
      accessorKey: 'valor_total',
      header: 'Valor Total',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-bold text-green-600">
            {formatCurrency(row.getValue('valor_total') || 0)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: any }) => (
        <Badge variant={getStatusBadgeVariant(row.getValue('status') || 'ativo')}>
          {getStatusLabel(row.getValue('status') || 'ativo')}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Criado em',
      cell: ({ row }: { row: any }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.getValue('created_at')).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }: { row: any }) => {
        const convenio = row.original as FuncionarioConvenio;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(convenio)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(convenio)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(convenio)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      emptyMessage="Nenhum convênio encontrado para este funcionário"
      searchPlaceholder="Buscar convênios..."
      searchFields={['convenios_planos.convenios_empresas.nome', 'convenios_planos.nome']}
    />
  );
}

