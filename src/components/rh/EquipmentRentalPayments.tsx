import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  DollarSign,
  Search,
  Filter,
  Plus,
  Calendar,
  CreditCard
} from 'lucide-react';
import { EquipmentRentalPayment, EquipmentRentalPaymentFilters } from '@/integrations/supabase/rh-equipment-rental-types';
// Função local para formatação de moeda
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

interface EquipmentRentalPaymentsProps {
  payments: EquipmentRentalPayment[];
  loading?: boolean;
  onEdit?: (payment: EquipmentRentalPayment) => void;
  onDelete?: (payment: EquipmentRentalPayment) => void;
  onAdd?: () => void;
  onFilter?: (filters: EquipmentRentalPaymentFilters) => void;
}

const statusLabels = {
  pending: 'Pendente',
  paid: 'Pago',
  cancelled: 'Cancelado'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const paymentMethodLabels = {
  bank_transfer: 'Transferência Bancária',
  pix: 'PIX',
  cash: 'Dinheiro',
  check: 'Cheque'
};

const paymentMethodIcons = {
  bank_transfer: CreditCard,
  pix: DollarSign,
  cash: DollarSign,
  check: CreditCard
};

export function EquipmentRentalPayments({
  payments,
  loading = false,
  onEdit,
  onDelete,
  onAdd,
  onFilter
}: EquipmentRentalPaymentsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('');

  const handleFilter = () => {
    if (onFilter) {
      onFilter({
        status: statusFilter === 'all' ? undefined : (statusFilter as any),
        payment_month: monthFilter || undefined
      });
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.equipment_rental?.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.equipment_rental?.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.payment_reference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || statusFilter === 'all' || payment.status === statusFilter;
    const matchesMonth = !monthFilter || payment.payment_month === monthFilter;
    
    return matchesSearch && matchesStatus && matchesMonth;
  });

  const getPaymentMethodIcon = (method: keyof typeof paymentMethodIcons) => {
    const IconComponent = paymentMethodIcons[method];
    return <IconComponent className="h-4 w-4" />;
  };

  const totalPaid = filteredPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = filteredPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Histórico de Pagamentos
          </CardTitle>
          <Button onClick={onAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Pagamento
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por equipamento, funcionário ou referência..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="month"
            placeholder="Mês/Ano"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full sm:w-48"
          />
          <Button onClick={handleFilter} variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Total Pago</span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(totalPaid)}
            </div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">Pendente</span>
            </div>
            <div className="text-2xl font-bold text-yellow-900">
              {formatCurrency(totalPending)}
            </div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Total de Pagamentos</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {filteredPayments.length}
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead>Funcionário</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Data Pagamento</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum pagamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {payment.equipment_rental?.equipment_name || 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {payment.equipment_rental?.equipment_type || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          Equipamento ID: {payment.equipment_rental?.id || 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {payment.equipment_rental?.equipment_name || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(payment.payment_month + '-01').toLocaleDateString('pt-BR', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(payment.amount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[payment.status]}>
                        {statusLabels[payment.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.payment_method ? (
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(payment.payment_method)}
                          <span className="text-sm">
                            {paymentMethodLabels[payment.payment_method]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.payment_date ? (
                        <div className="text-sm">
                          {new Date(payment.payment_date).toLocaleDateString('pt-BR')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(payment)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem 
                              onClick={() => onDelete(payment)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
