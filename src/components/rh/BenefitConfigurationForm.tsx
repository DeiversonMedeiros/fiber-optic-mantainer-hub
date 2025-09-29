import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useBenefitConfigurations } from '@/hooks/rh/useUnifiedBenefits';
import { 
  BenefitConfiguration, 
  BenefitConfigurationInsert,
  BenefitType,
  CalculationType,
  BENEFIT_TYPE_LABELS,
  CALCULATION_TYPE_LABELS,
  PaymentMethod
} from '@/integrations/supabase/rh-benefits-unified-types';

const benefitConfigurationSchema = z.object({
  benefit_type: z.enum(['vr_va', 'transporte', 'equipment_rental', 'premiacao']),
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  calculation_type: z.enum(['fixed_value', 'daily_value', 'percentage', 'production_based', 'goal_based']),
  base_value: z.number().min(0).optional(),
  percentage_value: z.number().min(0).max(100).optional(),
  min_value: z.number().min(0).optional(),
  max_value: z.number().min(0).optional(),
  daily_calculation_base: z.number().min(1).max(31).default(30),
  production_percentage: z.number().min(0).max(100).optional(),
  apply_absence_discount: z.boolean().default(true),
  absence_discount_percentage: z.number().min(0).max(100).default(0),
  apply_holiday_discount: z.boolean().default(true),
  apply_vacation_discount: z.boolean().default(true),
  apply_sick_leave_discount: z.boolean().default(true),
  apply_suspension_discount: z.boolean().default(true),
  payment_methods: z.array(z.enum(['flash', 'transfer', 'pix'])).default(['flash', 'transfer', 'pix']),
  is_active: z.boolean().default(true),
});

type BenefitConfigurationFormData = z.infer<typeof benefitConfigurationSchema>;

