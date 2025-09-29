import React from 'react';
import { Union } from '@/integrations/supabase/rh-types';
import { EnhancedDataTable } from './EnhancedDataTable';
import { TableActions, ViewAction, EditAction, DeleteAction } from './TableActions';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Phone } from 'lucide-react';

interface UnionTableProps {
  data: Union[];
  onEdit: (union: Union) => void;
  onDelete: (union: Union) => void;
  onView: (union: Union) => void;
  isLoading: boolean;
}

export function UnionTable({ data, onEdit, onDelete, onView, isLoading }: UnionTableProps) {
  const formatCNPJ = (cnpj: string | null) => {
    if (!cnpj) return 'Não informado';
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const columns = [
    {
      id: 'nome',
      header: 'Sindicato',
      accessorKey: 'nome',
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <Building2 className="h-4 w-4 text-blue-500" />
          <div>
            <div className="font-medium">{row.original.nome}</div>
            {row.original.cnpj && (
              <div className="text-sm text-muted-foreground">
                CNPJ: {formatCNPJ(row.original.cnpj)}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'cnpj',
      header: 'CNPJ',
      cell: ({ row }: any) => (
        <div className="text-sm">
          {formatCNPJ(row.original.cnpj)}
        </div>
      ),
    },
    {
      id: 'endereco',
      header: 'Endereço',
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-orange-500" />
          <span className="text-sm">
            {row.original.endereco ? 
              row.original.endereco.length > 50 ? 
                `${row.original.endereco.substring(0, 50)}...` : 
                row.original.endereco 
              : 'Não informado'
            }
          </span>
        </div>
      ),
    },
    {
      id: 'contato',
      header: 'Contato',
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <Phone className="h-4 w-4 text-green-500" />
          <span className="text-sm">
            {row.original.contato || 'Não informado'}
          </span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      id: 'created_at',
      header: 'Criado em',
      cell: ({ row }: any) => (
        <div className="text-sm text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString('pt-BR')}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }: any) => (
        <TableActions>
          <ViewAction onClick={() => onView(row.original)} />
          <EditAction onClick={() => onEdit(row.original)} />
          <DeleteAction 
            onClick={() => onDelete(row.original)}
            itemName={row.original.nome}
          />
        </TableActions>
      ),
    },
  ];

  return (
    <EnhancedDataTable
      data={data}
      columns={columns}
      searchKey="nome"
      searchPlaceholder="Buscar sindicatos..."
      isLoading={isLoading}
      emptyMessage="Nenhum sindicato encontrado."
      emptyDescription="Cadastre o primeiro sindicato para começar."
    />
  );
}






















































































