import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Car, Laptop, Smartphone, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { EquipmentRental, EquipmentRentalInsert, EquipmentRentalUpdate } from '@/integrations/supabase/rh-equipment-rental-types';

const equipmentRentalSchema = z.object({
  employee_id: z.string().min(1, 'Funcionário é obrigatório'),
  equipment_type: z.enum(['vehicle', 'computer', 'phone', 'other'], {
    required_error: 'Tipo de equipamento é obrigatório'
  }),
  equipment_name: z.string().min(1, 'Nome do equipamento é obrigatório'),
  equipment_description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  license_plate: z.string().optional(),
  monthly_value: z.number().min(0, 'Valor mensal deve ser maior ou igual a zero'),
  start_date: z.date({
    required_error: 'Data de início é obrigatória'
  }),
  end_date: z.date().optional(),
  status: z.enum(['active', 'inactive', 'terminated']).default('active')
});

type EquipmentRentalFormData = z.infer<typeof equipmentRentalSchema>;

interface EquipmentRentalFormProps {
  equipment?: EquipmentRental;
  employees: Array<{ id: string; name: string; cpf: string }>;
  onSubmit: (data: EquipmentRentalInsert | EquipmentRentalUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const equipmentTypeIcons = {
  vehicle: Car,
  computer: Laptop,
  phone: Smartphone,
  other: Package
};

const equipmentTypeLabels = {
  vehicle: 'Veículo',
  computer: 'Computador',
  phone: 'Celular',
  other: 'Outros'
};

export function EquipmentRentalForm({
  equipment,
  employees,
  onSubmit,
  onCancel,
  loading = false
}: EquipmentRentalFormProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [equipmentType, setEquipmentType] = useState<string>('');

  const form = useForm<EquipmentRentalFormData>({
    resolver: zodResolver(equipmentRentalSchema),
    defaultValues: {
      employee_id: equipment?.employee_id || '',
      equipment_type: equipment?.equipment_type || 'other',
      equipment_name: equipment?.equipment_name || '',
      equipment_description: equipment?.equipment_description || '',
      brand: equipment?.brand || '',
      model: equipment?.model || '',
      serial_number: equipment?.serial_number || '',
      license_plate: equipment?.license_plate || '',
      monthly_value: equipment?.monthly_value || 0,
      start_date: equipment?.start_date ? new Date(equipment.start_date) : new Date(),
      end_date: equipment?.end_date ? new Date(equipment.end_date) : undefined,
      status: equipment?.status || 'active'
    }
  });

  useEffect(() => {
    if (equipment) {
      setSelectedEmployee(equipment.employee_id);
      setEquipmentType(equipment.equipment_type);
    }
  }, [equipment]);

  const handleSubmit = async (data: EquipmentRentalFormData) => {
    try {
      const submitData = {
        ...data,
        start_date: data.start_date.toISOString().split('T')[0],
        end_date: data.end_date ? data.end_date.toISOString().split('T')[0] : undefined
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Erro ao salvar equipamento:', error);
    }
  };

  const getEquipmentIcon = (type: keyof typeof equipmentTypeIcons) => {
    const IconComponent = equipmentTypeIcons[type];
    return <IconComponent className="h-4 w-4" />;
  };

  const isVehicle = equipmentType === 'vehicle';
  const isComputer = equipmentType === 'computer';
  const isPhone = equipmentType === 'phone';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {equipment ? 'Editar Equipamento' : 'Novo Equipamento'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Funcionário */}
            <FormField
              control={form.control}
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funcionário *</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedEmployee(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o funcionário" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} - {employee.cpf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo de Equipamento */}
            <FormField
              control={form.control}
              name="equipment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Equipamento *</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setEquipmentType(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(equipmentTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            {getEquipmentIcon(value as keyof typeof equipmentTypeIcons)}
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nome do Equipamento */}
            <FormField
              control={form.control}
              name="equipment_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Equipamento *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Honda Civic 2020" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="equipment_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição adicional do equipamento..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Marca e Modelo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Honda, Dell, Samsung" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Civic, Inspiron, Galaxy" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Número de Série e Placa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="serial_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Série</FormLabel>
                    <FormControl>
                      <Input placeholder="Número de série do equipamento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isVehicle && (
                <FormField
                  control={form.control}
                  name="license_plate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placa do Veículo</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC-1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Valor Mensal */}
            <FormField
              control={form.control}
              name="monthly_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Mensal (R$) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Datas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Fim (opcional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => 
                            date < new Date() || 
                            (form.getValues('start_date') && date < form.getValues('start_date'))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="terminated">Encerrado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botões */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : equipment ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


