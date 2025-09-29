import React, { useState } from 'react';
import { EmployeeDiscount } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  DollarSign, 
  Calendar, 
  FileText,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmployeeDiscountsTableProps {
  discounts: EmployeeDiscount[];
  onEdit: (discount: EmployeeDiscount) => void;
  onDelete: (id: string) => void;
  onView: (discount: EmployeeDiscount) => void;
  isLoading?: boolean;
}

const tipoDescontoLabels = {
  multa_transito: 'Multa de Trânsito',
  emprestimo: 'Empréstimo',
  avaria_equipamento: 'Avaria de Equipamento',
  perda_equipamento: 'Perda de Equipamento',
  outros: 'Outros'
};

const statusConfig = {
  ativo: { label: 'Ativo', variant: 'default' as const, icon: CheckCircle },
  suspenso: { label: 'Suspenso', variant: 'secondary' as const, icon: AlertTriangle },
  cancelado: { label: 'Cancelado', variant: 'destructive' as const, icon: AlertTriangle },
  quitado: { label: 'Quitado', variant: 'outline' as const, icon: CheckCircle },
};

export function EmployeeDiscountsTable({ 
  discounts, 
  onEdit, 
  onDelete, 
  onView, 
  isLoading = false 
}: EmployeeDiscountsTableProps) {
  const [selectedDiscount, setSelectedDiscount] = useState<EmployeeDiscount | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.ativo;
  };

  const getProgressPercentage = (parcelaAtual: number, totalParcelas: number) => {
    return Math.round((parcelaAtual / totalParcelas) * 100);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Descontos do Funcionário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando descontos...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (discounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Descontos do Funcionário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhum desconto encontrado
            </h3>
            <p className="text-sm text-muted-foreground">
              Este funcionário não possui descontos registrados.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Descontos do Funcionário ({discounts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discounts.map((discount) => {
                const statusConfig = getStatusConfig(discount.status);
                const progressPercentage = getProgressPercentage(discount.parcela_atual, discount.quantidade_parcelas);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <TableRow key={discount.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {tipoDescontoLabels[discount.tipo_desconto]}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="text-sm font-medium truncate">
                          {discount.descricao}
                        </p>
                        {discount.observacoes && (
                          <p className="text-xs text-muted-foreground truncate">
                            {discount.observacoes}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <span className="font-mono font-medium">
                        {formatCurrency(discount.valor_total)}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-mono text-sm">
                          {formatCurrency(discount.valor_parcela)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {discount.parcela_atual} de {discount.quantidade_parcelas}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {progressPercentage}%
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={statusConfig.variant} className="flex items-center gap-1 w-fit">
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>Início: {formatDate(discount.data_inicio)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>Vencimento: {formatDate(discount.data_vencimento)}</span>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(discount)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(discount)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDelete(discount.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
