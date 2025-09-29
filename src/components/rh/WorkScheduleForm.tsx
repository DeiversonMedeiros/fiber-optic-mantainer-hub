// @ts-nocheck
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { WorkSchedule, WorkScheduleInsert, WorkScheduleUpdate } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, Users, FileText } from 'lucide-react';

const workScheduleSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  hora_entrada: z.string().min(1, 'Hora de entrada é obrigatória'),
  hora_saida: z.string().min(1, 'Hora de saída é obrigatória'),
  intervalo_inicio: z.string().optional(),
  intervalo_fim: z.string().optional(),
  dias_semana: z.array(z.number()).optional(),
  carga_horaria_semanal: z.number().min(1, 'Carga horária deve ser maior que 0').max(168, 'Carga horária inválida'),
  is_active: z.boolean().default(true),
  company_id: z.string().min(1, 'ID da empresa é obrigatório'),
});

type WorkScheduleFormData = z.infer<typeof workScheduleSchema>;

interface WorkScheduleFormProps {
  initialData?: WorkSchedule;
  onSubmit: (data: WorkScheduleInsert | WorkScheduleUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
  companyId: string;
}

export function WorkScheduleForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  companyId 
}: WorkScheduleFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<WorkScheduleFormData>({
    resolver: zodResolver(workScheduleSchema),
    defaultValues: {
      nome: initialData?.nome || '',
      hora_entrada: initialData?.hora_entrada || '',
      hora_saida: initialData?.hora_saida || '',
      intervalo_inicio: initialData?.intervalo_inicio || '',
      intervalo_fim: initialData?.intervalo_fim || '',
      dias_semana: initialData?.dias_semana || [],
      carga_horaria_semanal: initialData?.carga_horaria_semanal || 40,
      is_active: initialData?.is_active ?? true,
      company_id: companyId,
    },
  });

  const watchedIsActive = watch('is_active');

  const handleFormSubmit = (data: WorkScheduleFormData) => {
    if (isEditing) {
      onSubmit({
        ...data,
        id: initialData.id,
        updated_at: new Date().toISOString(),
      } as WorkScheduleUpdate);
    } else {
      onSubmit({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as WorkScheduleInsert);
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
              <Label htmlFor="nome">Nome da Escala *</Label>
              <Input
                id="nome"
                {...register('nome')}
                placeholder="Ex: Escala Padrão 8h"
                className={errors.nome ? 'border-destructive' : ''}
              />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dias_semana">Dias da Semana</Label>
              <div className="flex flex-wrap gap-2">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((dia, index) => (
                  <label key={dia} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={index + 1}
                      {...register('dias_semana')}
                      className="rounded"
                    />
                    <span className="text-sm">{dia}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Horários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hora_entrada">Hora de Entrada *</Label>
              <Input
                id="hora_entrada"
                type="time"
                {...register('hora_entrada')}
                className={errors.hora_entrada ? 'border-destructive' : ''}
              />
              {errors.hora_entrada && (
                <p className="text-sm text-destructive">{errors.hora_entrada.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora_saida">Hora de Saída *</Label>
              <Input
                id="hora_saida"
                type="time"
                {...register('hora_saida')}
                className={errors.hora_saida ? 'border-destructive' : ''}
              />
              {errors.hora_saida && (
                <p className="text-sm text-destructive">{errors.hora_saida.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="intervalo_inicio">Início do Intervalo</Label>
              <Input
                id="intervalo_inicio"
                type="time"
                {...register('intervalo_inicio')}
                className={errors.intervalo_inicio ? 'border-destructive' : ''}
              />
              {errors.intervalo_inicio && (
                <p className="text-sm text-destructive">{errors.intervalo_inicio.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="intervalo_fim">Fim do Intervalo</Label>
              <Input
                id="intervalo_fim"
                type="time"
                {...register('intervalo_fim')}
                className={errors.intervalo_fim ? 'border-destructive' : ''}
              />
              {errors.intervalo_fim && (
                <p className="text-sm text-destructive">{errors.intervalo_fim.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="carga_horaria_semanal">Carga Horária Semanal (horas) *</Label>
              <Input
                id="carga_horaria_semanal"
                type="number"
                min="1"
                max="168"
                {...register('carga_horaria_semanal', { valueAsNumber: true })}
                className={errors.carga_horaria_semanal ? 'border-destructive' : ''}
              />
              {errors.carga_horaria_semanal && (
                <p className="text-sm text-destructive">{errors.carga_horaria_semanal.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
            <Label htmlFor="is_active">Escala ativa</Label>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Escalas inativas não podem ser atribuídas a novos funcionários
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
          {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Escala' : 'Criar Escala'}
        </Button>
      </div>
    </form>
  );
}
























