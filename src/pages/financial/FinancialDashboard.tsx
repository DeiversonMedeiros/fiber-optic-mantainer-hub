import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Banknote,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { 
  useAccountsPayable, 
  useAccountsReceivable, 
  useBankAccounts, 
  useBankTransactions 
} from '@/hooks/financial';

interface KPIData {
  totalAP: number;
  totalAR: number;
  totalBankBalance: number;
  dso: number;
  dpo: number;
  cashFlow: number;
  pendingPayments: number;
  pendingReceipts: number;
  overduePayments: number;
  overdueReceipts: number;
}

export default function FinancialDashboard() {
  const [kpiData, setKpiData] = useState<KPIData>({
    totalAP: 0,
    totalAR: 0,
    totalBankBalance: 0,
    dso: 0,
    dpo: 0,
    cashFlow: 0,
    pendingPayments: 0,
    pendingReceipts: 0,
    overduePayments: 0,
    overdueReceipts: 0,
  });

  const { accountsPayable, getTotalByStatus: getAPTotals } = useAccountsPayable();
  const { accountsReceivable, getTotalByStatus: getARTotals, getDSO } = useAccountsReceivable();
  const { getTotalBalance } = useBankAccounts();
  const { getCashFlowProjection } = useBankTransactions();

  useEffect(() => {
    loadKPIData();
  }, [accountsPayable, accountsReceivable]);

  const loadKPIData = async () => {
    try {
      // Carregar totais de contas a pagar
      const apTotals = await getAPTotals();
      const arTotals = await getARTotals();
      const dso = await getDSO();
      const bankBalance = getTotalBalance();
      const cashFlow = await getCashFlowProjection(30);

      // Calcular DPO (Days Payable Outstanding)
      const dpo = calculateDPO(apTotals);

      setKpiData({
        totalAP: apTotals.pendente || 0,
        totalAR: arTotals.pendente || 0,
        totalBankBalance: bankBalance,
        dso: dso,
        dpo: dpo,
        cashFlow: cashFlow.reduce((sum: number, day: any) => sum + (day.entrada - day.saida), 0),
        pendingPayments: apTotals.pendente || 0,
        pendingReceipts: arTotals.pendente || 0,
        overduePayments: apTotals.vencido || 0,
        overdueReceipts: arTotals.vencido || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar KPIs:', error);
    }
  };

  const calculateDPO = (apTotals: any) => {
    // Cálculo simplificado do DPO
    const totalPendente = apTotals.pendente || 0;
    const totalPago = apTotals.pago || 0;
    
    if (totalPendente === 0) return 0;
    
    // Assumindo um período de 30 dias para o cálculo
    return Math.round((totalPendente / (totalPendente + totalPago)) * 30);
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
      case 'recebido':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'vencido':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">
            Visão geral das finanças da empresa
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Relatório Mensal
          </Button>
          <Button size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Exportar Dados
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Bancário</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(kpiData.totalBankBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total em contas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas a Receber</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(kpiData.totalAR)}
            </div>
            <p className="text-xs text-muted-foreground">
              DSO: {kpiData.dso} dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas a Pagar</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(kpiData.totalAP)}
            </div>
            <p className="text-xs text-muted-foreground">
              DPO: {kpiData.dpo} dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fluxo de Caixa (30d)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${kpiData.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(kpiData.cashFlow)}
            </div>
            <p className="text-xs text-muted-foreground">
              Projeção próximos 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas e Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Alertas Financeiros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {kpiData.overduePayments > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-sm font-medium">Pagamentos Vencidos</span>
                </div>
                <Badge variant="destructive">
                  {formatCurrency(kpiData.overduePayments)}
                </Badge>
              </div>
            )}
            
            {kpiData.overdueReceipts > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-orange-500 mr-2" />
                  <span className="text-sm font-medium">Recebimentos Vencidos</span>
                </div>
                <Badge variant="outline" className="text-orange-600">
                  {formatCurrency(kpiData.overdueReceipts)}
                </Badge>
              </div>
            )}

            {kpiData.cashFlow < 0 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-sm font-medium">Fluxo de Caixa Negativo</span>
                </div>
                <Badge variant="outline" className="text-yellow-600">
                  Atenção
                </Badge>
              </div>
            )}

            {kpiData.overduePayments === 0 && kpiData.overdueReceipts === 0 && kpiData.cashFlow >= 0 && (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm font-medium">Situação Financeira Normal</span>
                </div>
                <Badge variant="outline" className="text-green-600">
                  OK
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-blue-500" />
              Resumo por Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pagamentos Pendentes</span>
              <Badge className={getStatusColor('pendente')}>
                {formatCurrency(kpiData.pendingPayments)}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Recebimentos Pendentes</span>
              <Badge className={getStatusColor('pendente')}>
                {formatCurrency(kpiData.pendingReceipts)}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pagamentos Vencidos</span>
              <Badge className={getStatusColor('vencido')}>
                {formatCurrency(kpiData.overduePayments)}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Recebimentos Vencidos</span>
              <Badge className={getStatusColor('vencido')}>
                {formatCurrency(kpiData.overdueReceipts)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com Detalhes */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="payments">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="receipts">Contas a Receber</TabsTrigger>
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Contas a Pagar - Últimas 5</CardTitle>
                <CardDescription>
                  Últimas contas a pagar registradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {accountsPayable.slice(0, 5).map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium text-sm">{account.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          {account.data_vencimento && new Date(account.data_vencimento).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(account.valor)}</p>
                        <Badge className={getStatusColor(account.status)}>
                          {account.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contas a Receber - Últimas 5</CardTitle>
                <CardDescription>
                  Últimas contas a receber registradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {accountsReceivable.slice(0, 5).map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium text-sm">{account.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          {account.data_vencimento && new Date(account.data_vencimento).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(account.valor)}</p>
                        <Badge className={getStatusColor(account.status)}>
                          {account.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Contas a Pagar</CardTitle>
              <CardDescription>
                Lista completa de contas a pagar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Implementar tabela completa de contas a pagar com filtros e ações.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts">
          <Card>
            <CardHeader>
              <CardTitle>Contas a Receber</CardTitle>
              <CardDescription>
                Lista completa de contas a receber
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Implementar tabela completa de contas a receber com filtros e ações.
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
    </div>
  );
}



