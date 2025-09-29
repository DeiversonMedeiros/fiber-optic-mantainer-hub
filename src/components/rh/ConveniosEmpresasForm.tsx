import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ConvenioEmpresa, ConvenioEmpresaInsert, ConvenioEmpresaUpdate } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope, Building2, FileText } from 'lucide-react';

const convenioEmpresaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  tipo: z.enum(['medico', 'odontologico', 'ambos']),
  prestador: z.string().min(1, 'Prestador é obrigatório').max(200, 'Prestador muito longo'),
  cnpj: z.string().optional(),
  contato: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  endereco: z.string().optional(),
  is_active: z.boolean().default(true),
  company_id: z.string().min(1, 'ID da empresa é obrigatório'),
});

type ConvenioEmpresaFormData = z.infer<typeof convenioEmpresaSchema>;

interface ConveniosEmpresasFormProps {
  initialData?: ConvenioEmpresa;
  onSubmit: (data: ConvenioEmpresaInsert | ConvenioEmpresaUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
  companyId: string;
}

export function ConveniosEmpresasForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  companyId 
}: ConveniosEmpresasFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<ConvenioEmpresaFormData>({
    resolver: zodResolver(convenioEmpresaSchema),
    defaultValues: {
      nome: initialData?.nome || '',
      tipo: initialData?.tipo || 'medico',
      prestador: initialData?.prestador || '',
      cnpj: initialData?.cnpj || '',
      contato: initialData?.contato || '',
      telefone: initialData?.telefone || '',
      email: initialData?.email || '',
      endereco: initialData?.endereco || '',
      is_active: initialData?.is_active ?? true,
      company_id: companyId,
    },
  });

  const watchedTipo = watch('tipo');
  const watchedIsActive = watch('is_active');

  const handleFormSubmit = (data: ConvenioEmpresaFormData) => {
    if (isEditing) {
      onSubmit({
        ...data,
        id: initialData.id,
        updated_at: new Date().toISOString(),
      } as ConvenioEmpresaUpdate);
    } else {
      onSubmit({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as ConvenioEmpresaInsert);
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'medico':
        return 'Médico';
      case 'odontologico':
        return 'Odontológico';
      case 'ambos':
        return 'Médico + Odontológico';
      default:
        return tipo;
    }
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
              <Label htmlFor="nome">Nome do Convênio *</Label>
              <Input
                id="nome"
                {...register('nome')}
                placeholder="Ex: Bradesco Saúde, Unimed"
                className={errors.nome ? 'border-destructive' : ''}
              />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Convênio *</Label>
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
                  <SelectItem value="ambos">Médico + Odontológico</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo && (
                <p className="text-sm text-destructive">{errors.tipo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="prestador">Prestador *</Label>
              <Input
                id="prestador"
                {...register('prestador')}
                placeholder="Ex: Bradesco Saúde São Paulo"
                className={errors.prestador ? 'border-destructive' : ''}
              />
              {errors.prestador && (
                <p className="text-sm text-destructive">{errors.prestador.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                {...register('cnpj')}
                placeholder="00.000.000/0000-00"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contato e Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Contato e Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contato">Contato</Label>
              <Input
                id="contato"
                {...register('contato')}
                placeholder="Nome do responsável"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                {...register('telefone')}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="contato@prestador.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Textarea
                id="endereco"
                {...register('endereco')}
                placeholder="Endereço completo do prestador"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Configurações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={watchedIsActive}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
            <Label htmlFor="is_active">Convênio ativo</Label>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Convênios inativos não podem ter planos criados nem funcionários vinculados
          </p>
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
          {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Convênio' : 'Criar Convênio'}
        </Button>
      </div>
    </form>
  );
}

