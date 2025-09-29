// @ts-nocheck
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MedicalCertificate, MedicalCertificateInsert, MedicalCertificateUpdate } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, FileText, DollarSign, Stethoscope } from 'lucide-react';

const medicalCertificateSchema = z.object({
  funcionario_id: z.string().min(1, 'Funcionário é obrigatório'),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_fim: z.string().min(1, 'Data de fim é obrigatória'),
  dias_afastamento: z.number().min(1, 'Dias de afastamento deve ser maior que 0').max(365, 'Dias de afastamento deve ser menor que 365'),
  tipo: z.enum(['medico', 'odontologico', 'psicologico', 'pendente', 'aprovado', 'em_andamento', 'concluido', 'rejeitado']),
  medico_nome: z.string().min(1, 'Nome do médico é obrigatório'),
  crm_crmo: z.string().min(1, 'CRM/CRMO é obrigatório'),
  especialidade: z.string().optional(),
  cid: z.string().optional(),
  valor_beneficio: z.number().min(0, 'Valor deve ser maior ou igual a 0'),
  observacoes: z.string().optional(),
  company_id: z.string().min(1, 'ID da empresa é obrigatório'),
});

type MedicalCertificateFormData = z.infer<typeof medicalCertificateSchema>;

interface MedicalCertificatesFormProps {
  initialData?: MedicalCertificate;
  onSubmit: (data: MedicalCertificateInsert | MedicalCertificateUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
  companyId: string;
}

export function MedicalCertificatesForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  companyId 
}: MedicalCertificatesFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<MedicalCertificateFormData>({
    resolver: zodResolver(medicalCertificateSchema),
    defaultValues: {
      funcionario_id: initialData?.funcionario_id || '',
      data_inicio: initialData?.data_inicio || '',
      data_fim: initialData?.data_fim || '',
      dias_afastamento: initialData?.dias_afastamento || 1,
      tipo: initialData?.tipo || 'medico',
      medico_nome: initialData?.medico_nome || '',
      crm_crmo: initialData?.crm_crmo || '',
      especialidade: initialData?.especialidade || '',
      cid: initialData?.cid || '',
      valor_beneficio: initialData?.valor_beneficio || 0,
      observacoes: initialData?.observacoes || '',
      company_id: companyId,
    },
  });

  const watchedDataInicio = watch('data_inicio');
  const watchedDataFim = watch('data_fim');
  const watchedTipo = watch('tipo');

  // Calcular dias de afastamento automaticamente
  React.useEffect(() => {
    if (watchedDataInicio && watchedDataFim) {
      const inicio = new Date(watchedDataInicio);
      const fim = new Date(watchedDataFim);
      const diffTime = Math.abs(fim.getTime() - inicio.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir o dia inicial
      setValue('dias_afastamento', diffDays);
    }
  }, [watchedDataInicio, watchedDataFim, setValue]);

  const handleFormSubmit = (data: MedicalCertificateFormData) => {
    if (isEditing) {
      onSubmit({
        ...data,
        id: initialData.id,
        updated_at: new Date().toISOString(),
      } as MedicalCertificateUpdate);
    } else {
      onSubmit({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as MedicalCertificateInsert);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="funcionario_id">Funcionário *</Label>
              <Input
                id="funcionario_id"
                {...register('funcionario_id')}
                placeholder="ID do funcionário"
                className={errors.funcionario_id ? 'border-destructive' : ''}
              />
              {errors.funcionario_id && (
                <p className="text-sm text-destructive">{errors.funcionario_id.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                ID do funcionário que está afastado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Atestado *</Label>
              <Select
                value={watchedTipo}
                onValueChange={(value) => setValue('tipo', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medico">Médico</SelectItem>
                  <SelectItem value="odontologico">Odontológico</SelectItem>
                  <SelectItem value="psicologico">Psicológico</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo && (
                <p className="text-sm text-destructive">{errors.tipo.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Datas e Período */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Datas e Período
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
              <Label htmlFor="data_fim">Data de Fim *</Label>
              <Input
                id="data_fim"
                type="date"
                {...register('data_fim')}
                className={errors.data_fim ? 'border-destructive' : ''}
              />
              {errors.data_fim && (
                <p className="text-sm text-destructive">{errors.data_fim.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dias_afastamento">Dias de Afastamento *</Label>
              <Input
                id="dias_afastamento"
                type="number"
                min="1"
                max="365"
                {...register('dias_afastamento', { valueAsNumber: true })}
                className={errors.dias_afastamento ? 'border-destructive' : ''}
                readOnly
              />
              {errors.dias_afastamento && (
                <p className="text-sm text-destructive">{errors.dias_afastamento.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Calculado automaticamente baseado nas datas
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações Médicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Informações Médicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="medico_nome">Nome do Médico *</Label>
              <Input
                id="medico_nome"
                {...register('medico_nome')}
                placeholder="Nome completo do médico"
                className={errors.medico_nome ? 'border-destructive' : ''}
              />
              {errors.medico_nome && (
                <p className="text-sm text-destructive">{errors.medico_nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="crm_crmo">CRM/CRMO *</Label>
              <Input
                id="crm_crmo"
                {...register('crm_crmo')}
                placeholder="Número do registro profissional"
                className={errors.crm_crmo ? 'border-destructive' : ''}
              />
              {errors.crm_crmo && (
                <p className="text-sm text-destructive">{errors.crm_crmo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="especialidade">Especialidade</Label>
              <Input
                id="especialidade"
                {...register('especialidade')}
                placeholder="Especialidade médica"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cid">CID</Label>
              <Input
                id="cid"
                {...register('cid')}
                placeholder="Código Internacional de Doenças"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Benefícios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="valor_beneficio">Valor do Benefício (R$) *</Label>
              <Input
                id="valor_beneficio"
                type="number"
                step="0.01"
                min="0"
                {...register('valor_beneficio', { valueAsNumber: true })}
                className={errors.valor_beneficio ? 'border-destructive' : ''}
              />
              {errors.valor_beneficio && (
                <p className="text-sm text-destructive">{errors.valor_beneficio.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
              placeholder="Observações sobre o atestado médico"
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
          {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Atestado' : 'Criar Atestado'}
        </Button>
      </div>
    </form>
  );
}


























