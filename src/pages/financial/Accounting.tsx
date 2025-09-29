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
  XCircle,
  Upload,
  File,
  Zap,
  Globe,
  Shield,
  Clock,
  AlertCircle,
  BookOpen,
  Calculator,
  BarChart3,
  PieChart
} from 'lucide-react';
import { useChartAccounts } from '@/hooks/financial';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Accounting() {
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = useState(false);
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const {
    chartAccounts,
    loading,
    error,
    fetchChartAccounts,
    createChartAccount,
    updateChartAccount,
    deleteChartAccount,
    getAccountsByType,
    getActiveAccounts,
    validateAccountCode,
    getAccountPath
  } = useChartAccounts();

  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    tipo: 'ativo' as const,
    nivel: 1,
    parent_id: '',
    is_active: true,
  });

  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await fetchChartAccounts();
  };

  const handleCreateAccount = async () => {
    try {
      // Validar código antes de criar
      const validation = validateAccountCode(formData.codigo, formData.parent_id);
      if (!validation.isValid) {
        alert(validation.message);
        return;
      }

      await createChartAccount(formData);
      setIsCreateAccountModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao criar conta contábil:', error);
    }
  };

  const handleUpdateAccount = async () => {
    if (!selectedAccount) return;

    try {
      await updateChartAccount(selectedAccount.id, formData);
      setIsEditAccountModalOpen(false);
      setSelectedAccount(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar conta contábil:', error);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta contábil?')) {
      try {
        await deleteChartAccount(id);
        loadData();
      } catch (error) {
        console.error('Erro ao excluir conta contábil:', error);
      }
    }
  };

  const handleEditAccount = (account: any) => {
    setSelectedAccount(account);
    setFormData({
      codigo: account.codigo || '',
      nome: account.nome || '',
      tipo: account.tipo || 'ativo',
      nivel: account.nivel || 1,
      parent_id: account.parent_id || '',
      is_active: account.is_active,
    });
    setIsEditAccountModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      nome: '',
      tipo: 'ativo',
      nivel: 1,
      parent_id: '',
      is_active: true,
    });
  };

  const toggleExpanded = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const renderAccountTree = (accounts: any[], level = 0) => {
    return accounts.map((account) => (
      <React.Fragment key={account.id}>
        <TableRow>
          <TableCell style={{ paddingLeft: `${level * 20 + 12}px` }}>
            <div className="flex items-center">
              {account.children && account.children.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(account.id)}
                  className="h-6 w-6 p-0 mr-2"
                >
                  {expandedAccounts.has(account.id) ? '-' : '+'}
                </Button>
              )}
              <div>
                <p className="font-medium">{account.codigo} - {account.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {getAccountPath(account.id).join(' > ')}
                </p>
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Badge variant={getTypeColor(account.tipo)}>
              {account.tipo.replace('_', ' ').toUpperCase()}
            </Badge>
          </TableCell>
          <TableCell>{account.nivel}</TableCell>
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
        {expandedAccounts.has(account.id) && account.children && (
          <>{renderAccountTree(account.children, level + 1)}</>
        )}
      </React.Fragment>
    ));
  };

  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'ativo':
        return 'bg-blue-100 text-blue-800';
      case 'passivo':
        return 'bg-red-100 text-red-800';
      case 'patrimonio_liquido':
        return 'bg-green-100 text-green-800';
      case 'receita':
        return 'bg-yellow-100 text-yellow-800';
      case 'despesa':
        return 'bg-orange-100 text-orange-800';
      case 'custos':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAccounts = selectedType 
    ? getAccountsByType(selectedType)
    : chartAccounts;

  const searchFilteredAccounts = filteredAccounts.filter(account =>
    account.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeAccounts = getActiveAccounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contabilidade</h1>
          <p className="text-muted-foreground">
            Gerencie o plano de contas e estrutura contábil
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Dialog open={isCreateAccountModalOpen} onOpenChange={setIsCreateAccountModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Conta Contábil</DialogTitle>
                <DialogDescription>
                  Adicione uma nova conta ao plano de contas
                </DialogDescription>
              </DialogHeader>
              <AccountForm
                formData={formData}
                setFormData={setFormData}
                chartAccounts={activeAccounts}
                onSubmit={handleCreateAccount}
                onCancel={() => setIsCreateAccountModalOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chartAccounts.length}</div>
            <p className="text-xs text-muted-foreground">
              Contas cadastradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas Ativas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeAccounts.length}</div>
            <p className="text-xs text-muted-foreground">
              Contas em uso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Níveis</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...chartAccounts.map(acc => acc.nivel || 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Níveis hierárquicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(chartAccounts.map(acc => acc.tipo)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Tipos diferentes
            </p>
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
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Código ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Conta</Label>
              <Select
                value={selectedType}
                onValueChange={setSelectedType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="passivo">Passivo</SelectItem>
                  <SelectItem value="patrimonio_liquido">Patrimônio Líquido</SelectItem>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                  <SelectItem value="custos">Custos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as contas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as contas</SelectItem>
                  <SelectItem value="active">Apenas ativas</SelectItem>
                  <SelectItem value="inactive">Apenas inativas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Contas */}
      <Card>
        <CardHeader>
          <CardTitle>Plano de Contas</CardTitle>
          <CardDescription>
            {searchFilteredAccounts.length} conta(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderAccountTree(searchFilteredAccounts)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={isEditAccountModalOpen} onOpenChange={setIsEditAccountModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Conta Contábil</DialogTitle>
            <DialogDescription>
              Atualize os dados da conta contábil
            </DialogDescription>
          </DialogHeader>
          <AccountForm
            formData={formData}
            setFormData={setFormData}
            chartAccounts={activeAccounts}
            onSubmit={handleUpdateAccount}
            onCancel={() => setIsEditAccountModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface AccountFormProps {
  formData: any;
  setFormData: (data: any) => void;
  chartAccounts: any[];
  onSubmit: () => void;
  onCancel: () => void;
}

function AccountForm({ formData, setFormData, chartAccounts, onSubmit, onCancel }: AccountFormProps) {
  const [validationMessage, setValidationMessage] = useState('');

  const handleCodeChange = (codigo: string) => {
    setFormData({ ...formData, codigo });
    
    // Validar código em tempo real
    const validation = validateAccountCode(codigo, formData.parent_id);
    setValidationMessage(validation.isValid ? '' : validation.message);
  };

  const handleParentChange = (parentId: string) => {
    setFormData({ ...formData, parent_id: parentId });
    
    // Revalidar código se necessário
    if (formData.codigo) {
      const validation = validateAccountCode(formData.codigo, parentId);
      setValidationMessage(validation.isValid ? '' : validation.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="codigo">Código *</Label>
          <Input
            id="codigo"
            value={formData.codigo}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder="Ex: 1.01.001"
          />
          {validationMessage && (
            <p className="text-sm text-red-600">{validationMessage}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="Nome da conta"
          />
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
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="passivo">Passivo</SelectItem>
              <SelectItem value="patrimonio_liquido">Patrimônio Líquido</SelectItem>
              <SelectItem value="receita">Receita</SelectItem>
              <SelectItem value="despesa">Despesa</SelectItem>
              <SelectItem value="custos">Custos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nivel">Nível</Label>
          <Input
            id="nivel"
            type="number"
            min="1"
            max="10"
            value={formData.nivel}
            onChange={(e) => setFormData({ ...formData, nivel: parseInt(e.target.value) || 1 })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="parent_id">Conta Pai</Label>
          <Select
            value={formData.parent_id}
            onValueChange={handleParentChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma conta pai" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nenhuma">Nenhuma (conta raiz)</SelectItem>
              {chartAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.codigo} - {account.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        <Button onClick={onSubmit} disabled={!!validationMessage}>
          Salvar
        </Button>
      </div>
    </div>
  );
}
