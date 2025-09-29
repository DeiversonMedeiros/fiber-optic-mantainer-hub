import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ScheduleEntry } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User, FileText } from 'lucide-react';

const scheduleEntrySchema = z.object({
  tipo: z.enum(['turno', 'folga', 'ferias', 'feriado', 'atestado', 'falta'], {
    required_error: 'Tipo é obrigatório',
  }),
  shift_id: z.string().optional(),
  observacoes: z.string().optional(),
});

type ScheduleEntryFormData = z.infer<typeof scheduleEntrySchema>;

interface ScheduleEntryFormProps {
  employeeId: string;
  date: string;
  employees: any[];
  shifts: any[];
  existingEntry?: ScheduleEntry & { shift?: { nome: string; hora_inicio: string; hora_fim: string } };
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const ScheduleEntryForm = ({ 
  employeeId, 
  date, 
  employees, 
  shifts, 
  existingEntry, 
  onSubmit, 
  onCancel 
}: ScheduleEntryFormProps) => {
  const [tipo, setTipo] = useState(existingEntry?.tipo || 'turno');
  const [selectedShift, setSelectedShift] = useState(existingEntry?.shift_id || '');

  const employee = employees.find(emp => emp.id === employeeId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm<ScheduleEntryFormData>({
    resolver: zodResolver(scheduleEntrySchema),
    defaultValues: {
      tipo: existingEntry?.tipo || 'turno',
      shift_id: existingEntry?.shift_id || '',
      observacoes: existingEntry?.observacoes || '',
    },
  });

  const handleFormSubmit = (data: ScheduleEntryFormData) => {
    onSubmit({
      ...data,
      shift_id: data.tipo === 'turno' ? data.shift_id : null
    });
  };

  const handleTipoChange = (value: string) => {
    setTipo(value);
    setValue('tipo', value as any);
    
    // Limpar turno se não for tipo 'turno'
    if (value !== 'turno') {
      setSelectedShift('');
      setValue('shift_id', '');
    }
  };

  const handleShiftChange = (value: string) => {
    setSelectedShift(value);
    setValue('shift_id', value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'turno':
        return <Clock className="h-4 w-4" />;
      case 'folga':
        return <Calendar className="h-4 w-4" />;
      case 'ferias':
        return <Calendar className="h-4 w-4" />;
      case 'feriado':
        return <Calendar className="h-4 w-4" />;
      case 'atestado':
        return <FileText className="h-4 w-4" />;
      case 'falta':
        return <FileText className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'turno':
        return 'text-blue-600';
      case 'folga':
        return 'text-green-600';
      case 'ferias':
        return 'text-yellow-600';
      case 'feriado':
        return 'text-orange-600';
      case 'atestado':
        return 'text-red-600';
      case 'falta':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>{existingEntry ? 'Editar Escala' : 'Nova Escala'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Informações do funcionário e data */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="font-medium">{employee?.nome}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-sm">{formatDate(date)}</span>
              </div>
              {employee?.cargo && (
                <div className="text-sm text-gray-600">
                  Cargo: {employee.cargo}
                </div>
              )}
            </div>

            {/* Tipo de entrada */}
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={tipo} onValueChange={handleTipoChange}>
                <SelectTrigger className={errors.tipo ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="turno">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span>Turno</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="folga">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span>Folga</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ferias">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-yellow-600" />
                      <span>Férias</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="feriado">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      <span>Feriado</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="atestado">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-red-600" />
                      <span>Atestado</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="falta">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-red-600" />
                      <span>Falta</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo && (
                <p className="text-sm text-red-500">{errors.tipo.message}</p>
              )}
            </div>

            {/* Turno (apenas se tipo for 'turno') */}
            {tipo === 'turno' && (
              <div className="space-y-2">
                <Label htmlFor="shift_id">Turno *</Label>
                <Select value={selectedShift} onValueChange={handleShiftChange}>
                  <SelectTrigger className={errors.shift_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione o turno" />
                  </SelectTrigger>
                  <SelectContent>
                    {shifts.map((shift) => (
                      <SelectItem key={shift.id} value={shift.id}>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span>{shift.nome}</span>
                          <span className="text-sm text-gray-500">
                            ({shift.hora_inicio} - {shift.hora_fim})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.shift_id && (
                  <p className="text-sm text-red-500">{errors.shift_id.message}</p>
                )}
              </div>
            )}

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Informações adicionais..."
                {...register('observacoes')}
                rows={3}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[100px]"
              >
                {isSubmitting ? 'Salvando...' : (existingEntry ? 'Atualizar' : 'Salvar')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};











