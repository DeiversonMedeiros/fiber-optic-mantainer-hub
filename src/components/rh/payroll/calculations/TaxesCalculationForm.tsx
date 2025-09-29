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
  Calculator, 
  DollarSign, 
  Percent,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Download,
  FileText,
  TrendingUp,
  Shield,
  Receipt
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TaxCalculation {
  id: string;
  employeeId: string;
  employeeName: string;
  grossSalary: number;
  deductions: {
    inss: {
      base: number;
      rate: number;
      value: number;
      bracket: string;
    };
    irrf: {
      base: number;
      rate: number;
      value: number;
      bracket: string;
      dependents: number;
      deduction: number;
    };
    fgts: {
      base: number;
      rate: number;
      value: number;
    };
    unionContribution: {
      base: number;
      rate: number;
      value: number;
    };
  };
  totalDeductions: number;
  netSalary: number;
  status: 'calculated' | 'pending' | 'error';
}

interface TaxesCalculationFormProps {
  companyId: string;
  onCalculationComplete?: (result: TaxCalculation[]) => void;
}

// Tabelas de INSS 2024
const INSS_BRACKETS = [
  { min: 0, max: 1320, rate: 0.075, description: 'Até R$ 1.320,00' },
  { min: 1320.01, max: 2571.29, rate: 0.09, description: 'De R$ 1.320,01 até R$ 2.571,29' },
  { min: 2571.30, max: 3856.94, rate: 0.12, description: 'De R$ 2.571,30 até R$ 3.856,94' },
  { min: 3856.95, max: 7507.49, rate: 0.14, description: 'De R$ 3.856,95 até R$ 7.507,49' }
];

// Tabelas de IRRF 2024
const IRRF_BRACKETS = [
  { min: 0, max: 2112, rate: 0, description: 'Até R$ 2.112,00' },
  { min: 2112.01, max: 2826.65, rate: 0.075, description: 'De R$ 2.112,01 até R$ 2.826,65' },
  { min: 2826.66, max: 3751.05, rate: 0.15, description: 'De R$ 2.826,66 até R$ 3.751,05' },
  { min: 3751.06, max: 4664.68, rate: 0.225, description: 'De R$ 3.751,06 até R$ 4.664,68' },
  { min: 4664.69, max: Infinity, rate: 0.275, description: 'Acima de R$ 4.664,68' }
];

