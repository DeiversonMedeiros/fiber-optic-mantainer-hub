import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OvertimeCalculationForm } from '@/components/rh/payroll/calculations/OvertimeCalculationForm';
import { 
  Clock, 
  Calendar, 
  DollarSign, 
  Users, 
  Calculator,
  FileText,
  TrendingUp,
  AlertCircle,
  Play,
  Pause,
  CheckCircle,
  Upload,
  Settings,
  Download,
  RefreshCw,
  Zap,
  Plus
} from 'lucide-react';
import { useUserCompany } from '@/hooks/useUserCompany';
import { useToast } from '@/hooks/use-toast';

interface PayrollProcess {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  totalEmployees: number;
  processedEmployees: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

export default function AdvancedPayrollManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcess, setCurrentProcess] = useState<PayrollProcess | null>(null);
  const [processes, setProcesses] = useState<PayrollProcess[]>([]);
  const { data: userCompany, isLoading: loadingCompany } = useUserCompany();
  const { toast } = useToast();

  // =====================================================
  // ESTADOS E DADOS
  // =====================================================

  const [payrollData, setPayrollData] = useState({
    referencePeriod: new Date().toISOString().slice(0, 7), // YYYY-MM
    calculationDate: new Date().toISOString().split('T')[0],
    totalEmployees: 0,
    processedEmployees: 0,
    totalAmount: 0,
    status: 'draft' as 'draft' | 'calculating' | 'completed' | 'error'
  });

  // =====================================================
  // FUNÇÕES DE PROCESSAMENTO EM LOTE
  // =====================================================

  const startBulkCalculation = async () => {
    if (!userCompany) return;

    setIsProcessing(true);
    setPayrollData(prev => ({ ...prev, status: 'calculating' }));

    // Criar processo de cálculo
    const process: PayrollProcess = {
      id: `process-${Date.now()}`,
      name: `Folha ${payrollData.referencePeriod}`,
      status: 'processing',
      progress: 0,
      totalEmployees: payrollData.totalEmployees || 20000, // Usar valor configurado ou 20k
      processedEmployees: 0,
      startTime: new Date()
    };

    setCurrentProcess(process);
    setProcesses(prev => [process, ...prev]);

    try {
      // Simular processamento em lotes de 1000 funcionários
      const batchSize = 1000;
      const totalBatches = Math.ceil(process.totalEmployees / batchSize);

      for (let batch = 0; batch < totalBatches; batch++) {
        // Simular delay de processamento
        await new Promise(resolve => setTimeout(resolve, 100));

        const processed = Math.min((batch + 1) * batchSize, process.totalEmployees);
        const progress = Math.round((processed / process.totalEmployees) * 100);

        setCurrentProcess(prev => prev ? {
          ...prev,
          progress,
          processedEmployees: processed
        } : null);

        setPayrollData(prev => ({
          ...prev,
          processedEmployees: processed,
          totalAmount: processed * 2500 // Simular valor médio
        }));

        // Atualizar processo na lista
        setProcesses(prev => prev.map(p => 
          p.id === process.id 
            ? { ...p, progress, processedEmployees: processed }
            : p
        ));
      }

      // Finalizar processo
      const completedProcess = {
        ...process,
        status: 'completed' as const,
        progress: 100,
        endTime: new Date()
      };

      setCurrentProcess(completedProcess);
      setProcesses(prev => prev.map(p => 
        p.id === process.id ? completedProcess : p
      ));

      setPayrollData(prev => ({ ...prev, status: 'completed' }));

      toast({
        title: 'Cálculo Concluído!',
        description: `Folha de pagamento processada para ${process.totalEmployees} funcionários.`,
        variant: 'default',
      });

    } catch (error) {
      const errorProcess = {
        ...process,
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        endTime: new Date()
      };

      setCurrentProcess(errorProcess);
      setProcesses(prev => prev.map(p => 
        p.id === process.id ? errorProcess : p
      ));

      setPayrollData(prev => ({ ...prev, status: 'error' }));

      toast({
        title: 'Erro no Processamento',
        description: 'Ocorreu um erro durante o cálculo da folha.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const pauseCalculation = () => {
    if (currentProcess) {
      setCurrentProcess(prev => prev ? { ...prev, status: 'pending' } : null);
      setIsProcessing(false);
      toast({
        title: 'Processamento Pausado',
        description: 'O cálculo da folha foi pausado.',
        variant: 'default',
      });
    }
  };

  const resumeCalculation = () => {
    if (currentProcess && currentProcess.status === 'pending') {
      startBulkCalculation();
    }
  };

  const cancelCalculation = () => {
    setCurrentProcess(null);
    setIsProcessing(false);
    setPayrollData(prev => ({ ...prev, status: 'draft' }));
    toast({
      title: 'Processamento Cancelado',
      description: 'O cálculo da folha foi cancelado.',
      variant: 'default',
    });
  };

  // =====================================================
  // FUNÇÕES DE CONFIGURAÇÃO
  // =====================================================

  const importEmployeeData = async () => {
    toast({
      title: 'Importação de Dados',
      description: 'Funcionalidade de importação será implementada em breve.',
      variant: 'default',
    });
  };

  const configureParameters = () => {
    toast({
      title: 'Configuração de Parâmetros',
      description: 'Funcionalidade de configuração será implementada em breve.',
      variant: 'default',
    });
  };

  const generateAllDocuments = async () => {
    if (payrollData.status !== 'completed') {
      toast({
        title: 'Folha não Calculada',
        description: 'Complete o cálculo da folha antes de gerar documentos.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Gerando Documentos',
      description: 'Gerando títulos, guias de impostos e provisões contábeis...',
      variant: 'default',
    });
  };

  const createPaymentBatch = async () => {
    if (payrollData.status !== 'completed') {
      toast({
        title: 'Folha não Calculada',
        description: 'Complete o cálculo da folha antes de criar lote de pagamento.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Criando Lote de Pagamento',
      description: 'Criando lote de pagamento para o Bradesco...',
      variant: 'default',
    });
  };

  // =====================================================
  // RENDER HELPERS
  // =====================================================

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: FileText },
      calculating: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      error: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
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

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  if (loadingCompany) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dados da empresa...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userCompany) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Usuário não está associado a uma empresa. Entre em contato com o administrador.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!userCompany.is_active) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            A empresa <strong>{userCompany.nome_fantasia || userCompany.razao_social}</strong> está com status inativo. 
            Entre em contato com o administrador para ativar o módulo RH.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const companyId = userCompany.id;

  const handleCalculationComplete = (result: any) => {
    console.log('Cálculo concluído:', result);
    // Aqui você pode implementar lógica para salvar o resultado
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Folha de Pagamento Avançada</h1>
        <p className="text-muted-foreground">
          Sistema completo de cálculos de folha de pagamento com processamento em lote para grandes volumes
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(payrollData.totalEmployees)}</div>
            <p className="text-xs text-muted-foreground">
              {payrollData.processedEmployees} processados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(payrollData.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Folha de {payrollData.referencePeriod}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getStatusBadge(payrollData.status)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {payrollData.status === 'calculating' ? 'Processando...' : 'Pronto para processar'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payrollData.totalEmployees > 0 
                ? Math.round((payrollData.processedEmployees / payrollData.totalEmployees) * 100)
                : 0}%
            </div>
            <Progress 
              value={payrollData.totalEmployees > 0 
                ? (payrollData.processedEmployees / payrollData.totalEmployees) * 100
                : 0
              } 
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Processamento Atual */}
      {currentProcess && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Processamento em Andamento
            </CardTitle>
            <CardDescription>
              {currentProcess.name} - {currentProcess.processedEmployees} de {currentProcess.totalEmployees} funcionários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={currentProcess.progress} className="w-full" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{currentProcess.processedEmployees} processados</span>
                <span>{currentProcess.progress}% concluído</span>
              </div>
              <div className="flex gap-2">
                {currentProcess.status === 'processing' && (
                  <Button onClick={pauseCalculation} variant="outline" size="sm">
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar
                  </Button>
                )}
                {currentProcess.status === 'pending' && (
                  <Button onClick={resumeCalculation} size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Retomar
                  </Button>
                )}
                <Button onClick={cancelCalculation} variant="destructive" size="sm">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuração
            </CardTitle>
            <CardDescription>
              Configure parâmetros e importe dados de funcionários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={configureParameters} variant="outline" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Configurar Parâmetros
            </Button>
            <Button onClick={importEmployeeData} variant="outline" className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Importar Dados
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Cálculo
            </CardTitle>
            <CardDescription>
              Processe a folha de pagamento para todos os funcionários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={startBulkCalculation} 
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isProcessing ? 'Processando...' : 'Calcular Folha Completa'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos
            </CardTitle>
            <CardDescription>
              Gere documentos e crie lotes de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={generateAllDocuments} 
              disabled={payrollData.status !== 'completed'}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              Gerar todos os Documentos
            </Button>
            <Button 
              onClick={createPaymentBatch} 
              disabled={payrollData.status !== 'completed'}
              variant="outline"
              className="w-full"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Criar Lote de Pagamento
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Funcionalidades Detalhadas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="overtime" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Horas Extras</span>
          </TabsTrigger>
          <TabsTrigger value="vacation" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Férias</span>
          </TabsTrigger>
          <TabsTrigger value="thirteenth" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">13º Salário</span>
          </TabsTrigger>
          <TabsTrigger value="taxes" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Impostos</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Relatórios</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab de Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Processamentos</CardTitle>
                <CardDescription>Últimos processamentos de folha de pagamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {processes.slice(0, 5).map((process) => (
                    <div key={process.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{process.name}</p>
                        <p className="text-sm text-gray-600">
                          {process.processedEmployees} de {process.totalEmployees} funcionários
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(process.status)}
                        </div>
                        <p className="text-sm text-gray-600">{process.progress}%</p>
                      </div>
                    </div>
                  ))}
                  {processes.length === 0 && (
                    <p className="text-gray-500 text-center py-4">Nenhum processamento encontrado</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações Rápidas</CardTitle>
                <CardDescription>Ajuste parâmetros da folha de pagamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Período de Referência</label>
                  <input
                    type="month"
                    value={payrollData.referencePeriod}
                    onChange={(e) => setPayrollData(prev => ({ ...prev, referencePeriod: e.target.value }))}
                    className="w-full mt-1 p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Data de Cálculo</label>
                  <input
                    type="date"
                    value={payrollData.calculationDate}
                    onChange={(e) => setPayrollData(prev => ({ ...prev, calculationDate: e.target.value }))}
                    className="w-full mt-1 p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Total de Funcionários</label>
                  <input
                    type="number"
                    value={payrollData.totalEmployees}
                    onChange={(e) => setPayrollData(prev => ({ ...prev, totalEmployees: parseInt(e.target.value) || 0 }))}
                    className="w-full mt-1 p-2 border rounded"
                    placeholder="Ex: 20000"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab de Horas Extras */}
        <TabsContent value="overtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cálculo de Horas Extras</CardTitle>
              <CardDescription>
                Calcule horas extras, DSR e adicional noturno para funcionários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OvertimeCalculationForm
                companyId={companyId}
                onCalculationComplete={handleCalculationComplete}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Férias */}
        <TabsContent value="vacation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cálculo de Férias</CardTitle>
              <CardDescription>
                Calcule férias proporcionais, 1/3 constitucional e abono pecuniário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2" />
                  <p>Funcionalidade em desenvolvimento</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de 13º Salário */}
        <TabsContent value="thirteenth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cálculo de 13º Salário</CardTitle>
              <CardDescription>
                Calcule 13º salário e valores proporcionais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2" />
                  <p>Funcionalidade em desenvolvimento</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Impostos */}
        <TabsContent value="taxes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cálculo de Impostos</CardTitle>
              <CardDescription>
                Calcule INSS, IRRF, FGTS e contribuições sindicais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <Calculator className="h-8 w-8 mx-auto mb-2" />
                  <p>Funcionalidade em desenvolvimento</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Relatórios */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios e Exportações</CardTitle>
              <CardDescription>
                Gere relatórios detalhados e exporte dados da folha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <Download className="h-8 w-8 mx-auto mb-2" />
                  <p>Funcionalidade em desenvolvimento</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
