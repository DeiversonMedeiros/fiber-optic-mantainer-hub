import React from 'react';
import { ConvenioEmpresa } from '@/integrations/supabase/rh-types';
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

interface ConveniosEmpresasTableProps {
  data: ConvenioEmpresa[];
  onEdit: (convenio: ConvenioEmpresa) => void;
  onDelete: (convenio: ConvenioEmpresa) => void;
  onView: (convenio: ConvenioEmpresa) => void;
  isLoading?: boolean;
}

export function ConveniosEmpresasTable({
  data,
  onEdit,
  onDelete,
  onView,
  isLoading = false,
}: ConveniosEmpresasTableProps) {
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
      id: 'nome',
      key: 'nome',
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
      id: 'tipo',
      key: 'tipo',
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }: { row: any }) => (
        <Badge variant={getTipoBadgeVariant(row.getValue('tipo'))}>
          {getTipoLabel(row.getValue('tipo'))}
        </Badge>
      ),
    },
    {
      id: 'prestador',
      key: 'prestador',
      accessorKey: 'prestador',
      header: 'Prestador',
      cell: ({ row }: { row: any }) => (
        <span className="text-sm">{row.getValue('prestador')}</span>
      ),
    },
    {
      id: 'cnpj',
      key: 'cnpj',
      accessorKey: 'cnpj',
      header: 'CNPJ',
      cell: ({ row }: { row: any }) => (
        <span className="text-sm font-mono">{row.getValue('cnpj') || 'Não informado'}</span>
      ),
    },
    {
      id: 'contato',
      key: 'contato',
      accessorKey: 'contato',
      header: 'Contato',
      cell: ({ row }: { row: any }) => (
        <span className="text-sm">{row.getValue('contato') || 'Não informado'}</span>
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
      key: 'actions',
      accessorKey: 'actions',
      header: 'Ações',
      cell: ({ row }: { row: any }) => {
        const convenio = row.original as ConvenioEmpresa;

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
      emptyMessage="Nenhuma empresa convênio encontrada"
      searchPlaceholder="Buscar empresas convênio..."
      searchFields={['nome', 'prestador']}
    />
  );
}

