import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ESocialEvent, ESocialEventInsert, ESocialEventUpdate } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, FileText, DollarSign, Database } from 'lucide-react';

const eSocialEventSchema = z.object({
  funcionario_id: z.string().min(1, 'Funcionário é obrigatório'),
  tipo_evento: z.enum(['admissao', 'demissao', 'ferias', 'afastamento', 'retorno', 'alteracao_contrato', 'alteracao_salario']),
  data_evento: z.string().min(1, 'Data do evento é obrigatória'),
  status: z.enum(['pendente', 'processado', 'enviado', 'aceito', 'rejeitado']),
  numero_recibo: z.string().optional(),
  protocolo: z.string().optional(),
  valor_anterior: z.number().min(0, 'Valor deve ser maior ou igual a 0').optional(),
  valor_novo: z.number().min(0, 'Valor deve ser maior ou igual a 0').optional(),
  observacoes: z.string().optional(),
  company_id: z.string().min(1, 'ID da empresa é obrigatório'),
});

type ESocialEventFormData = z.infer<typeof eSocialEventSchema>;

interface ESocialEventsFormProps {
  initialData?: ESocialEvent;
  onSubmit: (data: ESocialEventInsert | ESocialEventUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
  companyId: string;
}

export function ESocialEventsForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  companyId 
}: ESocialEventsFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<ESocialEventFormData>({
    resolver: zodResolver(eSocialEventSchema),
    defaultValues: {
      funcionario_id: initialData?.funcionario_id || '',
      tipo_evento: initialData?.tipo_evento || 'admissao',
      data_evento: initialData?.data_evento || '',
      status: initialData?.status || 'pendente',
      numero_recibo: initialData?.numero_recibo || '',
      protocolo: initialData?.protocolo || '',
      valor_anterior: initialData?.valor_anterior || 0,
      valor_novo: initialData?.valor_novo || 0,
      observacoes: initialData?.observacoes || '',
      company_id: companyId,
    },
  });

  const watchedTipoEvento = watch('tipo_evento');
  const watchedStatus = watch('status');

  const handleFormSubmit = (data: ESocialEventFormData) => {
    if (isEditing) {
      onSubmit({
        ...data,
        id: initialData.id,
        updated_at: new Date().toISOString(),
      } as ESocialEventUpdate);
    } else {
      onSubmit({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as ESocialEventInsert);
    }
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
                ID do funcionário relacionado ao evento
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_evento">Tipo de Evento *</Label>
              <Select
                value={watchedTipoEvento}
                onValueChange={(value) => setValue('tipo_evento', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admissao">Admissão</SelectItem>
                  <SelectItem value="demissao">Demissão</SelectItem>
                  <SelectItem value="ferias">Férias</SelectItem>
                  <SelectItem value="afastamento">Afastamento</SelectItem>
                  <SelectItem value="retorno">Retorno</SelectItem>
                  <SelectItem value="alteracao_contrato">Alteração de Contrato</SelectItem>
                  <SelectItem value="alteracao_salario">Alteração de Salário</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo_evento && (
                <p className="text-sm text-destructive">{errors.tipo_evento.message}</p>
              )}
            </div>

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
                  <SelectItem value="processado">Processado</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="aceito">Aceito</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive">{errors.status.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data e Identificadores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Data e Identificadores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data_evento">Data do Evento *</Label>
              <Input
                id="data_evento"
                type="date"
                {...register('data_evento')}
                className={errors.data_evento ? 'border-destructive' : ''}
              />
              {errors.data_evento && (
                <p className="text-sm text-destructive">{errors.data_evento.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_recibo">Número do Recibo</Label>
              <Input
                id="numero_recibo"
                {...register('numero_recibo')}
                placeholder="Número do recibo eSocial"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="protocolo">Protocolo</Label>
              <Input
                id="protocolo"
                {...register('protocolo')}
                placeholder="Número do protocolo"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Valores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Valores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="valor_anterior">Valor Anterior (R$)</Label>
              <Input
                id="valor_anterior"
                type="number"
                step="0.01"
                min="0"
                {...register('valor_anterior', { valueAsNumber: true })}
                placeholder="0,00"
              />
              <p className="text-xs text-muted-foreground">
                Valor anterior (salário, benefício, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_novo">Valor Novo (R$)</Label>
              <Input
                id="valor_novo"
                type="number"
                step="0.01"
                min="0"
                {...register('valor_novo', { valueAsNumber: true })}
                placeholder="0,00"
              />
              <p className="text-xs text-muted-foreground">
                Novo valor após a alteração
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Informações Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                {...register('observacoes')}
                placeholder="Observações sobre o evento eSocial"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Detalhes adicionais sobre o evento
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

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
          {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Evento' : 'Criar Evento'}
        </Button>
      </div>
    </form>
  );
}





















































