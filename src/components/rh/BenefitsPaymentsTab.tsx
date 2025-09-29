// @ts-nocheck
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CalendarIcon, 
  CreditCard, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Users,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useBenefitPayments } from '@/hooks/rh/useUnifiedBenefits';
import { BenefitPayment, PaymentStatus } from '@/integrations/supabase/rh-benefits-unified-types';
import { useToast } from '@/hooks/use-toast';

interface BenefitsPaymentsTabProps {
  companyId: string;
}

export function BenefitsPaymentsTab({ companyId }: BenefitsPaymentsTabProps) {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('flash');
  const { toast } = useToast();

  const { 
    payments, 
    isLoading, 
    error, 
    createBulkPayments,
    updatePayment 
  } = useBenefitPayments(companyId, selectedMonth, selectedYear);

  // Debug logs
  console.log('🔍 BenefitsPaymentsTab Debug:');
  console.log('📊 payments data:', payments);
  console.log('📊 payments length:', payments?.length);
  console.log('⏳ isLoading:', isLoading);
  console.log('❌ error:', error);
  console.log('📅 selectedMonth:', selectedMonth);
  console.log('📅 selectedYear:', selectedYear);
  console.log('🏢 companyId:', companyId);

  const filteredPayments = payments?.filter(payment => 
    payment.payment_status === 'pending' || payment.payment_status === 'processing'
  );

  console.log('🔍 Filtered payments:', filteredPayments);
  console.log('🔍 Filtered payments length:', filteredPayments?.length);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPayments(filteredPayments?.map(p => p.id) || []);
    } else {
      setSelectedPayments([]);
    }
  };

  const handleSelectPayment = (paymentId: string, checked: boolean) => {
    if (checked) {
      setSelectedPayments(prev => [...prev, paymentId]);
    } else {
      setSelectedPayments(prev => prev.filter(id => id !== paymentId));
    }
  };

  const handleBulkPayment = async () => {
    if (selectedPayments.length === 0) {
      toast.error('Selecione pelo menos um pagamento');
      return;
    }

    try {
      await createBulkPayments.mutateAsync({
        companyId,
        month: selectedMonth,
        year: selectedYear,
        paymentMethod,
        paymentIds: selectedPayments
      });
      
      toast.success(`${selectedPayments.length} pagamentos enviados com sucesso!`);
      setSelectedPayments([]);
    } catch (error) {
      toast.error('Erro ao enviar pagamentos');
      console.error(error);
    }
  };

  const handleUpdatePaymentStatus = async (paymentId: string, status: PaymentStatus) => {
    try {
      await updatePaymentStatus.mutateAsync({ id: paymentId, payment_status: status });
      toast.success('Status atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar status');
      console.error(error);
    }
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'outline' as const, icon: Clock },
      processing: { label: 'Processando', variant: 'secondary' as const, icon: Send },
      completed: { label: 'Concluído', variant: 'default' as const, icon: CheckCircle },
      failed: { label: 'Falhou', variant: 'destructive' as const, icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      'flash': 'Flash (Cartão)',
      'bank_transfer': 'Transferência Bancária',
      'pix': 'PIX',
      'cash': 'Dinheiro'
    };
    return methods[method] || method;
  };

  const getBenefitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'vr_va': 'VR/VA',
      'transporte': 'Transporte',
      'equipment_rental': 'Locação de Equipamentos',
      'premiacao': 'Premiação'
    };
    return labels[type] || type;
  };

  const totalSelectedValue = selectedPayments.reduce((total, paymentId) => {
    const payment = payments?.find(p => p.id === paymentId);
    return total + (payment?.payment_value || 0);
  }, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Carregando pagamentos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Erro ao carregar pagamentos: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Gestão de Pagamentos</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie e processe os pagamentos de benefícios
          </p>
        </div>
      </div>

      {/* Filtros de Período */}
      <Card>
        <CardHeader>
          <CardTitle>Período de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div>
              <Label htmlFor="month">Mês</Label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {format(new Date(2024, month - 1), 'MMM', { locale: ptBR })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="year">Ano</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controles de Pagamento em Lote */}
      {filteredPayments && filteredPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pagamento em Lote</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="payment_method">Método de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flash">Flash (Cartão)</SelectItem>
                    <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    {selectedPayments.length} selecionados
                  </div>
                  <div className="font-medium">
                    Total: R$ {totalSelectedValue.toFixed(2)}
                  </div>
                </div>

                <Button 
                  onClick={handleBulkPayment}
                  disabled={selectedPayments.length === 0 || createBulkPayments.isPending}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {createBulkPayments.isPending ? 'Enviando...' : 'Enviar Pagamentos'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle>
            Pagamentos - {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy', { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayments && filteredPayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedPayments.length === filteredPayments.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Tipo de Benefício</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Envio</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedPayments.includes(payment.id)}
                        onCheckedChange={(checked) => handleSelectPayment(payment.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {payment.employee_name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {payment.employee_document || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getBenefitTypeLabel(payment.benefit_type || '')}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        R$ {(payment.payment_value || 0).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getPaymentMethodLabel(payment.payment_method || '')}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.payment_status)}
                    </TableCell>
                    <TableCell>
                      {payment.sent_at ? 
                        format(new Date(payment.sent_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 
                        '-'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {payment.payment_status === 'processing' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdatePaymentStatus(payment.id, 'completed')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {payment.payment_status === 'processing' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdatePaymentStatus(payment.id, 'failed')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum pagamento pendente encontrado para este período.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo de Pagamentos */}
      {payments && payments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium leading-none">Pendentes</p>
                  <p className="text-2xl font-bold">
                    {payments.filter(p => p.payment_status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Send className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium leading-none">Enviados</p>
                  <p className="text-2xl font-bold">
                    {payments.filter(p => p.payment_status === 'processing').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium leading-none">Pagos</p>
                  <p className="text-2xl font-bold">
                    {payments.filter(p => p.payment_status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium leading-none">Valor Total</p>
                  <p className="text-2xl font-bold">
                    R$ {payments.reduce((sum, p) => sum + (p.payment_value || 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}