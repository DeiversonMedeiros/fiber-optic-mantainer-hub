// @ts-nocheck
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FuncionarioConvenioDependente, FuncionarioConvenioDependenteInsert, FuncionarioConvenioDependenteUpdate, EmployeeDependent } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, UserCheck } from 'lucide-react';

const funcionarioConvenioDependenteSchema = z.object({
  funcionario_convenio_id: z.string().min(1, 'ID do convênio do funcionário é obrigatório'),
  funcionario_dependente_id: z.string().min(1, 'Dependente é obrigatório'),
  valor_dependente: z.number().min(0, 'Valor deve ser maior ou igual a 0'),
  is_ativo: z.boolean().default(true),
});

type FuncionarioConvenioDependenteFormData = z.infer<typeof funcionarioConvenioDependenteSchema>;

interface FuncionarioConvenioDependentesFormProps {
  initialData?: FuncionarioConvenioDependente;
  onSubmit: (data: FuncionarioConvenioDependenteInsert | FuncionarioConvenioDependenteUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
  funcionarioConvenioId: string;
  dependentesDisponiveis: EmployeeDependent[];
}

export function FuncionarioConvenioDependentesForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  funcionarioConvenioId,
  dependentesDisponiveis 
}: FuncionarioConvenioDependentesFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<FuncionarioConvenioDependenteFormData>({
    resolver: zodResolver(funcionarioConvenioDependenteSchema),
    defaultValues: {
      funcionario_convenio_id: funcionarioConvenioId,
      funcionario_dependente_id: initialData?.funcionario_dependente_id || '',
      valor_dependente: initialData?.valor_dependente || 0,
      is_ativo: initialData?.is_ativo ?? true,
    },
  });

  const watchedIsAtivo = watch('is_ativo');

  const handleFormSubmit = (data: FuncionarioConvenioDependenteFormData) => {
    if (isEditing) {
      onSubmit({
        ...data,
        id: initialData.id,
        updated_at: new Date().toISOString(),
      } as FuncionarioConvenioDependenteUpdate);
    } else {
      onSubmit({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as FuncionarioConvenioDependenteInsert);
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
        {/* Seleção do Dependente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Dependente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="funcionario_dependente_id">Dependente *</Label>
              <Select
                value={watch('funcionario_dependente_id')}
                onValueChange={(value) => setValue('funcionario_dependente_id', value)}
                disabled={isEditing} // Não permite alterar o dependente na edição
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dependente" />
                </SelectTrigger>
                <SelectContent>
                  {dependentesDisponiveis.map((dependente) => (
                    <SelectItem key={dependente.id} value={dependente.id}>
                      {dependente.name} - {dependente.cpf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.funcionario_dependente_id && (
                <p className="text-sm text-destructive">{errors.funcionario_dependente_id.message}</p>
              )}
              {dependentesDisponiveis.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum dependente disponível para vinculação
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Valor e Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Valor e Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="valor_dependente">Valor do Dependente (R$) *</Label>
              <Input
                id="valor_dependente"
                type="number"
                step="0.01"
                min="0"
                {...register('valor_dependente', { valueAsNumber: true })}
                placeholder="0,00"
                className={errors.valor_dependente ? 'border-destructive' : ''}
              />
              {errors.valor_dependente && (
                <p className="text-sm text-destructive">{errors.valor_dependente.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Valor mensal que o dependente pagará pelo convênio
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_ativo"
                checked={watchedIsAtivo}
                onCheckedChange={(checked) => setValue('is_ativo', checked)}
              />
              <Label htmlFor="is_ativo">Dependente ativo no convênio</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Dependentes inativos não podem usar o convênio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Informações da Vinculação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">ID do Convênio do Funcionário</label>
              <p className="text-sm font-mono bg-muted p-2 rounded">{funcionarioConvenioId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status da Vinculação</label>
              <p className="text-sm">
                {watchedIsAtivo ? (
                  <span className="text-green-600 font-medium">Ativa</span>
                ) : (
                  <span className="text-red-600 font-medium">Inativa</span>
                )}
              </p>
            </div>
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
          disabled={!isValid || isLoading || dependentesDisponiveis.length === 0}
        >
          {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Vinculação' : 'Vincular Dependente'}
        </Button>
      </div>
    </form>
  );
}

