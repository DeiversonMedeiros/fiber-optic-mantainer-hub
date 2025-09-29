import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Vacation, VacationInsert, VacationUpdate } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, FileText, DollarSign } from 'lucide-react';

const vacationSchema = z.object({
  funcionario_id: z.string().min(1, 'Funcionário é obrigatório'),
  ano_referencia: z.number().min(2000, 'Ano deve ser maior que 2000').max(2100, 'Ano deve ser menor que 2100'),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_fim: z.string().min(1, 'Data de fim é obrigatória'),
  dias_ferias: z.number().min(1, 'Dias de férias deve ser maior que 0').max(60, 'Dias de férias deve ser menor que 60'),
  status: z.enum(['pendente', 'aprovada', 'em_andamento', 'concluida', 'cancelada']),
  tipo_ferias: z.enum(['ferias_normais', 'ferias_antecipadas', 'abono_pecuniario']),
  valor_ferias: z.number().min(0, 'Valor deve ser maior ou igual a 0'),
  observacoes: z.string().optional(),
  company_id: z.string().min(1, 'ID da empresa é obrigatório'),
});

type VacationFormData = z.infer<typeof vacationSchema>;

interface VacationsFormProps {
  initialData?: Vacation;
  onSubmit: (data: VacationInsert | VacationUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
  companyId: string;
}

export function VacationsForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  companyId 
}: VacationsFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<VacationFormData>({
    resolver: zodResolver(vacationSchema),
    defaultValues: {
      funcionario_id: initialData?.funcionario_id || '',
      ano_referencia: initialData?.ano_referencia || new Date().getFullYear(),
      data_inicio: initialData?.data_inicio || '',
      data_fim: initialData?.data_fim || '',
      dias_ferias: initialData?.dias_ferias || 30,
      status: initialData?.status || 'pendente',
      tipo_ferias: initialData?.tipo_ferias || 'ferias_normais',
      valor_ferias: initialData?.valor_ferias || 0,
      observacoes: initialData?.observacoes || '',
      company_id: companyId,
    },
  });

  const watchedDataInicio = watch('data_inicio');
  const watchedDataFim = watch('data_fim');
  const watchedStatus = watch('status');
  const watchedTipoFerias = watch('tipo_ferias');

  // Calcular dias de férias automaticamente
  React.useEffect(() => {
    if (watchedDataInicio && watchedDataFim) {
      const inicio = new Date(watchedDataInicio);
      const fim = new Date(watchedDataFim);
      const diffTime = Math.abs(fim.getTime() - inicio.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir o dia inicial
      setValue('dias_ferias', diffDays);
    }
  }, [watchedDataInicio, watchedDataFim, setValue]);

  const handleFormSubmit = (data: VacationFormData) => {
    if (isEditing) {
      onSubmit({
        ...data,
        id: initialData.id,
        updated_at: new Date().toISOString(),
      } as VacationUpdate);
    } else {
      onSubmit({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as VacationInsert);
    }
  };

  const getCurrentYear = () => {
    return new Date().getFullYear();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="funcionario_id">Funcionário *</Label>
              <Input
                id="funcionario_id"
                {...register('funcionario_id')}
                placeholder="ID do funcionário"
                className={errors.funcionario_id ? 'border-destructive' : ''}
              />
              {errors.funcionario_id && (
                <p className="text-sm text-destructive">{errors.funcionario_id.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                ID do funcionário que está de férias
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ano_referencia">Ano de Referência *</Label>
              <Input
                id="ano_referencia"
                type="number"
                min="2000"
                max="2100"
                {...register('ano_referencia', { valueAsNumber: true })}
                defaultValue={getCurrentYear()}
                className={errors.ano_referencia ? 'border-destructive' : ''}
              />
              {errors.ano_referencia && (
                <p className="text-sm text-destructive">{errors.ano_referencia.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_ferias">Tipo de Férias *</Label>
              <Select
                value={watchedTipoFerias}
                onValueChange={(value) => setValue('tipo_ferias', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ferias_normais">Férias Normais</SelectItem>
                  <SelectItem value="ferias_antecipadas">Férias Antecipadas</SelectItem>
                  <SelectItem value="abono_pecuniario">Abono Pecuniário</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo_ferias && (
                <p className="text-sm text-destructive">{errors.tipo_ferias.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Datas e Período */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Datas e Período
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Label htmlFor="data_fim">Data de Fim *</Label>
              <Input
                id="data_fim"
                type="date"
                {...register('data_fim')}
                className={errors.data_fim ? 'border-destructive' : ''}
              />
              {errors.data_fim && (
                <p className="text-sm text-destructive">{errors.data_fim.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dias_ferias">Dias de Férias *</Label>
              <Input
                id="dias_ferias"
                type="number"
                min="1"
                max="60"
                {...register('dias_ferias', { valueAsNumber: true })}
                className={errors.dias_ferias ? 'border-destructive' : ''}
                readOnly
              />
              {errors.dias_ferias && (
                <p className="text-sm text-destructive">{errors.dias_ferias.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Calculado automaticamente baseado nas datas
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status e Valores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={watchedStatus}
                onValueChange={(value) => setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovada">Aprovada</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive">{errors.status.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Valores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="valor_ferias">Valor das Férias (R$) *</Label>
              <Input
                id="valor_ferias"
                type="number"
                step="0.01"
                min="0"
                {...register('valor_ferias', { valueAsNumber: true })}
                className={errors.valor_ferias ? 'border-destructive' : ''}
              />
              {errors.valor_ferias && (
                <p className="text-sm text-destructive">{errors.valor_ferias.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Observações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...register('observacoes')}
              placeholder="Observações sobre as férias"
              rows={3}
            />
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
          {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Férias' : 'Criar Férias'}
        </Button>
      </div>
    </form>
  );
}































































































