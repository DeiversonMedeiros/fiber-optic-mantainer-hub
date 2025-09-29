import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';

const payrollConfigSchema = z.object({
  employee_id: z.string().min(1, 'Funcionário é obrigatório'),
  regime_hora_extra: z.string().optional(),
  vigencia_banco_horas: z.number().min(0, 'Vigência deve ser maior ou igual a zero').optional()
});

type PayrollConfigFormData = z.infer<typeof payrollConfigSchema>;

interface PayrollConfigFormProps {
  payrollConfig?: any;
  onSubmit: (data: PayrollConfigFormData) => void;
  onCancel: () => void;
}

export const PayrollConfigForm: React.FC<PayrollConfigFormProps> = ({
  payrollConfig,
  onSubmit,
  onCancel
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<PayrollConfigFormData>({
    resolver: zodResolver(payrollConfigSchema),
    defaultValues: {
      employee_id: payrollConfig?.employee_id || '',
      regime_hora_extra: payrollConfig?.regime_hora_extra || '',
      vigencia_banco_horas: payrollConfig?.vigencia_banco_horas || 0
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

  const handleFormSubmit = (data: PayrollConfigFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {payrollConfig ? 'Editar Configuração de Folha' : 'Nova Configuração de Folha'}
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

            {/* Regime de Hora Extra */}
            <div className="space-y-2">
              <Label htmlFor="regime_hora_extra">Regime de Hora Extra</Label>
              <Select
                value={watch('regime_hora_extra')}
                onValueChange={(value) => setValue('regime_hora_extra', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o regime" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banco_horas">Banco de Horas</SelectItem>
                  <SelectItem value="hora_extra">Hora Extra</SelectItem>
                  <SelectItem value="misto">Misto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vigência do Banco de Horas */}
            <div className="space-y-2">
              <Label htmlFor="vigencia_banco_horas">Vigência do Banco de Horas (dias)</Label>
              <Input
                id="vigencia_banco_horas"
                type="number"
                min="0"
                {...register('vigencia_banco_horas', { valueAsNumber: true })}
                placeholder="Ex: 30"
              />
              {errors.vigencia_banco_horas && (
                <p className="text-sm text-red-600">{errors.vigencia_banco_horas.message}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : payrollConfig ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
