interface BenefitConfigurationFormProps {
  companyId: string;
  config?: BenefitConfiguration | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BenefitConfigurationForm({ 
  companyId, 
  config, 
  onSuccess, 
  onCancel 
}: BenefitConfigurationFormProps) {
  const { createConfiguration, updateConfiguration } = useBenefitConfigurations(companyId);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<PaymentMethod[]>(['flash', 'transfer', 'pix']);

  const form = useForm<BenefitConfigurationFormData>({
    resolver: zodResolver(benefitConfigurationSchema),
    defaultValues: {
      benefit_type: config?.benefit_type || 'vr_va',
      name: config?.name || '',
      description: config?.description || '',
      calculation_type: config?.calculation_type || 'fixed_value',
      base_value: config?.base_value || undefined,
      percentage_value: config?.percentage_value || undefined,
      min_value: config?.min_value || undefined,
      max_value: config?.max_value || undefined,
      daily_calculation_base: config?.daily_calculation_base || 30,
      production_percentage: config?.production_percentage || undefined,
      apply_absence_discount: config?.apply_absence_discount ?? true,
      absence_discount_percentage: config?.absence_discount_percentage || 0,
      apply_holiday_discount: config?.apply_holiday_discount ?? true,
      apply_vacation_discount: config?.apply_vacation_discount ?? true,
      apply_sick_leave_discount: config?.apply_sick_leave_discount ?? true,
      apply_suspension_discount: config?.apply_suspension_discount ?? true,
      payment_methods: config?.payment_methods || ['flash', 'transfer', 'pix'],
      is_active: config?.is_active ?? true,
    },
  });

  const selectedBenefitType = form.watch('benefit_type');
  const selectedCalculationType = form.watch('calculation_type');

  useEffect(() => {
    if (config) {
      setSelectedPaymentMethods(config.payment_methods);
    }
  }, [config]);

  // Determinar categoria Flash baseada no tipo de benefício
  const getFlashCategory = (benefitType: BenefitType): string => {
    switch (benefitType) {
      case 'vr_va':
        return 'REFEICAO E ALIMENTACAO';
      case 'transporte':
        return 'VALE TRANSPORTE PIX';
      case 'equipment_rental':
      case 'premiacao':
        return 'PREMIACAO VIRTUAL';
      default:
        return 'REFEICAO E ALIMENTACAO';
    }
  };

  const onSubmit = async (data: BenefitConfigurationFormData) => {
    try {
      const formData = {
        ...data,
        payment_methods: selectedPaymentMethods,
        flash_category: getFlashCategory(data.benefit_type),
        company_id: companyId,
      };

      if (config) {
        await updateConfiguration.mutateAsync({
          id: config.id,
          ...formData,
        });
      } else {
        await createConfiguration.mutateAsync(formData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    }
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    setSelectedPaymentMethods(prev => 
      prev.includes(method) 
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Tipo de Benefício */}
          <FormField
            control={form.control}
            name="benefit_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Benefício</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(BENEFIT_TYPE_LABELS).map(([type, label]) => (
                      <SelectItem key={type} value={type}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nome */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome *</FormLabel>
                <FormControl>
                  <Input placeholder="Nome da configuração" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Descrição */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descrição da configuração" 
                  {...field} 
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Tipo de Cálculo */}
          <FormField
            control={form.control}
            name="calculation_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Cálculo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(CALCULATION_TYPE_LABELS).map(([type, label]) => (
                      <SelectItem key={type} value={type}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Base de Cálculo Diário */}
          {selectedCalculationType === 'daily_value' && (
            <FormField
              control={form.control}
              name="daily_calculation_base"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base de Dias</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      max="31"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                    />
                  </FormControl>
                  <FormDescription>
                    Número de dias para cálculo diário (padrão: 30)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Valores */}
        <div className="grid grid-cols-2 gap-4">
          {(selectedCalculationType === 'fixed_value' || selectedCalculationType === 'daily_value') && (
            <FormField
              control={form.control}
              name="base_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Base (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {selectedCalculationType === 'percentage' && (
            <FormField
              control={form.control}
              name="percentage_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Percentual (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {selectedCalculationType === 'production_based' && (
            <FormField
              control={form.control}
              name="production_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Percentual de Produção (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Valores Mínimo e Máximo (para premiação variável) */}
        {selectedBenefitType === 'premiacao' && selectedCalculationType === 'fixed_value' && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="min_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Mínimo (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="max_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Máximo (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Configurações de Desconto */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="apply_absence_discount"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Aplicar Desconto por Ausência
                  </FormLabel>
                  <FormDescription>
                    Desconta valor proporcional aos dias de ausência
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {form.watch('apply_absence_discount') && (
            <FormField
              control={form.control}
              name="absence_discount_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Percentual de Desconto por Ausência (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Desconto por Feriados */}
          <FormField
            control={form.control}
            name="apply_holiday_discount"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Aplicar Desconto por Feriados
                  </FormLabel>
                  <FormDescription>
                    Desconta valor proporcional aos dias de feriados
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Desconto por Férias */}
          <FormField
            control={form.control}
            name="apply_vacation_discount"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Aplicar Desconto por Férias
                  </FormLabel>
                  <FormDescription>
                    Desconta valor proporcional aos dias de férias
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Desconto por Licença Médica */}
          <FormField
            control={form.control}
            name="apply_sick_leave_discount"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Aplicar Desconto por Licença Médica
                  </FormLabel>
                  <FormDescription>
                    Desconta valor proporcional aos dias de licença médica
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Desconto por Suspensão */}
          <FormField
            control={form.control}
            name="apply_suspension_discount"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Aplicar Desconto por Suspensão
                  </FormLabel>
                  <FormDescription>
                    Desconta valor proporcional aos dias de suspensão
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Métodos de Pagamento */}
        <div className="space-y-2">
          <Label>Métodos de Pagamento</Label>
          <div className="flex gap-4">
            {(['flash', 'transfer', 'pix'] as PaymentMethod[]).map((method) => (
              <div key={method} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={method}
                  checked={selectedPaymentMethods.includes(method)}
                  onChange={() => togglePaymentMethod(method)}
                  className="rounded"
                />
                <Label htmlFor={method} className="text-sm">
                  {method === 'flash' && 'Flash'}
                  {method === 'transfer' && 'Transferência'}
                  {method === 'pix' && 'PIX'}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Configuração Ativa
                </FormLabel>
                <FormDescription>
                  Configuração disponível para uso
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Botões */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createConfiguration.isPending || updateConfiguration.isPending}>
            {config ? 'Atualizar' : 'Criar'} Configuração
          </Button>
        </div>
      </form>
    </Form>
  );
}
