import React from 'react';
import { Convenio } from '@/integrations/supabase/rh-types';
import { DataTable } from './DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Stethoscope, Building2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

interface ConveniosTableProps {
  data: Convenio[];
  onEdit: (convenio: Convenio) => void;
  onDelete: (convenio: Convenio) => void;
  onView: (convenio: Convenio) => void;
  isLoading?: boolean;
}

export function ConveniosTable({
  data,
  onEdit,
  onDelete,
  onView,
  isLoading = false,
}: ConveniosTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'medico':
        return 'Médico';
      case 'odontologico':
        return 'Odontológico';
      case 'ambos':
        return 'Médico + Odontológico';
      default:
        return tipo;
    }
  };

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'medico':
        return 'default';
      case 'odontologico':
        return 'secondary';
      case 'ambos':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const columns = [
    {
      accessorKey: 'nome',
      header: 'Nome do Convênio',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          {row.original.tipo === 'medico' ? (
            <Stethoscope className="h-4 w-4 text-blue-600" />
          ) : row.original.tipo === 'odontologico' ? (
            <Building2 className="h-4 w-4 text-purple-600" />
          ) : (
            <div className="flex gap-1">
              <Stethoscope className="h-4 w-4 text-blue-600" />
              <Building2 className="h-4 w-4 text-purple-600" />
            </div>
          )}
          <span className="font-medium">{row.getValue('nome')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }: { row: any }) => (
        <Badge variant={getTipoBadgeVariant(row.getValue('tipo'))}>
          {getTipoLabel(row.getValue('tipo'))}
        </Badge>
      ),
    },
    {
      accessorKey: 'prestador',
      header: 'Prestador',
      cell: ({ row }: { row: any }) => (
        <span className="text-sm">{row.getValue('prestador')}</span>
      ),
    },
    {
      accessorKey: 'valor_mensal',
      header: 'Valor Mensal',
      cell: ({ row }: { row: any }) => (
        <span className="font-medium">
          {formatCurrency(row.getValue('valor_mensal') || 0)}
        </span>
      ),
    },
    {
      accessorKey: 'valor_por_funcionario',
      header: 'Valor por Funcionário',
      cell: ({ row }: { row: any }) => (
        <span className="font-medium">
          {formatCurrency(row.getValue('valor_por_funcionario') || 0)}
        </span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }: { row: any }) => (
        <Badge variant={row.getValue('is_active') ? 'default' : 'secondary'}>
          {row.getValue('is_active') ? 'Ativo' : 'Inativo'}
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
        const convenio = row.original as Convenio;

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
      emptyMessage="Nenhum convênio encontrado"
      searchPlaceholder="Buscar convênios..."
      searchFields={['nome', 'prestador']}
    />
  );
}

