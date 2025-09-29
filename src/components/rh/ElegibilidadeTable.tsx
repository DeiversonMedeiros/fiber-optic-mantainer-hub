// @ts-nocheck
import React from 'react';
import { BeneficioElegibilidade } from '@/integrations/supabase/rh-types';
import { DataTable } from './DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Shield, Users, Target, Calendar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

interface ElegibilidadeTableProps {
  data: BeneficioElegibilidade[];
  onEdit: (elegibilidade: BeneficioElegibilidade) => void;
  onDelete: (elegibilidade: BeneficioElegibilidade) => void;
  onView: (elegibilidade: BeneficioElegibilidade) => void;
  isLoading?: boolean;
}

export function ElegibilidadeTable({
  data,
  onEdit,
  onDelete,
  onView,
  isLoading = false,
}: ElegibilidadeTableProps) {
  // Verificar se os dados são válidos
  if (!data || !Array.isArray(data)) {
    console.warn('Dados inválidos passados para ElegibilidadeTable:', data);
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Dados inválidos</p>
      </div>
    );
  }
  const getTipoRegraLabel = (tipo: string) => {
    switch (tipo) {
      case 'cargo':
        return 'Por Cargo';
      case 'departamento':
        return 'Por Departamento';
      case 'ambos':
        return 'Cargo + Departamento';
      case 'todos':
        return 'Todos os Funcionários';
      default:
        return tipo;
    }
  };

  const getTipoRegraBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'cargo':
        return 'default';
      case 'departamento':
        return 'secondary';
      case 'ambos':
        return 'destructive';
      case 'todos':
        return 'outline';
      default:
        return 'outline';
    }
  };

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

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'convenio':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'vr_va':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'transporte':
        return <Target className="h-4 w-4 text-orange-600" />;
      case 'outros':
        return <Users className="h-4 w-4 text-purple-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  const columns = [
    {
      id: 'nome',
      key: 'nome',
      accessorKey: 'nome',
      header: 'Nome da Regra',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600" />
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
          {getCategoriaIcon(row.original.beneficio_tipos?.categoria || 'outros')}
          <span className="text-sm">{row.original.beneficio_tipos?.nome || 'N/A'}</span>
        </div>
      ),
    },
    {
      id: 'tipo_regra',
      key: 'tipo_regra',
      accessorKey: 'tipo_regra',
      header: 'Tipo de Regra',
      cell: ({ row }: { row: any }) => (
        <Badge variant={getTipoRegraBadgeVariant(row.getValue('tipo_regra'))}>
          {getTipoRegraLabel(row.getValue('tipo_regra'))}
        </Badge>
      ),
    },
    {
      id: 'data_inicio',
      key: 'data_inicio',
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
      id: 'data_fim',
      key: 'data_fim',
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
      id: 'is_active',
      key: 'is_active',
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }: { row: any }) => (
        <Badge variant={row.getValue('is_active') ? 'default' : 'secondary'}>
          {row.getValue('is_active') ? 'Ativa' : 'Inativa'}
        </Badge>
      ),
    },
    {
      id: 'created_at',
      key: 'created_at',
      accessorKey: 'created_at',
      header: 'Criada em',
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
        const elegibilidade = row.original as BeneficioElegibilidade;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(elegibilidade)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(elegibilidade)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(elegibilidade)}
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
      emptyMessage="Nenhuma regra de elegibilidade encontrada"
      searchPlaceholder="Buscar regras de elegibilidade..."
      searchFields={['nome', 'beneficio_tipos.nome']}
    />
  );
}
