import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePayrollCalculations } from '@/hooks/rh/payroll/usePayrollCalculations';
import { useEmployees } from '@/hooks/rh/useEmployees';
import { Calendar, Clock, DollarSign, Users, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const overtimeCalculationSchema = z.object({
  employeeId: z.string().min(1, 'Selecione um funcionário'),
  period: z.string().min(1, 'Selecione um período'),
});

type OvertimeCalculationFormData = z.infer<typeof overtimeCalculationSchema>;

interface OvertimeCalculationFormProps {
  onCalculationComplete?: (result: any) => void;
  onCancel?: () => void;
  companyId: string;
  calculationScope?: 'company' | 'cost_center' | 'individual';
  selectedCostCenter?: string;
  selectedEmployee?: string;
}

export function OvertimeCalculationForm({ 
  onCalculationComplete, 
  onCancel, 
  companyId,
  calculationScope = 'individual',
  selectedCostCenter,
  selectedEmployee: selectedEmployeeProp
}: OvertimeCalculationFormProps) {
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  
  const { employees, isLoading: employeesLoading } = useEmployees(companyId);
  const { 
    calculateOvertime, 
    loading: calculationLoading, 
    error: calculationError 
  } = usePayrollCalculations();

  // Filtrar funcionários baseado no escopo
  const getFilteredEmployees = () => {
    if (!employees) return [];
    
    if (calculationScope === 'individual' && selectedEmployeeProp) {
      return employees.filter(emp => emp.id === selectedEmployeeProp);
    }
    if (calculationScope === 'cost_center' && selectedCostCenter) {
      // Simular centro de custo baseado no nome do funcionário
      return employees.filter(emp => {
        const name = emp.nome.toLowerCase();
        if (selectedCostCenter === 'rh') return name.includes('joão') || name.includes('maria');
        if (selectedCostCenter === 'financeiro') return name.includes('pedro') || name.includes('ana');
        if (selectedCostCenter === 'vendas') return name.includes('carlos');
        return false;
      });
    }
    return employees; // company scope
  };

  const filteredEmployees = getFilteredEmployees();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<OvertimeCalculationFormData>({
    resolver: zodResolver(overtimeCalculationSchema),
    mode: 'onChange'
  });

  const watchedEmployeeId = watch('employeeId');
  const watchedPeriod = watch('period');

  // Atualizar funcionário selecionado
  useEffect(() => {
    if (watchedEmployeeId && filteredEmployees) {
      const employee = filteredEmployees.find(emp => emp.id === watchedEmployeeId);
      setSelectedEmployee(employee);
    }
  }, [watchedEmployeeId, filteredEmployees]);

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

  const onSubmit = async (data: OvertimeCalculationFormData) => {
    try {
      if (calculationScope === 'individual') {
        // Cálculo individual
        const result = await calculateOvertime(data.employeeId, data.period);
        
        if (result) {
          setCalculationResult(result);
          onCalculationComplete?.(result);
        }
      } else {
        // Cálculo em lote
        const bulkResults = [];
        
        for (const employee of filteredEmployees) {
          try {
            const result = await calculateOvertime(employee.id, data.period);
            if (result) {
              bulkResults.push({
                employee: employee,
                calculation: result
              });
            }
          } catch (error) {
            console.error(`Erro ao calcular horas extras para ${employee.nome}:`, error);
          }
        }
        
        setCalculationResult({
          type: 'bulk',
          results: bulkResults,
          period: data.period,
          totalEmployees: filteredEmployees.length,
          processedEmployees: bulkResults.length
        });
        
        onCalculationComplete?.(bulkResults);
      }
    } catch (error) {
      console.error('Erro ao calcular horas extras:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(2)}h`;
  };

  if (employeesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2">Carregando funcionários...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Cálculo de Horas Extras
          </CardTitle>
          <CardDescription>
            Calcule horas extras, DSR e adicional noturno
            {calculationScope === 'company' && ` - ${filteredEmployees.length} funcionários da empresa`}
            {calculationScope === 'cost_center' && selectedCostCenter && ` - ${filteredEmployees.length} funcionários do centro de custo ${selectedCostCenter}`}
            {calculationScope === 'individual' && selectedEmployeeProp && ` - Funcionário individual`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Seleção de Funcionário */}
              <div className="space-y-2">
                <Label htmlFor="employeeId">Funcionário *</Label>
                <Select onValueChange={(value) => setValue('employeeId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEmployees?.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{employee.nome}</span>
                          {employee.matricula && (
                            <Badge variant="outline" className="text-xs">
                              {employee.matricula}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.employeeId && (
                  <p className="text-sm text-destructive">{errors.employeeId.message}</p>
                )}
              </div>

              {/* Seleção de Período */}
              <div className="space-y-2">
                <Label htmlFor="period">Período *</Label>
                <Select onValueChange={(value) => setValue('period', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um período" />
                  </SelectTrigger>
                  <SelectContent>
                    {generatePeriodOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.period && (
                  <p className="text-sm text-destructive">{errors.period.message}</p>
                )}
              </div>
            </div>

            {/* Informações do Funcionário Selecionado */}
            {selectedEmployee && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Funcionário Selecionado</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p className="font-medium">{selectedEmployee.nome}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Matrícula:</span>
                    <p className="font-medium">{selectedEmployee.matricula || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CPF:</span>
                    <p className="font-medium">{selectedEmployee.cpf || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={selectedEmployee.status === 'ativo' ? 'default' : 'secondary'}>
                      {selectedEmployee.status}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex justify-end gap-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={!isValid || calculationLoading}
                className="min-w-[120px]"
              >
                {calculationLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Calculando...
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    {calculationScope === 'individual' ? 'Calcular' : 
                     calculationScope === 'cost_center' ? `Calcular - ${filteredEmployees.length} funcionários` :
                     `Calcular - ${filteredEmployees.length} funcionários da empresa`}
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Erro de Cálculo */}
          {calculationError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {calculationError}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Resultado do Cálculo */}
      {calculationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {calculationResult.type === 'bulk' ? 'Resultado do Cálculo em Lote' : 'Resultado do Cálculo'}
            </CardTitle>
            <CardDescription>
              {calculationResult.type === 'bulk' 
                ? `Processados ${calculationResult.processedEmployees} de ${calculationResult.totalEmployees} funcionários`
                : 'Detalhamento das horas extras calculadas'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {calculationResult.type === 'bulk' ? (
              // Resultado em lote
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Funcionários Processados</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {calculationResult.processedEmployees}
                    </p>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-900">Total de Horas Extras</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900">
                      {formatHours(calculationResult.results.reduce((sum, r) => sum + r.calculation.overtimeHours, 0))}
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Valor Total</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(calculationResult.results.reduce((sum, r) => sum + r.calculation.totalOvertimeValue, 0))}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Detalhamento por Funcionário</h4>
                  <div className="space-y-2">
                    {calculationResult.results.map((result, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <span className="font-medium">{result.employee.nome}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {formatHours(result.calculation.overtimeHours)} - {formatCurrency(result.calculation.totalOvertimeValue)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Resultado individual
              <div className="space-y-4">
                {/* Resumo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Horas Regulares</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatHours(calculationResult.regularHours)}
                    </p>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-900">Horas Extras</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900">
                      {formatHours(calculationResult.overtimeHours)}
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Valor Total</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(calculationResult.totalOvertimeValue)}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Detalhamento */}
                <div className="space-y-3">
                  <h4 className="font-medium">Detalhamento dos Valores</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Horas Extras (50%):</span>
                        <span className="font-medium">{formatCurrency(calculationResult.overtimeValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">DSR:</span>
                        <span className="font-medium">{formatCurrency(calculationResult.dsrValue)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Adicional Noturno:</span>
                        <span className="font-medium">{formatCurrency(calculationResult.nightShiftValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Horas Noturnas:</span>
                        <span className="font-medium">{formatHours(calculationResult.nightShiftHours)}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center bg-primary/5 p-3 rounded-lg">
                    <span className="text-lg font-semibold">Total das Horas Extras:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(calculationResult.totalOvertimeValue)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
