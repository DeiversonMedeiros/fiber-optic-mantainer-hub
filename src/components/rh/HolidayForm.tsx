import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Holiday, HolidayInsert, HolidayUpdate } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Type } from 'lucide-react';

const holidaySchema = z.object({
  data: z.string().min(1, 'Data é obrigatória'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo: z.enum(['nacional', 'estadual', 'municipal'], {
    required_error: 'Tipo é obrigatório',
  }),
  estado: z.string().optional(),
  cidade: z.string().optional(),
  observacoes: z.string().optional(),
});

type HolidayFormData = z.infer<typeof holidaySchema>;

interface HolidayFormProps {
  holiday?: Holiday | null;
  onSubmit: (data: HolidayInsert | HolidayUpdate) => void;
  onCancel: () => void;
  companyId: string;
}

export const HolidayForm = ({ holiday, onSubmit, onCancel, companyId }: HolidayFormProps) => {
  const [tipo, setTipo] = useState(holiday?.tipo || '');
  const isEditing = !!holiday;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm<HolidayFormData>({
    resolver: zodResolver(holidaySchema),
    defaultValues: {
      data: holiday?.data || '',
      nome: holiday?.nome || '',
      tipo: holiday?.tipo || 'nacional',
      estado: holiday?.estado || '',
      cidade: holiday?.cidade || '',
      observacoes: holiday?.observacoes || '',
    },
  });

  const handleFormSubmit = (data: HolidayFormData) => {
    const formData = {
      ...data,
      company_id: companyId,
      is_active: true,
    };

    if (isEditing) {
      onSubmit(formData as HolidayUpdate);
    } else {
      onSubmit(formData as HolidayInsert);
    }
  };

  const handleTipoChange = (value: string) => {
    setTipo(value);
    setValue('tipo', value as 'nacional' | 'estadual' | 'municipal');
    
    // Limpar campos de localização quando mudar o tipo
    if (value === 'nacional') {
      setValue('estado', '');
      setValue('cidade', '');
    } else if (value === 'estadual') {
      setValue('cidade', '');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>{isEditing ? 'Editar Feriado' : 'Novo Feriado'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                {...register('data')}
                className={errors.data ? 'border-red-500' : ''}
              />
              {errors.data && (
                <p className="text-sm text-red-500">{errors.data.message}</p>
              )}
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Feriado *</Label>
              <Input
                id="nome"
                placeholder="Ex: Dia do Trabalhador"
                {...register('nome')}
                className={errors.nome ? 'border-red-500' : ''}
              />
              {errors.nome && (
                <p className="text-sm text-red-500">{errors.nome.message}</p>
              )}
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={tipo} onValueChange={handleTipoChange}>
                <SelectTrigger className={errors.tipo ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nacional">
                    <div className="flex items-center space-x-2">
                      <Type className="h-4 w-4 text-blue-600" />
                      <span>Nacional</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="estadual">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span>Estadual</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="municipal">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-purple-600" />
                      <span>Municipal</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo && (
                <p className="text-sm text-red-500">{errors.tipo.message}</p>
              )}
            </div>

            {/* Estado (apenas para estadual e municipal) */}
            {tipo === 'estadual' || tipo === 'municipal' ? (
              <div className="space-y-2">
                <Label htmlFor="estado">Estado *</Label>
                <Input
                  id="estado"
                  placeholder="Ex: São Paulo"
                  {...register('estado')}
                  className={errors.estado ? 'border-red-500' : ''}
                />
                {errors.estado && (
                  <p className="text-sm text-red-500">{errors.estado.message}</p>
                )}
              </div>
            ) : null}

            {/* Cidade (apenas para municipal) */}
            {tipo === 'municipal' ? (
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade *</Label>
                <Input
                  id="cidade"
                  placeholder="Ex: São Paulo"
                  {...register('cidade')}
                  className={errors.cidade ? 'border-red-500' : ''}
                />
                {errors.cidade && (
                  <p className="text-sm text-red-500">{errors.cidade.message}</p>
                )}
              </div>
            ) : null}

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Informações adicionais sobre o feriado..."
                {...register('observacoes')}
                rows={3}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[100px]"
              >
                {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};











