import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Loader2, Plus, Trash2, Edit, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  EmploymentContract, 
  EmploymentContractInsert, 
  EmploymentContractUpdate,
  Position,
  WorkSchedule
} from '@/integrations/supabase/rh-types';

// Schema de validação
const contractSchema = z.object({
  position_id: z.string().min(1, 'Cargo é obrigatório'),
  work_schedule_id: z.string().min(1, 'Escala de trabalho é obrigatória'),
  tipo_contrato: z.enum(['clt', 'pj', 'estagiario', 'temporario', 'terceirizado']),
  data_inicio: z.date(),
  data_fim: z.date().optional(),
  salario_base: z.number().min(0, 'Salário deve ser positivo'),
  sindicato_id: z.string().optional(),
});

type ContractFormData = z.infer<typeof contractSchema>;

export interface EmployeeContractsProps {
  employeeId: string;
  contracts?: EmploymentContract[];
  positions?: Position[];
  workSchedules?: WorkSchedule[];
  onSubmit: (data: EmploymentContractInsert | EmploymentContractUpdate) => Promise<void>;
  onUpdate?: (id: string, data: EmploymentContractUpdate) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export function EmployeeContracts({
  employeeId,
  contracts = [],
  positions = [],
  workSchedules = [],
  onSubmit,
  onUpdate,
  onDelete,
  loading = false,
  className = '',
}: EmployeeContractsProps) {
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>();
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>();
  const [editingContract, setEditingContract] = useState<EmploymentContract | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      tipo_contrato: 'clt',
      salario_base: 0,
    },
  });

  // Atualizar valores quando as datas mudarem
  React.useEffect(() => {
    if (selectedStartDate) {
      setValue('data_inicio', selectedStartDate);
    }
    if (selectedEndDate) {
      setValue('data_fim', selectedEndDate);
    }
  }, [selectedStartDate, selectedEndDate, setValue]);

  // Preencher formulário quando editando
  React.useEffect(() => {
    if (editingContract) {
      setValue('position_id', editingContract.position_id || '');
      setValue('work_schedule_id', editingContract.work_schedule_id || '');
      setValue('tipo_contrato', editingContract.tipo_contrato);
      setValue('salario_base', editingContract.salario_base || 0);
      setValue('sindicato_id', editingContract.sindicato_id || '');
      setValue('data_inicio', editingContract.data_inicio ? new Date(editingContract.data_inicio) : new Date());
      setValue('data_fim', editingContract.data_fim ? new Date(editingContract.data_fim) : undefined);
      setSelectedStartDate(editingContract.data_inicio ? new Date(editingContract.data_inicio) : new Date());
      setSelectedEndDate(editingContract.data_fim ? new Date(editingContract.data_fim) : undefined);
      setIsFormOpen(true);
    }
  }, [editingContract, setValue]);

  const handleFormSubmit = async (data: ContractFormData) => {
    try {
      const contractData: EmploymentContractInsert = {
        employee_id: employeeId,
        position_id: data.position_id,
        work_schedule_id: data.work_schedule_id,
        tipo_contrato: data.tipo_contrato,
        data_inicio: data.data_inicio.toISOString().split('T')[0],
        data_fim: data.data_fim?.toISOString().split('T')[0] || null,
        salario_base: data.salario_base,
        sindicato_id: data.sindicato_id || null,
      };

      if (editingContract) {
        await onUpdate?.(editingContract.id, contractData);
        setEditingContract(null);
      } else {
        await onSubmit(contractData);
      }
      
      reset();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Erro ao salvar contrato:', error);
    }
  };

  const handleEdit = (contract: EmploymentContract) => {
    setEditingContract(contract);
  };

  const handleCancel = () => {
    setEditingContract(null);
    setIsFormOpen(false);
    reset();
    setSelectedStartDate(undefined);
    setSelectedEndDate(undefined);
  };

  const getPositionName = (id: string) => {
    return positions.find(p => p.id === id)?.nome || 'N/A';
  };

  const getWorkScheduleName = (id: string) => {
    return workSchedules.find(ws => ws.id === id)?.nome || 'N/A';
  };

  const getContractTypeLabel = (type: string) => {
    const labels = {
      clt: 'CLT',
      pj: 'PJ',
      estagiario: 'Estagiário',
      temporario: 'Temporário',
      terceirizado: 'Terceirizado'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getContractTypeColor = (type: string) => {
    const colors = {
      clt: 'bg-blue-100 text-blue-800',
      pj: 'bg-green-100 text-green-800',
      estagiario: 'bg-yellow-100 text-yellow-800',
      temporario: 'bg-orange-100 text-orange-800',
      terceirizado: 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contratos de Trabalho
          </CardTitle>
          <Button
            onClick={() => setIsFormOpen(true)}
            size="sm"
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Contrato
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Formulário */}
        {isFormOpen && (
          <div className="mb-6 p-4 border rounded-lg bg-muted/50">
            <h3 className="text-lg font-medium mb-4">
              {editingContract ? 'Editar Contrato' : 'Novo Contrato'}
            </h3>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position_id">Cargo *</Label>
                  <Select
                    value={watch('position_id')}
                    onValueChange={(value) => setValue('position_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem key={position.id} value={position.id}>
                          {position.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="work_schedule_id">Escala de Trabalho *</Label>
                  <Select
                    value={watch('work_schedule_id')}
                    onValueChange={(value) => setValue('work_schedule_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a escala" />
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

                <div className="space-y-2">
                  <Label htmlFor="salario_base">Salário Base *</Label>
                  <Input
                    id="salario_base"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('salario_base', { valueAsNumber: true })}
                    placeholder="0,00"
                    className={errors.salario_base ? 'border-destructive' : ''}
                  />
                  {errors.salario_base && (
                    <p className="text-sm text-destructive">{errors.salario_base.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sindicato_id">Sindicato</Label>
                  <Input
                    id="sindicato_id"
                    {...register('sindicato_id')}
                    placeholder="ID do sindicato (opcional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data de Início *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !selectedStartDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedStartDate ? (
                          format(selectedStartDate, 'dd/MM/yyyy', { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedStartDate}
                        onSelect={setSelectedStartDate}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Data de Fim</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !selectedEndDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedEndDate ? (
                          format(selectedEndDate, 'dd/MM/yyyy', { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedEndDate}
                        onSelect={setSelectedEndDate}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!isValid || loading}
                  className="min-w-[100px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingContract ? 'Atualizar' : 'Adicionar'
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Contratos */}
        {contracts.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contratos Cadastrados</h3>
            <div className="space-y-2">
              {contracts.map((contract) => (
                <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{getPositionName(contract.position_id || '')}</h4>
                      <Badge className={getContractTypeColor(contract.tipo_contrato)}>
                        {getContractTypeLabel(contract.tipo_contrato)}
                      </Badge>
                      {contract.is_active && (
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          Ativo
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Escala: {getWorkScheduleName(contract.work_schedule_id || '')}</p>
                      <p>Salário: {formatCurrency(contract.salario_base || 0)}</p>
                      <p>Período: {contract.data_inicio ? new Date(contract.data_inicio).toLocaleDateString('pt-BR') : 'N/A'} 
                        {contract.data_fim && ` - ${new Date(contract.data_fim).toLocaleDateString('pt-BR')}`}
                      </p>
                      {contract.sindicato_id && (
                        <p>Sindicato: {contract.sindicato_id}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(contract)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {onDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(contract.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum contrato cadastrado</p>
            <p className="text-sm">Clique em "Adicionar Contrato" para começar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

