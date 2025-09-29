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
import { CalendarIcon, Loader2, Plus, Trash2, Edit, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FuncionarioBeneficioHistorico, 
  FuncionarioBeneficioHistoricoInsert, 
  FuncionarioBeneficioHistoricoUpdate,
  Benefit
} from '@/integrations/supabase/rh-types';

// Schema de validação
const benefitSchema = z.object({
  benefit_id: z.string().min(1, 'Benefício é obrigatório'),
  convenio_id: z.string().optional(),
  vr_va_config_id: z.string().optional(),
  transporte_config_id: z.string().optional(),
  valor_beneficio: z.number().min(0, 'Valor deve ser positivo'),
  valor_desconto: z.number().min(0, 'Valor de desconto deve ser positivo').optional(),
  valor_final: z.number().min(0, 'Valor final deve ser positivo'),
  motivo_desconto: z.string().optional(),
  mes_referencia: z.number().min(1).max(12, 'Mês deve ser entre 1 e 12'),
  ano_referencia: z.number().min(2020, 'Ano deve ser maior que 2020'),
  status: z.enum(['ativo', 'suspenso', 'cancelado']).default('ativo'),
  data_inicio: z.date(),
  data_fim: z.date().optional(),
});

type BenefitFormData = z.infer<typeof benefitSchema>;

