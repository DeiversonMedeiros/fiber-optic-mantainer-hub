// @ts-nocheck
import React from 'react';
import { RecruitmentData } from '@/hooks/rh/useRecruitment';
import { EnhancedDataTable } from './EnhancedDataTable';
import { TableActions } from './TableActions';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecruitmentTableProps {
  data: RecruitmentData[];
  onEdit: (item: RecruitmentData) => void;
  onDelete: (item: RecruitmentData) => void;
  onView: (item: RecruitmentData) => void;
  isLoading?: boolean;
}

export function RecruitmentTable({ 
  data, 
  onEdit, 
  onDelete, 
  onView, 
  isLoading = false 
}: RecruitmentTableProps) {
  const columns = [
    {
      accessorKey: 'titulo',
      header: 'Título da Vaga',
      cell: ({ row }: { row: { original: RecruitmentData } }) => (
        <div className="font-medium">{row.original.titulo}</div>
      ),
    },
    {
      accessorKey: 'position_nome',
      header: 'Cargo',
      cell: ({ row }: { row: { original: RecruitmentData } }) => (
        <div className="text-sm">{row.original.position_nome}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: RecruitmentData } }) => {
        const status = row.original.status;
        let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
        let label = status;

        switch (status) {
          case 'aberta':
            variant = "default";
            label = "Aberta";
            break;
          case 'em_andamento':
            variant = "secondary";
            label = "Em Andamento";
            break;
          case 'fechada':
            variant = "outline";
            label = "Fechada";
            break;
          case 'cancelada':
            variant = "destructive";
            label = "Cancelada";
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
      accessorKey: 'tipo_contrato',
      header: 'Tipo de Contrato',
      cell: ({ row }: { row: { original: RecruitmentData } }) => (
        <Badge variant="outline">
          {row.original.tipo_contrato === 'clt' ? 'CLT' : 
           row.original.tipo_contrato === 'pj' ? 'PJ' :
           row.original.tipo_contrato === 'estagio' ? 'Estágio' :
           row.original.tipo_contrato === 'temporario' ? 'Temporário' : 'N/A'}
        </Badge>
      ),
    },
    {
      accessorKey: 'local_trabalho',
      header: 'Local',
      cell: ({ row }: { row: { original: RecruitmentData } }) => (
        <div className="text-sm">{row.original.local_trabalho}</div>
      ),
    },
    {
      accessorKey: 'salario_min',
      header: 'Faixa Salarial',
      cell: ({ row }: { row: { original: RecruitmentData } }) => {
        const formatCurrency = (value: number) => {
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(value);
        };

        return (
          <div className="text-sm">
            {formatCurrency(row.original.salario_min)} - {formatCurrency(row.original.salario_max)}
          </div>
        );
      },
    },
    {
      accessorKey: 'vagas_disponiveis',
      header: 'Vagas',
      cell: ({ row }: { row: { original: RecruitmentData } }) => (
        <div className="text-sm font-medium">
          {row.original.vagas_disponiveis} vaga(s)
        </div>
      ),
    },
    {
      accessorKey: 'candidatos_interessados',
      header: 'Candidatos',
      cell: ({ row }: { row: { original: RecruitmentData } }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.candidatos_interessados} candidato(s)
        </div>
      ),
    },
    {
      accessorKey: 'data_abertura',
      header: 'Data Abertura',
      cell: ({ row }: { row: { original: RecruitmentData } }) => (
        <div className="text-sm">
          {row.original.data_abertura 
            ? format(new Date(row.original.data_abertura), 'dd/MM/yyyy', { locale: ptBR })
            : '-'
          }
        </div>
      ),
    },
    {
      accessorKey: 'data_fechamento',
      header: 'Data Fechamento',
      cell: ({ row }: { row: { original: RecruitmentData } }) => (
        <div className="text-sm">
          {row.original.data_fechamento 
            ? format(new Date(row.original.data_fechamento), 'dd/MM/yyyy', { locale: ptBR })
            : '-'
          }
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Criada em',
      cell: ({ row }: { row: { original: RecruitmentData } }) => (
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
      cell: ({ row }: { row: { original: RecruitmentData } }) => (
        <TableActions
          item={row.original}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          viewLabel="Ver Detalhes"
          editLabel="Editar Vaga"
          deleteLabel="Excluir Vaga"
          disableEdit={row.original.status === 'fechada' || row.original.status === 'cancelada'}
          disableDelete={row.original.status === 'em_andamento'}
        />
      ),
    },
  ];

  return (
    <EnhancedDataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      emptyMessage="Nenhuma vaga de recrutamento encontrada"
      searchPlaceholder="Buscar vagas..."
      title="Vagas de Recrutamento"
    />
  );
}
