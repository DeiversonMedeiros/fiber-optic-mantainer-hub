import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TimeRecord, TimeRecordInsert, TimeRecordUpdate, Employee } from '@/integrations/supabase/rh-types';
import { useEmployees } from '@/hooks/rh';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FormSection, FormField, FormRow, FormColumn } from './FormModal';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const timeRecordSchema = z.object({
  employee_id: z.string().min(1, 'Funcionário é obrigatório'),
  data: z.date({
    required_error: 'Data é obrigatória',
  }),
  entrada: z.string().min(1, 'Horário de entrada é obrigatório'),
  saida: z.string().min(1, 'Horário de saída é obrigatório'),
  tipo_registro: z.enum(['normal', 'extra']).default('normal'),
  status: z.enum(['pending', 'approved', 'rejected', 'processing']).default('pending'),
  observacoes: z.string().max(500, 'Observações muito longas').optional(),
  justificativa: z.string().max(500, 'Justificativa muito longa').optional(),
});

type TimeRecordFormData = z.infer<typeof timeRecordSchema>;

export interface TimeRecordFormProps {
  timeRecord?: TimeRecord;
  onSubmit: (data: TimeRecordFormData) => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
}

export function TimeRecordForm({
  timeRecord,
  onSubmit,
  onCancel,
  loading = false,
  className = ''
}: TimeRecordFormProps) {
  const isEditing = !!timeRecord;
  const { employees, isLoading: employeesLoading } = useEmployees();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<TimeRecordFormData>({
    resolver: zodResolver(timeRecordSchema),
    defaultValues: timeRecord ? {
      employee_id: timeRecord.employee_id,
      data: new Date(timeRecord.data),
      entrada: timeRecord.entrada ? format(new Date(timeRecord.entrada), 'HH:mm') : '',
      saida: timeRecord.saida ? format(new Date(timeRecord.saida), 'HH:mm') : '',
      tipo_registro: timeRecord.tipo_registro,
      status: timeRecord.status,
      observacoes: timeRecord.observacoes || '',
      justificativa: timeRecord.justificativa || '',
    } : {
      employee_id: '',
      data: new Date(),
      entrada: '',
      saida: '',
      tipo_registro: 'normal',
      status: 'pending',
      observacoes: '',
      justificativa: '',
    },
  });

  const handleFormSubmit = async (data: TimeRecordFormData) => {
    try {
      // Converter horários para formato ISO
      const entradaTime = new Date(data.data);
      const [entradaHours, entradaMinutes] = data.entrada.split(':');
      entradaTime.setHours(parseInt(entradaHours), parseInt(entradaMinutes), 0, 0);

      const saidaTime = new Date(data.data);
      const [saidaHours, saidaMinutes] = data.saida.split(':');
      saidaTime.setHours(parseInt(saidaHours), parseInt(saidaMinutes), 0, 0);

      const submitData = {
        ...data,
        entrada: entradaTime.toISOString(),
        saida: saidaTime.toISOString(),
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Erro ao salvar registro de ponto:', error);
    }
  };

  // Função para validar horários
  const validateTimeRange = () => {
    const entrada = watch('entrada');
    const saida = watch('saida');
    
    if (entrada && saida) {
      const entradaTime = new Date(`2000-01-01T${entrada}:00`);
      const saidaTime = new Date(`2000-01-01T${saida}:00`);
      
      if (entradaTime >= saidaTime) {
        return 'Horário de saída deve ser posterior ao horário de entrada';
      }
    }
    
    return null;
  };

  const timeRangeError = validateTimeRange();

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={`space-y-6 ${className}`}>
      <FormSection title="Informações do Funcionário" description="Selecione o funcionário e a data">
        <FormRow>
          <FormColumn>
            <FormField label="Funcionário *" error={errors.employee_id?.message}>
              <Select
                value={watch('employee_id')}
                onValueChange={(value) => setValue('employee_id', value)}
                disabled={loading || employeesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.nome} - {employee.cpf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </FormColumn>
          <FormColumn>
            <FormField label="Data *" error={errors.data?.message}>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !watch('data') && 'text-muted-foreground'
                    )}
                    disabled={loading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watch('data') ? (
                      format(watch('data'), 'dd/MM/yyyy', { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={watch('data')}
                    onSelect={(date) => date && setValue('data', date)}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </FormField>
          </FormColumn>
        </FormRow>
      </FormSection>

      <FormSection title="Horários" description="Registre os horários de entrada e saída">
        <FormRow>
          <FormColumn>
            <FormField label="Entrada *" error={errors.entrada?.message}>
              <Input
                {...register('entrada')}
                type="time"
                placeholder="08:00"
                disabled={loading}
              />
            </FormField>
          </FormColumn>
          <FormColumn>
            <FormField label="Saída *" error={errors.saida?.message}>
              <Input
                {...register('saida')}
                type="time"
                placeholder="17:00"
                disabled={loading}
              />
            </FormField>
          </FormColumn>
        </FormRow>
        
        {timeRangeError && (
          <div className="text-sm text-destructive mt-2">
            {timeRangeError}
          </div>
        )}
      </FormSection>

      <FormSection title="Tipo e Status" description="Configure o tipo de registro e status">
        <FormRow>
          <FormColumn>
            <FormField label="Tipo de Registro" error={errors.tipo_registro?.message}>
              <Select
                value={watch('tipo_registro')}
                onValueChange={(value) => setValue('tipo_registro', value as 'normal' | 'extra')}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="extra">Horas Extras</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </FormColumn>
          <FormColumn>
            <FormField label="Status" error={errors.status?.message}>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as 'pending' | 'approved' | 'rejected' | 'processing')}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </FormColumn>
        </FormRow>
      </FormSection>

      <FormSection title="Observações" description="Adicione observações ou justificativas">
        <FormField label="Observações" error={errors.observacoes?.message}>
          <Textarea
            {...register('observacoes')}
            placeholder="Ex: Reunião com cliente, projeto urgente..."
            rows={3}
            disabled={loading}
          />
        </FormField>

        <FormField label="Justificativa" error={errors.justificativa?.message}>
          <Textarea
            {...register('justificativa')}
            placeholder="Ex: Justificativa para atraso ou saída antecipada..."
            rows={3}
            disabled={loading}
          />
        </FormField>
      </FormSection>

      {/* Botões de ação */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || !isValid || !!timeRangeError}
        >
          {loading ? 'Salvando...' : isEditing ? 'Atualizar Registro' : 'Criar Registro'}
        </Button>
      </div>
    </form>
  );
}

// Componente para visualizar detalhes do registro de ponto
export function TimeRecordDetails({ timeRecord }: { timeRecord: TimeRecord }) {
  const { employees } = useEmployees();
  
  const getEmployeeName = (employeeId: string) => {
    const employee = employees?.find(emp => emp.id === employeeId);
    return employee?.nome || 'Funcionário não encontrado';
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    return format(new Date(timeString), 'HH:mm');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const calculateWorkedHours = (entry: string, exit: string) => {
    if (!entry || !exit) return 'N/A';
    
    const entryTime = new Date(entry);
    const exitTime = new Date(exit);
    const diffMs = exitTime.getTime() - entryTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return `${diffHours.toFixed(2)}h`;
  };

  const formatStatus = (status: string) => {
    const statusMap = {
      'pending': { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      'approved': { label: 'Aprovado', className: 'bg-green-100 text-green-800' },
      'rejected': { label: 'Rejeitado', className: 'bg-red-100 text-red-800' },
      'processing': { label: 'Processando', className: 'bg-blue-100 text-blue-800' },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, className: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <FormSection title="Informações do Funcionário">
        <FormRow>
          <FormColumn>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Funcionário</Label>
              <div className="text-base font-medium">{getEmployeeName(timeRecord.employee_id)}</div>
            </div>
          </FormColumn>
          <FormColumn>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Data</Label>
              <div className="text-base font-medium">{formatDate(timeRecord.data)}</div>
            </div>
          </FormColumn>
        </FormRow>
      </FormSection>

      <FormSection title="Horários">
        <FormRow>
          <FormColumn>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Entrada</Label>
              <div className="text-base font-medium text-green-600">
                {formatTime(timeRecord.entrada)}
              </div>
            </div>
          </FormColumn>
          <FormColumn>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Saída</Label>
              <div className="text-base font-medium text-red-600">
                {formatTime(timeRecord.saida)}
              </div>
            </div>
          </FormColumn>
        </FormRow>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Horas Trabalhadas</Label>
          <div className="text-base font-medium">
            {calculateWorkedHours(timeRecord.entrada, timeRecord.saida)}
          </div>
        </div>
      </FormSection>

      <FormSection title="Detalhes">
        <FormRow>
          <FormColumn>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Tipo de Registro</Label>
              <div className="text-base">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  timeRecord.tipo_registro === 'normal' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {timeRecord.tipo_registro === 'normal' ? 'Normal' : 'Horas Extras'}
                </span>
              </div>
            </div>
          </FormColumn>
          <FormColumn>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <div className="text-base">
                {formatStatus(timeRecord.status)}
              </div>
            </div>
          </FormColumn>
        </FormRow>
      </FormSection>

      {(timeRecord.observacoes || timeRecord.justificativa) && (
        <FormSection title="Observações e Justificativas">
          {timeRecord.observacoes && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Observações</Label>
              <div className="text-base">{timeRecord.observacoes}</div>
            </div>
          )}

          {timeRecord.justificativa && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Justificativa</Label>
              <div className="text-base">{timeRecord.justificativa}</div>
            </div>
          )}
        </FormSection>
      )}
    </div>
  );
}





