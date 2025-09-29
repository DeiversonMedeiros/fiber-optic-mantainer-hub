import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { usePayrollCalculationEngine } from '@/hooks/rh/usePayrollCalculationEngine';
import { useEmployees } from '@/hooks/rh';
import { useToast } from '@/hooks/use-toast';
import { 
  Calculator, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  Users, 
  AlertTriangle,
  Filter,
  Download,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';

interface PayrollCalculationDashboardProps {
  companyId: string;
}

export function PayrollCalculationDashboard({ companyId }: PayrollCalculationDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCalculations, setSelectedCalculations] = useState<string[]>([]);
  const [calculations, setCalculations] = useState<any[]>([]);
  const [calculationResult, setCalculationResult] = useState<any>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const { employees, isLoading: employeesLoading } = useEmployees(companyId);
  const { 
    loading, 
    error, 
    calculatePayroll, 
    getCalculations, 
    getCalculationById,
    approveCalculation,
    rejectCalculation
  } = usePayrollCalculationEngine();

  // Gerar opções de período (últimos 12 meses)
  const generatePeriodOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const period = date.toISOString().slice(0, 7); // YYYY-MM
      const label = date.toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'long' 
      });
      options.push({ value: period, label });
    }
    
    return options;
  };

  // Carregar cálculos quando o período mudar
  useEffect(() => {
    if (selectedPeriod) {
      loadCalculations();
    }
  }, [selectedPeriod, selectedEmployee, selectedStatus]);

  const loadCalculations = async () => {
    const calculationsData = await getCalculations(
      selectedPeriod,
      selectedEmployee === 'all' ? undefined : selectedEmployee,
      selectedStatus === 'all' ? undefined : selectedStatus
    );
    setCalculations(calculationsData);
  };

  const handleCalculate = async () => {
    if (!selectedPeriod) {
      toast({
        title: "Erro",
        description: "Selecione um período para calcular",
        variant: "destructive"
      });
      return;
    }

    if (selectedEmployee === 'all') {
      toast({
        title: "Erro",
        description: "Selecione um funcionário específico para calcular",
        variant: "destructive"
      });
      return;
    }

    const result = await calculatePayroll(selectedEmployee, selectedPeriod, 'full');
    
    if (result) {
      setCalculationResult(result);
      await loadCalculations(); // Recarregar cálculos após processamento
    }
  };

  const handleApproveSelected = async () => {
    if (selectedCalculations.length === 0) return;

    const success = await approveCalculation(selectedCalculations[0], user?.id || '');
    if (success) {
      setSelectedCalculations([]);
      await loadCalculations();
    }
  };

  const handleRejectSelected = async () => {
    if (selectedCalculations.length === 0) return;

    const reason = prompt('Motivo da rejeição:');
    if (!reason) return;

    const success = await rejectCalculation(selectedCalculations[0], user?.id || '', reason);
    if (success) {
      setSelectedCalculations([]);
      await loadCalculations();
    }
  };

  const handleSelectCalculation = (calculationId: string, checked: boolean) => {
    if (checked) {
      setSelectedCalculations([...selectedCalculations, calculationId]);
    } else {
      setSelectedCalculations(selectedCalculations.filter(id => id !== calculationId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCalculations(calculations.map(calc => calc.id));
    } else {
      setSelectedCalculations([]);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': 'secondary',
      'calculated': 'default',
      'approved': 'outline',
      'processed': 'default'
    } as const;

    const icons = {
      'pending': <Clock className="h-3 w-3" />,
      'calculated': <Calculator className="h-3 w-3" />,
      'approved': <CheckCircle className="h-3 w-3" />,
      'processed': <CheckCircle className="h-3 w-3" />
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {icons[status as keyof typeof icons]}
        <span className="ml-1 capitalize">{status}</span>
      </Badge>
    );
  };

  const statusOptions = [
    { value: 'pending', label: 'Pendente' },
    { value: 'calculated', label: 'Calculado' },
    { value: 'approved', label: 'Aprovado' },
    { value: 'processed', label: 'Processado' }
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Motor de Cálculo de Folha</h2>
          <p className="text-muted-foreground">
            Calcule e gerencie folhas de pagamento automaticamente
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCalculate} disabled={loading || !selectedPeriod || selectedEmployee === 'all'}>
            <Calculator className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Calcular Folha
          </Button>
        </div>
      </div>

      {/* Resultado do Cálculo */}
      {calculationResult && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Cálculo Concluído:</strong> {calculationResult.salario_liquido.toFixed(2)} líquido para {calculationResult.calculation.employee_id}
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">Período *</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um período" />
                </SelectTrigger>
                <SelectContent>
                  {generatePeriodOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee">Funcionário *</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os funcionários</SelectItem>
                  {employees?.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.nome} {employee.matricula && `(${employee.matricula})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações em Lote */}
      {selectedCalculations.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedCalculations.length} cálculo(s) selecionado(s)
              </span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleApproveSelected}
                  disabled={loading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={handleRejectSelected}
                  disabled={loading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Cálculos */}
      <Card>
        <CardHeader>
          <CardTitle>Cálculos de Folha</CardTitle>
          <CardDescription>
            {calculations.length} cálculo(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2">Carregando cálculos...</span>
            </div>
          ) : calculations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cálculo encontrado para o período selecionado
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cabeçalho da tabela */}
              <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 rounded-lg font-medium text-sm">
                <div className="col-span-1">
                  <Checkbox
                    checked={selectedCalculations.length === calculations.length}
                    onCheckedChange={handleSelectAll}
                  />
                </div>
                <div className="col-span-2">Funcionário</div>
                <div className="col-span-2">Período</div>
                <div className="col-span-2">Salário Bruto</div>
                <div className="col-span-2">Salário Líquido</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Ações</div>
              </div>

              {/* Cálculos */}
              {calculations.map((calculation) => (
                <div key={calculation.id} className="grid grid-cols-12 gap-4 p-4 border rounded-lg">
                  <div className="col-span-1 flex items-center">
                    <Checkbox
                      checked={selectedCalculations.includes(calculation.id)}
                      onCheckedChange={(checked) => handleSelectCalculation(calculation.id, checked as boolean)}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <div className="font-medium">{calculation.employee?.nome}</div>
                    <div className="text-sm text-muted-foreground">
                      {calculation.employee?.matricula}
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="font-medium">
                      {new Date(calculation.period + '-01').toLocaleDateString('pt-BR', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="font-medium">
                      {formatCurrency(calculation.salario_bruto)}
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="font-medium text-green-600">
                      {formatCurrency(calculation.salario_liquido)}
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    {getStatusBadge(calculation.status)}
                  </div>
                  
                  <div className="col-span-1">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => getCalculationById(calculation.id)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      {calculation.status === 'calculated' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => approveCalculation(calculation.id, user?.id || '')}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectCalculation(calculation.id, user?.id || '', 'Rejeitado individualmente')}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
