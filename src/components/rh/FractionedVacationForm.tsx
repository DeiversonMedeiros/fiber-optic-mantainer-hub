// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Users, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { FractionedVacationForm, VacationPeriodForm, VacationValidation } from '@/integrations/supabase/rh-types';
import { useVacationYears } from '@/hooks/useVacationYears';

const vacationPeriodSchema = z.object({
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().min(1, 'Data de fim é obrigatória'),
  diasFerias: z.number().min(5, 'Mínimo 5 dias').max(30, 'Máximo 30 dias'),
  diasAbono: z.number().min(0, 'Mínimo 0 dias').max(10, 'Máximo 10 dias'),
  observacoes: z.string().optional(),
});

const fractionedVacationSchema = z.object({
  tipoFracionamento: z.enum(['integral', 'fracionado']),
  ano: z.number().min(2000).max(2100),
  periodos: z.array(vacationPeriodSchema).min(1, 'Pelo menos um período é obrigatório'),
  observacoes: z.string().optional(),
});

type FractionedVacationFormData = z.infer<typeof fractionedVacationSchema>;

interface FractionedVacationFormProps {
  onSubmit: (data: FractionedVacationForm) => void;
  onCancel: () => void;
  isLoading?: boolean;
  companyId: string;
  employeeId: string;
}

