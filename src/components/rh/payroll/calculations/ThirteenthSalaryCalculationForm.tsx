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
  DollarSign, 
  Calculator, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Download,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ThirteenthSalaryCalculation {
  id: string;
  employeeId: string;
  employeeName: string;
  admissionDate: string;
  referenceYear: number;
  workingMonths: number;
  proportionalMonths: number;
  baseSalary: number;
  grossValue: number;
  deductions: {
    inss: number;
    irrf: number;
    fgts: number;
  };
  netValue: number;
  firstInstallment: number;
  secondInstallment: number;
  status: 'calculated' | 'pending' | 'error';
  paymentDate?: string;
}

interface ThirteenthSalaryCalculationFormProps {
  companyId: string;
  onCalculationComplete?: (result: ThirteenthSalaryCalculation[]) => void;
}

export function ThirteenthSalaryCalculationForm({ 
  companyId, 
  onCalculationComplete 
}: ThirteenthSalaryCalculationFormProps) {
  const [calculations, setCalculations] = useState<ThirteenthSalaryCalculation[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [referenceYear, setReferenceYear] = useState<number>(new Date().getFullYear());
  const [admissionDate, setAdmissionDate] = useState<string>('');
  const [baseSalary, setBaseSalary] = useState<number>(0);
  const [workingMonths, setWorkingMonths] = useState<number>(12);
  const [paymentType, setPaymentType] = useState<'full' | 'installments'>('installments');
  const [firstInstallmentDate, setFirstInstallmentDate] = useState<string>('');
  const [secondInstallmentDate, setSecondInstallmentDate] = useState<string>('');
  const { toast } = useToast();

  // Simular lista de funcionários (em produção viria de uma API)
  const employees = [
    { id: '1', name: 'João Silva', admissionDate: '2020-01-15', salary: 5000 },
    { id: '2', name: 'Maria Santos', admissionDate: '2019-03-20', salary: 4500 },
    { id: '3', name: 'Pedro Costa', admissionDate: '2021-06-10', salary: 3800 },
    { id: '4', name: 'Ana Oliveira', admissionDate: '2024-08-01', salary: 3200 },
  ];

  useEffect(() => {
    // Definir datas padrão para as parcelas
    const currentYear = new Date().getFullYear();
    setFirstInstallmentDate(`${currentYear}-11-30`);
    setSecondInstallmentDate(`${currentYear}-12-20`);
  }, []);

  const calculateWorkingMonths = (admissionDate: string, referenceYear: number) => {
    const admission = new Date(admissionDate);
    const yearStart = new Date(referenceYear, 0, 1);
    const yearEnd = new Date(referenceYear, 11, 31);
    
    const startDate = admission > yearStart ? admission : yearStart;
    const endDate = yearEnd;
    
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                  (endDate.getMonth() - startDate.getMonth()) + 1;
    
    return Math.max(1, Math.min(months, 12));
  };

  const calculateThirteenthSalary = () => {
    if (!selectedEmployee || !admissionDate || baseSalary <= 0) {
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

      // Calcular meses trabalhados
      const calculatedWorkingMonths = calculateWorkingMonths(admissionDate, referenceYear);
      const proportionalMonths = calculatedWorkingMonths;

      // Calcular 13º salário proporcional
      const grossValue = (baseSalary * proportionalMonths) / 12;

      // Calcular descontos
      const inss = Math.min(grossValue * 0.11, 828.39); // Teto INSS 2024
      const irrf = grossValue > 1903.98 ? (grossValue - 1903.98) * 0.075 : 0;
      const fgts = grossValue * 0.08;

      const deductions = { inss, irrf, fgts };
      const netValue = grossValue - inss - irrf;

      // Calcular parcelas
      const firstInstallment = paymentType === 'full' ? netValue : netValue * 0.5;
      const secondInstallment = paymentType === 'full' ? 0 : netValue * 0.5;

      const calculation: ThirteenthSalaryCalculation = {
        id: `thirteenth-${Date.now()}`,
        employeeId: selectedEmployee,
        employeeName: employee.name,
        admissionDate,
        referenceYear,
        workingMonths: calculatedWorkingMonths,
        proportionalMonths,
        baseSalary,
        grossValue,
        deductions,
        netValue,
        firstInstallment,
        secondInstallment,
        status: 'calculated'
      };

      setCalculations(prev => [calculation, ...prev]);
      
      toast({
        title: 'Cálculo concluído',
        description: `13º salário calculado para ${employee.name}`,
      });

      if (onCalculationComplete) {
        onCalculationComplete([calculation]);
      }

    } catch (error) {
      toast({
        title: 'Erro no cálculo',
        description: 'Erro ao calcular 13º salário. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const calculateBulkThirteenthSalary = async () => {
    setIsCalculating(true);
    
    try {
      const bulkCalculations: ThirteenthSalaryCalculation[] = employees.map(employee => {
        const calculatedWorkingMonths = calculateWorkingMonths(employee.admissionDate, referenceYear);
        const grossValue = (employee.salary * calculatedWorkingMonths) / 12;
        const inss = Math.min(grossValue * 0.11, 828.39);
        const irrf = grossValue > 1903.98 ? (grossValue - 1903.98) * 0.075 : 0;
        const fgts = grossValue * 0.08;
        const netValue = grossValue - inss - irrf;
        const firstInstallment = netValue * 0.5;
        const secondInstallment = netValue * 0.5;

        return {
          id: `bulk-thirteenth-${employee.id}-${Date.now()}`,
          employeeId: employee.id,
          employeeName: employee.name,
          admissionDate: employee.admissionDate,
          referenceYear,
          workingMonths: calculatedWorkingMonths,
          proportionalMonths: calculatedWorkingMonths,
          baseSalary: employee.salary,
          grossValue,
          deductions: { inss, irrf, fgts },
          netValue,
          firstInstallment,
          secondInstallment,
          status: 'calculated' as const
        };
      });

      setCalculations(prev => [...bulkCalculations, ...prev]);
      
      toast({
        title: 'Cálculo em lote concluído',
        description: `13º salário calculado para ${employees.length} funcionários`,
      });

      if (onCalculationComplete) {
        onCalculationComplete(bulkCalculations);
      }

    } catch (error) {
      toast({
        title: 'Erro no cálculo em lote',
        description: 'Erro ao calcular 13º salário em lote.',
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
      description: 'Cálculo de 13º salário removido com sucesso.',
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

    // Simular exportação
    const csvData = [
      ['Funcionário', 'Ano', 'Meses Trabalhados', 'Salário Base', 'Valor Bruto', 'INSS', 'IRRF', 'FGTS', 'Valor Líquido', '1ª Parcela', '2ª Parcela'],
      ...calculations.map(calc => [
        calc.employeeName,
        calc.referenceYear.toString(),
        calc.workingMonths.toString(),
        formatCurrency(calc.baseSalary),
        formatCurrency(calc.grossValue),
        formatCurrency(calc.deductions.inss),
        formatCurrency(calc.deductions.irrf),
        formatCurrency(calc.deductions.fgts),
        formatCurrency(calc.netValue),
        formatCurrency(calc.firstInstallment),
        formatCurrency(calc.secondInstallment)
      ])
    ];

    const csvContent = csvData.map(row => row.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `13_salario_${referenceYear}.csv`;
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
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Calendar },
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
  const totalFirstInstallment = calculations.reduce((sum, calc) => sum + calc.firstInstallment, 0);
  const totalSecondInstallment = calculations.reduce((sum, calc) => sum + calc.secondInstallment, 0);

  return (
    <div className="space-y-6">
      {/* Formulário de Cálculo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Cálculo de 13º Salário
          </CardTitle>
          <CardDescription>
            Calcule 13º salário proporcional e parcelas para funcionários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="referenceYear">Ano de Referência</Label>
              <Input
                id="referenceYear"
                type="number"
                min="2020"
                max="2030"
                value={referenceYear}
                onChange={(e) => setReferenceYear(parseInt(e.target.value) || new Date().getFullYear())}
              />
            </div>

            <div>
              <Label htmlFor="employee">Funcionário</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
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

            <div>
              <Label htmlFor="workingMonths">Meses Trabalhados</Label>
              <Input
                id="workingMonths"
                type="number"
                min="1"
                max="12"
                value={workingMonths}
                onChange={(e) => setWorkingMonths(parseInt(e.target.value) || 12)}
              />
            </div>

            <div>
              <Label htmlFor="paymentType">Forma de Pagamento</Label>
              <Select value={paymentType} onValueChange={(value: 'full' | 'installments') => setPaymentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="installments">Parcelado (1ª e 2ª parcela)</SelectItem>
                  <SelectItem value="full">À vista</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {paymentType === 'installments' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstInstallmentDate">Data da 1ª Parcela</Label>
                <Input
                  id="firstInstallmentDate"
                  type="date"
                  value={firstInstallmentDate}
                  onChange={(e) => setFirstInstallmentDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="secondInstallmentDate">Data da 2ª Parcela</Label>
                <Input
                  id="secondInstallmentDate"
                  type="date"
                  value={secondInstallmentDate}
                  onChange={(e) => setSecondInstallmentDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={calculateThirteenthSalary} 
              disabled={isCalculating}
              className="flex-1"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {isCalculating ? 'Calculando...' : 'Calcular 13º Salário'}
            </Button>
            
            <Button 
              onClick={calculateBulkThirteenthSalary} 
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
              <CardTitle className="text-sm font-medium">1ª Parcela</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalFirstInstallment)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">2ª Parcela</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(totalSecondInstallment)}
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
                  {calculations.length} cálculo(s) de 13º salário realizados
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
                  <TableHead>Ano</TableHead>
                  <TableHead>Meses</TableHead>
                  <TableHead>Salário Base</TableHead>
                  <TableHead>Valor Bruto</TableHead>
                  <TableHead>Descontos</TableHead>
                  <TableHead>1ª Parcela</TableHead>
                  <TableHead>2ª Parcela</TableHead>
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
                      {calculation.referenceYear}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{calculation.workingMonths} meses</div>
                        <div className="text-muted-foreground">
                          {calculation.proportionalMonths} proporcionais
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(calculation.baseSalary)}
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
                    <TableCell className="text-blue-600 font-medium">
                      {formatCurrency(calculation.firstInstallment)}
                    </TableCell>
                    <TableCell className="text-purple-600 font-medium">
                      {formatCurrency(calculation.secondInstallment)}
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