export interface EmployeeBenefitsProps {
  employeeId: string;
  benefits?: FuncionarioBeneficioHistorico[];
  benefitTypes?: Benefit[];
  onSubmit: (data: FuncionarioBeneficioHistoricoInsert | FuncionarioBeneficioHistoricoUpdate) => Promise<void>;
  onUpdate?: (id: string, data: FuncionarioBeneficioHistoricoUpdate) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export function EmployeeBenefits({
  employeeId,
  benefits = [],
  benefitTypes = [],
  onSubmit,
  onUpdate,
  onDelete,
  loading = false,
  className = '',
}: EmployeeBenefitsProps) {
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>();
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>();
  const [editingBenefit, setEditingBenefit] = useState<FuncionarioBeneficioHistorico | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = useForm<BenefitFormData>({
    resolver: zodResolver(benefitSchema),
    defaultValues: {
      valor_beneficio: 0,
      valor_desconto: 0,
      valor_final: 0,
      mes_referencia: new Date().getMonth() + 1,
      ano_referencia: new Date().getFullYear(),
      status: 'ativo',
    },
  });

  const watchedValorBeneficio = watch('valor_beneficio');
  const watchedValorDesconto = watch('valor_desconto');

  // Calcular valor final automaticamente
  React.useEffect(() => {
    const valorFinal = (watchedValorBeneficio || 0) - (watchedValorDesconto || 0);
    setValue('valor_final', Math.max(0, valorFinal));
  }, [watchedValorBeneficio, watchedValorDesconto, setValue]);

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
    if (editingBenefit) {
      setValue('benefit_id', editingBenefit.benefit_id);
      setValue('convenio_id', editingBenefit.convenio_id || '');
      setValue('vr_va_config_id', editingBenefit.vr_va_config_id || '');
      setValue('transporte_config_id', editingBenefit.transporte_config_id || '');
      setValue('valor_beneficio', editingBenefit.valor_beneficio);
      setValue('valor_desconto', editingBenefit.valor_desconto || 0);
      setValue('valor_final', editingBenefit.valor_final);
      setValue('motivo_desconto', editingBenefit.motivo_desconto || '');
      setValue('mes_referencia', editingBenefit.mes_referencia);
      setValue('ano_referencia', editingBenefit.ano_referencia);
      setValue('status', editingBenefit.status);
      setValue('data_inicio', new Date(editingBenefit.data_inicio));
      setValue('data_fim', editingBenefit.data_fim ? new Date(editingBenefit.data_fim) : undefined);
      setSelectedStartDate(new Date(editingBenefit.data_inicio));
      setSelectedEndDate(editingBenefit.data_fim ? new Date(editingBenefit.data_fim) : undefined);
      setIsFormOpen(true);
    }
  }, [editingBenefit, setValue]);

  const handleFormSubmit = async (data: BenefitFormData) => {
    try {
      const benefitData: FuncionarioBeneficioHistoricoInsert = {
        employee_id: employeeId,
        benefit_id: data.benefit_id,
        convenio_id: data.convenio_id || null,
        vr_va_config_id: data.vr_va_config_id || null,
        transporte_config_id: data.transporte_config_id || null,
        valor_beneficio: data.valor_beneficio,
        valor_desconto: data.valor_desconto || null,
        valor_final: data.valor_final,
        motivo_desconto: data.motivo_desconto || null,
        mes_referencia: data.mes_referencia,
        ano_referencia: data.ano_referencia,
        status: data.status,
        data_inicio: data.data_inicio.toISOString().split('T')[0],
        data_fim: data.data_fim?.toISOString().split('T')[0] || null,
      };

      if (editingBenefit) {
        await onUpdate?.(editingBenefit.id, benefitData);
        setEditingBenefit(null);
      } else {
        await onSubmit(benefitData);
      }
      
      reset();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Erro ao salvar benefício:', error);
    }
  };

  const handleEdit = (benefit: FuncionarioBeneficioHistorico) => {
    setEditingBenefit(benefit);
  };

  const handleCancel = () => {
    setEditingBenefit(null);
    setIsFormOpen(false);
    reset();
    setSelectedStartDate(undefined);
    setSelectedEndDate(undefined);
  };

  const getBenefitName = (id: string) => {
    return benefitTypes.find(bt => bt.id === id)?.nome || 'N/A';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'suspenso': return 'bg-yellow-100 text-yellow-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
            <Gift className="h-5 w-5" />
            Benefícios
          </CardTitle>
          <Button
            onClick={() => setIsFormOpen(true)}
            size="sm"
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Benefício
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Formulário */}
        {isFormOpen && (
          <div className="mb-6 p-4 border rounded-lg bg-muted/50">
            <h3 className="text-lg font-medium mb-4">
              {editingBenefit ? 'Editar Benefício' : 'Novo Benefício'}
            </h3>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="benefit_id">Benefício *</Label>
                  <Select
                    value={watch('benefit_id')}
                    onValueChange={(value) => setValue('benefit_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o benefício" />
                    </SelectTrigger>
                    <SelectContent>
                      {benefitTypes.map((benefit) => (
                        <SelectItem key={benefit.id} value={benefit.id}>
                          {benefit.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={watch('status')}
                    onValueChange={(value) => setValue('status', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="suspenso">Suspenso</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_beneficio">Valor do Benefício *</Label>
                  <Input
                    id="valor_beneficio"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('valor_beneficio', { valueAsNumber: true })}
                    placeholder="0,00"
                    className={errors.valor_beneficio ? 'border-destructive' : ''}
                  />
                  {errors.valor_beneficio && (
                    <p className="text-sm text-destructive">{errors.valor_beneficio.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_desconto">Valor de Desconto</Label>
                  <Input
                    id="valor_desconto"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('valor_desconto', { valueAsNumber: true })}
                    placeholder="0,00"
                    className={errors.valor_desconto ? 'border-destructive' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_final">Valor Final</Label>
                  <Input
                    id="valor_final"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('valor_final', { valueAsNumber: true })}
                    placeholder="0,00"
                    readOnly
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivo_desconto">Motivo do Desconto</Label>
                  <Input
                    id="motivo_desconto"
                    {...register('motivo_desconto')}
                    placeholder="Ex: Falta, atraso, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mes_referencia">Mês de Referência *</Label>
                  <Select
                    value={watch('mes_referencia').toString()}
                    onValueChange={(value) => setValue('mes_referencia', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <SelectItem key={month} value={month.toString()}>
                          {new Date(2024, month - 1).toLocaleDateString('pt-BR', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ano_referencia">Ano de Referência *</Label>
                  <Input
                    id="ano_referencia"
                    type="number"
                    min="2020"
                    max="2030"
                    {...register('ano_referencia', { valueAsNumber: true })}
                    placeholder="2024"
                    className={errors.ano_referencia ? 'border-destructive' : ''}
                  />
                  {errors.ano_referencia && (
                    <p className="text-sm text-destructive">{errors.ano_referencia.message}</p>
                  )}
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
                    editingBenefit ? 'Atualizar' : 'Adicionar'
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Benefícios */}
        {benefits.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Benefícios Cadastrados</h3>
            <div className="space-y-2">
              {benefits.map((benefit) => (
                <div key={benefit.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{getBenefitName(benefit.benefit_id)}</h4>
                      <Badge className={getStatusColor(benefit.status)}>
                        {benefit.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Valor: {formatCurrency(benefit.valor_beneficio)}</p>
                      {benefit.valor_desconto && benefit.valor_desconto > 0 && (
                        <p>Desconto: {formatCurrency(benefit.valor_desconto)}</p>
                      )}
                      <p>Valor Final: {formatCurrency(benefit.valor_final)}</p>
                      <p>Referência: {benefit.mes_referencia.toString().padStart(2, '0')}/{benefit.ano_referencia}</p>
                      <p>Período: {new Date(benefit.data_inicio).toLocaleDateString('pt-BR')} 
                        {benefit.data_fim && ` - ${new Date(benefit.data_fim).toLocaleDateString('pt-BR')}`}
                      </p>
                      {benefit.motivo_desconto && (
                        <p>Motivo do Desconto: {benefit.motivo_desconto}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(benefit)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {onDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(benefit.id)}
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
            <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum benefício cadastrado</p>
            <p className="text-sm">Clique em "Adicionar Benefício" para começar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

