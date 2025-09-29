import React from 'react';
import { TransporteConfig } from '@/integrations/supabase/rh-types';
import { DataTable } from './DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Bus, Ticket, Fuel } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

interface TransporteTableProps {
  data: TransporteConfig[];
  onEdit: (transporte: TransporteConfig) => void;
  onDelete: (transporte: TransporteConfig) => void;
  onView: (transporte: TransporteConfig) => void;
  isLoading?: boolean;
}

export function TransporteTable({
  data,
  onEdit,
  onDelete,
  onView,
  isLoading = false,
}: TransporteTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'passagem':
        return 'Passagem';
      case 'combustivel':
        return 'Combustível';
      case 'ambos':
        return 'Passagem + Combustível';
      default:
        return tipo;
    }
  };

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'passagem':
        return 'default';
      case 'combustivel':
        return 'secondary';
      case 'ambos':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'passagem':
        return <Ticket className="h-4 w-4 text-orange-600" />;
      case 'combustivel':
        return <Fuel className="h-4 w-4 text-purple-600" />;
      case 'ambos':
        return (
          <div className="flex gap-1">
            <Ticket className="h-4 w-4 text-orange-600" />
            <Fuel className="h-4 w-4 text-purple-600" />
          </div>
        );
      default:
        return <Bus className="h-4 w-4 text-blue-600" />;
    }
  };

  const columns = [
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          {getTipoIcon(row.getValue('tipo'))}
          <Badge variant={getTipoBadgeVariant(row.getValue('tipo'))}>
            {getTipoLabel(row.getValue('tipo'))}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'valor_passagem',
      header: 'Valor Passagem',
      cell: ({ row }: { row: any }) => (
        <span className="font-medium">
          {formatCurrency(row.getValue('valor_passagem') || 0)}
        </span>
      ),
    },
    {
      accessorKey: 'quantidade_passagens',
      header: 'Qtd. Passagens',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-1">
          <Ticket className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{row.getValue('quantidade_passagens')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'valor_combustivel',
      header: 'Valor Combustível',
      cell: ({ row }: { row: any }) => (
        <span className="font-medium">
          {formatCurrency(row.getValue('valor_combustivel') || 0)}
        </span>
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
        const transporte = row.original as TransporteConfig;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(transporte)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(transporte)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(transporte)}
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
      emptyMessage="Nenhuma configuração de transporte encontrada"
      searchPlaceholder="Buscar configurações..."
      searchFields={['tipo']}
    />
  );
}

