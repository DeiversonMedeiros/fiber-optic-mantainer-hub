import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmployeeShift {
  id: string;
  employee?: {
    nome: string;
    matricula?: string;
  };
  shift?: {
    nome: string;
    hora_inicio: string;
    hora_fim: string;
  };
  data_inicio: string;
  data_fim?: string;
  is_active?: boolean;
  created_at: string;
}

interface EmployeeShiftTableProps {
  employeeShifts: EmployeeShift[];
  onEdit: (employeeShift: EmployeeShift) => void;
  onDelete: (id: string) => void;
}

export const EmployeeShiftTable: React.FC<EmployeeShiftTableProps> = ({
  employeeShifts,
  onEdit,
  onDelete
}) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const formatTime = (timeString: string) => {
    try {
      return format(new Date(`2000-01-01T${timeString}`), 'HH:mm');
    } catch {
      return timeString;
    }
  };

  if (employeeShifts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhuma atribuição de turno encontrada.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Funcionário</TableHead>
            <TableHead>Turno</TableHead>
            <TableHead>Horário</TableHead>
            <TableHead>Data Início</TableHead>
            <TableHead>Data Fim</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employeeShifts.map((employeeShift) => (
            <TableRow key={employeeShift.id}>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {employeeShift.employee?.nome || 'N/A'}
                  </div>
                  {employeeShift.employee?.matricula && (
                    <div className="text-sm text-gray-500">
                      Matrícula: {employeeShift.employee.matricula}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {employeeShift.shift?.nome || 'N/A'}
              </TableCell>
              <TableCell>
                {employeeShift.shift ? (
                  <div className="text-sm">
                    <div>{formatTime(employeeShift.shift.hora_inicio)} - {formatTime(employeeShift.shift.hora_fim)}</div>
                  </div>
                ) : (
                  'N/A'
                )}
              </TableCell>
              <TableCell>
                {formatDate(employeeShift.data_inicio)}
              </TableCell>
              <TableCell>
                {employeeShift.data_fim ? formatDate(employeeShift.data_fim) : '-'}
              </TableCell>
              <TableCell>
                <Badge variant={employeeShift.is_active ? 'default' : 'secondary'}>
                  {employeeShift.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(employeeShift)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(employeeShift.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};






















































































