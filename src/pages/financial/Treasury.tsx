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
  AlertTriangle,
  Activity,
  CreditCard,
  Banknote,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useBankAccounts, useBankTransactions, BankTransactionFilters } from '@/hooks/financial';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Treasury() {
  const [filters, setFilters] = useState<BankTransactionFilters>({});
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = useState(false);
  const [isCreateTransactionModalOpen, setIsCreateTransactionModalOpen] = useState(false);
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
  const [isEditTransactionModalOpen, setIsEditTransactionModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    bankAccounts,
    loading: accountsLoading,
    error: accountsError,
    fetchBankAccounts,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    getTotalBalance,
    getActiveAccounts
  } = useBankAccounts();

  const {
    bankTransactions,
    loading: transactionsLoading,
    error: transactionsError,
    fetchBankTransactions,
    createBankTransaction,
    updateBankTransaction,
    deleteBankTransaction,
    reconcileTransaction,
    unreconcileTransaction,
    getCashFlowProjection,
    getUnreconciledTransactions
  } = useBankTransactions();

  const [accountFormData, setAccountFormData] = useState({
    banco: '',
    agencia: '',
    conta: '',
    tipo_conta: 'corrente',
    saldo_atual: '',
    is_active: true,
  });

  const [transactionFormData, setTransactionFormData] = useState({
    bank_account_id: '',
    tipo: 'entrada' as const,
    descricao: '',
    valor: '',
    data_movimento: '',
    data_conciliacao: '',
    conciliado: false,
  });

  const [cashFlowProjection, setCashFlowProjection] = useState<any[]>([]);
  const [unreconciledTransactions, setUnreconciledTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    await fetchBankAccounts();
    await fetchBankTransactions(filters);
    const projection = await getCashFlowProjection(90);
    const unreconciled = await getUnreconciledTransactions();
    setCashFlowProjection(projection);
    setUnreconciledTransactions(unreconciled);
  };

  const handleCreateAccount = async () => {
    try {
      await createBankAccount({
        ...accountFormData,
        saldo_atual: accountFormData.saldo_atual ? parseFloat(accountFormData.saldo_atual) : 0,
      });
      setIsCreateAccountModalOpen(false);
      resetAccountForm();
      loadData();
    } catch (error) {
      console.error('Erro ao criar conta bancária:', error);
    }
  };

  const handleUpdateAccount = async () => {
    if (!selectedAccount) return;

    try {
      await updateBankAccount(selectedAccount.id, {
        ...accountFormData,
        saldo_atual: accountFormData.saldo_atual ? parseFloat(accountFormData.saldo_atual) : 0,
      });
      setIsEditAccountModalOpen(false);
      setSelectedAccount(null);
      resetAccountForm();
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar conta bancária:', error);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta bancária?')) {
      try {
        await deleteBankAccount(id);
        loadData();
      } catch (error) {
        console.error('Erro ao excluir conta bancária:', error);
      }
    }
  };

  const handleCreateTransaction = async () => {
    try {
      await createBankTransaction({
        ...transactionFormData,
        valor: parseFloat(transactionFormData.valor),
      });
      setIsCreateTransactionModalOpen(false);
      resetTransactionForm();
      loadData();
    } catch (error) {
      console.error('Erro ao criar transação bancária:', error);
    }
  };

  const handleUpdateTransaction = async () => {
    if (!selectedTransaction) return;

    try {
      await updateBankTransaction(selectedTransaction.id, {
        ...transactionFormData,
        valor: parseFloat(transactionFormData.valor),
      });
      setIsEditTransactionModalOpen(false);
      setSelectedTransaction(null);
      resetTransactionForm();
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar transação bancária:', error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação bancária?')) {
      try {
        await deleteBankTransaction(id);
        loadData();
      } catch (error) {
        console.error('Erro ao excluir transação bancária:', error);
      }
    }
  };

  const handleReconcile = async (id: string) => {
    try {
      await reconcileTransaction(id, new Date().toISOString().split('T')[0]);
      loadData();
    } catch (error) {
      console.error('Erro ao conciliar transação:', error);
    }
  };

  const handleUnreconcile = async (id: string) => {
    try {
      await unreconcileTransaction(id);
      loadData();
    } catch (error) {
      console.error('Erro ao desconciliar transação:', error);
    }
  };

  const handleEditAccount = (account: any) => {
    setSelectedAccount(account);
    setAccountFormData({
      banco: account.banco || '',
      agencia: account.agencia || '',
      conta: account.conta || '',
      tipo_conta: account.tipo_conta || 'corrente',
      saldo_atual: account.saldo_atual?.toString() || '',
      is_active: account.is_active,
    });
    setIsEditAccountModalOpen(true);
  };

  const handleEditTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setTransactionFormData({
      bank_account_id: transaction.bank_account_id || '',
      tipo: transaction.tipo || 'entrada',
      descricao: transaction.descricao || '',
      valor: transaction.valor?.toString() || '',
      data_movimento: transaction.data_movimento || '',
      data_conciliacao: transaction.data_conciliacao || '',
      conciliado: transaction.conciliado || false,
    });
    setIsEditTransactionModalOpen(true);
  };

  const resetAccountForm = () => {
    setAccountFormData({
      banco: '',
      agencia: '',
      conta: '',
      tipo_conta: 'corrente',
      saldo_atual: '',
      is_active: true,
    });
  };

  const resetTransactionForm = () => {
    setTransactionFormData({
      bank_account_id: '',
      tipo: 'entrada',
      descricao: '',
      valor: '',
      data_movimento: '',
      data_conciliacao: '',
      conciliado: false,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTransactionTypeColor = (tipo: string) => {
    return tipo === 'entrada' ? 'text-green-600' : 'text-red-600';
  };

  const getTransactionTypeIcon = (tipo: string) => {
    return tipo === 'entrada' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const filteredTransactions = bankTransactions.filter(transaction =>
    transaction.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalance = getTotalBalance();
  const activeAccounts = getActiveAccounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tesouraria</h1>
          <p className="text-muted-foreground">
            Gerencie contas bancárias e transações financeiras
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Dialog open={isCreateAccountModalOpen} onOpenChange={setIsCreateAccountModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Conta Bancária</DialogTitle>
                <DialogDescription>
                  Adicione uma nova conta bancária ao sistema
                </DialogDescription>
              </DialogHeader>
              <AccountForm
                formData={accountFormData}
                setFormData={setAccountFormData}
                onSubmit={handleCreateAccount}
                onCancel={() => setIsCreateAccountModalOpen(false)}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateTransactionModalOpen} onOpenChange={setIsCreateTransactionModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Transação Bancária</DialogTitle>
                <DialogDescription>
                  Registre uma nova transação bancária
                </DialogDescription>
              </DialogHeader>
              <TransactionForm
                formData={transactionFormData}
                setFormData={setTransactionFormData}
                bankAccounts={activeAccounts}
                onSubmit={handleCreateTransaction}
                onCancel={() => setIsCreateTransactionModalOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeAccounts.length} conta(s) ativa(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações Hoje</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bankTransactions.filter(t => 
                t.data_movimento === new Date().toISOString().split('T')[0]
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Movimentações do dia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Conciliadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {unreconciledTransactions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Transações pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fluxo 30d</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              cashFlowProjection.reduce((sum, day) => sum + (day.entrada - day.saida), 0) >= 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {formatCurrency(
                cashFlowProjection.reduce((sum, day) => sum + (day.entrada - day.saida), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Projeção 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="accounts">Contas Bancárias</TabsTrigger>
          <TabsTrigger value="reconciliation">Conciliação</TabsTrigger>
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
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
                      placeholder="Descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_account">Conta Bancária</Label>
                  <Select
                    value={filters.bank_account_id || ''}
                    onValueChange={(value) => setFilters({ ...filters, bank_account_id: value || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as contas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as contas</SelectItem>
                      {activeAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.banco} - {account.conta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={filters.tipo || ''}
                    onValueChange={(value) => setFilters({ ...filters, tipo: value || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os tipos</SelectItem>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conciliado">Status</Label>
                  <Select
                    value={filters.conciliado?.toString() || ''}
                    onValueChange={(value) => setFilters({ 
                      ...filters, 
                      conciliado: value === '' ? undefined : value === 'true' 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os status</SelectItem>
                      <SelectItem value="true">Conciliadas</SelectItem>
                      <SelectItem value="false">Não conciliadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Transações */}
          <Card>
            <CardHeader>
              <CardTitle>Transações Bancárias</CardTitle>
              <CardDescription>
                {filteredTransactions.length} transação(ões) encontrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {transaction.data_movimento ? (
                          format(new Date(transaction.data_movimento), 'dd/MM/yyyy', { locale: ptBR })
                        ) : '-'}
                      </TableCell>
                      <TableCell>{transaction.descricao}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className={getTransactionTypeColor(transaction.tipo)}>
                            {getTransactionTypeIcon(transaction.tipo)}
                          </span>
                          <span className="ml-2 capitalize">{transaction.tipo}</span>
                        </div>
                      </TableCell>
                      <TableCell className={getTransactionTypeColor(transaction.tipo)}>
                        {transaction.tipo === 'entrada' ? '+' : '-'}
                        {formatCurrency(transaction.valor)}
                      </TableCell>
                      <TableCell>
                        {transaction.bank_accounts?.banco} - {transaction.bank_accounts?.conta}
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.conciliado ? "default" : "secondary"}>
                          {transaction.conciliado ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Conciliada</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" /> Pendente</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTransaction(transaction)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {transaction.conciliado ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnreconcile(transaction.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReconcile(transaction.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTransaction(transaction.id)}
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
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contas Bancárias</CardTitle>
              <CardDescription>
                {bankAccounts.length} conta(s) cadastrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Banco</TableHead>
                    <TableHead>Agência</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>{account.banco}</TableCell>
                      <TableCell>{account.agencia || '-'}</TableCell>
                      <TableCell>{account.conta}</TableCell>
                      <TableCell className="capitalize">{account.tipo_conta}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(account.saldo_atual || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.is_active ? "default" : "secondary"}>
                          {account.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAccount(account)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAccount(account.id)}
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
        </TabsContent>

        <TabsContent value="reconciliation">
          <Card>
            <CardHeader>
              <CardTitle>Conciliação Bancária</CardTitle>
              <CardDescription>
                Transações não conciliadas: {unreconciledTransactions.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Implementar interface de conciliação bancária com upload de extrato.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa</CardTitle>
              <CardDescription>
                Projeção de fluxo de caixa para os próximos 90 dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Implementar gráfico de fluxo de caixa com projeções.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modais */}
      <Dialog open={isEditAccountModalOpen} onOpenChange={setIsEditAccountModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Conta Bancária</DialogTitle>
            <DialogDescription>
              Atualize os dados da conta bancária
            </DialogDescription>
          </DialogHeader>
          <AccountForm
            formData={accountFormData}
            setFormData={setAccountFormData}
            onSubmit={handleUpdateAccount}
            onCancel={() => setIsEditAccountModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditTransactionModalOpen} onOpenChange={setIsEditTransactionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Transação Bancária</DialogTitle>
            <DialogDescription>
              Atualize os dados da transação bancária
            </DialogDescription>
          </DialogHeader>
          <TransactionForm
            formData={transactionFormData}
            setFormData={setTransactionFormData}
            bankAccounts={activeAccounts}
            onSubmit={handleUpdateTransaction}
            onCancel={() => setIsEditTransactionModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface AccountFormProps {
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function AccountForm({ formData, setFormData, onSubmit, onCancel }: AccountFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="banco">Banco *</Label>
          <Input
            id="banco"
            value={formData.banco}
            onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
            placeholder="Nome do banco"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="agencia">Agência</Label>
          <Input
            id="agencia"
            value={formData.agencia}
            onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
            placeholder="Número da agência"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="conta">Conta *</Label>
          <Input
            id="conta"
            value={formData.conta}
            onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
            placeholder="Número da conta"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo_conta">Tipo de Conta</Label>
          <Select
            value={formData.tipo_conta}
            onValueChange={(value) => setFormData({ ...formData, tipo_conta: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="corrente">Corrente</SelectItem>
              <SelectItem value="poupanca">Poupança</SelectItem>
              <SelectItem value="investimento">Investimento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="saldo_atual">Saldo Atual</Label>
          <Input
            id="saldo_atual"
            type="number"
            step="0.01"
            value={formData.saldo_atual}
            onChange={(e) => setFormData({ ...formData, saldo_atual: e.target.value })}
            placeholder="0,00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="is_active">Status</Label>
          <Select
            value={formData.is_active.toString()}
            onValueChange={(value) => setFormData({ ...formData, is_active: value === 'true' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Ativa</SelectItem>
              <SelectItem value="false">Inativa</SelectItem>
            </SelectContent>
          </Select>
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

interface TransactionFormProps {
  formData: any;
  setFormData: (data: any) => void;
  bankAccounts: any[];
  onSubmit: () => void;
  onCancel: () => void;
}

function TransactionForm({ formData, setFormData, bankAccounts, onSubmit, onCancel }: TransactionFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bank_account_id">Conta Bancária *</Label>
          <Select
            value={formData.bank_account_id}
            onValueChange={(value) => setFormData({ ...formData, bank_account_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma conta" />
            </SelectTrigger>
            <SelectContent>
              {bankAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.banco} - {account.conta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo *</Label>
          <Select
            value={formData.tipo}
            onValueChange={(value) => setFormData({ ...formData, tipo: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entrada">Entrada</SelectItem>
              <SelectItem value="saida">Saída</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição *</Label>
          <Input
            id="descricao"
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            placeholder="Descrição da transação"
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
          <Label htmlFor="data_movimento">Data do Movimento</Label>
          <Input
            id="data_movimento"
            type="date"
            value={formData.data_movimento}
            onChange={(e) => setFormData({ ...formData, data_movimento: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_conciliacao">Data de Conciliação</Label>
          <Input
            id="data_conciliacao"
            type="date"
            value={formData.data_conciliacao}
            onChange={(e) => setFormData({ ...formData, data_conciliacao: e.target.value })}
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
