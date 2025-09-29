import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ConvenioPlano, ConvenioPlanoInsert, ConvenioPlanoUpdate } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, DollarSign, FileText } from 'lucide-react';

const convenioPlanoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  descricao: z.string().optional(),
  tipo_plano: z.enum(['basico', 'intermediario', 'master', 'premium', 'executivo']),
  valor_titular: z.number().min(0, 'Valor deve ser maior ou igual a 0'),
  valor_dependente: z.number().min(0, 'Valor deve ser maior ou igual a 0'),
  valor_coparticipacao: z.number().min(0, 'Valor deve ser maior ou igual a 0'),
  cobertura: z.string().optional(),
  is_active: z.boolean().default(true),
  convenio_empresa_id: z.string().min(1, 'ID do convênio empresa é obrigatório'),
});

type ConvenioPlanoFormData = z.infer<typeof convenioPlanoSchema>;

interface ConveniosPlanosFormProps {
  initialData?: ConvenioPlano;
  onSubmit: (data: ConvenioPlanoInsert | ConvenioPlanoUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
  convenioEmpresaId: string;
}

export function ConveniosPlanosForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  convenioEmpresaId 
}: ConveniosPlanosFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<ConvenioPlanoFormData>({
    resolver: zodResolver(convenioPlanoSchema),
    defaultValues: {
      nome: initialData?.nome || '',
      descricao: initialData?.descricao || '',
      tipo_plano: initialData?.tipo_plano || 'basico',
      valor_titular: initialData?.valor_titular || 0,
      valor_dependente: initialData?.valor_dependente || 0,
      valor_coparticipacao: initialData?.valor_coparticipacao || 0,
      cobertura: initialData?.cobertura || '',
      is_active: initialData?.is_active ?? true,
      convenio_empresa_id: convenioEmpresaId,
    },
  });

  const watchedTipoPlano = watch('tipo_plano');
  const watchedIsActive = watch('is_active');

  const handleFormSubmit = (data: ConvenioPlanoFormData) => {
    if (isEditing) {
      onSubmit({
        ...data,
        id: initialData.id,
        updated_at: new Date().toISOString(),
      } as ConvenioPlanoUpdate);
    } else {
      onSubmit({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as ConvenioPlanoInsert);
    }
  };

  const getTipoPlanoLabel = (tipo: string) => {
    switch (tipo) {
      case 'basico':
        return 'Básico';
      case 'intermediario':
        return 'Intermediário';
      case 'master':
        return 'Master';
      case 'premium':
        return 'Premium';
      case 'executivo':
        return 'Executivo';
      default:
        return tipo;
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
              <Label htmlFor="nome">Nome do Plano *</Label>
              <Input
                id="nome"
                {...register('nome')}
                placeholder="Ex: Plano Básico, Plano Master"
                className={errors.nome ? 'border-destructive' : ''}
              />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_plano">Tipo do Plano *</Label>
              <Select
                value={watchedTipoPlano}
                onValueChange={(value) => setValue('tipo_plano', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basico">Básico</SelectItem>
                  <SelectItem value="intermediario">Intermediário</SelectItem>
                  <SelectItem value="master">Master</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="executivo">Executivo</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo_plano && (
                <p className="text-sm text-destructive">{errors.tipo_plano.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                {...register('descricao')}
                placeholder="Descrição detalhada do plano"
                rows={3}
              />
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
              <Label htmlFor="valor_titular">Valor Titular (R$) *</Label>
              <Input
                id="valor_titular"
                type="number"
                step="0.01"
                min="0"
                {...register('valor_titular', { valueAsNumber: true })}
                placeholder="0,00"
                className={errors.valor_titular ? 'border-destructive' : ''}
              />
              {errors.valor_titular && (
                <p className="text-sm text-destructive">{errors.valor_titular.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_dependente">Valor Dependente (R$) *</Label>
              <Input
                id="valor_dependente"
                type="number"
                step="0.01"
                min="0"
                {...register('valor_dependente', { valueAsNumber: true })}
                placeholder="0,00"
                className={errors.valor_dependente ? 'border-destructive' : ''}
              />
              {errors.valor_dependente && (
                <p className="text-sm text-destructive">{errors.valor_dependente.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_coparticipacao">Valor Coparticipação (R$) *</Label>
              <Input
                id="valor_coparticipacao"
                type="number"
                step="0.01"
                min="0"
                {...register('valor_coparticipacao', { valueAsNumber: true })}
                placeholder="0,00"
                className={errors.valor_coparticipacao ? 'border-destructive' : ''}
              />
              {errors.valor_coparticipacao && (
                <p className="text-sm text-destructive">{errors.valor_coparticipacao.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Valor que o funcionário paga em cada consulta/procedimento
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cobertura */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Cobertura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="cobertura">Descrição da Cobertura</Label>
            <Textarea
              id="cobertura"
              {...register('cobertura')}
              placeholder="Descreva os serviços cobertos pelo plano (consultas, exames, cirurgias, etc.)"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
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
            <Label htmlFor="is_active">Plano ativo</Label>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Planos inativos não podem ser selecionados por funcionários
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
          {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Plano' : 'Criar Plano'}
        </Button>
      </div>
    </form>
  );
}

