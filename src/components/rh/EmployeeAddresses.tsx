import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, MapPin } from 'lucide-react';
import { EmployeeAddress, EmployeeAddressInsert, EmployeeAddressUpdate } from '@/integrations/supabase/rh-types';

// Schema de validação
const addressSchema = z.object({
  cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP deve ter formato 00000-000').optional().or(z.literal('')),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().max(2, 'UF deve ter 2 caracteres').optional(),
  pais: z.string().optional(),
  tipo_endereco: z.string().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

export interface EmployeeAddressesProps {
  employeeId: string;
  addresses?: EmployeeAddress[];
  onSubmit: (data: EmployeeAddressInsert | EmployeeAddressUpdate) => Promise<void>;
  onDelete?: (addressId: string) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export function EmployeeAddresses({
  employeeId,
  addresses = [],
  onSubmit,
  onDelete,
  loading = false,
  className = '',
}: EmployeeAddressesProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      pais: 'Brasil',
      tipo_endereco: 'residencial',
    },
  });

  const handleFormSubmit = async (data: AddressFormData) => {
    try {
      const addressData: EmployeeAddressInsert = {
        employee_id: employeeId,
        company_id: '', // Será preenchido pelo hook
        ...data,
      };
      await onSubmit(addressData);
      reset();
    } catch (error) {
      console.error('Erro ao salvar endereço:', error);
    }
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return value;
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setValue('cep', formatted);
  };

  const ufOptions = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const tipoEnderecoOptions = [
    { value: 'residencial', label: 'Residencial' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'correspondencia', label: 'Correspondência' },
    { value: 'cobranca', label: 'Cobrança' },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Endereços
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Tipo de Endereço */}
          <div className="space-y-2">
            <Label htmlFor="tipo_endereco">Tipo de Endereço</Label>
            <Select
              value={watch('tipo_endereco')}
              onValueChange={(value) => setValue('tipo_endereco', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de endereço" />
              </SelectTrigger>
              <SelectContent>
                {tipoEnderecoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CEP e Logradouro */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cep">CEP *</Label>
              <Input
                id="cep"
                value={watch('cep')}
                onChange={handleCEPChange}
                placeholder="00000-000"
                maxLength={9}
                className={errors.cep ? 'border-destructive' : ''}
              />
              {errors.cep && (
                <p className="text-sm text-destructive">{errors.cep.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="logradouro">Logradouro</Label>
              <Input
                id="logradouro"
                {...register('logradouro')}
                placeholder="Rua, Avenida, etc."
              />
            </div>
          </div>

          {/* Número e Complemento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                {...register('numero')}
                placeholder="123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                {...register('complemento')}
                placeholder="Apto, Bloco, etc."
              />
            </div>
          </div>

          {/* Bairro e Cidade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                {...register('bairro')}
                placeholder="Nome do bairro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                {...register('cidade')}
                placeholder="Nome da cidade"
              />
            </div>
          </div>

          {/* UF e País */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="uf">UF</Label>
              <Select
                value={watch('uf')}
                onValueChange={(value) => setValue('uf', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a UF" />
                </SelectTrigger>
                <SelectContent>
                  {ufOptions.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pais">País</Label>
              <Input
                id="pais"
                {...register('pais')}
                placeholder="Brasil"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button
              type="submit"
              disabled={!isValid || loading}
              className="min-w-[100px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Endereço'
              )}
            </Button>
          </div>
        </form>

        {/* Lista de Endereços Existentes */}
        {addresses.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Endereços Cadastrados</h3>
            <div className="space-y-2">
              {addresses.map((address) => (
                <div key={address.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {address.logradouro && address.numero && 
                        `${address.logradouro}, ${address.numero}`
                      }
                      {address.complemento && ` - ${address.complemento}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.bairro && `${address.bairro}, `}
                      {address.cidade && `${address.cidade} - `}
                      {address.uf && `${address.uf}, `}
                      {address.pais}
                      {address.cep && ` - ${address.cep}`}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      Tipo: {address.tipo_endereco}
                    </p>
                  </div>
                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(address.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}




