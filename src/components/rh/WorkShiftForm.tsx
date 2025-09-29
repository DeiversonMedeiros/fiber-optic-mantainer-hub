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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Calendar, Settings, AlertCircle, CheckCircle } from 'lucide-react';

const workShiftSchema = z.object({
  nome: z.string().min(1, 'Nome da escala é obrigatório'),
  hora_inicio: z.string().min(1, 'Hora de início é obrigatória'),
  hora_fim: z.string().min(1, 'Hora de fim é obrigatória'),
  dias_semana: z.array(z.number()).optional(),
  is_active: z.boolean(),
  company_id: z.string().min(1, 'ID da empresa é obrigatório'),
  tipo_escala: z.enum(['fixa', 'flexivel_6x1', 'flexivel_5x2', 'flexivel_4x3', 'escala_12x36', 'escala_24x48', 'personalizada']),
  dias_trabalho: z.number().min(1).max(6),
  dias_folga: z.number().min(1),
  ciclo_dias: z.number().min(7),
  descricao: z.string().optional(),
  template_escala: z.boolean().optional(),
}).refine((data) => {
  // Validação CLT: máximo 6 dias consecutivos de trabalho
  if (data.dias_trabalho > 6) {
    return false;
  }
  // Validação CLT: mínimo 1 dia de folga por semana
  if (data.dias_folga < 1) {
    return false;
  }
  // Validação: ciclo deve ser válido
  if (data.ciclo_dias < (data.dias_trabalho + data.dias_folga)) {
    return false;
  }
  return true;
}, {
  message: "Escala não está em conformidade com a CLT. Máximo 6 dias consecutivos de trabalho e mínimo 1 dia de folga por semana.",
  path: ["dias_trabalho"]
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
      tipo_escala: initialData?.tipo_escala || 'fixa',
      dias_trabalho: initialData?.dias_trabalho || 5,
      dias_folga: initialData?.dias_folga || 2,
      ciclo_dias: initialData?.ciclo_dias || 7,
      descricao: initialData?.descricao || '',
      template_escala: initialData?.template_escala || false,
    },
  });

  const watchedDiasSemana = watch('dias_semana');
  const watchedTipoEscala = watch('tipo_escala');
  const watchedDiasTrabalho = watch('dias_trabalho');
  const watchedDiasFolga = watch('dias_folga');
  const watchedCicloDias = watch('ciclo_dias');

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

  const tiposEscala = [
    { value: 'fixa', label: 'Escala Fixa', description: 'Dias fixos da semana (atual)' },
    { value: 'flexivel_6x1', label: 'Escala 6x1', description: '6 dias de trabalho, 1 dia de folga' },
    { value: 'flexivel_5x2', label: 'Escala 5x2', description: '5 dias de trabalho, 2 dias de folga' },
    { value: 'flexivel_4x3', label: 'Escala 4x3', description: '4 dias de trabalho, 3 dias de folga' },
    { value: 'escala_12x36', label: 'Escala 12x36', description: '12 horas de trabalho, 36 horas de folga' },
    { value: 'escala_24x48', label: 'Escala 24x48', description: '24 horas de trabalho, 48 horas de folga' },
    { value: 'personalizada', label: 'Personalizada', description: 'Configuração personalizada' },
  ];

  // Função para aplicar configurações automáticas baseadas no tipo de escala
  const handleTipoEscalaChange = (tipo: string) => {
    setValue('tipo_escala', tipo as any);
    
    switch (tipo) {
      case 'fixa':
        setValue('dias_trabalho', 5);
        setValue('dias_folga', 2);
        setValue('ciclo_dias', 7);
        break;
      case 'flexivel_6x1':
        setValue('dias_trabalho', 6);
        setValue('dias_folga', 1);
        setValue('ciclo_dias', 7);
        break;
      case 'flexivel_5x2':
        setValue('dias_trabalho', 5);
        setValue('dias_folga', 2);
        setValue('ciclo_dias', 7);
        break;
      case 'flexivel_4x3':
        setValue('dias_trabalho', 4);
        setValue('dias_folga', 3);
        setValue('ciclo_dias', 7);
        break;
      case 'escala_12x36':
        setValue('dias_trabalho', 1);
        setValue('dias_folga', 2);
        setValue('ciclo_dias', 3);
        break;
      case 'escala_24x48':
        setValue('dias_trabalho', 1);
        setValue('dias_folga', 2);
        setValue('ciclo_dias', 3);
        break;
      case 'personalizada':
        // Manter valores atuais
        break;
    }
  };

  // Função para validar conformidade CLT
  const isCltCompliant = () => {
    return watchedDiasTrabalho <= 6 && watchedDiasFolga >= 1 && watchedCicloDias >= (watchedDiasTrabalho + watchedDiasFolga);
  };

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
      {/* Tipo de Escala */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Tipo de Escala
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo_escala">Tipo de Escala *</Label>
            <Select value={watchedTipoEscala} onValueChange={handleTipoEscalaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de escala" />
              </SelectTrigger>
              <SelectContent>
                {tiposEscala.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    <div>
                      <div className="font-medium">{tipo.label}</div>
                      <div className="text-sm text-muted-foreground">{tipo.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tipo_escala && (
              <p className="text-sm text-destructive">{errors.tipo_escala.message}</p>
            )}
          </div>

          {/* Validação CLT */}
          <div className={`p-3 rounded-lg border flex items-center gap-2 ${
            isCltCompliant() 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {isCltCompliant() ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm">
              {isCltCompliant() 
                ? 'Escala em conformidade com a CLT' 
                : 'Escala não está em conformidade com a CLT'
              }
            </span>
          </div>
        </CardContent>
      </Card>

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

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                {...register('descricao')}
                placeholder="Descrição da escala de trabalho..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={watch('is_active')}
                onCheckedChange={(checked) => setValue('is_active', !!checked)}
              />
              <Label htmlFor="is_active">Escala ativa</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="template_escala"
                checked={watch('template_escala')}
                onCheckedChange={(checked) => setValue('template_escala', !!checked)}
              />
              <Label htmlFor="template_escala">Usar como template</Label>
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

      {/* Configuração de Escala Flexível */}
      {watchedTipoEscala !== 'fixa' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Configuração da Escala
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dias_trabalho">Dias de Trabalho *</Label>
                <Input
                  id="dias_trabalho"
                  type="number"
                  min="1"
                  max="6"
                  {...register('dias_trabalho', { valueAsNumber: true })}
                  className={errors.dias_trabalho ? 'border-destructive' : ''}
                />
                {errors.dias_trabalho && (
                  <p className="text-sm text-destructive">{errors.dias_trabalho.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dias_folga">Dias de Folga *</Label>
                <Input
                  id="dias_folga"
                  type="number"
                  min="1"
                  {...register('dias_folga', { valueAsNumber: true })}
                  className={errors.dias_folga ? 'border-destructive' : ''}
                />
                {errors.dias_folga && (
                  <p className="text-sm text-destructive">{errors.dias_folga.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ciclo_dias">Ciclo (dias) *</Label>
                <Input
                  id="ciclo_dias"
                  type="number"
                  min="7"
                  {...register('ciclo_dias', { valueAsNumber: true })}
                  className={errors.ciclo_dias ? 'border-destructive' : ''}
                />
                {errors.ciclo_dias && (
                  <p className="text-sm text-destructive">{errors.ciclo_dias.message}</p>
                )}
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Exemplo:</strong> {watchedDiasTrabalho} dias de trabalho + {watchedDiasFolga} dias de folga = {watchedCicloDias} dias de ciclo
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dias da Semana - Apenas para escalas fixas */}
      {watchedTipoEscala === 'fixa' && (
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
      )}

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

















































































