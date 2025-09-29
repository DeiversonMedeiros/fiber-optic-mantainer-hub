// @ts-nocheck
import React from 'react';
import { BeneficioTipo } from '@/integrations/supabase/rh-types';
import { DataTable } from './DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Gift, Shield, Target, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

interface BeneficioTiposTableProps {
  data: BeneficioTipo[];
  onEdit: (tipo: BeneficioTipo) => void;
  onDelete: (tipo: BeneficioTipo) => void;
  onView: (tipo: BeneficioTipo) => void;
  isLoading?: boolean;
}

export function BeneficioTiposTable({
  data,
  onEdit,
  onDelete,
  onView,
  isLoading = false,
}: BeneficioTiposTableProps) {
  const getCategoriaLabel = (categoria: string) => {
    switch (categoria) {
      case 'convenio':
        return 'Convênios';
      case 'vr_va':
        return 'VR/VA';
      case 'transporte':
        return 'Transporte';
      case 'outros':
        return 'Outros';
      default:
        return categoria;
    }
  };

  const getCategoriaBadgeVariant = (categoria: string) => {
    switch (categoria) {
      case 'convenio':
        return 'default';
      case 'vr_va':
        return 'secondary';
      case 'transporte':
        return 'destructive';
      case 'outros':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'convenio':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'vr_va':
        return <Gift className="h-4 w-4 text-green-600" />;
      case 'transporte':
        return <Target className="h-4 w-4 text-orange-600" />;
      case 'outros':
        return <Users className="h-4 w-4 text-purple-600" />;
      default:
        return <Gift className="h-4 w-4 text-gray-600" />;
    }
  };

  const columns = [
    {
      id: 'nome',
      key: 'nome',
      accessorKey: 'nome',
      header: 'Nome do Tipo',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          {getCategoriaIcon(row.original.categoria)}
          <span className="font-medium">{row.getValue('nome')}</span>
        </div>
      ),
    },
    {
      id: 'categoria',
      key: 'categoria',
      accessorKey: 'categoria',
      header: 'Categoria',
      cell: ({ row }: { row: any }) => (
        <Badge variant={getCategoriaBadgeVariant(row.getValue('categoria'))}>
          {getCategoriaLabel(row.getValue('categoria'))}
        </Badge>
      ),
    },
    {
      id: 'descricao',
      key: 'descricao',
      accessorKey: 'descricao',
      header: 'Descrição',
      cell: ({ row }: { row: any }) => (
        <span className="text-sm text-muted-foreground max-w-xs truncate">
          {row.getValue('descricao') || 'Sem descrição'}
        </span>
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
          {new Date(row.getValue('created_at')).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }: { row: any }) => {
        const tipo = row.original as BeneficioTipo;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(tipo)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(tipo)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(tipo)}
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
      emptyMessage="Nenhum tipo de benefício encontrado"
      searchPlaceholder="Buscar tipos de benefícios..."
      searchFields={['nome', 'categoria']}
    />
  );
}
