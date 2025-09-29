import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Loader2, FileText, DollarSign, Percent } from 'lucide-react';
import { Employee } from '@/integrations/supabase/rh-types';

export interface EmployeeFiscalProps {
  employeeId: string;
  employee?: Employee;
  loading?: boolean;
  className?: string;
}

interface FiscalCalculation {
  salarioBruto: number;
  inss: number;
  irrf: number;
  fgts: number;
  salarioLiquido: number;
  dependentesIR: number;
  baseCalculoIR: number;
  aliquotaIR: number;
  deducaoIR: number;
}

export function EmployeeFiscal({
  employeeId,
  employee,
  loading = false,
  className = '',
}: EmployeeFiscalProps) {
  const [calculations, setCalculations] = useState<FiscalCalculation | null>(null);
  const [salarioBruto, setSalarioBruto] = useState<number>(employee?.salario_base || 0);
  const [dependentesIR, setDependentesIR] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);

  // Função para calcular INSS
  const calcularINSS = (salario: number): { valor: number; aliquota: number } => {
    const faixasINSS = [
      { limite: 1412.00, aliquota: 0.075 },
      { limite: 2666.68, aliquota: 0.09 },
      { limite: 4000.03, aliquota: 0.12 },
      { limite: 7786.02, aliquota: 0.14 }
    ];

    let valorINSS = 0;
    let aliquota = 0;

    for (const faixa of faixasINSS) {
      if (salario <= faixa.limite) {
        valorINSS = salario * faixa.aliquota;
        aliquota = faixa.aliquota;
        break;
      } else {
        valorINSS += faixa.limite * faixa.aliquota;
        aliquota = faixa.aliquota;
      }
    }

    return { valor: Math.min(valorINSS, 908.85), aliquota };
  };

  // Função para calcular IRRF
  const calcularIRRF = (salario: number, inss: number, dependentes: number): { valor: number; aliquota: number; deducao: number; baseCalculo: number } => {
    const deducaoPorDependente = 189.59;
    const baseCalculo = Math.max(0, salario - inss - (dependentes * deducaoPorDependente));

    const faixasIR = [
      { limite: 2112.00, aliquota: 0, deducao: 0 },
      { limite: 2826.65, aliquota: 0.075, deducao: 158.40 },
      { limite: 3751.05, aliquota: 0.15, deducao: 370.40 },
      { limite: 4664.68, aliquota: 0.225, deducao: 651.73 },
      { limite: Infinity, aliquota: 0.275, deducao: 884.96 }
    ];

    let aliquota = 0;
    let deducao = 0;

    for (const faixa of faixasIR) {
      if (baseCalculo <= faixa.limite) {
        aliquota = faixa.aliquota;
        deducao = faixa.deducao;
        break;
      }
    }

    const valorIR = Math.max(0, (baseCalculo * aliquota) - deducao);

    return { valor: valorIR, aliquota, deducao, baseCalculo };
  };

  // Função para calcular FGTS
  const calcularFGTS = (salario: number): number => {
    return salario * 0.08; // 8% do salário
  };

  // Função principal de cálculo
  const calcularFiscal = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      const inssResult = calcularINSS(salarioBruto);
      const irrfResult = calcularIRRF(salarioBruto, inssResult.valor, dependentesIR);
      const fgts = calcularFGTS(salarioBruto);
      const salarioLiquido = salarioBruto - inssResult.valor - irrfResult.valor;

      setCalculations({
        salarioBruto,
        inss: inssResult.valor,
        irrf: irrfResult.valor,
        fgts,
        salarioLiquido,
        dependentesIR,
        baseCalculoIR: irrfResult.baseCalculo,
        aliquotaIR: irrfResult.aliquota,
        deducaoIR: irrfResult.deducao,
      });
      
      setIsCalculating(false);
    }, 500);
  };

  // Calcular automaticamente quando os valores mudarem
  useEffect(() => {
    if (salarioBruto > 0) {
      calcularFiscal();
    }
  }, [salarioBruto, dependentesIR]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Cálculos Fiscais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Parâmetros de Entrada */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
          <div className="space-y-2">
            <Label htmlFor="salarioBruto">Salário Bruto</Label>
            <Input
              id="salarioBruto"
              type="number"
              step="0.01"
              min="0"
              value={salarioBruto}
              onChange={(e) => setSalarioBruto(parseFloat(e.target.value) || 0)}
              placeholder="0,00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dependentesIR">Dependentes para IR</Label>
            <Input
              id="dependentesIR"
              type="number"
              min="0"
              value={dependentesIR}
              onChange={(e) => setDependentesIR(parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>

        {/* Resultados dos Cálculos */}
        {calculations && (
          <div className="space-y-4">
            {/* Resumo Principal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Salário Líquido</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(calculations.salarioLiquido)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Total Descontos</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(calculations.inss + calculations.irrf)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">FGTS</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(calculations.fgts)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detalhamento dos Impostos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* INSS */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">INSS</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Valor:</span>
                    <span className="font-medium">{formatCurrency(calculations.inss)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Alíquota:</span>
                    <Badge variant="outline">{formatPercent(calculations.inss / calculations.salarioBruto)}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* IRRF */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">IRRF</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Valor:</span>
                    <span className="font-medium">{formatCurrency(calculations.irrf)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base de Cálculo:</span>
                    <span className="text-sm">{formatCurrency(calculations.baseCalculoIR)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Alíquota:</span>
                    <Badge variant="outline">{formatPercent(calculations.aliquotaIR)}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Dedução:</span>
                    <span className="text-sm">{formatCurrency(calculations.deducaoIR)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dependentes:</span>
                    <span className="text-sm">{calculations.dependentesIR}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumo Detalhado */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo Detalhado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Salário Bruto:</span>
                    <span className="font-medium">{formatCurrency(calculations.salarioBruto)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-red-600">(-) INSS:</span>
                    <span className="text-red-600 font-medium">-{formatCurrency(calculations.inss)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-red-600">(-) IRRF:</span>
                    <span className="text-red-600 font-medium">-{formatCurrency(calculations.irrf)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-blue-600">(+) FGTS (8%):</span>
                    <span className="text-blue-600 font-medium">+{formatCurrency(calculations.fgts)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-3">
                    <span className="font-semibold">Salário Líquido:</span>
                    <span className="font-bold text-green-600">{formatCurrency(calculations.salarioLiquido)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Observações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>• Os cálculos são baseados nas tabelas vigentes de 2024</p>
                  <p>• INSS: Alíquotas progressivas até o teto de R$ 908,85</p>
                  <p>• IRRF: Considera dedução de R$ 189,59 por dependente</p>
                  <p>• FGTS: 8% sobre o salário bruto (depositado pelo empregador)</p>
                  <p>• Valores podem variar conforme acordos coletivos e benefícios</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Estado de Carregamento */}
        {isCalculating && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Calculando impostos...</span>
          </div>
        )}

        {/* Estado Inicial */}
        {!calculations && !isCalculating && (
          <div className="text-center py-8 text-muted-foreground">
            <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Insira o salário bruto para calcular os impostos</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
