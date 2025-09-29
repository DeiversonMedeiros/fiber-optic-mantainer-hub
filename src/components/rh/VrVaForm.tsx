import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { VrVaConfig, VrVaConfigInsert, VrVaConfigUpdate } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, DollarSign, Calendar, Settings } from 'lucide-react';

const vrVaSchema = z.object({
  tipo: z.enum(['VR', 'VA']),
  valor_diario: z.number().min(0, 'Valor deve ser maior ou igual a 0'),
  valor_mensal: z.number().min(0, 'Valor deve ser maior ou igual a 0'),
  dias_uteis_mes: z.number().min(1, 'Dias úteis deve ser pelo menos 1').max(31, 'Dias úteis não pode ser maior que 31'),
  desconto_por_ausencia: z.boolean().default(true),
  desconto_por_ferias: z.boolean().default(true),
  desconto_por_licenca: z.boolean().default(true),
  is_active: z.boolean().default(true),
  company_id: z.string().min(1, 'ID da empresa é obrigatório'),
});

type VrVaFormData = z.infer<typeof vrVaSchema>;

interface VrVaFormProps {
  initialData?: VrVaConfig;
  onSubmit: (data: VrVaConfigInsert | VrVaConfigUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
  companyId: string;
}

export function VrVaForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  companyId 
}: VrVaFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<VrVaFormData>({
    resolver: zodResolver(vrVaSchema),
    defaultValues: {
      tipo: initialData?.tipo || 'VR',
      valor_diario: initialData?.valor_diario || 0,
      valor_mensal: initialData?.valor_mensal || 0,
      dias_uteis_mes: initialData?.dias_uteis_mes || 22,
      desconto_por_ausencia: initialData?.desconto_por_ausencia ?? true,
      desconto_por_ferias: initialData?.desconto_por_ferias ?? true,
      desconto_por_licenca: initialData?.desconto_por_licenca ?? true,
      is_active: initialData?.is_active ?? true,
      company_id: companyId,
    },
  });

  const watchedTipo = watch('tipo');
  const watchedValorDiario = watch('valor_diario');
  const watchedDiasUteis = watch('dias_uteis_mes');
  const watchedIsActive = watch('is_active');

  // Calcular valor mensal automaticamente
  React.useEffect(() => {
    const valorMensal = watchedValorDiario * watchedDiasUteis;
    setValue('valor_mensal', valorMensal);
  }, [watchedValorDiario, watchedDiasUteis, setValue]);

  const handleFormSubmit = (data: VrVaFormData) => {
    if (isEditing) {
      onSubmit({
        ...data,
        id: initialData.id,
        updated_at: new Date().toISOString(),
      } as VrVaConfigUpdate);
    } else {
      onSubmit({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as VrVaConfigInsert);
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'VR':
        return 'Vale Refeição';
      case 'VA':
        return 'Vale Alimentação';
      default:
        return tipo;
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Configurações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Configurações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Benefício *</Label>
              <Select
                value={watchedTipo}
                onValueChange={(value) => setValue('tipo', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VR">Vale Refeição (VR)</SelectItem>
                  <SelectItem value="VA">Vale Alimentação (VA)</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo && (
                <p className="text-sm text-destructive">{errors.tipo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dias_uteis_mes">Dias Úteis no Mês *</Label>
              <Input
                id="dias_uteis_mes"
                type="number"
                min="1"
                max="31"
                {...register('dias_uteis_mes', { valueAsNumber: true })}
                placeholder="22"
                className={errors.dias_uteis_mes ? 'border-destructive' : ''}
              />
              {errors.dias_uteis_mes && (
                <p className="text-sm text-destructive">{errors.dias_uteis_mes.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Número de dias úteis no mês para cálculo do valor mensal
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Valores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Valores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="valor_diario">Valor Diário (R$) *</Label>
              <Input
                id="valor_diario"
                type="number"
                step="0.01"
                min="0"
                {...register('valor_diario', { valueAsNumber: true })}
                placeholder="0,00"
                className={errors.valor_diario ? 'border-destructive' : ''}
              />
              {errors.valor_diario && (
                <p className="text-sm text-destructive">{errors.valor_diario.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_mensal">Valor Mensal (R$) *</Label>
              <Input
                id="valor_mensal"
                type="number"
                step="0.01"
                min="0"
                {...register('valor_mensal', { valueAsNumber: true })}
                placeholder="0,00"
                className={errors.valor_mensal ? 'border-destructive' : ''}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Calculado automaticamente: Valor Diário × Dias Úteis
              </p>
              {errors.valor_mensal && (
                <p className="text-sm text-destructive">{errors.valor_mensal.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regras de Desconto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Regras de Desconto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="desconto_por_ausencia"
                checked={watch('desconto_por_ausencia')}
                onCheckedChange={(checked) => setValue('desconto_por_ausencia', checked)}
              />
              <Label htmlFor="desconto_por_ausencia">Desconto por Ausência</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="desconto_por_ferias"
                checked={watch('desconto_por_ferias')}
                onCheckedChange={(checked) => setValue('desconto_por_ferias', checked)}
              />
              <Label htmlFor="desconto_por_ferias">Desconto por Férias</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="desconto_por_licenca"
                checked={watch('desconto_por_licenca')}
                onCheckedChange={(checked) => setValue('desconto_por_licenca', checked)}
              />
              <Label htmlFor="desconto_por_licenca">Desconto por Licença</Label>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure quando o {getTipoLabel(watchedTipo)} deve ser descontado do funcionário
          </p>
        </CardContent>
      </Card>

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Configurações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={watchedIsActive}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
            <Label htmlFor="is_active">Configuração ativa</Label>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Configurações inativas não são aplicadas aos funcionários
          </p>
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
          {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Configuração' : 'Criar Configuração'}
        </Button>
      </div>
    </form>
  );
}

