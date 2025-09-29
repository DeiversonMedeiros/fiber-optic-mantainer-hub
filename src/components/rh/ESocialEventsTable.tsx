// @ts-nocheck
import React from 'react';
import { ESocialEvent } from '@/integrations/supabase/rh-types';
import { EnhancedDataTable } from './EnhancedDataTable';
import { TableActions } from './TableActions';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ESocialEventsTableProps {
  data: ESocialEvent[];
  onEdit: (item: ESocialEvent) => void;
  onDelete: (item: ESocialEvent) => void;
  onView: (item: ESocialEvent) => void;
  isLoading?: boolean;
}

export function ESocialEventsTable({ 
  data, 
  onEdit, 
  onDelete, 
  onView, 
  isLoading = false 
}: ESocialEventsTableProps) {
  const columns = [
    {
      accessorKey: 'funcionario_nome',
      header: 'Funcionário',
      cell: ({ row }: { row: { original: ESocialEvent } }) => (
        <div className="font-medium">{row.original.funcionario_nome || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'tipo_evento',
      header: 'Tipo de Evento',
      cell: ({ row }: { row: { original: ESocialEvent } }) => (
        <Badge variant="outline">
          {row.original.tipo_evento === 'admissao' ? 'Admissão' : 
           row.original.tipo_evento === 'demissao' ? 'Demissão' :
           row.original.tipo_evento === 'ferias' ? 'Férias' :
           row.original.tipo_evento === 'afastamento' ? 'Afastamento' :
           row.original.tipo_evento === 'retorno' ? 'Retorno' :
           row.original.tipo_evento === 'alteracao_contrato' ? 'Alteração de Contrato' :
           row.original.tipo_evento === 'alteracao_salario' ? 'Alteração de Salário' : 'N/A'}
        </Badge>
      ),
    },
    {
      accessorKey: 'data_evento',
      header: 'Data do Evento',
      cell: ({ row }: { row: { original: ESocialEvent } }) => (
        <div className="text-sm">
          {row.original.data_evento 
            ? format(new Date(row.original.data_evento), 'dd/MM/yyyy', { locale: ptBR })
            : '-'
          }
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: ESocialEvent } }) => {
        const status = row.original.status;
        let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
        let label = status;

        switch (status) {
          case 'pendente':
            variant = "secondary";
            label = "Pendente";
            break;
          case 'processado':
            variant = "outline";
            label = "Processado";
            break;
          case 'enviado':
            variant = "default";
            label = "Enviado";
            break;
          case 'aceito':
            variant = "default";
            label = "Aceito";
            break;
          case 'rejeitado':
            variant = "destructive";
            label = "Rejeitado";
            break;
        }

        return (
          <Badge variant={variant}>
            {label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'numero_recibo',
      header: 'Número do Recibo',
      cell: ({ row }: { row: { original: ESocialEvent } }) => (
        <div className="text-sm font-mono">{row.original.numero_recibo || '-'}</div>
      ),
    },
    {
      accessorKey: 'protocolo',
      header: 'Protocolo',
      cell: ({ row }: { row: { original: ESocialEvent } }) => (
        <div className="text-sm font-mono">{row.original.protocolo || '-'}</div>
      ),
    },
    {
      accessorKey: 'valor_anterior',
      header: 'Valor Anterior',
      cell: ({ row }: { row: { original: ESocialEvent } }) => {
        const formatCurrency = (value: number) => {
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(value);
        };

        return (
          <div className="text-sm text-muted-foreground">
            {row.original.valor_anterior ? formatCurrency(row.original.valor_anterior) : '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'valor_novo',
      header: 'Valor Novo',
      cell: ({ row }: { row: { original: ESocialEvent } }) => {
        const formatCurrency = (value: number) => {
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(value);
        };

        return (
          <div className="text-sm font-medium text-green-600">
            {row.original.valor_novo ? formatCurrency(row.original.valor_novo) : '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'observacoes',
      header: 'Observações',
      cell: ({ row }: { row: { original: ESocialEvent } }) => (
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          {row.original.observacoes || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Criado em',
      cell: ({ row }: { row: { original: ESocialEvent } }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.created_at 
            ? format(new Date(row.original.created_at), 'dd/MM/yyyy', { locale: ptBR })
            : '-'
          }
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }: { row: { original: ESocialEvent } }) => (
        <TableActions
          item={row.original}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          viewLabel="Ver Detalhes"
          editLabel="Editar Evento"
          deleteLabel="Excluir Evento"
          disableEdit={row.original.status === 'aceito' || row.original.status === 'rejeitado'}
          disableDelete={row.original.status === 'enviado' || row.original.status === 'aceito'}
        />
      ),
    },
  ];

  return (
    <EnhancedDataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      emptyMessage="Nenhum evento eSocial encontrado"
      searchPlaceholder="Buscar eventos..."
      title="Eventos eSocial"
    />
  );
}
