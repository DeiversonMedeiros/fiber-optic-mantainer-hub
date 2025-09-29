import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinancialTableProps {
  data: any[];
  columns: {
    key: string;
    label: string;
    render?: (value: any, item: any) => React.ReactNode;
    className?: string;
  }[];
  actions?: {
    label: string;
    icon: React.ReactNode;
    onClick: (item: any) => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  }[];
  loading?: boolean;
  emptyMessage?: string;
}

export function FinancialTable({
  data,
  columns,
  actions = [],
  loading = false,
  emptyMessage = 'Nenhum item encontrado',
}: FinancialTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-12 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const renderCell = (column: any, item: any) => {
    const value = item[column.key];
    
    if (column.render) {
      return column.render(value, item);
    }

    // Renderizações padrão baseadas no tipo de dado
    if (column.key.includes('data') || column.key.includes('date')) {
      return value ? format(new Date(value), 'dd/MM/yyyy', { locale: ptBR }) : '-';
    }

    if (column.key.includes('valor') || column.key.includes('value')) {
      return value ? new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value) : '-';
    }

    if (column.key.includes('status')) {
      const statusColors = {
        'pendente': 'bg-yellow-100 text-yellow-800',
        'pago': 'bg-green-100 text-green-800',
        'recebido': 'bg-green-100 text-green-800',
        'vencido': 'bg-red-100 text-red-800',
        'cancelado': 'bg-gray-100 text-gray-800',
        'autorizada': 'bg-green-100 text-green-800',
        'rejeitada': 'bg-red-100 text-red-800',
        'inutilizada': 'bg-orange-100 text-orange-800',
        'online': 'bg-green-100 text-green-800',
        'offline': 'bg-red-100 text-red-800',
        'manutencao': 'bg-yellow-100 text-yellow-800',
        'erro': 'bg-red-100 text-red-800',
        'ativa': 'bg-green-100 text-green-800',
        'inativa': 'bg-gray-100 text-gray-800',
      };

      return (
        <Badge className={statusColors[value as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
          {value}
        </Badge>
      );
    }

    return value || '-';
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.key} className={column.className}>
              {column.label}
            </TableHead>
          ))}
          {actions.length > 0 && <TableHead>Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, index) => (
          <TableRow key={item.id || index}>
            {columns.map((column) => (
              <TableCell key={column.key} className={column.className}>
                {renderCell(column, item)}
              </TableCell>
            ))}
            {actions.length > 0 && (
              <TableCell>
                <div className="flex items-center space-x-2">
                  {actions.map((action, actionIndex) => (
                    <Button
                      key={actionIndex}
                      variant={action.variant || 'ghost'}
                      size="sm"
                      onClick={() => action.onClick(item)}
                    >
                      {action.icon}
                    </Button>
                  ))}
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}



