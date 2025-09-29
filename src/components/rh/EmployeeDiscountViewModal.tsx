import React from 'react';
import { EmployeeDiscount } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  DollarSign, 
  Calendar, 
  FileText, 
  User, 
  Building, 
  Calculator,
  AlertTriangle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmployeeDiscountViewModalProps {
  discount: EmployeeDiscount | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (discount: EmployeeDiscount) => void;
}

const tipoDescontoLabels = {
  multa_transito: 'Multa de Trânsito',
  emprestimo: 'Empréstimo',
  avaria_equipamento: 'Avaria de Equipamento',
  perda_equipamento: 'Perda de Equipamento',
  outros: 'Outros'
};

const statusConfig = {
  ativo: { label: 'Ativo', variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
  suspenso: { label: 'Suspenso', variant: 'secondary' as const, icon: AlertTriangle, color: 'text-yellow-600' },
  cancelado: { label: 'Cancelado', variant: 'destructive' as const, icon: X, color: 'text-red-600' },
  quitado: { label: 'Quitado', variant: 'outline' as const, icon: CheckCircle, color: 'text-blue-600' },
};

export function EmployeeDiscountViewModal({ 
  discount, 
  isOpen, 
  onClose, 
  onEdit 
}: EmployeeDiscountViewModalProps) {
  if (!discount) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.ativo;
  };

  const getProgressPercentage = (parcelaAtual: number, totalParcelas: number) => {
    return Math.round((parcelaAtual / totalParcelas) * 100);
  };

  const statusConfig = getStatusConfig(discount.status);
  const StatusIcon = statusConfig.icon;
  const progressPercentage = getProgressPercentage(discount.parcela_atual, discount.quantidade_parcelas);
  const valorRestante = discount.valor_total - (discount.valor_parcela * (discount.parcela_atual - 1));
  const parcelasRestantes = discount.quantidade_parcelas - discount.parcela_atual + 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes do Desconto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Tipo de Desconto</label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {tipoDescontoLabels[discount.tipo_desconto]}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge variant={statusConfig.variant} className="flex items-center gap-1 w-fit">
                    <StatusIcon className="h-3 w-3" />
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                <p className="text-sm">{discount.descricao}</p>
              </div>

              {discount.observacoes && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Observações</label>
                  <p className="text-sm text-muted-foreground">{discount.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Valores e Parcelas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Valores e Parcelas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Valor Total</label>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(discount.valor_total)}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Valor da Parcela</label>
                  <div className="text-xl font-semibold">
                    {formatCurrency(discount.valor_parcela)}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Parcelas</label>
                  <div className="text-lg font-medium">
                    {discount.parcela_atual} de {discount.quantidade_parcelas}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progresso do Pagamento</span>
                  <span className="text-sm text-muted-foreground">{progressPercentage}%</span>
                </div>
                
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className="bg-primary h-3 rounded-full transition-all"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Valor Pago:</span>
                    <div className="font-medium">
                      {formatCurrency(discount.valor_parcela * (discount.parcela_atual - 1))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Valor Restante:</span>
                    <div className="font-medium">
                      {formatCurrency(valorRestante)}
                    </div>
                  </div>
                </div>
              </div>

              {discount.valor_maximo_parcela && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium">Valor Máximo da Parcela (30% do salário):</span>
                    <span className="font-mono">
                      {formatCurrency(discount.valor_maximo_parcela)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Período */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Data de Início</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(discount.data_inicio)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Data de Vencimento</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(discount.data_vencimento)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <label className="text-muted-foreground">Criado em:</label>
                  <div>{formatDateTime(discount.created_at)}</div>
                </div>

                <div className="space-y-2">
                  <label className="text-muted-foreground">Atualizado em:</label>
                  <div>{formatDateTime(discount.updated_at)}</div>
                </div>

                {discount.salario_base_funcionario && (
                  <div className="space-y-2">
                    <label className="text-muted-foreground">Salário Base (momento da criação):</label>
                    <div className="font-mono">
                      {formatCurrency(discount.salario_base_funcionario)}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          {onEdit && (
            <Button onClick={() => onEdit(discount)}>
              Editar Desconto
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
