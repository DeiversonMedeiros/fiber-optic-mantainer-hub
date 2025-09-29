import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TransporteConfig, TransporteConfigInsert, TransporteConfigUpdate } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bus, DollarSign, Ticket, Fuel, Settings } from 'lucide-react';

const transporteSchema = z.object({
  tipo: z.enum(['passagem', 'combustivel', 'ambos']),
  valor_passagem: z.number().min(0, 'Valor deve ser maior ou igual a 0'),
  quantidade_passagens: z.number().min(0, 'Quantidade deve ser maior ou igual a 0'),
  valor_combustivel: z.number().min(0, 'Valor deve ser maior ou igual a 0'),
  desconto_por_ausencia: z.boolean().default(true),
  desconto_por_ferias: z.boolean().default(true),
  desconto_por_licenca: z.boolean().default(true),
  is_active: z.boolean().default(true),
  company_id: z.string().min(1, 'ID da empresa é obrigatório'),
});

type TransporteFormData = z.infer<typeof transporteSchema>;

interface TransporteFormProps {
  initialData?: TransporteConfig;
  onSubmit: (data: TransporteConfigInsert | TransporteConfigUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
  companyId: string;
}

export function TransporteForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  companyId 
}: TransporteFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<TransporteFormData>({
    resolver: zodResolver(transporteSchema),
    defaultValues: {
      tipo: initialData?.tipo || 'passagem',
      valor_passagem: initialData?.valor_passagem || 0,
      quantidade_passagens: initialData?.quantidade_passagens || 0,
      valor_combustivel: initialData?.valor_combustivel || 0,
      desconto_por_ausencia: initialData?.desconto_por_ausencia ?? true,
      desconto_por_ferias: initialData?.desconto_por_ferias ?? true,
      desconto_por_licenca: initialData?.desconto_por_licenca ?? true,
      is_active: initialData?.is_active ?? true,
      company_id: companyId,
    },
  });

  const watchedTipo = watch('tipo');
  const watchedIsActive = watch('is_active');

  const handleFormSubmit = (data: TransporteFormData) => {
    if (isEditing) {
      onSubmit({
        ...data,
        id: initialData.id,
        updated_at: new Date().toISOString(),
      } as TransporteConfigUpdate);
    } else {
      onSubmit({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as TransporteConfigInsert);
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'passagem':
        return 'Passagem';
      case 'combustivel':
        return 'Combustível';
      case 'ambos':
        return 'Passagem + Combustível';
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
              <Bus className="h-5 w-5" />
              Configurações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Transporte *</Label>
              <Select
                value={watchedTipo}
                onValueChange={(value) => setValue('tipo', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passagem">Passagem</SelectItem>
                  <SelectItem value="combustivel">Combustível</SelectItem>
                  <SelectItem value="ambos">Passagem + Combustível</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo && (
                <p className="text-sm text-destructive">{errors.tipo.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Valores de Passagem */}
        {(watchedTipo === 'passagem' || watchedTipo === 'ambos') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Configurações de Passagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="valor_passagem">Valor da Passagem (R$) *</Label>
                <Input
                  id="valor_passagem"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('valor_passagem', { valueAsNumber: true })}
                  placeholder="0,00"
                  className={errors.valor_passagem ? 'border-destructive' : ''}
                />
                {errors.valor_passagem && (
                  <p className="text-sm text-destructive">{errors.valor_passagem.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantidade_passagens">Quantidade de Passagens *</Label>
                <Input
                  id="quantidade_passagens"
                  type="number"
                  min="0"
                  {...register('quantidade_passagens', { valueAsNumber: true })}
                  placeholder="0"
                  className={errors.quantidade_passagens ? 'border-destructive' : ''}
                />
                {errors.quantidade_passagens && (
                  <p className="text-sm text-destructive">{errors.quantidade_passagens.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Número de passagens por dia/funcionário
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Valores de Combustível */}
        {(watchedTipo === 'combustivel' || watchedTipo === 'ambos') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5" />
                Configurações de Combustível
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="valor_combustivel">Valor do Combustível (R$) *</Label>
                <Input
                  id="valor_combustivel"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('valor_combustivel', { valueAsNumber: true })}
                  placeholder="0,00"
                  className={errors.valor_combustivel ? 'border-destructive' : ''}
                />
                {errors.valor_combustivel && (
                  <p className="text-sm text-destructive">{errors.valor_combustivel.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Valor mensal de combustível por funcionário
                </p>
              </div>
            </CardContent>
          </Card>
        )}
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
            Configure quando o benefício de transporte deve ser descontado do funcionário
          </p>
        </CardContent>
      </Card>

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
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

