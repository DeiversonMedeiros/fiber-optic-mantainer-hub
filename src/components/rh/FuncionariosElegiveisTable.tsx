import React from 'react';
import { DataTable } from './DataTable';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX, Shield, Target } from 'lucide-react';

interface FuncionariosElegiveisTableProps {
  data: any[];
  isLoading?: boolean;
}

export function FuncionariosElegiveisTable({
  data,
  isLoading = false,
}: FuncionariosElegiveisTableProps) {
  const columns = [
    {
      id: 'nome',
      key: 'nome',
      accessorKey: 'nome',
      header: 'Funcionário',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          <span className="font-medium">{row.getValue('nome')}</span>
        </div>
      ),
    },
    {
      id: 'cargo',
      key: 'cargo',
      accessorKey: 'cargo',
      header: 'Cargo',
      cell: ({ row }: { row: any }) => (
        <span className="text-sm">{row.getValue('cargo') || 'Não definido'}</span>
      ),
    },
    {
      id: 'departamento',
      key: 'departamento',
      accessorKey: 'departamento',
      header: 'Departamento',
      cell: ({ row }: { row: any }) => (
        <span className="text-sm">{row.getValue('departamento') || 'Não definido'}</span>
      ),
    },
    {
      id: 'is_elegivel',
      key: 'is_elegivel',
      accessorKey: 'is_elegivel',
      header: 'Elegibilidade',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          {row.getValue('is_elegivel') ? (
            <>
              <UserCheck className="h-4 w-4 text-green-600" />
              <Badge variant="default" className="bg-green-100 text-green-800">
                Elegível
              </Badge>
            </>
          ) : (
            <>
              <UserX className="h-4 w-4 text-red-600" />
              <Badge variant="destructive">
                Não Elegível
              </Badge>
            </>
          )}
        </div>
      ),
    },
    {
      id: 'regra_aplicada',
      key: 'regra_aplicada',
      accessorKey: 'regra_aplicada',
      header: 'Regra Aplicada',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {row.getValue('regra_aplicada') || 'N/A'}
          </span>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      emptyMessage="Nenhum funcionário elegível encontrado"
      searchPlaceholder="Buscar funcionários elegíveis..."
      searchFields={['nome', 'cargo', 'departamento']}
    />
  );
}
