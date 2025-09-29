import React, { useState, useEffect } from 'react';
import { Unit, UnitInsert, UnitUpdate } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UnitsFormProps {
  unit?: Unit;
  onSubmit: (data: UnitInsert | UnitUpdate) => void;
  onCancel: () => void;
  unitsForSelect: Array<{ id: string; codigo: string; nome: string; parent_id: string | null }>;
}

export function UnitsForm({ unit, onSubmit, onCancel, unitsForSelect }: UnitsFormProps) {
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    descricao: '',
    parent_id: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (unit) {
      setFormData({
        codigo: unit.codigo,
        nome: unit.nome,
        descricao: unit.descricao || '',
        parent_id: unit.parent_id || '',
      });
    }
  }, [unit]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.codigo.trim()) {
      newErrors.codigo = 'Código é obrigatório';
    }

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    // Verificar se o código já existe (exceto para a própria unidade sendo editada)
    const existingUnit = unitsForSelect.find(u => 
      u.codigo === formData.codigo && u.id !== unit?.id
    );
    if (existingUnit) {
      newErrors.codigo = 'Código já existe';
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
      parent_id: formData.parent_id || null,
    };

    onSubmit(submitData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === 'none' ? '' : value,
    }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Filtrar unidades que podem ser pais (excluir a própria unidade e suas filhas)
  const getAvailableParents = () => {
    if (!unit) return unitsForSelect;
    
    // Excluir a própria unidade e suas filhas
    const excludeIds = new Set([unit.id]);
    const addChildren = (parentId: string) => {
      const children = unitsForSelect.filter(u => u.parent_id === parentId);
      children.forEach(child => {
        excludeIds.add(child.id);
        addChildren(child.id);
      });
    };
    addChildren(unit.id);
    
    return unitsForSelect.filter(u => !excludeIds.has(u.id));
  };

  const availableParents = getAvailableParents();

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
            placeholder="Ex: DIR001"
            className={errors.codigo ? 'border-destructive' : ''}
          />
          {errors.codigo && (
            <p className="text-sm text-destructive">{errors.codigo}</p>
          )}
        </div>

        {/* Unidade Pai */}
        <div className="space-y-2">
          <Label htmlFor="parent_id">Unidade Pai</Label>
          <Select
            value={formData.parent_id || 'none'}
            onValueChange={(value) => handleInputChange('parent_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a unidade pai (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma (Unidade Raiz)</SelectItem>
              {availableParents.map((parent) => (
                <SelectItem key={parent.id} value={parent.id}>
                  {parent.codigo} - {parent.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="nome">Nome *</Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => handleInputChange('nome', e.target.value)}
          placeholder="Ex: Diretoria de Recursos Humanos"
          className={errors.nome ? 'border-destructive' : ''}
        />
        {errors.nome && (
          <p className="text-sm text-destructive">{errors.nome}</p>
        )}
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          value={formData.descricao}
          onChange={(e) => handleInputChange('descricao', e.target.value)}
          placeholder="Descrição da unidade organizacional..."
          rows={3}
        />
      </div>

      {/* Informações sobre hierarquia */}
      {formData.parent_id && (
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-2">Informações da Hierarquia</h4>
          <p className="text-sm text-muted-foreground">
            Esta unidade será criada como subunidade da unidade selecionada. 
            O nível hierárquico será calculado automaticamente.
          </p>
        </div>
      )}

      {/* Botões */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {unit ? 'Atualizar' : 'Criar'} Unidade
        </Button>
      </div>
    </form>
  );
}
