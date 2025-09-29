import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EmployeeDiscount, EmployeeDiscountInsert, EmployeeDiscountUpdate, RhStatus } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calculator, AlertTriangle, CheckCircle, DollarSign, Calendar, FileText } from 'lucide-react';

const discountSchema = z.object({
  tipo_desconto: z.enum(['multa_transito', 'emprestimo', 'avaria_equipamento', 'perda_equipamento', 'outros']),
  descricao: z.string().min(1, 'Descrição é obrigatória').max(500, 'Descrição muito longa'),
  valor_total: z.number().min(0.01, 'Valor total deve ser maior que zero'),
  quantidade_parcelas: z.number().min(1, 'Deve ter pelo menos 1 parcela').max(60, 'Máximo 60 parcelas'),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_vencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  observacoes: z.string().optional(),
  status: z.enum(['ativo', 'suspenso', 'cancelado', 'quitado']).default('ativo'),
});

type DiscountFormData = z.infer<typeof discountSchema>;

interface EmployeeDiscountsFormProps {
  initialData?: EmployeeDiscount;
  onSubmit: (data: EmployeeDiscountInsert | EmployeeDiscountUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
  employeeId: string;
  companyId: string;
  employeeSalary: number;
}

const tipoDescontoLabels = {
  multa_transito: 'Multa de Trânsito',
  emprestimo: 'Empréstimo',
  avaria_equipamento: 'Avaria de Equipamento',
  perda_equipamento: 'Perda de Equipamento',
  outros: 'Outros'
};

const statusLabels = {
  ativo: 'Ativo',
  suspenso: 'Suspenso',
  cancelado: 'Cancelado',
  quitado: 'Quitado'
};

export function EmployeeDiscountsForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  employeeId,
  companyId,
  employeeSalary
}: EmployeeDiscountsFormProps) {
  const isEditing = !!initialData;
  const [calculatedValues, setCalculatedValues] = useState<{
    valor_parcela: number;
    valor_maximo_parcela: number;
    warning?: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<DiscountFormData>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      tipo_desconto: initialData?.tipo_desconto || 'multa_transito',
      descricao: initialData?.descricao || '',
      valor_total: initialData?.valor_total || 0,
      quantidade_parcelas: initialData?.quantidade_parcelas || 1,
      data_inicio: initialData?.data_inicio || '',
      data_vencimento: initialData?.data_vencimento || '',
      observacoes: initialData?.observacoes || '',
      status: initialData?.status || 'ativo',
    },
  });

  const watchedValorTotal = watch('valor_total');
  const watchedQuantidadeParcelas = watch('quantidade_parcelas');

  // Calcular valores quando os campos mudarem
  useEffect(() => {
    if (watchedValorTotal && watchedQuantidadeParcelas) {
      const valorParcela = watchedValorTotal / watchedQuantidadeParcelas;
      const valorMaximoParcela = employeeSalary * 0.30;
      
      setCalculatedValues({
        valor_parcela: valorParcela,
        valor_maximo_parcela: valorMaximoParcela,
        warning: valorParcela > valorMaximoParcela 
          ? `Valor da parcela (R$ ${valorParcela.toFixed(2)}) excede 30% do salário base (R$ ${valorMaximoParcela.toFixed(2)}). Valor máximo recomendado: R$ ${valorMaximoParcela.toFixed(2)}`
          : undefined
      });
    }
  }, [watchedValorTotal, watchedQuantidadeParcelas, employeeSalary]);

  const handleFormSubmit = (data: DiscountFormData) => {
    if (isEditing) {
      onSubmit({
        ...data,
        id: initialData.id,
        updated_at: new Date().toISOString(),
      } as EmployeeDiscountUpdate);
    } else {
      const valorParcela = data.valor_total / data.quantidade_parcelas;
      const valorMaximoParcela = employeeSalary * 0.30;
      
      onSubmit({
        ...data,
        employee_id: employeeId,
        company_id: companyId,
        valor_parcela: valorParcela,
        parcela_atual: 1,
        valor_maximo_parcela: valorMaximoParcela,
        salario_base_funcionario: employeeSalary,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as EmployeeDiscountInsert);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações do Desconto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_desconto">Tipo de Desconto *</Label>
              <Select
                value={watch('tipo_desconto')}
                onValueChange={(value) => setValue('tipo_desconto', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoDescontoLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tipo_desconto && (
                <p className="text-sm text-destructive">{errors.tipo_desconto.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                {...register('descricao')}
                placeholder="Descreva o motivo do desconto"
                rows={3}
                className={errors.descricao ? 'border-destructive' : ''}
              />
              {errors.descricao && (
                <p className="text-sm text-destructive">{errors.descricao.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                {...register('observacoes')}
                placeholder="Observações adicionais"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Valores e Parcelas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Valores e Parcelas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="valor_total">Valor Total (R$) *</Label>
              <Input
                id="valor_total"
                type="number"
                step="0.01"
                min="0.01"
                {...register('valor_total', { valueAsNumber: true })}
                placeholder="0,00"
                className={errors.valor_total ? 'border-destructive' : ''}
              />
              {errors.valor_total && (
                <p className="text-sm text-destructive">{errors.valor_total.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantidade_parcelas">Quantidade de Parcelas *</Label>
              <Input
                id="quantidade_parcelas"
                type="number"
                min="1"
                max="60"
                {...register('quantidade_parcelas', { valueAsNumber: true })}
                placeholder="1"
                className={errors.quantidade_parcelas ? 'border-destructive' : ''}
              />
              {errors.quantidade_parcelas && (
                <p className="text-sm text-destructive">{errors.quantidade_parcelas.message}</p>
              )}
            </div>

            {/* Cálculo da parcela */}
            {calculatedValues && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Valor da Parcela:</span>
                  <span className="font-mono text-lg">
                    R$ {calculatedValues.valor_parcela.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Valor Máximo (30% do salário):</span>
                  <span className="font-mono text-sm">
                    R$ {calculatedValues.valor_maximo_parcela.toFixed(2)}
                  </span>
                </div>
                
                {calculatedValues.warning && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Atenção!</AlertTitle>
                    <AlertDescription className="text-sm">
                      {calculatedValues.warning}
                    </AlertDescription>
                  </Alert>
                )}
                
                {!calculatedValues.warning && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Valor da parcela está dentro do limite permitido.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Datas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data de Início *</Label>
              <Input
                id="data_inicio"
                type="date"
                {...register('data_inicio')}
                className={errors.data_inicio ? 'border-destructive' : ''}
              />
              {errors.data_inicio && (
                <p className="text-sm text-destructive">{errors.data_inicio.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
              <Input
                id="data_vencimento"
                type="date"
                {...register('data_vencimento')}
                className={errors.data_vencimento ? 'border-destructive' : ''}
              />
              {errors.data_vencimento && (
                <p className="text-sm text-destructive">{errors.data_vencimento.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={!isValid || isLoading}
        >
          {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Desconto' : 'Criar Desconto'}
        </Button>
      </div>
    </form>
  );
}
