import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmploymentContract {
  id: string;
  employee?: {
    nome: string;
    matricula?: string;
  };
  position?: {
    nome: string;
  };
  tipo_contrato: 'clt' | 'pj' | 'estagiario' | 'temporario' | 'terceirizado';
  data_inicio?: string;
  data_fim?: string;
  salario_base?: number;
  is_active?: boolean;
  created_at: string;
}

interface EmploymentContractTableProps {
  contracts: EmploymentContract[];
  onEdit: (contract: EmploymentContract) => void;
  onDelete: (id: string) => void;
}

export const EmploymentContractTable: React.FC<EmploymentContractTableProps> = ({
  contracts,
  onEdit,
  onDelete
}) => {
  const getTipoContratoLabel = (tipo: string) => {
    const labels = {
      clt: 'CLT',
      pj: 'PJ',
      estagiario: 'Estagiário',
      temporario: 'Temporário',
      terceirizado: 'Terceirizado'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  const getTipoContratoVariant = (tipo: string) => {
    const variants = {
      clt: 'default',
      pj: 'secondary',
      estagiario: 'outline',
      temporario: 'destructive',
      terceirizado: 'outline'
    };
    return variants[tipo as keyof typeof variants] || 'default';
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  if (contracts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhum contrato encontrado.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Funcionário</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Data Início</TableHead>
            <TableHead>Data Fim</TableHead>
            <TableHead>Salário Base</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => (
            <TableRow key={contract.id}>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {contract.employee?.nome || 'N/A'}
                  </div>
                  {contract.employee?.matricula && (
                    <div className="text-sm text-gray-500">
                      Matrícula: {contract.employee.matricula}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {contract.position?.nome || 'N/A'}
              </TableCell>
              <TableCell>
                <Badge variant={getTipoContratoVariant(contract.tipo_contrato)}>
                  {getTipoContratoLabel(contract.tipo_contrato)}
                </Badge>
              </TableCell>
              <TableCell>
                {formatDate(contract.data_inicio)}
              </TableCell>
              <TableCell>
                {formatDate(contract.data_fim)}
              </TableCell>
              <TableCell>
                {formatCurrency(contract.salario_base)}
              </TableCell>
              <TableCell>
                <Badge variant={contract.is_active ? 'default' : 'secondary'}>
                  {contract.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(contract)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(contract.id)}
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






















































































