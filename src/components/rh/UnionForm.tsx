import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Union, UnionInsert, UnionUpdate } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, MapPin, Phone, Settings } from 'lucide-react';

const unionSchema = z.object({
  nome: z.string().min(1, 'Nome do sindicato é obrigatório'),
  cnpj: z.string().optional(),
  endereco: z.string().optional(),
  contato: z.string().optional(),
  is_active: z.boolean(),
  company_id: z.string().min(1, 'ID da empresa é obrigatório'),
});

type UnionFormData = z.infer<typeof unionSchema>;

interface UnionFormProps {
  initialData?: Union;
  onSubmit: (data: UnionInsert | UnionUpdate) => void;
  onCancel: () => void;
  isLoading?: boolean;
  companyId: string;
}

export function UnionForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  companyId 
}: UnionFormProps) {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<UnionFormData>({
    resolver: zodResolver(unionSchema),
    defaultValues: {
      nome: initialData?.nome || '',
      cnpj: initialData?.cnpj || '',
      endereco: initialData?.endereco || '',
      contato: initialData?.contato || '',
      is_active: initialData?.is_active !== false,
      company_id: companyId,
    },
  });

  const handleFormSubmit = (data: UnionFormData) => {
    if (isEditing) {
      onSubmit({
        ...data,
        id: initialData.id,
      } as UnionUpdate);
    } else {
      onSubmit({
        ...data,
      } as UnionInsert);
    }
  };

  const formatCNPJ = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara: 00.000.000/0000-00
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setValue('cnpj', formatted);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Sindicato *</Label>
              <Input
                id="nome"
                {...register('nome')}
                placeholder="Ex: Sindicato dos Trabalhadores..."
                className={errors.nome ? 'border-destructive' : ''}
              />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                {...register('cnpj')}
                placeholder="00.000.000/0000-00"
                onChange={handleCNPJChange}
                maxLength={18}
                className={errors.cnpj ? 'border-destructive' : ''}
              />
              {errors.cnpj && (
                <p className="text-sm text-destructive">{errors.cnpj.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={watch('is_active')}
                onCheckedChange={(checked) => setValue('is_active', !!checked)}
              />
              <Label htmlFor="is_active">Sindicato ativo</Label>
            </div>
          </CardContent>
        </Card>

        {/* Informações de Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contato">Telefone/Email</Label>
              <Input
                id="contato"
                {...register('contato')}
                placeholder="Ex: (11) 99999-9999 ou email@sindicato.com"
                className={errors.contato ? 'border-destructive' : ''}
              />
              {errors.contato && (
                <p className="text-sm text-destructive">{errors.contato.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Endereço
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço Completo</Label>
            <Textarea
              id="endereco"
              {...register('endereco')}
              placeholder="Rua, número, bairro, cidade, CEP..."
              rows={3}
              className={errors.endereco ? 'border-destructive' : ''}
            />
            {errors.endereco && (
              <p className="text-sm text-destructive">{errors.endereco.message}</p>
            )}
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
          {isLoading ? 'Salvando...' : isEditing ? 'Atualizar Sindicato' : 'Criar Sindicato'}
        </Button>
      </div>
    </form>
  );
}
























































































