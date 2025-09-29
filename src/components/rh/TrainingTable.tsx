import React from 'react';
import { TrainingData } from '@/hooks/rh/useTraining';
import { EnhancedDataTable } from './EnhancedDataTable';
import { TableActions } from './TableActions';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TrainingTableProps {
  data: TrainingData[];
  onEdit: (item: TrainingData) => void;
  onDelete: (item: TrainingData) => void;
  onView: (item: TrainingData) => void;
  isLoading?: boolean;
}

export function TrainingTable({ 
  data, 
  onEdit, 
  onDelete, 
  onView, 
  isLoading = false 
}: TrainingTableProps) {
  const columns = [
    {
      accessorKey: 'titulo',
      header: 'Título do Treinamento',
      cell: ({ row }: { row: { original: TrainingData } }) => (
        <div className="font-medium">{row.original.titulo}</div>
      ),
    },
    {
      accessorKey: 'tipo_treinamento',
      header: 'Tipo',
      cell: ({ row }: { row: { original: TrainingData } }) => {
        const tipo = row.original.tipo_treinamento;
        let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
        let label = tipo;

        switch (tipo) {
          case 'obrigatorio':
            variant = "destructive";
            label = "Obrigatório";
            break;
          case 'opcional':
            variant = "outline";
            label = "Opcional";
            break;
          case 'desenvolvimento':
            variant = "default";
            label = "Desenvolvimento";
            break;
          case 'compliance':
            variant = "secondary";
            label = "Compliance";
            break;
          case 'seguranca':
            variant = "destructive";
            label = "Segurança";
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
      accessorKey: 'categoria',
      header: 'Categoria',
      cell: ({ row }: { row: { original: TrainingData } }) => (
        <Badge variant="outline">
          {row.original.categoria === 'tecnico' ? 'Técnico' : 
           row.original.categoria === 'soft_skills' ? 'Soft Skills' :
           row.original.categoria === 'gestao' ? 'Gestão' :
           row.original.categoria === 'compliance' ? 'Compliance' :
           row.original.categoria === 'seguranca_trabalho' ? 'Segurança do Trabalho' : 'N/A'}
        </Badge>
      ),
    },
    {
      accessorKey: 'modalidade',
      header: 'Modalidade',
      cell: ({ row }: { row: { original: TrainingData } }) => (
        <Badge variant="outline">
          {row.original.modalidade === 'presencial' ? 'Presencial' : 
           row.original.modalidade === 'online' ? 'Online' :
           row.original.modalidade === 'hibrido' ? 'Híbrido' :
           row.original.modalidade === 'e-learning' ? 'E-learning' : 'N/A'}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: TrainingData } }) => {
        const status = row.original.status;
        let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
        let label = status;

        switch (status) {
          case 'planejado':
            variant = "outline";
            label = "Planejado";
            break;
          case 'em_andamento':
            variant = "secondary";
            label = "Em Andamento";
            break;
          case 'concluido':
            variant = "default";
            label = "Concluído";
            break;
          case 'cancelado':
            variant = "destructive";
            label = "Cancelado";
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
      accessorKey: 'duracao_horas',
      header: 'Duração',
      cell: ({ row }: { row: { original: TrainingData } }) => (
        <div className="text-sm font-medium">
          {row.original.duracao_horas}h
        </div>
      ),
    },
    {
      accessorKey: 'data_inicio',
      header: 'Data Início',
      cell: ({ row }: { row: { original: TrainingData } }) => (
        <div className="text-sm">
          {row.original.data_inicio 
            ? format(new Date(row.original.data_inicio), 'dd/MM/yyyy', { locale: ptBR })
            : '-'
          }
        </div>
      ),
    },
    {
      accessorKey: 'local',
      header: 'Local',
      cell: ({ row }: { row: { original: TrainingData } }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.local || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'instrutor',
      header: 'Instrutor',
      cell: ({ row }: { row: { original: TrainingData } }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.instrutor || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'custo_por_participante',
      header: 'Custo/Participante',
      cell: ({ row }: { row: { original: TrainingData } }) => {
        const formatCurrency = (value: number) => {
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(value);
        };

        return (
          <div className="text-sm">
            {row.original.custo_por_participante > 0 
              ? formatCurrency(row.original.custo_por_participante)
              : 'Gratuito'
            }
          </div>
        );
      },
    },
    {
      accessorKey: 'participantes_inscritos',
      header: 'Inscritos',
      cell: ({ row }: { row: { original: TrainingData } }) => (
        <div className="text-sm">
          {row.original.participantes_inscritos}/{row.original.max_participantes}
        </div>
      ),
    },
    {
      accessorKey: 'certificacao',
      header: 'Certificação',
      cell: ({ row }: { row: { original: TrainingData } }) => (
        <Badge variant={row.original.certificacao ? "default" : "outline"}>
          {row.original.certificacao ? 'Sim' : 'Não'}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Criado em',
      cell: ({ row }: { row: { original: TrainingData } }) => (
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
      cell: ({ row }: { row: { original: TrainingData } }) => (
        <TableActions
          item={row.original}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          viewLabel="Ver Detalhes"
          editLabel="Editar Treinamento"
          deleteLabel="Excluir Treinamento"
          disableEdit={row.original.status === 'concluido' || row.original.status === 'cancelado'}
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
      emptyMessage="Nenhum treinamento encontrado"
      searchPlaceholder="Buscar treinamentos..."
    />
  );
}
