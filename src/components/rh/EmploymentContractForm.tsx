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
import { rhSupabase, rhTable } from '@/integrations/supabase/rh-client';

const employmentContractSchema = z.object({
  employee_id: z.string().min(1, 'Funcionário é obrigatório'),
  position_id: z.string().min(1, 'Cargo é obrigatório'),
  work_schedule_id: z.string().optional(),
  tipo_contrato: z.enum(['clt', 'pj', 'estagiario', 'temporario', 'terceirizado']),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_fim: z.string().optional(),
  salario_base: z.number().min(0, 'Salário deve ser maior ou igual a zero').optional(),
  sindicato_id: z.string().optional(),
  is_active: z.boolean().default(true)
});

type EmploymentContractFormData = z.infer<typeof employmentContractSchema>;

interface EmploymentContractFormProps {
  contract?: any;
  onSubmit: (data: EmploymentContractFormData) => void;
  onCancel: () => void;
}

export const EmploymentContractForm: React.FC<EmploymentContractFormProps> = ({
  contract,
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
  } = useForm<EmploymentContractFormData>({
    resolver: zodResolver(employmentContractSchema),
    defaultValues: {
      employee_id: contract?.employee_id || '',
      position_id: contract?.position_id || '',
      work_schedule_id: contract?.work_schedule_id || '',
      tipo_contrato: contract?.tipo_contrato || 'clt',
      data_inicio: contract?.data_inicio || '',
      data_fim: contract?.data_fim || '',
      salario_base: contract?.salario_base || 0,
      sindicato_id: contract?.sindicato_id || '',
      is_active: contract?.is_active ?? true
    }
  });

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await rhTable('employees')
        .select('id, nome, matricula')
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch positions
  const { data: positions = [] } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const { data, error } = await rhTable('positions')
        .select('id, nome, codigo')
        .eq('is_active', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch work schedules
  const { data: workSchedules = [] } = useQuery({
    queryKey: ['work-shifts'],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .schema('rh')
        .from('rh.work_shifts')
        .select('id, nome')
        .eq('is_active', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch unions
  const { data: unions = [] } = useQuery({
    queryKey: ['unions'],
    queryFn: async () => {
      const { data, error } = await rhTable('unions')
        .select('id, nome')
        .eq('is_active', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (contract) {
      setIsActive(contract.is_active ?? true);
    }
  }, [contract]);

  const handleFormSubmit = (data: EmploymentContractFormData) => {
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
            {contract ? 'Editar Contrato de Trabalho' : 'Novo Contrato de Trabalho'}
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

            {/* Cargo */}
            <div className="space-y-2">
              <Label htmlFor="position_id">Cargo *</Label>
              <Select
                value={watch('position_id')}
                onValueChange={(value) => setValue('position_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cargo" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position.id} value={position.id}>
                      {position.nome} ({position.codigo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.position_id && (
                <p className="text-sm text-red-600">{errors.position_id.message}</p>
              )}
            </div>

            {/* Tipo de Contrato */}
            <div className="space-y-2">
              <Label htmlFor="tipo_contrato">Tipo de Contrato *</Label>
              <Select
                value={watch('tipo_contrato')}
                onValueChange={(value) => setValue('tipo_contrato', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clt">CLT</SelectItem>
                  <SelectItem value="pj">PJ</SelectItem>
                  <SelectItem value="estagiario">Estagiário</SelectItem>
                  <SelectItem value="temporario">Temporário</SelectItem>
                  <SelectItem value="terceirizado">Terceirizado</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo_contrato && (
                <p className="text-sm text-red-600">{errors.tipo_contrato.message}</p>
              )}
            </div>

            {/* Jornada de Trabalho */}
            <div className="space-y-2">
              <Label htmlFor="work_schedule_id">Jornada de Trabalho</Label>
              <Select
                value={watch('work_schedule_id')}
                onValueChange={(value) => setValue('work_schedule_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma jornada" />
                </SelectTrigger>
                <SelectContent>
                  {workSchedules.map((schedule) => (
                    <SelectItem key={schedule.id} value={schedule.id}>
                      {schedule.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            {/* Salário Base */}
            <div className="space-y-2">
              <Label htmlFor="salario_base">Salário Base</Label>
              <Input
                id="salario_base"
                type="number"
                step="0.01"
                min="0"
                {...register('salario_base', { valueAsNumber: true })}
              />
              {errors.salario_base && (
                <p className="text-sm text-red-600">{errors.salario_base.message}</p>
              )}
            </div>

            {/* Sindicato */}
            <div className="space-y-2">
              <Label htmlFor="sindicato_id">Sindicato</Label>
              <Select
                value={watch('sindicato_id')}
                onValueChange={(value) => setValue('sindicato_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um sindicato" />
                </SelectTrigger>
                <SelectContent>
                  {unions.map((union) => (
                    <SelectItem key={union.id} value={union.id}>
                      {union.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status Ativo */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="is_active">Contrato ativo</Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : contract ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};




