export function FractionedVacationFormComponent({ 
  onSubmit, 
  onCancel, 
  isLoading = false,
  companyId,
  employeeId
}: FractionedVacationFormProps) {
  const [validation, setValidation] = useState<VacationValidation | null>(null);
  const [periodos, setPeriodos] = useState<VacationPeriodForm[]>([
    {
      dataInicio: '',
      dataFim: '',
      diasFerias: 0,
      diasAbono: 0,
      observacoes: ''
    }
  ]);

  // Buscar anos de férias disponíveis
  const { data: availableYears, isLoading: loadingYears } = useVacationYears(employeeId);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<FractionedVacationFormData>({
    resolver: zodResolver(fractionedVacationSchema),
    defaultValues: {
      tipoFracionamento: 'integral',
      ano: new Date().getFullYear(),
      periodos: periodos,
      observacoes: '',
    },
  });

  const watchedTipoFracionamento = watch('tipoFracionamento');
  const watchedAno = watch('ano');

  // Atualizar períodos no formulário quando mudarem
  useEffect(() => {
    setValue('periodos', periodos);
  }, [periodos, setValue]);

  // Definir ano padrão quando os anos disponíveis carregarem
  useEffect(() => {
    if (availableYears && availableYears.length > 0 && !watchedAno) {
      setValue('ano', availableYears[0].ano);
    }
  }, [availableYears, watchedAno, setValue]);

  // Validar férias fracionadas em tempo real
  useEffect(() => {
    if (watchedTipoFracionamento === 'fracionado' && periodos.length > 0) {
      validateFractionedVacation();
    }
  }, [periodos, watchedTipoFracionamento, watchedAno]);

  const validateFractionedVacation = async () => {
    try {
      const periodosData = periodos.map(p => ({
        data_inicio: p.dataInicio,
        data_fim: p.dataFim,
        dias_ferias: p.diasFerias,
        dias_abono: p.diasAbono
      }));

      const totalDias = periodosData.reduce((sum, p) => sum + p.dias_ferias, 0);
      const temPeriodo14Dias = periodosData.some(p => p.dias_ferias >= 14);
      
      // Buscar dias disponíveis para o ano selecionado
      const selectedYear = availableYears?.find(y => y.ano === watchedAno);
      const diasDisponiveis = selectedYear?.dias_disponiveis || 30;
      
      // Validar se não excede os dias disponíveis
      const excedeDisponivel = totalDias > diasDisponiveis;
      const valido = !excedeDisponivel && totalDias <= 30 && temPeriodo14Dias && periodosData.every(p => p.dias_ferias >= 5);

      let mensagem = 'Férias fracionadas válidas';
      if (excedeDisponivel) {
        mensagem = `Excede os dias disponíveis (${diasDisponiveis} dias)`;
      } else if (!temPeriodo14Dias) {
        mensagem = 'Pelo menos um período deve ter 14 dias ou mais';
      } else if (totalDias > 30) {
        mensagem = 'Total não pode exceder 30 dias';
      } else if (!periodosData.every(p => p.dias_ferias >= 5)) {
        mensagem = 'Cada período deve ter no mínimo 5 dias';
      }

      setValidation({
        valido,
        mensagem,
        total_dias: totalDias,
        tem_periodo_14_dias: temPeriodo14Dias
      });
    } catch (error) {
      console.error('Erro na validação:', error);
    }
  };

  const addPeriodo = () => {
    if (periodos.length < 3) {
      setPeriodos([...periodos, {
        dataInicio: '',
        dataFim: '',
        diasFerias: 0,
        diasAbono: 0,
        observacoes: ''
      }]);
    }
  };

  const removePeriodo = (index: number) => {
    if (periodos.length > 1) {
      setPeriodos(periodos.filter((_, i) => i !== index));
    }
  };

  const updatePeriodo = (index: number, field: keyof VacationPeriodForm, value: any) => {
    const newPeriodos = [...periodos];
    newPeriodos[index] = { ...newPeriodos[index], [field]: value };
    
    // Calcular dias automaticamente se mudou as datas
    if (field === 'dataInicio' || field === 'dataFim') {
      const inicio = new Date(newPeriodos[index].dataInicio);
      const fim = new Date(newPeriodos[index].dataFim);
      if (!isNaN(inicio.getTime()) && !isNaN(fim.getTime()) && inicio <= fim) {
        const diffTime = Math.abs(fim.getTime() - inicio.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        newPeriodos[index].diasFerias = diffDays;
      }
    }
    
    setPeriodos(newPeriodos);
  };

  const handleFormSubmit = (data: FractionedVacationFormData) => {
    onSubmit(data);
  };

  const getValidationIcon = () => {
    if (!validation) return null;
    return validation.valido ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  const getValidationColor = () => {
    if (!validation) return 'text-gray-600';
    return validation.valido ? 'text-green-600' : 'text-red-600';
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Tipo de Férias */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Tipo de Férias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="tipoFracionamento">Tipo de Férias *</Label>
            <Select
              value={watchedTipoFracionamento}
              onValueChange={(value) => setValue('tipoFracionamento', value as 'integral' | 'fracionado')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="integral">Férias Integrais (30 dias seguidos)</SelectItem>
                <SelectItem value="fracionado">Férias Fracionadas (até 3 períodos)</SelectItem>
              </SelectContent>
            </Select>
            {errors.tipoFracionamento && (
              <p className="text-sm text-destructive">{errors.tipoFracionamento.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ano">Ano de Referência *</Label>
            {loadingYears ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">Carregando anos disponíveis...</span>
              </div>
            ) : availableYears && availableYears.length > 0 ? (
              <Select
                value={watchedAno.toString()}
                onValueChange={(value) => setValue('ano', parseInt(value))}
              >
                <SelectTrigger className={errors.ano ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year.ano} value={year.ano.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{year.ano}</span>
                        <div className="flex items-center space-x-2 ml-4">
                          <Badge 
                            variant={year.status === 'Disponível' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {year.dias_disponiveis} dias
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {year.status}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-muted-foreground p-2 border rounded">
                Nenhum ano com férias disponíveis encontrado.
              </div>
            )}
            {errors.ano && (
              <p className="text-sm text-destructive">{errors.ano.message}</p>
            )}
            {availableYears && availableYears.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Mostrando apenas anos com férias disponíveis para gozo.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Períodos de Férias */}
      {watchedTipoFracionamento === 'fracionado' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Períodos de Férias Fracionadas
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPeriodo}
                disabled={periodos.length >= 3}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Período
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {periodos.map((periodo, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Período {index + 1}</h4>
                  {periodos.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePeriodo(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`dataInicio-${index}`}>Data de Início *</Label>
                    <Input
                      id={`dataInicio-${index}`}
                      type="date"
                      value={periodo.dataInicio}
                      onChange={(e) => updatePeriodo(index, 'dataInicio', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`dataFim-${index}`}>Data de Fim *</Label>
                    <Input
                      id={`dataFim-${index}`}
                      type="date"
                      value={periodo.dataFim}
                      onChange={(e) => updatePeriodo(index, 'dataFim', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`diasFerias-${index}`}>Dias de Férias *</Label>
                    <Input
                      id={`diasFerias-${index}`}
                      type="number"
                      min="5"
                      max="30"
                      value={periodo.diasFerias}
                      onChange={(e) => updatePeriodo(index, 'diasFerias', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`diasAbono-${index}`}>Dias de Abono</Label>
                    <Input
                      id={`diasAbono-${index}`}
                      type="number"
                      min="0"
                      max="10"
                      value={periodo.diasAbono}
                      onChange={(e) => updatePeriodo(index, 'diasAbono', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`observacoes-${index}`} className="text-sm">Observações</Label>
                  <Textarea
                    id={`observacoes-${index}`}
                    placeholder="Observações sobre este período (opcional)"
                    value={periodo.observacoes}
                    onChange={(e) => updatePeriodo(index, 'observacoes', e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </div>
            ))}

            {/* Validação */}
            {validation && (
              <Alert className={validation.valido ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-center gap-2">
                  {getValidationIcon()}
                  <AlertDescription className={getValidationColor()}>
                    <strong>{validation.mensagem}</strong>
                    <br />
                    Total de dias: {validation.total_dias}/30
                    <br />
                    Tem período com 14+ dias: {validation.tem_periodo_14_dias ? 'Sim' : 'Não'}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Regras da legislação */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-blue-900 mb-2 text-sm">Regras da Legislação Brasileira</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Máximo de 3 períodos de férias</li>
                <li>• Pelo menos um período deve ter 14 dias ou mais</li>
                <li>• Demais períodos devem ter no mínimo 5 dias</li>
                <li>• Total não pode exceder 30 dias</li>
                <li>• Concordância mútua entre empregado e empregador</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Férias Integrais */}
      {watchedTipoFracionamento === 'integral' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Período de Férias Integrais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableYears && availableYears.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Dias disponíveis para {watchedAno}:</strong> {
                    availableYears.find(y => y.ano === watchedAno)?.dias_disponiveis || 0
                  } dias
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="dataInicioIntegral">Data de Início *</Label>
                <Input
                  id="dataInicioIntegral"
                  type="date"
                  {...register('periodos.0.dataInicio')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataFimIntegral">Data de Fim *</Label>
                <Input
                  id="dataFimIntegral"
                  type="date"
                  {...register('periodos.0.dataFim')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diasFeriasIntegral">Dias de Férias *</Label>
                <Input
                  id="diasFeriasIntegral"
                  type="number"
                  min="1"
                  max={availableYears?.find(y => y.ano === watchedAno)?.dias_disponiveis || 30}
                  {...register('periodos.0.diasFerias', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diasAbonoIntegral">Dias de Abono</Label>
                <Input
                  id="diasAbonoIntegral"
                  type="number"
                  min="0"
                  max="10"
                  {...register('periodos.0.diasAbono', { valueAsNumber: true })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observações Gerais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Observações Gerais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...register('observacoes')}
              placeholder="Observações sobre as férias (opcional)"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-end space-x-2 pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          size="sm"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={!isValid || isLoading || (watchedTipoFracionamento === 'fracionado' && !validation?.valido)}
          size="sm"
        >
          {isLoading ? 'Enviando...' : 'Enviar Solicitação'}
        </Button>
      </div>
    </form>
  );
}