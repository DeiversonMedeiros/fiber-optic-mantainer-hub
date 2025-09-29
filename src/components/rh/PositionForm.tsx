// @ts-nocheck
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Position, PositionInsert, PositionUpdate } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormSection, FormField, FormRow, FormColumn } from './FormModal';
import { Label } from '@/components/ui/label';

const positionSchema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório').max(20, 'Código muito longo'),
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  descricao: z.string().max(500, 'Descrição muito longa').optional(),
  nivel_hierarquico: z.coerce.number().min(1, 'Nível deve ser maior que 0').max(10, 'Nível muito alto').optional(),
  is_active: z.boolean().default(true),
});

type PositionFormData = z.infer<typeof positionSchema>;

export interface PositionFormProps {
  position?: Position;
  onSubmit: (data: PositionInsert | PositionUpdate) => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
}

export function PositionForm({
  position,
  onSubmit,
  onCancel,
  loading = false,
  className = ''
}: PositionFormProps) {
  const isEditing = !!position;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<PositionFormData>({
    resolver: zodResolver(positionSchema),
    defaultValues: position ? {
      codigo: position.codigo,
      nome: position.nome,
      descricao: position.descricao || '',
      nivel_hierarquico: position.nivel_hierarquico || 1,
      is_active: position.is_active ?? true,
    } : {
      codigo: '',
      nome: '',
      descricao: '',
      nivel_hierarquico: 1,
      is_active: true,
    },
  });

  const handleFormSubmit = async (data: PositionFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Erro ao salvar cargo:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={`space-y-6 ${className}`}>
      <FormSection title="Informações Básicas" description="Dados principais do cargo">
        <FormRow>
          <FormColumn>
            <FormField label="Código do Cargo *" error={errors.codigo?.message}>
              <Input
                {...register('codigo')}
                placeholder="Ex: DEV001"
                disabled={loading}
              />
            </FormField>
          </FormColumn>
          <FormColumn>
            <FormField label="Nome do Cargo *" error={errors.nome?.message}>
              <Input
                {...register('nome')}
                placeholder="Ex: Desenvolvedor Full Stack"
                disabled={loading}
              />
            </FormField>
          </FormColumn>
        </FormRow>

        <FormRow>
          <FormColumn>
            <FormField label="Nível Hierárquico" error={errors.nivel_hierarquico?.message}>
              <Select
                value={watch('nivel_hierarquico')?.toString()}
                onValueChange={(value) => setValue('nivel_hierarquico', parseInt(value))}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                    <SelectItem key={level} value={level.toString()}>
                      Nível {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </FormColumn>
          <FormColumn>
            <FormField label="Status" error={errors.is_active?.message}>
              <Select
                value={watch('is_active') ? 'true' : 'false'}
                onValueChange={(value) => setValue('is_active', value === 'true')}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ativo</SelectItem>
                  <SelectItem value="false">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </FormColumn>
        </FormRow>

        <FormField label="Descrição" error={errors.descricao?.message}>
          <Textarea
            {...register('descricao')}
            placeholder="Descreva as responsabilidades e características do cargo"
            rows={3}
            disabled={loading}
          />
        </FormField>
      </FormSection>

      {/* Botões de ação */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || !isValid}
        >
          {loading ? 'Salvando...' : isEditing ? 'Atualizar Cargo' : 'Criar Cargo'}
        </Button>
      </div>
    </form>
  );
}

// Componente para visualizar detalhes do cargo
export function PositionDetails({ position }: { position: Position }) {
  return (
    <div className="space-y-6">
      <FormSection title="Informações Básicas">
        <FormRow>
          <FormColumn>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Nome do Cargo</Label>
              <div className="text-base font-medium">{position.nome}</div>
            </div>
          </FormColumn>
          <FormColumn>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Nível Hierárquico</Label>
              <div className="text-base font-medium">Nível {position.nivel_hierarquico}</div>
            </div>
          </FormColumn>
        </FormRow>

        {position.descricao && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Descrição</Label>
            <div className="text-base">{position.descricao}</div>
          </div>
        )}
      </FormSection>

      <FormSection title="Remuneração e Jornada">
        <FormRow>
          <FormColumn>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Salário Base</Label>
              <div className="text-base font-medium">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(position.salario_base)}
              </div>
            </div>
          </FormColumn>
          <FormColumn>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Carga Horária</Label>
              <div className="text-base font-medium">{position.carga_horaria}h/semana</div>
            </div>
          </FormColumn>
        </FormRow>
      </FormSection>

      {(position.requisitos || position.responsabilidades || position.beneficios) && (
        <FormSection title="Detalhes do Cargo">
          {position.requisitos && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Requisitos</Label>
              <div className="text-base">{position.requisitos}</div>
            </div>
          )}

          {position.responsabilidades && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Responsabilidades</Label>
              <div className="text-base">{position.responsabilidades}</div>
            </div>
          )}

          {position.beneficios && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Benefícios</Label>
              <div className="text-base">{position.beneficios}</div>
            </div>
          )}
        </FormSection>
      )}

      <FormSection title="Status">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Status</Label>
          <div className="text-base">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              position.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {position.status === 'active' ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
      </FormSection>
    </div>
  );
}





