import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BeneficioTipo, BeneficioTipoInsert, BeneficioTipoUpdate } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Shield, Target, Users } from 'lucide-react';

const beneficioTipoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  descricao: z.string().optional(),
  categoria: z.enum(['convenio', 'vr_va', 'transporte', 'outros']),
  is_active: z.boolean().default(true),
  company_id: z.string().min(1, 'ID da empresa é obrigatório'),
});

type BeneficioTipoFormData = z.infer<typeof beneficioTipoSchema>;

interface BeneficioTiposFormProps {
  initialData?: BeneficioTipo;
  onSubmit: (data: BeneficioTipoInsert | BeneficioTipoUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
  companyId: string;
}

export function BeneficioTiposForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  companyId 
}: BeneficioTiposFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<BeneficioTipoFormData>({
    resolver: zodResolver(beneficioTipoSchema),
    defaultValues: {
      nome: initialData?.nome || '',
      descricao: initialData?.descricao || '',
      categoria: (initialData?.categoria as any) || 'convenio',
      is_active: initialData?.is_active ?? true,
      company_id: companyId,
    },
  });

  const watchedCategoria = watch('categoria');
  const watchedIsActive = watch('is_active');

  const handleFormSubmit = (data: BeneficioTipoFormData) => {
    if (isEditing) {
      onSubmit({
        ...data,
        id: initialData.id,
        updated_at: new Date().toISOString(),
      } as BeneficioTipoUpdate);
    } else {
      onSubmit({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as BeneficioTipoInsert);
    }
  };

  const getCategoriaLabel = (categoria: string) => {
    switch (categoria) {
      case 'convenio':
        return 'Convênios';
      case 'vr_va':
        return 'VR/VA';
      case 'transporte':
        return 'Transporte';
      case 'outros':
        return 'Outros';
      default:
        return categoria;
    }
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'convenio':
        return <Shield className="h-5 w-5 text-blue-600" />;
      case 'vr_va':
        return <Gift className="h-5 w-5 text-green-600" />;
      case 'transporte':
        return <Target className="h-5 w-5 text-orange-600" />;
      case 'outros':
        return <Users className="h-5 w-5 text-purple-600" />;
      default:
        return <Gift className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Tipo *</Label>
              <Input
                id="nome"
                {...register('nome')}
                placeholder="Ex: Convênio Médico, Vale Refeição"
                className={errors.nome ? 'border-destructive' : ''}
              />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
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
                  <SelectItem value="convenio">Convênios</SelectItem>
                  <SelectItem value="vr_va">VR/VA</SelectItem>
                  <SelectItem value="transporte">Transporte</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
              {errors.categoria && (
                <p className="text-sm text-destructive">{errors.categoria.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                {...register('descricao')}
                placeholder="Descrição detalhada do tipo de benefício"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getCategoriaIcon(watchedCategoria)}
              Configurações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={watchedIsActive}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
              <Label htmlFor="is_active">Tipo ativo</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Tipos inativos não podem ter regras de elegibilidade criadas
            </p>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Categoria Selecionada:</h4>
              <div className="flex items-center gap-2">
                {getCategoriaIcon(watchedCategoria)}
                <span className="text-sm">{getCategoriaLabel(watchedCategoria)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {watchedCategoria === 'convenio' && 'Benefícios relacionados a convênios médicos e odontológicos'}
                {watchedCategoria === 'vr_va' && 'Benefícios de vale refeição e vale alimentação'}
                {watchedCategoria === 'transporte' && 'Benefícios relacionados a transporte e mobilidade'}
                {watchedCategoria === 'outros' && 'Outros tipos de benefícios não categorizados'}
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
          {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Tipo' : 'Criar Tipo'}
        </Button>
      </div>
    </form>
  );
}
