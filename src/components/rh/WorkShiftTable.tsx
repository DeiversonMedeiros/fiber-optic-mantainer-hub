// @ts-nocheck
import React from 'react';
import { WorkShift } from '@/integrations/supabase/rh-types';
import { EnhancedDataTable } from './EnhancedDataTable';
import { TableActions, ViewAction, EditAction, DeleteAction } from './TableActions';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar } from 'lucide-react';

interface WorkShiftTableProps {
  data: WorkShift[];
  onEdit: (workShift: WorkShift) => void;
  onDelete: (workShift: WorkShift) => void;
  onView: (workShift: WorkShift) => void;
  isLoading: boolean;
}

export function WorkShiftTable({ data, onEdit, onDelete, onView, isLoading }: WorkShiftTableProps) {
  const formatDaysOfWeek = (days: number[] | null) => {
    if (!days || days.length === 0) return 'Não definido';
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days.map(day => dayNames[day]).join(', ');
  };

  const formatTime = (time: string) => {
    return time ? time.substring(0, 5) : 'Não definido';
  };

  const columns = [
    {
      id: 'nome',
      header: 'Nome da Escala',
      accessorKey: 'nome',
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-blue-500" />
          <div>
            <div className="font-medium">{row.original.nome}</div>
            <div className="text-sm text-muted-foreground">
              {formatTime(row.original.hora_inicio)} - {formatTime(row.original.hora_fim)}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'horario',
      header: 'Horário',
      cell: ({ row }: any) => (
        <div className="text-center">
          <div className="font-medium">
            {formatTime(row.original.hora_inicio)} - {formatTime(row.original.hora_fim)}
          </div>
          <div className="text-sm text-muted-foreground">
            {row.original.hora_inicio && row.original.hora_fim ? 
              `${Math.abs(
                (new Date(`1970-01-01T${row.original.hora_fim}:00`) as any) - 
                (new Date(`1970-01-01T${row.original.hora_inicio}:00`) as any)
              ) / (1000 * 60 * 60)}h` : 'N/A'}
          </div>
        </div>
      ),
    },
    {
      id: 'dias_semana',
      header: 'Dias da Semana',
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-orange-500" />
          <span className="text-sm">{formatDaysOfWeek(row.original.dias_semana)}</span>
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
      searchPlaceholder="Buscar escalas..."
      isLoading={isLoading}
      emptyMessage="Nenhuma escala de trabalho encontrada."
      emptyDescription="Crie a primeira escala de trabalho para começar."
    />
  );
}
























































































