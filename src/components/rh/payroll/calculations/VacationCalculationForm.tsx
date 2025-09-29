import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Calendar, 
  Calculator, 
  DollarSign, 
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VacationCalculation {
  id: string;
  employeeId: string;
  employeeName: string;
  admissionDate: string;
  vacationStartDate: string;
  vacationEndDate: string;
  workingDays: number;
  vacationDays: number;
  proportionalVacation: number;
  constitutionalThird: number;
  pecuniaryAllowance: number;
  grossValue: number;
  deductions: {
    inss: number;
    irrf: number;
    fgts: number;
  };
  netValue: number;
  status: 'calculated' | 'pending' | 'error';
}

interface VacationCalculationFormProps {
  companyId: string;
  calculationScope?: 'company' | 'cost_center' | 'individual';
  selectedCostCenter?: string;
  selectedEmployee?: string;
  onCalculationComplete?: (result: VacationCalculation[]) => void;
}

export function VacationCalculationForm({ 
  companyId, 
  calculationScope = 'individual',
  selectedCostCenter,
  selectedEmployee: selectedEmployeeProp,
  onCalculationComplete 
}: VacationCalculationFormProps) {
  const [calculations, setCalculations] = useState<VacationCalculation[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [admissionDate, setAdmissionDate] = useState<string>('');
  const [vacationStartDate, setVacationStartDate] = useState<string>('');
  const [vacationEndDate, setVacationEndDate] = useState<string>('');
  const [workingDays, setWorkingDays] = useState<number>(0);
  const [vacationDays, setVacationDays] = useState<number>(30);
  const [includePecuniaryAllowance, setIncludePecuniaryAllowance] = useState(false);
  const [pecuniaryDays, setPecuniaryDays] = useState<number>(10);
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const { toast } = useToast();

  // Simular lista de funcionários (em produção viria de uma API)
  const allEmployees = [
    { id: '1', name: 'João Silva', admissionDate: '2020-01-15', salary: 5000, costCenter: 'rh' },
    { id: '2', name: 'Maria Santos', admissionDate: '2019-03-20', salary: 4500, costCenter: 'financeiro' },
    { id: '3', name: 'Pedro Costa', admissionDate: '2021-06-10', salary: 3800, costCenter: 'vendas' },
    { id: '4', name: 'Ana Oliveira', admissionDate: '2024-08-01', salary: 3200, costCenter: 'producao' },
    { id: '5', name: 'Carlos Lima', admissionDate: '2022-03-15', salary: 5500, costCenter: 'comercial' },
  ];

  // Filtrar funcionários baseado no escopo
  const getFilteredEmployees = () => {
    if (calculationScope === 'individual' && selectedEmployeeProp) {
      return allEmployees.filter(emp => emp.id === selectedEmployeeProp);
    }
    if (calculationScope === 'cost_center' && selectedCostCenter) {
      return allEmployees.filter(emp => emp.costCenter === selectedCostCenter);
    }
    return allEmployees; // company scope
  };

  const employees = getFilteredEmployees();

  const calculateSingleVacation = (employee: any, admissionDate: string, vacationStartDate: string, vacationEndDate: string, vacationDays: number, baseSalary: number, includePecuniary: boolean, pecuniaryDays: number): VacationCalculation => {
    // Calcular dias trabalhados no ano
    const currentYear = new Date().getFullYear();
    const admissionYear = new Date(admissionDate).getFullYear();
    const workingDaysInYear = admissionYear === currentYear 
      ? Math.floor((new Date().getTime() - new Date(admissionDate).getTime()) / (1000 * 60 * 60 * 24))
      : 365;

    // Calcular férias proporcionais
    const proportionalVacation = Math.floor((workingDaysInYear / 365) * 30);

    // Calcular 1/3 constitucional
    const dailySalary = baseSalary / 30;
    const vacationValue = vacationDays * dailySalary;
    const constitutionalThird = vacationValue / 3;

    // Calcular abono pecuniário (se solicitado)
    const pecuniaryValue = includePecuniary ? pecuniaryDays * dailySalary : 0;

    // Calcular valor bruto
    const grossValue = vacationValue + constitutionalThird + pecuniaryValue;

    // Calcular descontos (simplificado)
    const inss = Math.min(grossValue * 0.11, 828.39); // Teto INSS 2024
    const irrf = grossValue > 1903.98 ? (grossValue - 1903.98) * 0.075 : 0;
    const fgts = grossValue * 0.08;

    const deductions = { inss, irrf, fgts };
    const netValue = grossValue - inss - irrf;

    return {
      id: `vacation-${employee.id}-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      admissionDate,
      vacationStartDate,
      vacationEndDate,
      workingDays: workingDaysInYear,
      vacationDays,
      proportionalVacation,
      constitutionalThird,
      pecuniaryAllowance: pecuniaryValue,
      grossValue,
      deductions,
      netValue,
      status: 'calculated'
    };
  };

  const calculateVacation = () => {
    if (calculationScope === 'individual' && (!selectedEmployeeId || !admissionDate || !vacationStartDate || !vacationEndDate || baseSalary <= 0)) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    if (calculationScope !== 'individual' && employees.length === 0) {
      toast({
        title: 'Nenhum funcionário',
        description: 'Nenhum funcionário encontrado para o escopo selecionado.',
        variant: 'destructive',
      });
      return;
    }

    setIsCalculating(true);

    try {
      if (calculationScope === 'individual') {
        // Cálculo individual
        const employee = employees.find(emp => emp.id === selectedEmployeeId);
        if (!employee) throw new Error('Funcionário não encontrado');

        const calculation = calculateSingleVacation(employee, admissionDate, vacationStartDate, vacationEndDate, vacationDays, baseSalary, includePecuniaryAllowance, pecuniaryDays);
        setCalculations(prev => [calculation, ...prev]);
        
        toast({
          title: 'Cálculo concluído',
          description: `Férias calculadas para ${employee.name}`,
        });

        if (onCalculationComplete) {
          onCalculationComplete([calculation]);
        }
      } else {
        // Cálculo em lote
        const bulkCalculations = employees.map(employee => 
          calculateSingleVacation(employee, employee.admissionDate, vacationStartDate, vacationEndDate, vacationDays, employee.salary, includePecuniaryAllowance, pecuniaryDays)
        );

        setCalculations(prev => [...bulkCalculations, ...prev]);
        
        toast({
          title: 'Cálculo em lote concluído',
          description: `Férias calculadas para ${employees.length} funcionários`,
        });

        if (onCalculationComplete) {
          onCalculationComplete(bulkCalculations);
        }
      }

    } catch (error) {
      toast({
        title: 'Erro no cálculo',
        description: 'Erro ao calcular férias. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const calculateBulkVacations = async () => {
    setIsCalculating(true);
    
    try {
      // Simular cálculo em lote
      const bulkCalculations: VacationCalculation[] = employees.map(employee => {
        const workingDaysInYear = 365; // Simplificado
        const proportionalVacation = 30;
        const dailySalary = employee.salary / 30;
        const vacationValue = 30 * dailySalary;
        const constitutionalThird = vacationValue / 3;
        const grossValue = vacationValue + constitutionalThird;
        const inss = Math.min(grossValue * 0.11, 828.39);
        const irrf = grossValue > 1903.98 ? (grossValue - 1903.98) * 0.075 : 0;
        const fgts = grossValue * 0.08;
        const netValue = grossValue - inss - irrf;

        return {
          id: `bulk-vacation-${employee.id}-${Date.now()}`,
          employeeId: employee.id,
          employeeName: employee.name,
          admissionDate: employee.admissionDate,
          vacationStartDate: '2024-12-01',
          vacationEndDate: '2024-12-30',
          workingDays: workingDaysInYear,
          vacationDays: 30,
          proportionalVacation,
          constitutionalThird,
          pecuniaryAllowance: 0,
          grossValue,
          deductions: { inss, irrf, fgts },
          netValue,
          status: 'calculated' as const
        };
      });

      setCalculations(prev => [...bulkCalculations, ...prev]);
      
      toast({
        title: 'Cálculo em lote concluído',
        description: `Férias calculadas para ${employees.length} funcionários`,
      });

      if (onCalculationComplete) {
        onCalculationComplete(bulkCalculations);
      }

    } catch (error) {
      toast({
        title: 'Erro no cálculo em lote',
        description: 'Erro ao calcular férias em lote.',
        variant: 'destructive',
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const deleteCalculation = (id: string) => {
    setCalculations(prev => prev.filter(calc => calc.id !== id));
    toast({
      title: 'Cálculo removido',
      description: 'Cálculo de férias removido com sucesso.',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      calculated: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      error: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status === 'calculated' ? 'Calculado' : status === 'pending' ? 'Pendente' : 'Erro'}
      </Badge>
    );
  };

  const totalGrossValue = calculations.reduce((sum, calc) => sum + calc.grossValue, 0);
  const totalNetValue = calculations.reduce((sum, calc) => sum + calc.netValue, 0);
  const totalDeductions = totalGrossValue - totalNetValue;

  return (
    <div className="space-y-6">
      {/* Formulário de Cálculo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Cálculo de Férias
          </CardTitle>
          <CardDescription>
            Calcule férias proporcionais, 1/3 constitucional e abono pecuniário
            {calculationScope === 'company' && ` - ${employees.length} funcionários da empresa`}
            {calculationScope === 'cost_center' && selectedCostCenter && ` - ${employees.length} funcionários do centro de custo ${selectedCostCenter}`}
            {calculationScope === 'individual' && selectedEmployeeProp && ` - Funcionário individual`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employee">Funcionário *</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - {formatCurrency(employee.salary)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="admissionDate">Data de Admissão *</Label>
              <Input
                id="admissionDate"
                type="date"
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="vacationStart">Início das Férias *</Label>
              <Input
                id="vacationStart"
                type="date"
                value={vacationStartDate}
                onChange={(e) => setVacationStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="vacationEnd">Fim das Férias *</Label>
              <Input
                id="vacationEnd"
                type="date"
                value={vacationEndDate}
                onChange={(e) => setVacationEndDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="vacationDays">Dias de Férias</Label>
              <Input
                id="vacationDays"
                type="number"
                min="1"
                max="30"
                value={vacationDays}
                onChange={(e) => setVacationDays(parseInt(e.target.value) || 30)}
              />
            </div>

            <div>
              <Label htmlFor="baseSalary">Salário Base *</Label>
              <Input
                id="baseSalary"
                type="number"
                step="0.01"
                value={baseSalary}
                onChange={(e) => setBaseSalary(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includePecuniary"
                checked={includePecuniaryAllowance}
                onChange={(e) => setIncludePecuniaryAllowance(e.target.checked)}
              />
              <Label htmlFor="includePecuniary">Incluir Abono Pecuniário</Label>
            </div>
            
            {includePecuniaryAllowance && (
              <div>
                <Label htmlFor="pecuniaryDays">Dias de Abono (máx. 10)</Label>
                <Input
                  id="pecuniaryDays"
                  type="number"
                  min="1"
                  max="10"
                  value={pecuniaryDays}
                  onChange={(e) => setPecuniaryDays(Math.min(parseInt(e.target.value) || 0, 10))}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={calculateVacation} 
              disabled={isCalculating}
              className="flex-1"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {isCalculating ? 'Calculando...' : 
                calculationScope === 'individual' ? 'Calcular Férias' :
                calculationScope === 'cost_center' ? `Calcular Férias - ${employees.length} funcionários` :
                `Calcular Férias - ${employees.length} funcionários da empresa`
              }
            </Button>
            
            {calculationScope === 'individual' && (
              <Button 
                onClick={calculateBulkVacations} 
                disabled={isCalculating}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Calcular Todos
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resumo dos Cálculos */}
      {calculations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Valor Bruto Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalGrossValue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Descontos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                -{formatCurrency(totalDeductions)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Valor Líquido Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalNetValue)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Resultados */}
      {calculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados dos Cálculos</CardTitle>
            <CardDescription>
              {calculations.length} cálculo(s) de férias realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead>Valor Bruto</TableHead>
                  <TableHead>Descontos</TableHead>
                  <TableHead>Valor Líquido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculations.map((calculation) => (
                  <TableRow key={calculation.id}>
                    <TableCell className="font-medium">
                      {calculation.employeeName}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(calculation.vacationStartDate).toLocaleDateString('pt-BR')}</div>
                        <div className="text-muted-foreground">
                          até {new Date(calculation.vacationEndDate).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{calculation.vacationDays} dias</div>
                        {calculation.pecuniaryAllowance > 0 && (
                          <div className="text-muted-foreground">
                            +{pecuniaryDays} abono
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {formatCurrency(calculation.grossValue)}
                    </TableCell>
                    <TableCell className="text-red-600">
                      <div className="text-sm">
                        <div>INSS: {formatCurrency(calculation.deductions.inss)}</div>
                        <div>IRRF: {formatCurrency(calculation.deductions.irrf)}</div>
                        <div>FGTS: {formatCurrency(calculation.deductions.fgts)}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-blue-600 font-bold">
                      {formatCurrency(calculation.netValue)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(calculation.status)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCalculation(calculation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
