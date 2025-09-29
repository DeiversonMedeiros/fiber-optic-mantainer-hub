import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  DollarSign,
  Building,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { useAccountsPayable, AccountsPayableFilters } from '@/hooks/financial';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AccountsPayable() {
  const [filters, setFilters] = useState<AccountsPayableFilters>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    accountsPayable,
    loading,
    error,
    fetchAccountsPayable,
    createAccountsPayable,
    updateAccountsPayable,
    deleteAccountsPayable,
    getAgingReport,
    getTotalByStatus
  } = useAccountsPayable();

  const [formData, setFormData] = useState({
    fornecedor_id: '',
    numero_documento: '',
    descricao: '',
    valor: '',
    data_vencimento: '',
    data_pagamento: '',
    valor_pago: '',
    status: 'pendente' as const,
    cost_center_id: '',
    project_id: '',
    classe_financeira: '',
  });

  const [agingReport, setAgingReport] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>({});

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    await fetchAccountsPayable(filters);
    const aging = await getAgingReport();
    const totalsData = await getTotalByStatus();
    setAgingReport(aging);
    setTotals(totalsData);
  };

  const handleCreate = async () => {
    try {
      await createAccountsPayable({
        ...formData,
        valor: parseFloat(formData.valor),
        valor_pago: formData.valor_pago ? parseFloat(formData.valor_pago) : undefined,
      });
      setIsCreateModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao criar conta a pagar:', error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedAccount) return;

    try {
      await updateAccountsPayable(selectedAccount.id, {
        ...formData,
        valor: parseFloat(formData.valor),
        valor_pago: formData.valor_pago ? parseFloat(formData.valor_pago) : undefined,
      });
      setIsEditModalOpen(false);
      setSelectedAccount(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar conta a pagar:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta a pagar?')) {
      try {
        await deleteAccountsPayable(id);
        loadData();
      } catch (error) {
        console.error('Erro ao excluir conta a pagar:', error);
      }
    }
  };

  const handleEdit = (account: any) => {
    setSelectedAccount(account);
    setFormData({
      fornecedor_id: account.fornecedor_id || '',
      numero_documento: account.numero_documento || '',
      descricao: account.descricao || '',
      valor: account.valor?.toString() || '',
      data_vencimento: account.data_vencimento || '',
      data_pagamento: account.data_pagamento || '',
      valor_pago: account.valor_pago?.toString() || '',
      status: account.status || 'pendente',
      cost_center_id: account.cost_center_id || '',
      project_id: account.project_id || '',
      classe_financeira: account.classe_financeira || '',
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      fornecedor_id: '',
      numero_documento: '',
      descricao: '',
      valor: '',
      data_vencimento: '',
      data_pagamento: '',
      valor_pago: '',
      status: 'pendente',
      cost_center_id: '',
      project_id: '',
      classe_financeira: '',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'vencido':
        return 'bg-red-100 text-red-800';
      case 'cancelado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (vencimento: string) => {
    if (!vencimento) return false;
    return new Date(vencimento) < new Date();
  };

  const filteredAccounts = accountsPayable.filter(account =>
    account.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.numero_documento?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas a Pagar</h1>
          <p className="text-muted-foreground">
            Gerencie as contas a pagar da empresa
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Conta a Pagar</DialogTitle>
                <DialogDescription>
                  Preencha os dados da conta a pagar
                </DialogDescription>
              </DialogHeader>
              <CreateEditForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleCreate}
                onCancel={() => setIsCreateModalOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(totals.pendente || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totals.pago || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totals.vencido || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency((totals.pendente || 0) + (totals.pago || 0) + (totals.vencido || 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Descrição ou número..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status || 'todos'}
                onValueChange={(value) => setFilters({ ...filters, status: value === 'todos' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={filters.data_inicio || ''}
                onChange={(e) => setFilters({ ...filters, data_inicio: e.target.value || undefined })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_fim">Data Fim</Label>
              <Input
                id="data_fim"
                type="date"
                value={filters.data_fim || ''}
                onChange={(e) => setFilters({ ...filters, data_fim: e.target.value || undefined })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Contas a Pagar</CardTitle>
          <CardDescription>
            {filteredAccounts.length} conta(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{account.descricao}</p>
                      {account.classe_financeira && (
                        <p className="text-sm text-muted-foreground">
                          {account.classe_financeira}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{account.numero_documento || '-'}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{formatCurrency(account.valor)}</p>
                      {account.valor_pago && (
                        <p className="text-sm text-muted-foreground">
                          Pago: {formatCurrency(account.valor_pago)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                      {account.data_vencimento ? (
                        <span className={isOverdue(account.data_vencimento) ? 'text-red-600' : ''}>
                          {format(new Date(account.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      ) : (
                        '-'
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(account.status)}>
                      {account.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(account)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(account.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Conta a Pagar</DialogTitle>
            <DialogDescription>
              Atualize os dados da conta a pagar
            </DialogDescription>
          </DialogHeader>
          <CreateEditForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CreateEditFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function CreateEditForm({ formData, setFormData, onSubmit, onCancel }: CreateEditFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição *</Label>
          <Input
            id="descricao"
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            placeholder="Descrição da conta"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="numero_documento">Número do Documento</Label>
          <Input
            id="numero_documento"
            value={formData.numero_documento}
            onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
            placeholder="Número do documento"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor">Valor *</Label>
          <Input
            id="valor"
            type="number"
            step="0.01"
            value={formData.valor}
            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
            placeholder="0,00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_vencimento">Data de Vencimento</Label>
          <Input
            id="data_vencimento"
            type="date"
            value={formData.data_vencimento}
            onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="classe_financeira">Classe Financeira</Label>
          <Input
            id="classe_financeira"
            value={formData.classe_financeira}
            onChange={(e) => setFormData({ ...formData, classe_financeira: e.target.value })}
            placeholder="Classe financeira"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onSubmit}>
          Salvar
        </Button>
      </div>
    </div>
  );
}
