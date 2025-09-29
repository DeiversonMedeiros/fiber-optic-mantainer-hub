// @ts-nocheck
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TrainingData, TrainingInsert, TrainingUpdate } from '@/hooks/rh/useTraining';
import { z } from 'zod';
import { trainingValidationSchema } from '@/lib/validations/rh-validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, FileText, DollarSign, MapPin, GraduationCap, Clock, Award } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

type TrainingFormData = z.infer<typeof trainingValidationSchema>;

interface TrainingFormProps {
  initialData?: TrainingData;
  onSubmit: (data: TrainingInsert | TrainingUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
  companyId: string;
}

export function TrainingForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  companyId 
}: TrainingFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<TrainingFormData>({
    resolver: zodResolver(trainingValidationSchema),
    defaultValues: {
      titulo: initialData?.titulo || '',
      descricao: initialData?.descricao || '',
      tipo_treinamento: initialData?.tipo_treinamento || 'opcional',
      categoria: initialData?.categoria || 'tecnico',
      modalidade: initialData?.modalidade || 'presencial',
      duracao_horas: initialData?.duracao_horas || 1,
      data_inicio: initialData?.data_inicio || '',
      data_fim: initialData?.data_fim || '',
      local: initialData?.local || '',
      instrutor: initialData?.instrutor || '',
      custo_por_participante: initialData?.custo_por_participante || 0,
      max_participantes: initialData?.max_participantes || 1,
      requisitos: initialData?.requisitos || '',
      material_apoio: initialData?.material_apoio || '',
      certificacao: initialData?.certificacao || false,
      observacoes: initialData?.observacoes || '',
      company_id: companyId,
    },
  });

  const watchedTipoTreinamento = watch('tipo_treinamento');
  const watchedCategoria = watch('categoria');
  const watchedModalidade = watch('modalidade');
  const watchedCertificacao = watch('certificacao');

  const handleFormSubmit = (data: TrainingFormData) => {
    if (isEditing) {
      onSubmit({
        ...data,
        id: initialData.id,
        updated_at: new Date().toISOString(),
      } as TrainingUpdate);
    } else {
      onSubmit({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as TrainingInsert);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título do Treinamento *</Label>
              <Input
                id="titulo"
                {...register('titulo')}
                placeholder="Ex: Treinamento de Segurança do Trabalho"
                className={errors.titulo ? 'border-destructive' : ''}
              />
              {errors.titulo && (
                <p className="text-sm text-destructive">{errors.titulo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_treinamento">Tipo de Treinamento *</Label>
              <Select
                value={watchedTipoTreinamento}
                onValueChange={(value) => setValue('tipo_treinamento', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="obrigatorio">Obrigatório</SelectItem>
                  <SelectItem value="opcional">Opcional</SelectItem>
                  <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="seguranca">Segurança</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo_treinamento && (
                <p className="text-sm text-destructive">{errors.tipo_treinamento.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select
                value={watchedCategoria}
                onValueChange={(value) => setValue('categoria', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="soft_skills">Soft Skills</SelectItem>
                  <SelectItem value="gestao">Gestão</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="seguranca_trabalho">Segurança do Trabalho</SelectItem>
                </SelectContent>
              </Select>
              {errors.categoria && (
                <p className="text-sm text-destructive">{errors.categoria.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="modalidade">Modalidade *</Label>
              <Select
                value={watchedModalidade}
                onValueChange={(value) => setValue('modalidade', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a modalidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="hibrido">Híbrido</SelectItem>
                  <SelectItem value="e-learning">E-learning</SelectItem>
                </SelectContent>
              </Select>
              {errors.modalidade && (
                <p className="text-sm text-destructive">{errors.modalidade.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Datas e Duração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Datas e Duração
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
                placeholder="Opcional"
              />
              <p className="text-xs text-muted-foreground">
                Data de conclusão do treinamento
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duracao_horas">Duração (horas) *</Label>
              <Input
                id="duracao_horas"
                type="number"
                min="1"
                {...register('duracao_horas', { valueAsNumber: true })}
                className={errors.duracao_horas ? 'border-destructive' : ''}
              />
              {errors.duracao_horas && (
                <p className="text-sm text-destructive">{errors.duracao_horas.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_participantes">Máximo de Participantes *</Label>
              <Input
                id="max_participantes"
                type="number"
                min="1"
                {...register('max_participantes', { valueAsNumber: true })}
                className={errors.max_participantes ? 'border-destructive' : ''}
              />
              {errors.max_participantes && (
                <p className="text-sm text-destructive">{errors.max_participantes.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Local e Instrutor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Local e Instrutor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="local">Local</Label>
              <Input
                id="local"
                {...register('local')}
                placeholder="Ex: Auditório Principal, Sala de Treinamento"
              />
              <p className="text-xs text-muted-foreground">
                Local onde será realizado o treinamento
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instrutor">Instrutor</Label>
              <Input
                id="instrutor"
                {...register('instrutor')}
                placeholder="Nome do instrutor ou empresa"
              />
              <p className="text-xs text-muted-foreground">
                Responsável pela condução do treinamento
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Custos e Certificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custo_por_participante">Custo por Participante (R$) *</Label>
              <Input
                id="custo_por_participante"
                type="number"
                step="0.01"
                min="0"
                {...register('custo_por_participante', { valueAsNumber: true })}
                placeholder="0,00"
                className={errors.custo_por_participante ? 'border-destructive' : ''}
              />
              {errors.custo_por_participante && (
                <p className="text-sm text-destructive">{errors.custo_por_participante.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Custo por participante (0 para gratuito)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="certificacao"
                checked={watchedCertificacao}
                onCheckedChange={(checked) => setValue('certificacao', checked)}
              />
              <Label htmlFor="certificacao">Emite Certificação</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Se o treinamento emite certificado de conclusão
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Descrição e Requisitos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Descrição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                {...register('descricao')}
                placeholder="Descreva o conteúdo e objetivos do treinamento"
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
              <Label htmlFor="requisitos">Requisitos</Label>
              <Textarea
                id="requisitos"
                {...register('requisitos')}
                placeholder="Pré-requisitos para participação"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Conhecimentos ou experiências necessárias
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Material de Apoio e Observações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Material de Apoio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="material_apoio">Material de Apoio</Label>
              <Textarea
                id="material_apoio"
                {...register('material_apoio')}
                placeholder="Materiais, equipamentos, recursos necessários"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Recursos e materiais fornecidos aos participantes
              </p>
            </div>
          </CardContent>
        </Card>

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
                placeholder="Informações adicionais sobre o treinamento"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Detalhes extras, observações importantes
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
          {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Treinamento' : 'Criar Treinamento'}
        </Button>
      </div>
    </form>
  );
}
