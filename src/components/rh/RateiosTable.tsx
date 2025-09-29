// @ts-nocheck
import React from 'react';
import { BeneficioRateio } from '@/integrations/supabase/rh-types';
import { DataTable } from './DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Calculator, Play, Pause, DollarSign, Percent, Users, TrendingUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

interface RateiosTableProps {
  data: BeneficioRateio[];
  onEdit: (rateio: BeneficioRateio) => void;
  onDelete: (rateio: BeneficioRateio) => void;
  onView: (rateio: BeneficioRateio) => void;
  onCalcular: (rateio: BeneficioRateio) => void;
  onAplicar: (rateio: BeneficioRateio) => void;
  isLoading?: boolean;
}

export function RateiosTable({
  data,
  onEdit,
  onDelete,
  onView,
  onCalcular,
  onAplicar,
  isLoading = false,
}: RateiosTableProps) {
  const getTipoRateioLabel = (tipo: string) => {
    switch (tipo) {
      case 'percentual':
        return 'Percentual';
      case 'valor_fixo':
        return 'Valor Fixo';
      case 'proporcional_funcionarios':
        return 'Proporcional Funcionários';
      case 'proporcional_custo':
        return 'Proporcional Custo';
      default:
        return tipo;
    }
  };

  const getTipoRateioBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'percentual':
        return 'default';
      case 'valor_fixo':
        return 'secondary';
      case 'proporcional_funcionarios':
        return 'destructive';
      case 'proporcional_custo':
        return 'outline';
      default:
        return 'outline';
    }
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const columns = [
    {
      id: 'nome',
      key: 'nome',
      accessorKey: 'nome',
      header: 'Nome do Rateio',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          {getTipoRateioIcon(row.original.tipo_rateio)}
          <span className="font-medium">{row.getValue('nome')}</span>
        </div>
      ),
    },
    {
      id: 'beneficio_tipo',
      key: 'beneficio_tipos.nome',
      accessorKey: 'beneficio_tipos.nome',
      header: 'Tipo de Benefício',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <span className="text-sm">{row.original.beneficio_tipos?.nome || 'N/A'}</span>
          <Badge variant="outline" className="text-xs">
            {row.original.beneficio_tipos?.categoria || 'N/A'}
          </Badge>
        </div>
      ),
    },
    {
      id: 'tipo_rateio',
      key: 'tipo_rateio',
      accessorKey: 'tipo_rateio',
      header: 'Tipo de Rateio',
      cell: ({ row }: { row: any }) => (
        <Badge variant={getTipoRateioBadgeVariant(row.getValue('tipo_rateio'))}>
          {getTipoRateioLabel(row.getValue('tipo_rateio'))}
        </Badge>
      ),
    },
    {
      id: 'valor_total',
      key: 'valor_total',
      accessorKey: 'valor_total',
      header: 'Valor Total',
      cell: ({ row }: { row: any }) => (
        <span className="font-mono text-sm">
          {formatCurrency(row.getValue('valor_total'))}
        </span>
      ),
    },
    {
      id: 'periodo',
      key: 'periodo',
      accessorKey: 'periodo_inicio',
      header: 'Período',
      cell: ({ row }: { row: any }) => (
        <div className="text-sm">
          <div>{formatDate(row.getValue('periodo_inicio'))}</div>
          {row.original.periodo_fim && (
            <div className="text-muted-foreground">
              até {formatDate(row.original.periodo_fim)}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'is_active',
      key: 'is_active',
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }: { row: any }) => (
        <Badge variant={row.getValue('is_active') ? 'default' : 'secondary'}>
          {row.getValue('is_active') ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      id: 'created_at',
      key: 'created_at',
      accessorKey: 'created_at',
      header: 'Criado em',
      cell: ({ row }: { row: any }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.getValue('created_at'))}
        </span>
      ),
    },
    {
      id: 'actions',
      key: 'actions',
      header: 'Ações',
      cell: ({ row }: { row: any }) => {
        const rateio = row.original as BeneficioRateio;

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
                <DropdownMenuItem onClick={() => onView(rateio)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(rateio)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCalcular(rateio)}>
                  <Calculator className="mr-2 h-4 w-4" />
                  Calcular
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAplicar(rateio)}>
                  <Play className="mr-2 h-4 w-4" />
                  Aplicar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(rateio)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
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
      emptyMessage="Nenhum rateio encontrado"
      searchPlaceholder="Buscar rateios..."
      searchFields={['nome', 'beneficio_tipos.nome', 'tipo_rateio']}
    />
  );
}
