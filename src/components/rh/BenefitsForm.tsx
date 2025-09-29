import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Benefit, BenefitInsert, BenefitUpdate } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, DollarSign, Tag, FileText } from 'lucide-react';

const benefitSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  tipo_beneficio: z.enum(['valor_fixo', 'percentual']),
  valor: z.number().min(0, 'Valor deve ser maior ou igual a 0'),
  categoria: z.string().optional(),
  descricao: z.string().optional(),
  is_active: z.boolean().default(true),
  company_id: z.string().min(1, 'ID da empresa é obrigatório'),
});

type BenefitFormData = z.infer<typeof benefitSchema>;

interface BenefitsFormProps {
  initialData?: Benefit;
  onSubmit: (data: BenefitInsert | BenefitUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
  companyId: string;
}

export function BenefitsForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  companyId 
}: BenefitsFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<BenefitFormData>({
    resolver: zodResolver(benefitSchema),
    defaultValues: {
      nome: initialData?.nome || '',
      tipo_beneficio: initialData?.tipo_beneficio || 'valor_fixo',
      valor: initialData?.valor || 0,
      categoria: initialData?.categoria || '',
      descricao: initialData?.descricao || '',
      is_active: initialData?.is_active ?? true,
      company_id: companyId,
    },
  });

  const watchedTipoBeneficio = watch('tipo_beneficio');
  const watchedIsActive = watch('is_active');

  const handleFormSubmit = (data: BenefitFormData) => {
    if (isEditing) {
      onSubmit({
        ...data,
        id: initialData.id,
        updated_at: new Date().toISOString(),
      } as BenefitUpdate);
    } else {
      onSubmit({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as BenefitInsert);
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
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Benefício *</Label>
              <Input
                id="nome"
                {...register('nome')}
                placeholder="Ex: Vale Refeição"
                className={errors.nome ? 'border-destructive' : ''}
              />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_beneficio">Tipo de Benefício *</Label>
              <Select
                value={watchedTipoBeneficio}
                onValueChange={(value) => setValue('tipo_beneficio', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="valor_fixo">Valor Fixo</SelectItem>
                  <SelectItem value="percentual">Percentual</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo_beneficio && (
                <p className="text-sm text-destructive">{errors.tipo_beneficio.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Input
                id="categoria"
                {...register('categoria')}
                placeholder="Ex: Alimentação, Transporte, Saúde"
              />
            </div>
          </CardContent>
        </Card>

        {/* Valores e Configurações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Valores e Configurações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="valor">
                {watchedTipoBeneficio === 'valor_fixo' ? 'Valor (R$)' : 'Percentual (%)'} *
              </Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                {...register('valor', { valueAsNumber: true })}
                placeholder={watchedTipoBeneficio === 'valor_fixo' ? '0,00' : '0'}
                className={errors.valor ? 'border-destructive' : ''}
              />
              {errors.valor && (
                <p className="text-sm text-destructive">{errors.valor.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {watchedTipoBeneficio === 'valor_fixo' 
                  ? 'Valor fixo em reais para todos os funcionários'
                  : 'Percentual sobre o salário base do funcionário'
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                {...register('descricao')}
                placeholder="Descrição detalhada do benefício"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
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
            <Label htmlFor="is_active">Benefício ativo</Label>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Benefícios inativos não podem ser atribuídos a novos funcionários
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
          {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Benefício' : 'Criar Benefício'}
        </Button>
      </div>
    </form>
  );
}





















































