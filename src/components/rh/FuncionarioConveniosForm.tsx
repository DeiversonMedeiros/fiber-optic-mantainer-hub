// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FuncionarioConvenio, FuncionarioConvenioInsert, FuncionarioConvenioUpdate, ConvenioEmpresa, ConvenioPlano } from '@/integrations/supabase/rh-types';
import { useConveniosPlanos } from '@/hooks/rh/useConveniosPlanos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, Stethoscope, FileText } from 'lucide-react';

const funcionarioConvenioSchema = z.object({
  convenio_plano_id: z.string().min(1, 'Plano do convênio é obrigatório'),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_fim: z.string().optional(),
  valor_titular: z.number().min(0, 'Valor deve ser maior ou igual a 0'),
  valor_dependentes: z.number().min(0, 'Valor deve ser maior ou igual a 0'),
  valor_total: z.number().min(0, 'Valor deve ser maior ou igual a 0'),
  status: z.enum(['ativo', 'suspenso', 'cancelado']).default('ativo'),
  observacoes: z.string().optional(),
  employee_id: z.string().min(1, 'ID do funcionário é obrigatório'),
});

type FuncionarioConvenioFormData = z.infer<typeof funcionarioConvenioSchema>;

interface FuncionarioConveniosFormProps {
  initialData?: FuncionarioConvenio;
  onSubmit: (data: FuncionarioConvenioInsert | FuncionarioConvenioUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
  employeeId: string;
  conveniosEmpresas: ConvenioEmpresa[];
}

export function FuncionarioConveniosForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  employeeId,
  conveniosEmpresas 
}: FuncionarioConveniosFormProps) {
  const [selectedConvenioEmpresaId, setSelectedConvenioEmpresaId] = useState<string>('');
  const [conveniosPlanos, setConveniosPlanos] = useState<ConvenioPlano[]>([]);
  const isEditing = !!initialData;

  const {
    conveniosPlanos: planosData,
    isLoading: isLoadingPlanos,
  } = useConveniosPlanos(selectedConvenioEmpresaId);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<FuncionarioConvenioFormData>({
    resolver: zodResolver(funcionarioConvenioSchema),
    defaultValues: {
      convenio_plano_id: initialData?.convenio_plano_id || '',
      data_inicio: initialData?.data_inicio || '',
      data_fim: initialData?.data_fim || '',
      valor_titular: initialData?.valor_titular || 0,
      valor_dependentes: initialData?.valor_dependentes || 0,
      valor_total: initialData?.valor_total || 0,
      status: (initialData?.status as any) || 'ativo',
      observacoes: initialData?.observacoes || '',
      employee_id: employeeId,
    },
  });

  const watchedValorTitular = watch('valor_titular');
  const watchedValorDependentes = watch('valor_dependentes');

  // Atualizar valor total quando valores individuais mudarem
  useEffect(() => {
    const total = (watchedValorTitular || 0) + (watchedValorDependentes || 0);
    setValue('valor_total', total);
  }, [watchedValorTitular, watchedValorDependentes, setValue]);

  // Carregar planos quando convênio empresa for selecionado
  useEffect(() => {
    if (selectedConvenioEmpresaId) {
      setConveniosPlanos(planosData);
    } else {
      setConveniosPlanos([]);
    }
  }, [selectedConvenioEmpresaId, planosData]);

  // Definir convênio empresa inicial se estiver editando
  useEffect(() => {
    if (initialData?.convenios_planos?.convenios_empresas?.id) {
      setSelectedConvenioEmpresaId(initialData.convenios_planos.convenios_empresas.id);
    }
  }, [initialData]);

  const handleFormSubmit = (data: FuncionarioConvenioFormData) => {
    if (isEditing) {
      onSubmit({
        ...data,
        id: initialData.id,
        updated_at: new Date().toISOString(),
      } as FuncionarioConvenioUpdate);
    } else {
      onSubmit({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as FuncionarioConvenioInsert);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'Ativo';
      case 'suspenso':
        return 'Suspenso';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seleção do Convênio e Plano */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Convênio e Plano
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="convenio_empresa">Convênio Empresa *</Label>
              <Select
                value={selectedConvenioEmpresaId}
                onValueChange={setSelectedConvenioEmpresaId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o convênio empresa" />
                </SelectTrigger>
                <SelectContent>
                  {conveniosEmpresas.map((convenio) => (
                    <SelectItem key={convenio.id} value={convenio.id}>
                      {convenio.nome} - {convenio.prestador}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="convenio_plano_id">Plano do Convênio *</Label>
              <Select
                value={watch('convenio_plano_id')}
                onValueChange={(value) => setValue('convenio_plano_id', value)}
                disabled={!selectedConvenioEmpresaId || isLoadingPlanos}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  {conveniosPlanos.map((plano) => (
                    <SelectItem key={plano.id} value={plano.id}>
                      {plano.nome} - {formatCurrency(plano.valor_titular || 0)} (Titular) / {formatCurrency(plano.valor_dependente || 0)} (Dependente)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.convenio_plano_id && (
                <p className="text-sm text-destructive">{errors.convenio_plano_id.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Datas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Período de Vigência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data de Início *</Label>
              <Input
                id="data_inicio"
                type="date"
                {...register('data_inicio')}
                className={errors.data_inicio ? 'border-destructive' : ''}
              />
              {errors.data_inicio && (
                <p className="text-sm text-destructive">{errors.data_inicio.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_fim">Data de Fim</Label>
              <Input
                id="data_fim"
                type="date"
                {...register('data_fim')}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para vigência indefinida
              </p>
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
          </CardContent>
        </Card>
      </div>

      {/* Valores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Valores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_titular">Valor Titular (R$) *</Label>
              <Input
                id="valor_titular"
                type="number"
                step="0.01"
                min="0"
                {...register('valor_titular', { valueAsNumber: true })}
                placeholder="0,00"
                className={errors.valor_titular ? 'border-destructive' : ''}
              />
              {errors.valor_titular && (
                <p className="text-sm text-destructive">{errors.valor_titular.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_dependentes">Valor Dependentes (R$) *</Label>
              <Input
                id="valor_dependentes"
                type="number"
                step="0.01"
                min="0"
                {...register('valor_dependentes', { valueAsNumber: true })}
                placeholder="0,00"
                className={errors.valor_dependentes ? 'border-destructive' : ''}
              />
              {errors.valor_dependentes && (
                <p className="text-sm text-destructive">{errors.valor_dependentes.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_total">Valor Total (R$) *</Label>
              <Input
                id="valor_total"
                type="number"
                step="0.01"
                min="0"
                {...register('valor_total', { valueAsNumber: true })}
                placeholder="0,00"
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Calculado automaticamente
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Observações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...register('observacoes')}
              placeholder="Observações sobre a adesão ao convênio"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

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
          {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Adesão' : 'Criar Adesão'}
        </Button>
      </div>
    </form>
  );
}

