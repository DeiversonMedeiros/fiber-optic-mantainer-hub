import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useQuery } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/rh-client';

const employeeShiftSchema = z.object({
  employee_id: z.string().min(1, 'Funcionário é obrigatório'),
  shift_id: z.string().min(1, 'Turno é obrigatório'),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_fim: z.string().optional(),
  is_active: z.boolean().default(true)
});

type EmployeeShiftFormData = z.infer<typeof employeeShiftSchema>;

interface EmployeeShiftFormProps {
  employeeShift?: any;
  onSubmit: (data: EmployeeShiftFormData) => void;
  onCancel: () => void;
}

export const EmployeeShiftForm: React.FC<EmployeeShiftFormProps> = ({
  employeeShift,
  onSubmit,
  onCancel
}) => {
  const [isActive, setIsActive] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<EmployeeShiftFormData>({
    resolver: zodResolver(employeeShiftSchema),
    defaultValues: {
      employee_id: employeeShift?.employee_id || '',
      shift_id: employeeShift?.shift_id || '',
      data_inicio: employeeShift?.data_inicio || '',
      data_fim: employeeShift?.data_fim || '',
      is_active: employeeShift?.is_active ?? true
    }
  });

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('employees')
        .select('id, nome, matricula')
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch work shifts
  const { data: workShifts = [] } = useQuery({
    queryKey: ['work-shifts'],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('work_shifts')
        .select('id, nome, hora_inicio, hora_fim')
        .eq('is_active', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (employeeShift) {
      setIsActive(employeeShift.is_active ?? true);
    }
  }, [employeeShift]);

  const handleFormSubmit = (data: EmployeeShiftFormData) => {
    onSubmit({
      ...data,
      is_active: isActive
    });
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {employeeShift ? 'Editar Atribuição de Turno' : 'Nova Atribuição de Turno'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Funcionário */}
            <div className="space-y-2">
              <Label htmlFor="employee_id">Funcionário *</Label>
              <Select
                value={watch('employee_id')}
                onValueChange={(value) => setValue('employee_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.nome} {employee.matricula && `(${employee.matricula})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employee_id && (
                <p className="text-sm text-red-600">{errors.employee_id.message}</p>
              )}
            </div>

            {/* Turno */}
            <div className="space-y-2">
              <Label htmlFor="shift_id">Turno *</Label>
              <Select
                value={watch('shift_id')}
                onValueChange={(value) => setValue('shift_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um turno" />
                </SelectTrigger>
                <SelectContent>
                  {workShifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      {shift.nome} ({shift.hora_inicio} - {shift.hora_fim})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.shift_id && (
                <p className="text-sm text-red-600">{errors.shift_id.message}</p>
              )}
            </div>

            {/* Data de Início */}
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data de Início *</Label>
              <Input
                id="data_inicio"
                type="date"
                {...register('data_inicio')}
              />
              {errors.data_inicio && (
                <p className="text-sm text-red-600">{errors.data_inicio.message}</p>
              )}
            </div>

            {/* Data de Fim */}
            <div className="space-y-2">
              <Label htmlFor="data_fim">Data de Fim</Label>
              <Input
                id="data_fim"
                type="date"
                {...register('data_fim')}
              />
            </div>
          </div>

          {/* Status Ativo */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="is_active">Atribuição ativa</Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : employeeShift ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};




















