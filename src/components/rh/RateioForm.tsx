import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BeneficioTipo, BeneficioRateio } from '@/integrations/supabase/rh-types';
import { Calendar, DollarSign, Percent, Users, TrendingUp } from 'lucide-react';

const rateioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  beneficio_tipo_id: z.string().min(1, 'Tipo de benefício é obrigatório'),
  tipo_rateio: z.enum(['percentual', 'valor_fixo', 'proporcional_funcionarios', 'proporcional_custo']),
  valor_total: z.number().min(0, 'Valor deve ser maior ou igual a zero'),
  periodo_inicio: z.string().min(1, 'Data de início é obrigatória'),
  periodo_fim: z.string().optional(),
  is_active: z.boolean().default(true),
});

type RateioFormData = z.infer<typeof rateioSchema>;

interface RateioFormProps {
  initialData?: BeneficioRateio;
  onSubmit: (data: RateioFormData) => void;
  onCancel: () => void;
  beneficioTipos: BeneficioTipo[];
  isLoading?: boolean;
}

export function RateioForm({
  initialData,
  onSubmit,
  onCancel,
  beneficioTipos,
  isLoading = false,
}: RateioFormProps) {
  const [tipoRateio, setTipoRateio] = useState<string>('percentual');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RateioFormData>({
    resolver: zodResolver(rateioSchema),
    defaultValues: {
      nome: initialData?.nome || '',
      descricao: initialData?.descricao || '',
      beneficio_tipo_id: initialData?.beneficio_tipo_id || '',
      tipo_rateio: initialData?.tipo_rateio || 'percentual',
      valor_total: initialData?.valor_total || 0,
      periodo_inicio: initialData?.periodo_inicio || '',
      periodo_fim: initialData?.periodo_fim || '',
      is_active: initialData?.is_active ?? true,
    },
  });

  const watchedTipoRateio = watch('tipo_rateio');

  useEffect(() => {
    setTipoRateio(watchedTipoRateio);
  }, [watchedTipoRateio]);

  const getTipoRateioLabel = (tipo: string) => {
    switch (tipo) {
      case 'percentual':
        return 'Percentual';
      case 'valor_fixo':
        return 'Valor Fixo';
      case 'proporcional_funcionarios':
        return 'Proporcional Funcionários';
      case 'proporcional_custo':
        return 'Proporcional Custo';
      default:
        return tipo;
    }
  };

  const getTipoRateioDescription = (tipo: string) => {
    switch (tipo) {
      case 'percentual':
        return 'Cada departamento recebe uma porcentagem fixa do valor total';
      case 'valor_fixo':
        return 'Cada departamento recebe um valor fixo definido';
      case 'proporcional_funcionarios':
        return 'Rateio proporcional ao número de funcionários de cada departamento';
      case 'proporcional_custo':
        return 'Rateio proporcional ao custo médio dos funcionários de cada departamento';
      default:
        return '';
    }
  };

  const getTipoRateioIcon = (tipo: string) => {
    switch (tipo) {
      case 'percentual':
        return <Percent className="h-4 w-4 text-blue-600" />;
      case 'valor_fixo':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'proporcional_funcionarios':
        return <Users className="h-4 w-4 text-orange-600" />;
      case 'proporcional_custo':
        return <TrendingUp className="h-4 w-4 text-purple-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do Rateio *</Label>
          <Input
            id="nome"
            {...register('nome')}
            placeholder="Ex: Rateio VR Janeiro 2024"
            className={errors.nome ? 'border-destructive' : ''}
          />
          {errors.nome && (
            <p className="text-sm text-destructive">{errors.nome.message}</p>
          )}
        </div>

        {/* Tipo de Benefício */}
        <div className="space-y-2">
          <Label htmlFor="beneficio_tipo_id">Tipo de Benefício *</Label>
          <Select
            value={watch('beneficio_tipo_id')}
            onValueChange={(value) => setValue('beneficio_tipo_id', value)}
          >
            <SelectTrigger className={errors.beneficio_tipo_id ? 'border-destructive' : ''}>
              <SelectValue placeholder="Selecione o tipo de benefício" />
            </SelectTrigger>
            <SelectContent>
              {beneficioTipos.map((tipo) => (
                <SelectItem key={tipo.id} value={tipo.id}>
                  {tipo.nome} - {tipo.categoria}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.beneficio_tipo_id && (
            <p className="text-sm text-destructive">{errors.beneficio_tipo_id.message}</p>
          )}
        </div>
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          {...register('descricao')}
          placeholder="Descrição opcional do rateio"
          rows={3}
        />
      </div>

      {/* Tipo de Rateio */}
      <div className="space-y-2">
        <Label htmlFor="tipo_rateio">Tipo de Rateio *</Label>
        <Select
          value={watch('tipo_rateio')}
          onValueChange={(value) => setValue('tipo_rateio', value as any)}
        >
          <SelectTrigger className={errors.tipo_rateio ? 'border-destructive' : ''}>
            <SelectValue placeholder="Selecione o tipo de rateio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percentual">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-blue-600" />
                Percentual
              </div>
            </SelectItem>
            <SelectItem value="valor_fixo">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Valor Fixo
              </div>
            </SelectItem>
            <SelectItem value="proporcional_funcionarios">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-600" />
                Proporcional Funcionários
              </div>
            </SelectItem>
            <SelectItem value="proporcional_custo">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                Proporcional Custo
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {errors.tipo_rateio && (
          <p className="text-sm text-destructive">{errors.tipo_rateio.message}</p>
        )}
        
        {/* Descrição do tipo de rateio */}
        <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
          {getTipoRateioIcon(tipoRateio)}
          <p className="text-sm text-muted-foreground">
            {getTipoRateioDescription(tipoRateio)}
          </p>
        </div>
      </div>

      {/* Valor Total */}
      <div className="space-y-2">
        <Label htmlFor="valor_total">Valor Total *</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="valor_total"
            type="number"
            step="0.01"
            min="0"
            {...register('valor_total', { valueAsNumber: true })}
            placeholder="0,00"
            className={`pl-10 ${errors.valor_total ? 'border-destructive' : ''}`}
          />
        </div>
        {errors.valor_total && (
          <p className="text-sm text-destructive">{errors.valor_total.message}</p>
        )}
      </div>

      {/* Período */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="periodo_inicio">Data de Início *</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="periodo_inicio"
              type="date"
              {...register('periodo_inicio')}
              className={`pl-10 ${errors.periodo_inicio ? 'border-destructive' : ''}`}
            />
          </div>
          {errors.periodo_inicio && (
            <p className="text-sm text-destructive">{errors.periodo_inicio.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="periodo_fim">Data de Fim (Opcional)</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="periodo_fim"
              type="date"
              {...register('periodo_fim')}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={watch('is_active')}
          onCheckedChange={(checked) => setValue('is_active', checked)}
        />
        <Label htmlFor="is_active">Rateio ativo</Label>
      </div>

      {/* Botões */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : initialData ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}
