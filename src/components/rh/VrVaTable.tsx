import React from 'react';
import { VrVaConfig } from '@/integrations/supabase/rh-types';
import { DataTable } from './DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, CreditCard, Calendar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

interface VrVaTableProps {
  data: VrVaConfig[];
  onEdit: (vrVa: VrVaConfig) => void;
  onDelete: (vrVa: VrVaConfig) => void;
  onView: (vrVa: VrVaConfig) => void;
  isLoading?: boolean;
}

export function VrVaTable({
  data,
  onEdit,
  onDelete,
  onView,
  isLoading = false,
}: VrVaTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'VR':
        return 'Vale Refeição';
      case 'VA':
        return 'Vale Alimentação';
      default:
        return tipo;
    }
  };

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'VR':
        return 'default';
      case 'VA':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const columns = [
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-blue-600" />
          <Badge variant={getTipoBadgeVariant(row.getValue('tipo'))}>
            {getTipoLabel(row.getValue('tipo'))}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'valor_diario',
      header: 'Valor Diário',
      cell: ({ row }: { row: any }) => (
        <span className="font-medium">
          {formatCurrency(row.getValue('valor_diario') || 0)}
        </span>
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
      accessorKey: 'dias_uteis_mes',
      header: 'Dias Úteis',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{row.getValue('dias_uteis_mes')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'descontos',
      header: 'Descontos',
      cell: ({ row }: { row: any }) => {
        const descontos = [];
        if (row.original.desconto_por_ausencia) descontos.push('Ausência');
        if (row.original.desconto_por_ferias) descontos.push('Férias');
        if (row.original.desconto_por_licenca) descontos.push('Licença');
        
        return (
          <div className="flex flex-wrap gap-1">
            {descontos.map((desconto, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {desconto}
              </Badge>
            ))}
          </div>
        );
      },
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
        const vrVa = row.original as VrVaConfig;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(vrVa)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(vrVa)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(vrVa)}
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
      emptyMessage="Nenhuma configuração VR/VA encontrada"
      searchPlaceholder="Buscar configurações..."
      searchFields={['tipo']}
    />
  );
}

