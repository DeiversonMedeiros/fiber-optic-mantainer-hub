import React, { useState, useEffect } from 'react';
import { DeficiencyType, DeficiencyTypeInsert, DeficiencyTypeUpdate } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface DeficiencyTypesFormProps {
  deficiencyType?: DeficiencyType;
  onSubmit: (data: DeficiencyTypeInsert | DeficiencyTypeUpdate) => void;
  onCancel: () => void;
}

export function DeficiencyTypesForm({ deficiencyType, onSubmit, onCancel }: DeficiencyTypesFormProps) {
  const [formData, setFormData] = useState({
    codigo: '',
    descricao: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (deficiencyType) {
      setFormData({
        codigo: deficiencyType.codigo,
        descricao: deficiencyType.descricao,
        is_active: deficiencyType.is_active ?? true,
      });
    }
  }, [deficiencyType]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.codigo.trim()) {
      newErrors.codigo = 'Código é obrigatório';
    } else if (formData.codigo.length > 10) {
      newErrors.codigo = 'Código deve ter no máximo 10 caracteres';
    }

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    } else if (formData.descricao.length > 255) {
      newErrors.descricao = 'Descrição deve ter no máximo 255 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
    };

    onSubmit(submitData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Código */}
        <div className="space-y-2">
          <Label htmlFor="codigo">Código *</Label>
          <Input
            id="codigo"
            value={formData.codigo}
            onChange={(e) => handleInputChange('codigo', e.target.value)}
            placeholder="Ex: FISICA"
            maxLength={10}
            className={errors.codigo ? 'border-destructive' : ''}
          />
          {errors.codigo && (
            <p className="text-sm text-destructive">{errors.codigo}</p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="is_active">Status</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <Label htmlFor="is_active" className="text-sm font-normal">
              Ativo
            </Label>
          </div>
        </div>
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição *</Label>
        <Textarea
          id="descricao"
          value={formData.descricao}
          onChange={(e) => handleInputChange('descricao', e.target.value)}
          placeholder="Ex: Deficiência Física"
          maxLength={255}
          rows={3}
          className={errors.descricao ? 'border-destructive' : ''}
        />
        {errors.descricao && (
          <p className="text-sm text-destructive">{errors.descricao}</p>
        )}
      </div>

      {/* Informações sobre o tipo de deficiência */}
      <div className="p-4 bg-muted rounded-lg">
        <h4 className="text-sm font-medium mb-2">Informações sobre o Tipo de Deficiência</h4>
        <p className="text-sm text-muted-foreground">
          O código deve ser único e representar o tipo de deficiência de forma clara. 
          Exemplos: FISICA, VISUAL, AUDITIVA, INTELECTUAL, MULTIPLA, TRANSTORNO.
        </p>
      </div>

      {/* Botões */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {deficiencyType ? 'Atualizar' : 'Criar'} Tipo de Deficiência
        </Button>
      </div>
    </form>
  );
}






























































