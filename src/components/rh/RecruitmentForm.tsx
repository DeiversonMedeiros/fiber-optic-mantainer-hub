// @ts-nocheck
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RecruitmentData, RecruitmentInsert, RecruitmentUpdate } from '@/hooks/rh/useRecruitment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, FileText, DollarSign, MapPin, Briefcase } from 'lucide-react';

const recruitmentSchema = z.object({
  position_id: z.string().min(1, 'Cargo é obrigatório'),
  status: z.enum(['aberta', 'em_andamento', 'fechada', 'cancelada']),
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  requisitos: z.string().min(1, 'Requisitos são obrigatórios'),
  salario_min: z.number().min(0, 'Salário mínimo deve ser maior ou igual a 0'),
  salario_max: z.number().min(0, 'Salário máximo deve ser maior ou igual a 0'),
  tipo_contrato: z.enum(['clt', 'pj', 'estagio', 'temporario']),
  local_trabalho: z.string().min(1, 'Local de trabalho é obrigatório'),
  data_abertura: z.string().min(1, 'Data de abertura é obrigatória'),
  data_fechamento: z.string().optional(),
  vagas_disponiveis: z.number().min(1, 'Número de vagas deve ser maior que 0'),
  observacoes: z.string().optional(),
  company_id: z.string().min(1, 'ID da empresa é obrigatório'),
});

type RecruitmentFormData = z.infer<typeof recruitmentSchema>;

interface RecruitmentFormProps {
  initialData?: RecruitmentData;
  onSubmit: (data: RecruitmentInsert | RecruitmentUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
  companyId: string;
}

export function RecruitmentForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  companyId 
}: RecruitmentFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<RecruitmentFormData>({
    resolver: zodResolver(recruitmentSchema),
    defaultValues: {
      position_id: initialData?.position_id || '',
      status: initialData?.status || 'aberta',
      titulo: initialData?.titulo || '',
      descricao: initialData?.descricao || '',
      requisitos: initialData?.requisitos || '',
      salario_min: initialData?.salario_min || 0,
      salario_max: initialData?.salario_max || 0,
      tipo_contrato: initialData?.tipo_contrato || 'clt',
      local_trabalho: initialData?.local_trabalho || '',
      data_abertura: initialData?.data_abertura || '',
      data_fechamento: initialData?.data_fechamento || '',
      vagas_disponiveis: initialData?.vagas_disponiveis || 1,
      observacoes: initialData?.observacoes || '',
      company_id: companyId,
    },
  });

  const watchedStatus = watch('status');
  const watchedTipoContrato = watch('tipo_contrato');

  const handleFormSubmit = (data: RecruitmentFormData) => {
    if (isEditing) {
      onSubmit({
        ...data,
        id: initialData.id,
        updated_at: new Date().toISOString(),
      } as RecruitmentUpdate);
    } else {
      onSubmit({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as RecruitmentInsert);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="position_id">Cargo *</Label>
              <Input
                id="position_id"
                {...register('position_id')}
                placeholder="ID do cargo"
                className={errors.position_id ? 'border-destructive' : ''}
              />
              {errors.position_id && (
                <p className="text-sm text-destructive">{errors.position_id.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                ID do cargo para o qual a vaga está sendo aberta
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="titulo">Título da Vaga *</Label>
              <Input
                id="titulo"
                {...register('titulo')}
                placeholder="Ex: Desenvolvedor Full Stack"
                className={errors.titulo ? 'border-destructive' : ''}
              />
              {errors.titulo && (
                <p className="text-sm text-destructive">{errors.titulo.message}</p>
              )}
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
                  <SelectItem value="aberta">Aberta</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="fechada">Fechada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive">{errors.status.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_contrato">Tipo de Contrato *</Label>
              <Select
                value={watchedTipoContrato}
                onValueChange={(value) => setValue('tipo_contrato', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clt">CLT</SelectItem>
                  <SelectItem value="pj">PJ</SelectItem>
                  <SelectItem value="estagio">Estágio</SelectItem>
                  <SelectItem value="temporario">Temporário</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo_contrato && (
                <p className="text-sm text-destructive">{errors.tipo_contrato.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Datas e Localização */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Datas e Localização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data_abertura">Data de Abertura *</Label>
              <Input
                id="data_abertura"
                type="date"
                {...register('data_abertura')}
                className={errors.data_abertura ? 'border-destructive' : ''}
              />
              {errors.data_abertura && (
                <p className="text-sm text-destructive">{errors.data_abertura.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_fechamento">Data de Fechamento</Label>
              <Input
                id="data_fechamento"
                type="date"
                {...register('data_fechamento')}
                placeholder="Opcional"
              />
              <p className="text-xs text-muted-foreground">
                Data limite para receber candidaturas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="local_trabalho">Local de Trabalho *</Label>
              <Input
                id="local_trabalho"
                {...register('local_trabalho')}
                placeholder="Ex: São Paulo, SP"
                className={errors.local_trabalho ? 'border-destructive' : ''}
              />
              {errors.local_trabalho && (
                <p className="text-sm text-destructive">{errors.local_trabalho.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vagas_disponiveis">Número de Vagas *</Label>
              <Input
                id="vagas_disponiveis"
                type="number"
                min="1"
                {...register('vagas_disponiveis', { valueAsNumber: true })}
                className={errors.vagas_disponiveis ? 'border-destructive' : ''}
              />
              {errors.vagas_disponiveis && (
                <p className="text-sm text-destructive">{errors.vagas_disponiveis.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Descrição e Requisitos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Descrição da Vaga
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                {...register('descricao')}
                placeholder="Descreva as responsabilidades e atividades da vaga"
                rows={4}
                className={errors.descricao ? 'border-destructive' : ''}
              />
              {errors.descricao && (
                <p className="text-sm text-destructive">{errors.descricao.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Requisitos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="requisitos">Requisitos *</Label>
              <Textarea
                id="requisitos"
                {...register('requisitos')}
                placeholder="Experiência, formação, habilidades necessárias"
                rows={4}
                className={errors.requisitos ? 'border-destructive' : ''}
              />
              {errors.requisitos && (
                <p className="text-sm text-destructive">{errors.requisitos.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salário e Observações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Faixa Salarial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="salario_min">Salário Mínimo (R$) *</Label>
              <Input
                id="salario_min"
                type="number"
                step="0.01"
                min="0"
                {...register('salario_min', { valueAsNumber: true })}
                placeholder="0,00"
                className={errors.salario_min ? 'border-destructive' : ''}
              />
              {errors.salario_min && (
                <p className="text-sm text-destructive">{errors.salario_min.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="salario_max">Salário Máximo (R$) *</Label>
              <Input
                id="salario_max"
                type="number"
                step="0.01"
                min="0"
                {...register('salario_max', { valueAsNumber: true })}
                placeholder="0,00"
                className={errors.salario_max ? 'border-destructive' : ''}
              />
              {errors.salario_max && (
                <p className="text-sm text-destructive">{errors.salario_max.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                {...register('observacoes')}
                placeholder="Informações adicionais sobre a vaga"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Detalhes extras, benefícios, horários, etc.
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
          {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Vaga' : 'Criar Vaga'}
        </Button>
      </div>
    </form>
  );
}
































































































