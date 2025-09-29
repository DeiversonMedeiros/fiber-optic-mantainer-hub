import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PayrollConfig {
  id: string;
  employee?: {
    nome: string;
    matricula?: string;
  };
  regime_hora_extra?: string;
  vigencia_banco_horas?: number;
  created_at: string;
}

interface PayrollConfigTableProps {
  payrollConfigs: PayrollConfig[];
  onEdit: (payrollConfig: PayrollConfig) => void;
  onDelete: (id: string) => void;
}

export const PayrollConfigTable: React.FC<PayrollConfigTableProps> = ({
  payrollConfigs,
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

  const getRegimeLabel = (regime?: string) => {
    if (!regime) return 'Não configurado';
    
    const labels = {
      banco_horas: 'Banco de Horas',
      hora_extra: 'Hora Extra',
      misto: 'Misto'
    };
    return labels[regime as keyof typeof labels] || regime;
  };

  const getRegimeVariant = (regime?: string) => {
    if (!regime) return 'secondary';
    
    const variants = {
      banco_horas: 'default',
      hora_extra: 'destructive',
      misto: 'outline'
    };
    return variants[regime as keyof typeof variants] || 'default';
  };

  if (payrollConfigs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhuma configuração de folha encontrada.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Funcionário</TableHead>
            <TableHead>Regime Hora Extra</TableHead>
            <TableHead>Vigência Banco de Horas</TableHead>
            <TableHead>Data Criação</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payrollConfigs.map((config) => (
            <TableRow key={config.id}>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {config.employee?.nome || 'N/A'}
                  </div>
                  {config.employee?.matricula && (
                    <div className="text-sm text-gray-500">
                      Matrícula: {config.employee.matricula}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getRegimeVariant(config.regime_hora_extra)}>
                  {getRegimeLabel(config.regime_hora_extra)}
                </Badge>
              </TableCell>
              <TableCell>
                {config.vigencia_banco_horas ? (
                  <span className="text-sm">
                    {config.vigencia_banco_horas} dias
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">Não configurado</span>
                )}
              </TableCell>
              <TableCell>
                {formatDate(config.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(config)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(config.id)}
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























































































