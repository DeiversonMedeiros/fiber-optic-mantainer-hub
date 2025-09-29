import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Payroll, PayrollInsert, PayrollUpdate } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Calendar, Users, FileText } from 'lucide-react';

const payrollSchema = z.object({
  competencia: z.string().min(1, 'Competência é obrigatória'),
  status: z.enum(['processando', 'processado', 'erro', 'cancelado']),
  total_proventos: z.number().min(0, 'Total de proventos deve ser maior ou igual a 0'),
  total_descontos: z.number().min(0, 'Total de descontos deve ser maior ou igual a 0'),
  total_liquido: z.number().min(0, 'Total líquido deve ser maior ou igual a 0'),
  company_id: z.string().min(1, 'ID da empresa é obrigatório'),
});

type PayrollFormData = z.infer<typeof payrollSchema>;

interface PayrollFormProps {
  initialData?: Payroll;
  onSubmit: (data: PayrollInsert | PayrollUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
  companyId: string;
}

export function PayrollForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  companyId 
}: PayrollFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<PayrollFormData>({
    resolver: zodResolver(payrollSchema),
    defaultValues: {
      competencia: initialData?.competencia || '',
      status: initialData?.status || 'processando',
      total_proventos: initialData?.total_proventos || 0,
      total_descontos: initialData?.total_descontos || 0,
      total_liquido: initialData?.total_liquido || 0,
      company_id: companyId,
    },
  });

  const watchedStatus = watch('status');
  const watchedProventos = watch('total_proventos');
  const watchedDescontos = watch('total_descontos');

  // Calcular total líquido automaticamente
  React.useEffect(() => {
    const liquido = watchedProventos - watchedDescontos;
    setValue('total_liquido', Math.max(0, liquido));
  }, [watchedProventos, watchedDescontos, setValue]);

  const handleFormSubmit = (data: PayrollFormData) => {
    if (isEditing) {
      onSubmit({
        ...data,
        id: initialData.id,
        updated_at: new Date().toISOString(),
      } as PayrollUpdate);
    } else {
      onSubmit({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as PayrollInsert);
    }
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="competencia">Competência *</Label>
              <Input
                id="competencia"
                type="month"
                {...register('competencia')}
                defaultValue={getCurrentMonth()}
                className={errors.competencia ? 'border-destructive' : ''}
              />
              {errors.competencia && (
                <p className="text-sm text-destructive">{errors.competencia.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Mês/ano de referência da folha de pagamento
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={watchedStatus}
                onValueChange={(value) => setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="processando">Processando</SelectItem>
                  <SelectItem value="processado">Processado</SelectItem>
                  <SelectItem value="erro">Erro</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive">{errors.status.message}</p>
              )}
            </div>


          </CardContent>
        </Card>

        {/* Valores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Valores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="total_proventos">Total Proventos (R$) *</Label>
              <Input
                id="total_proventos"
                type="number"
                step="0.01"
                min="0"
                {...register('total_proventos', { valueAsNumber: true })}
                className={errors.total_proventos ? 'border-destructive' : ''}
              />
              {errors.total_proventos && (
                <p className="text-sm text-destructive">{errors.total_proventos.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_descontos">Total Descontos (R$) *</Label>
              <Input
                id="total_descontos"
                type="number"
                step="0.01"
                min="0"
                {...register('total_descontos', { valueAsNumber: true })}
                className={errors.total_descontos ? 'border-destructive' : ''}
              />
              {errors.total_descontos && (
                <p className="text-sm text-destructive">{errors.total_descontos.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_liquido">Total Líquido (R$) *</Label>
              <Input
                id="total_liquido"
                type="number"
                step="0.01"
                min="0"
                {...register('total_liquido', { valueAsNumber: true })}
                className={errors.total_liquido ? 'border-destructive' : ''}
                readOnly
              />
              {errors.total_liquido && (
                <p className="text-sm text-destructive">{errors.total_liquido.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Calculado automaticamente (Proventos - Descontos)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>



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
          {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Folha' : 'Criar Folha'}
        </Button>
      </div>
    </form>
  );
}








