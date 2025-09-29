import React from 'react';
import { MedicalCertificate } from '@/integrations/supabase/rh-types';
import { EnhancedDataTable } from './EnhancedDataTable';
import { TableActions } from './TableActions';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MedicalCertificatesTableProps {
  data: MedicalCertificate[];
  onEdit: (item: MedicalCertificate) => void;
  onDelete: (item: MedicalCertificate) => void;
  onView: (item: MedicalCertificate) => void;
  isLoading?: boolean;
}

export function MedicalCertificatesTable({ 
  data, 
  onEdit, 
  onDelete, 
  onView, 
  isLoading = false 
}: MedicalCertificatesTableProps) {
  const columns = [
    {
      accessorKey: 'funcionario_id',
      header: 'Funcionário',
      cell: ({ row }: { row: { original: MedicalCertificate } }) => (
        <div className="font-medium">{row.original.funcionario_id || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'data_inicio',
      header: 'Data Início',
      cell: ({ row }: { row: { original: MedicalCertificate } }) => (
        <div className="text-sm">
          {row.original.data_inicio 
            ? format(new Date(row.original.data_inicio), 'dd/MM/yyyy', { locale: ptBR })
            : '-'
          }
        </div>
      ),
    },
    {
      accessorKey: 'data_fim',
      header: 'Data Fim',
      cell: ({ row }: { row: { original: MedicalCertificate } }) => (
        <div className="text-sm">
          {row.original.data_fim 
            ? format(new Date(row.original.data_fim), 'dd/MM/yyyy', { locale: ptBR })
            : '-'
          }
        </div>
      ),
    },
    {
      accessorKey: 'dias_afastamento',
      header: 'Dias Afastamento',
      cell: ({ row }: { row: { original: MedicalCertificate } }) => (
        <div className="text-sm font-medium">
          {row.original.dias_afastamento || 0} dias
        </div>
      ),
    },
    {
      accessorKey: 'tipo_atestado',
      header: 'Tipo',
      cell: ({ row }: { row: { original: MedicalCertificate } }) => (
        <Badge variant="outline">
          {row.original.tipo_atestado === 'medico' ? 'Médico' : 
           row.original.tipo_atestado === 'odontologico' ? 'Odontológico' :
           row.original.tipo_atestado === 'psicologico' ? 'Psicológico' : 'N/A'}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: MedicalCertificate } }) => {
        const status = row.original.status;
        let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
        let label = status;

        switch (status) {
          case 'pendente':
            variant = "secondary";
            label = "Pendente";
            break;
          case 'aprovado':
            variant = "outline";
            label = "Aprovado";
            break;
          case 'em_andamento':
            variant = "default";
            label = "Em Andamento";
            break;
          case 'concluido':
            variant = "default";
            label = "Concluído";
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
      accessorKey: 'medico_nome',
      header: 'Médico',
      cell: ({ row }: { row: { original: MedicalCertificate } }) => (
        <div className="text-sm">{row.original.medico_nome || '-'}</div>
      ),
    },
    {
      accessorKey: 'crm_crmo',
      header: 'CRM/CRMO',
      cell: ({ row }: { row: { original: MedicalCertificate } }) => (
        <div className="text-sm font-mono">{row.original.crm_crmo || '-'}</div>
      ),
    },
    {
      accessorKey: 'valor_beneficio',
      header: 'Valor Benefício',
      cell: ({ row }: { row: { original: MedicalCertificate } }) => {
        const formatCurrency = (value: number) => {
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(value);
        };

        return (
          <div className="text-sm font-medium text-green-600">
            {row.original.valor_beneficio ? formatCurrency(row.original.valor_beneficio) : '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Criado em',
      cell: ({ row }: { row: { original: MedicalCertificate } }) => (
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
      cell: ({ row }: { row: { original: MedicalCertificate } }) => (
        <TableActions
          item={row.original}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          viewLabel="Ver Detalhes"
          editLabel="Editar Atestado"
          deleteLabel="Excluir Atestado"
          disableEdit={row.original.status === 'concluido' || row.original.status === 'rejeitado'}
          disableDelete={row.original.status === 'em_andamento' || row.original.status === 'concluido'}
        />
      ),
    },
  ];

  return (
    <EnhancedDataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      emptyMessage="Nenhum atestado médico encontrado"
      searchPlaceholder="Buscar atestados..."
      title="Atestados Médicos"
    />
  );
}
