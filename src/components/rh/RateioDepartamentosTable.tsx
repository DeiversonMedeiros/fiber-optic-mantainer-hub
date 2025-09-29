// @ts-nocheck
import React from 'react';
import { BeneficioRateioDepartamento } from '@/integrations/supabase/rh-types';
import { DataTable } from './DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Building2, Percent, DollarSign, Users, TrendingUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

interface RateioDepartamentosTableProps {
  data: BeneficioRateioDepartamento[];
  onEdit: (departamento: BeneficioRateioDepartamento) => void;
  onDelete: (departamento: BeneficioRateioDepartamento) => void;
  isLoading?: boolean;
  tipoRateio?: string;
}

export function RateioDepartamentosTable({
  data,
  onEdit,
  onDelete,
  isLoading = false,
  tipoRateio = 'percentual',
}: RateioDepartamentosTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getTipoRateioIcon = (tipo: string) => {
    switch (tipo) {
      case 'percentual':
        return <Percent className="h-4 w-4 text-blue-600" />;
      case 'valor_fixo':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'proporcional_funcionarios':
        return <Users className="h-4 w-4 text-orange-600" />;
      case 'proporcional_custo':
        return <TrendingUp className="h-4 w-4 text-purple-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const columns = [
    {
      id: 'departamento',
      key: 'departments.nome',
      accessorKey: 'departments.nome',
      header: 'Departamento',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-600" />
          <span className="font-medium">{row.original.departments?.nome || 'N/A'}</span>
        </div>
      ),
    },
    {
      id: 'percentual',
      key: 'percentual',
      accessorKey: 'percentual',
      header: 'Percentual',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          {getTipoRateioIcon(tipoRateio)}
          <span className="font-mono text-sm">
            {formatPercent(row.getValue('percentual'))}
          </span>
        </div>
      ),
    },
    {
      id: 'valor_fixo',
      key: 'valor_fixo',
      accessorKey: 'valor_fixo',
      header: 'Valor Fixo',
      cell: ({ row }: { row: any }) => (
        <span className="font-mono text-sm">
          {formatCurrency(row.getValue('valor_fixo') || 0)}
        </span>
      ),
    },
    {
      id: 'quantidade_funcionarios',
      key: 'quantidade_funcionarios',
      accessorKey: 'quantidade_funcionarios',
      header: 'Funcionários',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{row.getValue('quantidade_funcionarios') || 0}</span>
        </div>
      ),
    },
    {
      id: 'custo_medio_funcionario',
      key: 'custo_medio_funcionario',
      accessorKey: 'custo_medio_funcionario',
      header: 'Custo Médio',
      cell: ({ row }: { row: any }) => (
        <span className="font-mono text-sm">
          {formatCurrency(row.getValue('custo_medio_funcionario') || 0)}
        </span>
      ),
    },
    {
      id: 'valor_calculado',
      key: 'valor_calculado',
      accessorKey: 'valor_calculado',
      header: 'Valor Calculado',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-mono text-sm font-semibold">
            {formatCurrency(row.getValue('valor_calculado') || 0)}
          </span>
        </div>
      ),
    },
    {
      id: 'observacoes',
      key: 'observacoes',
      accessorKey: 'observacoes',
      header: 'Observações',
      cell: ({ row }: { row: any }) => (
        <span className="text-sm text-muted-foreground max-w-xs truncate">
          {row.getValue('observacoes') || 'Sem observações'}
        </span>
      ),
    },
    {
      id: 'actions',
      key: 'actions',
      header: 'Ações',
      cell: ({ row }: { row: any }) => {
        const departamento = row.original as BeneficioRateioDepartamento;

        return (
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(departamento)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(departamento)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      emptyMessage="Nenhum departamento adicionado ao rateio"
      searchPlaceholder="Buscar departamentos..."
      searchFields={['departments.nome', 'observacoes']}
    />
  );
}
