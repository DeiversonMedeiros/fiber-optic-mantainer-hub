import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { WorkShift, WorkShiftInsert, WorkShiftUpdate } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, Settings } from 'lucide-react';

const workShiftSchema = z.object({
  nome: z.string().min(1, 'Nome da escala é obrigatório'),
  hora_inicio: z.string().min(1, 'Hora de início é obrigatória'),
  hora_fim: z.string().min(1, 'Hora de fim é obrigatória'),
  dias_semana: z.array(z.number()).min(1, 'Selecione pelo menos um dia da semana'),
  is_active: z.boolean(),
  company_id: z.string().min(1, 'ID da empresa é obrigatório'),
});

type WorkShiftFormData = z.infer<typeof workShiftSchema>;

interface WorkShiftFormProps {
  initialData?: WorkShift;
  onSubmit: (data: WorkShiftInsert | WorkShiftUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
  companyId: string;
}

export function WorkShiftForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  companyId 
}: WorkShiftFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<WorkShiftFormData>({
    resolver: zodResolver(workShiftSchema),
    defaultValues: {
      nome: initialData?.nome || '',
      hora_inicio: initialData?.hora_inicio || '',
      hora_fim: initialData?.hora_fim || '',
      dias_semana: initialData?.dias_semana || [],
      is_active: initialData?.is_active !== false,
      company_id: companyId,
    },
  });

  const watchedDiasSemana = watch('dias_semana');

  const handleFormSubmit = (data: WorkShiftFormData) => {
    if (isEditing) {
      onSubmit({
        ...data,
        id: initialData.id,
      } as WorkShiftUpdate);
    } else {
      onSubmit({
        ...data,
      } as WorkShiftInsert);
    }
  };

  const diasSemana = [
    { id: 0, nome: 'Domingo' },
    { id: 1, nome: 'Segunda-feira' },
    { id: 2, nome: 'Terça-feira' },
    { id: 3, nome: 'Quarta-feira' },
    { id: 4, nome: 'Quinta-feira' },
    { id: 5, nome: 'Sexta-feira' },
    { id: 6, nome: 'Sábado' },
  ];

  const handleDayToggle = (dayId: number, checked: boolean) => {
    const currentDays = watchedDiasSemana || [];
    if (checked) {
      setValue('dias_semana', [...currentDays, dayId].sort());
    } else {
      setValue('dias_semana', currentDays.filter(id => id !== dayId));
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Escala *</Label>
              <Input
                id="nome"
                {...register('nome')}
                placeholder="Ex: Turno Manhã, Escala 12x36..."
                className={errors.nome ? 'border-destructive' : ''}
              />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={watch('is_active')}
                onCheckedChange={(checked) => setValue('is_active', !!checked)}
              />
              <Label htmlFor="is_active">Escala ativa</Label>
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
              <Label htmlFor="hora_inicio">Hora de Início *</Label>
              <Input
                id="hora_inicio"
                type="time"
                {...register('hora_inicio')}
                className={errors.hora_inicio ? 'border-destructive' : ''}
              />
              {errors.hora_inicio && (
                <p className="text-sm text-destructive">{errors.hora_inicio.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora_fim">Hora de Fim *</Label>
              <Input
                id="hora_fim"
                type="time"
                {...register('hora_fim')}
                className={errors.hora_fim ? 'border-destructive' : ''}
              />
              {errors.hora_fim && (
                <p className="text-sm text-destructive">{errors.hora_fim.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dias da Semana */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Dias da Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {diasSemana.map((dia) => (
                <div key={dia.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dia-${dia.id}`}
                    checked={watchedDiasSemana?.includes(dia.id) || false}
                    onCheckedChange={(checked) => handleDayToggle(dia.id, !!checked)}
                  />
                  <Label htmlFor={`dia-${dia.id}`} className="text-sm">
                    {dia.nome}
                  </Label>
                </div>
              ))}
            </div>
            {errors.dias_semana && (
              <p className="text-sm text-destructive">{errors.dias_semana.message}</p>
            )}
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
          {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Escala' : 'Criar Escala'}
        </Button>
      </div>
    </form>
  );
}













































