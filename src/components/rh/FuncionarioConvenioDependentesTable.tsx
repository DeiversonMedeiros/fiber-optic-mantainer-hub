import React from 'react';
import { FuncionarioConvenioDependente } from '@/integrations/supabase/rh-types';
import { DataTable } from './DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Users, DollarSign, UserCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

interface FuncionarioConvenioDependentesTableProps {
  data: FuncionarioConvenioDependente[];
  onEdit: (dependente: FuncionarioConvenioDependente) => void;
  onDelete: (dependente: FuncionarioConvenioDependente) => void;
  onView: (dependente: FuncionarioConvenioDependente) => void;
  isLoading?: boolean;
}

export function FuncionarioConvenioDependentesTable({
  data,
  onEdit,
  onDelete,
  onView,
  isLoading = false,
}: FuncionarioConvenioDependentesTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const columns = [
    {
      accessorKey: 'funcionario_dependente_id',
      header: 'Dependente',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          <span className="font-medium">
            {row.getValue('funcionario_dependente_id') || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'valor_dependente',
      header: 'Valor',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-bold text-green-600">
            {formatCurrency(row.getValue('valor_dependente') || 0)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'is_ativo',
      header: 'Status',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-muted-foreground" />
          <Badge variant={row.getValue('is_ativo') ? 'default' : 'secondary'}>
            {row.getValue('is_ativo') ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Vinculado em',
      cell: ({ row }: { row: any }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.getValue('created_at')).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
    {
      accessorKey: 'updated_at',
      header: 'Atualizado em',
      cell: ({ row }: { row: any }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.getValue('updated_at')).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }: { row: any }) => {
        const dependente = row.original as FuncionarioConvenioDependente;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(dependente)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(dependente)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(dependente)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Desvincular
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
      emptyMessage="Nenhum dependente vinculado a este convênio"
      searchPlaceholder="Buscar dependentes..."
      searchFields={['funcionario_dependente_id']}
    />
  );
}

