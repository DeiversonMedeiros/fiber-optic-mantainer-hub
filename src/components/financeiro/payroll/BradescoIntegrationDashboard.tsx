import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useBradescoIntegration } from '@/hooks/financeiro/useBradescoIntegration';
import { 
  Building2, 
  CreditCard, 
  Download, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Plus,
  Settings,
  BarChart3,
  RefreshCw,
  FileText,
  DollarSign,
  Users,
  Activity
} from 'lucide-react';

interface BradescoIntegrationDashboardProps {
  payrollCalculationId?: string;
}

export const BradescoIntegrationDashboard: React.FC<BradescoIntegrationDashboardProps> = ({
  payrollCalculationId
}) => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    period: 'all'
  });

  const {
    bradescoConfig,
    transactions,
    bankStatements,
    paymentBatches,
    integrationLogs,
    isLoading,
    error,
    isProcessing,
    authenticate,
    createTransaction,
    processTransaction,
    syncBankStatement,
    createCompletePaymentBatch,
    processPayrollBatch,
    generateCNABFile,
    logIntegration
  } = useBradescoIntegration();

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleAuthenticate = async () => {
    try {
      await authenticate();
      toast({
        title: 'Sucesso',
        description: 'Autenticação com o Bradesco realizada com sucesso!'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao autenticar com o Bradesco',
        variant: 'destructive'
      });
    }
  };

  const handleSyncBankStatement = async () => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      await syncBankStatement({ startDate, endDate });
      toast({
        title: 'Sucesso',
        description: 'Extrato bancário sincronizado com sucesso!'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao sincronizar extrato bancário',
        variant: 'destructive'
      });
    }
  };

  const handleProcessPayrollBatch = async () => {
    if (!payrollCalculationId) {
      toast({
        title: 'Erro',
        description: 'ID da folha de pagamento não encontrado',
        variant: 'destructive'
      });
      return;
    }

    try {
      await processPayrollBatch(payrollCalculationId);
      toast({
        title: 'Sucesso',
        description: 'Lote de pagamento da folha criado com sucesso!'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao processar lote da folha',
        variant: 'destructive'
      });
    }
  };

  const handleGenerateCNAB = async (batchId: string) => {
    try {
      await generateCNABFile(batchId);
      toast({
        title: 'Sucesso',
        description: 'Arquivo CNAB gerado com sucesso!'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao gerar arquivo CNAB',
        variant: 'destructive'
      });
    }
  };

  // =====================================================
  // RENDER HELPERS
  // =====================================================

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  // =====================================================
  // RENDER
  // =====================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando integração bancária...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar dados</h3>
        <p className="text-gray-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integração Bancária - Bradesco</h2>
          <p className="text-gray-600">Gerencie transações, extratos e pagamentos com o Banco Bradesco</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleAuthenticate}
            disabled={isProcessing}
            variant="outline"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Autenticar
          </Button>
          <Button
            onClick={handleSyncBankStatement}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Sincronizar Extrato
          </Button>
          {payrollCalculationId && (
            <Button
              onClick={handleProcessPayrollBatch}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Processar Folha
            </Button>
          )}
        </div>
      </div>

      {/* Status da Configuração */}
      {bradescoConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Status da Configuração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Ambiente</Label>
                <p className="text-lg font-semibold capitalize">{bradescoConfig.environment}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Agência</Label>
                <p className="text-lg font-semibold">{bradescoConfig.agency_number}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Conta</Label>
                <p className="text-lg font-semibold">{bradescoConfig.account_number}-{bradescoConfig.account_digit}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <div className="flex items-center gap-2">
                  {bradescoConfig.is_active ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ativo
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      <XCircle className="w-3 h-3 mr-1" />
                      Inativo
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {transactions?.filter(t => t.status === 'completed').length || 0} concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Extratos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bankStatements?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {bankStatements?.filter(s => s.sync_status === 'completed').length || 0} sincronizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lotes de Pagamento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentBatches?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {paymentBatches?.filter(b => b.status === 'completed').length || 0} processados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logs de Integração</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrationLogs?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {integrationLogs?.filter(l => l.log_level === 'error').length || 0} erros
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="statements">Extratos</TabsTrigger>
          <TabsTrigger value="batches">Lotes</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transações Recentes */}
            <Card>
              <CardHeader>
                <CardTitle>Transações Recentes</CardTitle>
                <CardDescription>Últimas transações processadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {transactions?.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{transaction.transaction_id}</p>
                        <p className="text-sm text-gray-600">{transaction.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))}
                  {(!transactions || transactions.length === 0) && (
                    <p className="text-gray-500 text-center py-4">Nenhuma transação encontrada</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lotes Recentes */}
            <Card>
              <CardHeader>
                <CardTitle>Lotes de Pagamento</CardTitle>
                <CardDescription>Últimos lotes processados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {paymentBatches?.slice(0, 5).map((batch) => (
                    <div key={batch.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{batch.batch_number}</p>
                        <p className="text-sm text-gray-600">{batch.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(batch.total_amount)}</p>
                        {getStatusBadge(batch.status)}
                      </div>
                    </div>
                  ))}
                  {(!paymentBatches || paymentBatches.length === 0) && (
                    <p className="text-gray-500 text-center py-4">Nenhum lote encontrado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transações Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transações Bancárias</CardTitle>
              <CardDescription>Gerencie as transações com o Bradesco</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID da Transação</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.transaction_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.transaction_type}</Badge>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>{formatDateTime(transaction.created_at)}</TableCell>
                      <TableCell>
                        {transaction.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => processTransaction(transaction.id)}
                          >
                            Processar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!transactions || transactions.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Nenhuma transação encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Extratos Tab */}
        <TabsContent value="statements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Extratos Bancários</CardTitle>
              <CardDescription>Visualize e gerencie os extratos sincronizados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Saldo Inicial</TableHead>
                    <TableHead>Saldo Final</TableHead>
                    <TableHead>Créditos</TableHead>
                    <TableHead>Débitos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Processado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankStatements?.map((statement) => (
                    <TableRow key={statement.id}>
                      <TableCell className="font-medium">{formatDate(statement.statement_date)}</TableCell>
                      <TableCell>{formatCurrency(statement.opening_balance)}</TableCell>
                      <TableCell>{formatCurrency(statement.closing_balance)}</TableCell>
                      <TableCell>{formatCurrency(statement.total_credits)}</TableCell>
                      <TableCell>{formatCurrency(statement.total_debits)}</TableCell>
                      <TableCell>{getStatusBadge(statement.sync_status)}</TableCell>
                      <TableCell>
                        {statement.is_processed ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Sim
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Não
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!bankStatements || bankStatements.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Nenhum extrato encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lotes Tab */}
        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lotes de Pagamento</CardTitle>
              <CardDescription>Gerencie os lotes de pagamento enviados ao Bradesco</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número do Lote</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Transações</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentBatches?.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.batch_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{batch.batch_type}</Badge>
                      </TableCell>
                      <TableCell>{batch.description}</TableCell>
                      <TableCell>{formatCurrency(batch.total_amount)}</TableCell>
                      <TableCell>{batch.total_transactions}</TableCell>
                      <TableCell>{getStatusBadge(batch.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {batch.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateCNAB(batch.id)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              CNAB
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!paymentBatches || paymentBatches.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Nenhum lote encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Integração</CardTitle>
              <CardDescription>Monitore as atividades de integração com o Bradesco</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Duração</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrationLogs?.slice(0, 50).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{formatDateTime(log.created_at)}</TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            log.log_level === 'error' ? 'bg-red-100 text-red-800' :
                            log.log_level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                            log.log_level === 'info' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {log.log_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.log_type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{log.message}</TableCell>
                      <TableCell>{log.endpoint || '-'}</TableCell>
                      <TableCell>{log.duration_ms ? `${log.duration_ms}ms` : '-'}</TableCell>
                    </TableRow>
                  ))}
                  {(!integrationLogs || integrationLogs.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhum log encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};