export function TaxesCalculationForm({ 
  companyId, 
  onCalculationComplete 
}: TaxesCalculationFormProps) {
  const [calculations, setCalculations] = useState<TaxCalculation[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [grossSalary, setGrossSalary] = useState<number>(0);
  const [dependents, setDependents] = useState<number>(0);
  const [unionContribution, setUnionContribution] = useState<boolean>(false);
  const [unionRate, setUnionRate] = useState<number>(1.0);
  const [otherDeductions, setOtherDeductions] = useState<number>(0);
  const { toast } = useToast();

  // Simular lista de funcionários (em produção viria de uma API)
  const employees = [
    { id: '1', name: 'João Silva', salary: 5000, dependents: 2 },
    { id: '2', name: 'Maria Santos', salary: 4500, dependents: 1 },
    { id: '3', name: 'Pedro Costa', salary: 3800, dependents: 0 },
    { id: '4', name: 'Ana Oliveira', salary: 3200, dependents: 3 },
    { id: '5', name: 'Carlos Lima', salary: 8000, dependents: 1 },
  ];

  const calculateINSS = (salary: number) => {
    let totalINSS = 0;
    let currentBracket = '';

    for (const bracket of INSS_BRACKETS) {
      if (salary > bracket.min) {
        const taxableAmount = Math.min(salary, bracket.max) - bracket.min;
        const bracketValue = taxableAmount * bracket.rate;
        totalINSS += bracketValue;
        currentBracket = bracket.description;
      }
    }

    return {
      base: salary,
      rate: totalINSS / salary,
      value: totalINSS,
      bracket: currentBracket
    };
  };

  const calculateIRRF = (salary: number, dependents: number) => {
    const dependentDeduction = dependents * 189.59; // Valor por dependente 2024
    const baseSalary = salary - dependentDeduction;
    
    let irrfValue = 0;
    let currentBracket = '';

    for (const bracket of IRRF_BRACKETS) {
      if (baseSalary > bracket.min) {
        const taxableAmount = Math.min(baseSalary, bracket.max) - bracket.min;
        const bracketValue = taxableAmount * bracket.rate;
        irrfValue += bracketValue;
        currentBracket = bracket.description;
      }
    }

    return {
      base: baseSalary,
      rate: irrfValue / salary,
      value: irrfValue,
      bracket: currentBracket,
      dependents,
      deduction: dependentDeduction
    };
  };

  const calculateFGTS = (salary: number) => {
    return {
      base: salary,
      rate: 0.08,
      value: salary * 0.08
    };
  };

  const calculateUnionContribution = (salary: number, rate: number) => {
    return {
      base: salary,
      rate: rate / 100,
      value: salary * (rate / 100)
    };
  };

  const calculateTaxes = () => {
    if (!selectedEmployee || grossSalary <= 0) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setIsCalculating(true);

    try {
      const employee = employees.find(emp => emp.id === selectedEmployee);
      if (!employee) throw new Error('Funcionário não encontrado');

      // Calcular INSS
      const inss = calculateINSS(grossSalary);

      // Calcular IRRF
      const irrf = calculateIRRF(grossSalary, dependents);

      // Calcular FGTS
      const fgts = calculateFGTS(grossSalary);

      // Calcular contribuição sindical
      const unionContributionValue = unionContribution 
        ? calculateUnionContribution(grossSalary, unionRate)
        : { base: grossSalary, rate: 0, value: 0 };

      const totalDeductions = inss.value + irrf.value + otherDeductions + unionContributionValue.value;
      const netSalary = grossSalary - totalDeductions;

      const calculation: TaxCalculation = {
        id: `tax-${Date.now()}`,
        employeeId: selectedEmployee,
        employeeName: employee.name,
        grossSalary,
        deductions: {
          inss,
          irrf,
          fgts,
          unionContribution: unionContributionValue
        },
        totalDeductions,
        netSalary,
        status: 'calculated'
      };

      setCalculations(prev => [calculation, ...prev]);
      
      toast({
        title: 'Cálculo concluído',
        description: `Impostos calculados para ${employee.name}`,
      });

      if (onCalculationComplete) {
        onCalculationComplete([calculation]);
      }

    } catch (error) {
      toast({
        title: 'Erro no cálculo',
        description: 'Erro ao calcular impostos. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const calculateBulkTaxes = async () => {
    setIsCalculating(true);
    
    try {
      const bulkCalculations: TaxCalculation[] = employees.map(employee => {
        const inss = calculateINSS(employee.salary);
        const irrf = calculateIRRF(employee.salary, employee.dependents);
        const fgts = calculateFGTS(employee.salary);
        const unionContributionValue = unionContribution 
          ? calculateUnionContribution(employee.salary, unionRate)
          : { base: employee.salary, rate: 0, value: 0 };

        const totalDeductions = inss.value + irrf.value + otherDeductions + unionContributionValue.value;
        const netSalary = employee.salary - totalDeductions;

        return {
          id: `bulk-tax-${employee.id}-${Date.now()}`,
          employeeId: employee.id,
          employeeName: employee.name,
          grossSalary: employee.salary,
          deductions: {
            inss,
            irrf,
            fgts,
            unionContribution: unionContributionValue
          },
          totalDeductions,
          netSalary,
          status: 'calculated' as const
        };
      });

      setCalculations(prev => [...bulkCalculations, ...prev]);
      
      toast({
        title: 'Cálculo em lote concluído',
        description: `Impostos calculados para ${employees.length} funcionários`,
      });

      if (onCalculationComplete) {
        onCalculationComplete(bulkCalculations);
      }

    } catch (error) {
      toast({
        title: 'Erro no cálculo em lote',
        description: 'Erro ao calcular impostos em lote.',
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
      description: 'Cálculo de impostos removido com sucesso.',
    });
  };

  const exportCalculations = () => {
    if (calculations.length === 0) {
      toast({
        title: 'Nenhum cálculo',
        description: 'Não há cálculos para exportar.',
        variant: 'destructive',
      });
      return;
    }

    const csvData = [
      ['Funcionário', 'Salário Bruto', 'INSS', 'IRRF', 'FGTS', 'Sindical', 'Outros', 'Total Descontos', 'Salário Líquido'],
      ...calculations.map(calc => [
        calc.employeeName,
        formatCurrency(calc.grossSalary),
        formatCurrency(calc.deductions.inss.value),
        formatCurrency(calc.deductions.irrf.value),
        formatCurrency(calc.deductions.fgts.value),
        formatCurrency(calc.deductions.unionContribution.value),
        formatCurrency(otherDeductions),
        formatCurrency(calc.totalDeductions),
        formatCurrency(calc.netSalary)
      ])
    ];

    const csvContent = csvData.map(row => row.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `impostos_${new Date().getFullYear()}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Exportação concluída',
      description: 'Arquivo CSV gerado com sucesso.',
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
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Calculator },
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

  const totalGrossSalary = calculations.reduce((sum, calc) => sum + calc.grossSalary, 0);
  const totalDeductions = calculations.reduce((sum, calc) => sum + calc.totalDeductions, 0);
  const totalNetSalary = calculations.reduce((sum, calc) => sum + calc.netSalary, 0);
  const totalINSS = calculations.reduce((sum, calc) => sum + calc.deductions.inss.value, 0);
  const totalIRRF = calculations.reduce((sum, calc) => sum + calc.deductions.irrf.value, 0);
  const totalFGTS = calculations.reduce((sum, calc) => sum + calc.deductions.fgts.value, 0);

  return (
    <div className="space-y-6">
      {/* Formulário de Cálculo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Cálculo de Impostos
          </CardTitle>
          <CardDescription>
            Calcule INSS, IRRF, FGTS e contribuições sindicais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employee">Funcionário</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} - {formatCurrency(employee.salary)} ({employee.dependents} dep.)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="grossSalary">Salário Bruto *</Label>
              <Input
                id="grossSalary"
                type="number"
                step="0.01"
                value={grossSalary}
                onChange={(e) => setGrossSalary(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
              />
            </div>

            <div>
              <Label htmlFor="dependents">Número de Dependentes</Label>
              <Input
                id="dependents"
                type="number"
                min="0"
                value={dependents}
                onChange={(e) => setDependents(parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label htmlFor="otherDeductions">Outras Deduções</Label>
              <Input
                id="otherDeductions"
                type="number"
                step="0.01"
                value={otherDeductions}
                onChange={(e) => setOtherDeductions(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="unionContribution"
                checked={unionContribution}
                onChange={(e) => setUnionContribution(e.target.checked)}
              />
              <Label htmlFor="unionContribution">Incluir Contribuição Sindical</Label>
            </div>
            
            {unionContribution && (
              <div>
                <Label htmlFor="unionRate">Taxa Sindical (%)</Label>
                <Input
                  id="unionRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={unionRate}
                  onChange={(e) => setUnionRate(parseFloat(e.target.value) || 0)}
                  placeholder="1,0"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={calculateTaxes} 
              disabled={isCalculating}
              className="flex-1"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {isCalculating ? 'Calculando...' : 'Calcular Impostos'}
            </Button>
            
            <Button 
              onClick={calculateBulkTaxes} 
              disabled={isCalculating}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Calcular Todos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo dos Cálculos */}
      {calculations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Salário Bruto Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalGrossSalary)}
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
              <CardTitle className="text-sm font-medium">INSS Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(totalINSS)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Salário Líquido Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalNetSalary)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Resultados */}
      {calculations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Resultados dos Cálculos</CardTitle>
                <CardDescription>
                  {calculations.length} cálculo(s) de impostos realizados
                </CardDescription>
              </div>
              <Button onClick={exportCalculations} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Salário Bruto</TableHead>
                  <TableHead>INSS</TableHead>
                  <TableHead>IRRF</TableHead>
                  <TableHead>FGTS</TableHead>
                  <TableHead>Sindical</TableHead>
                  <TableHead>Outros</TableHead>
                  <TableHead>Total Descontos</TableHead>
                  <TableHead>Salário Líquido</TableHead>
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
                    <TableCell className="font-medium">
                      {formatCurrency(calculation.grossSalary)}
                    </TableCell>
                    <TableCell className="text-orange-600">
                      <div className="text-sm">
                        <div>{formatCurrency(calculation.deductions.inss.value)}</div>
                        <div className="text-muted-foreground">
                          ({calculation.deductions.inss.rate.toFixed(2)}%)
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-red-600">
                      <div className="text-sm">
                        <div>{formatCurrency(calculation.deductions.irrf.value)}</div>
                        <div className="text-muted-foreground">
                          ({calculation.deductions.irrf.rate.toFixed(2)}%)
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-blue-600">
                      <div className="text-sm">
                        <div>{formatCurrency(calculation.deductions.fgts.value)}</div>
                        <div className="text-muted-foreground">
                          (8,00%)
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-purple-600">
                      {formatCurrency(calculation.deductions.unionContribution.value)}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {formatCurrency(otherDeductions)}
                    </TableCell>
                    <TableCell className="text-red-600 font-medium">
                      {formatCurrency(calculation.totalDeductions)}
                    </TableCell>
                    <TableCell className="text-green-600 font-bold">
                      {formatCurrency(calculation.netSalary)}
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

      {/* Informações sobre as Tabelas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Tabela INSS 2024
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {INSS_BRACKETS.map((bracket, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{bracket.description}</span>
                  <span className="font-medium">{(bracket.rate * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Tabela IRRF 2024
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {IRRF_BRACKETS.map((bracket, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{bracket.description}</span>
                  <span className="font-medium">{(bracket.rate * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
