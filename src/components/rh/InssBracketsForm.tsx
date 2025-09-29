import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { type InssBracket, type InssBracketInsert } from '@/hooks/rh/useInssBrackets';

interface InssBracketsFormProps {
  inssBracket?: InssBracket | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: InssBracketInsert) => void;
}

export const InssBracketsForm: React.FC<InssBracketsFormProps> = ({
  inssBracket,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<InssBracketInsert>({
    codigo: '',
    descricao: '',
    valor_minimo: 0,
    valor_maximo: undefined,
    aliquota: 0,
    valor_deducao: 0,
    is_active: true
  });

  const { toast } = useToast();

  useEffect(() => {
    if (inssBracket) {
      setFormData(inssBracket);
    } else {
      setFormData({
        codigo: '',
        descricao: '',
        valor_minimo: 0,
        valor_maximo: undefined,
        aliquota: 0,
        valor_deducao: 0,
        is_active: true
      });
    }
  }, [inssBracket, isOpen]);

  const handleInputChange = (field: keyof InssBracketInsert, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.codigo.trim() || !formData.descricao.trim()) {
      toast({
        title: "Erro",
        description: "Código e descrição são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (formData.valor_minimo < 0) {
      toast({
        title: "Erro",
        description: "Valor mínimo deve ser maior ou igual a zero",
        variant: "destructive"
      });
      return;
    }

    if (formData.valor_maximo && formData.valor_maximo <= formData.valor_minimo) {
      toast({
        title: "Erro",
        description: "Valor máximo deve ser maior que o valor mínimo",
        variant: "destructive"
      });
      return;
    }

    if (formData.aliquota < 0 || formData.aliquota > 100) {
      toast({
        title: "Erro",
        description: "Alíquota deve estar entre 0 e 100",
        variant: "destructive"
      });
      return;
    }

    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          {inssBracket ? 'Editar Faixa INSS' : 'Nova Faixa INSS'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="codigo">Código *</Label>
            <Input
              id="codigo"
              value={formData.codigo}
              onChange={(e) => handleInputChange('codigo', e.target.value)}
              placeholder="Ex: INSS_1"
              maxLength={10}
              required
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Ex: Primeira faixa INSS"
              required
            />
          </div>

          <div>
            <Label htmlFor="valor_minimo">Valor Mínimo (R$) *</Label>
            <Input
              id="valor_minimo"
              type="number"
              step="0.01"
              value={formData.valor_minimo || ''}
              onChange={(e) => handleInputChange('valor_minimo', parseFloat(e.target.value) || 0)}
              placeholder="Ex: 0.00"
              min="0"
              required
            />
          </div>

          <div>
            <Label htmlFor="valor_maximo">Valor Máximo (R$)</Label>
            <Input
              id="valor_maximo"
              type="number"
              step="0.01"
              value={formData.valor_maximo || ''}
              onChange={(e) => handleInputChange('valor_maximo', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Ex: 1100.00 (deixe vazio para última faixa)"
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="aliquota">Alíquota (%) *</Label>
            <Input
              id="aliquota"
              type="number"
              step="0.01"
              value={formData.aliquota || ''}
              onChange={(e) => handleInputChange('aliquota', parseFloat(e.target.value) || 0)}
              placeholder="Ex: 7.5"
              min="0"
              max="100"
              required
            />
          </div>

          <div>
            <Label htmlFor="valor_deducao">Valor Dedução (R$) *</Label>
            <Input
              id="valor_deducao"
              type="number"
              step="0.01"
              value={formData.valor_deducao || ''}
              onChange={(e) => handleInputChange('valor_deducao', parseFloat(e.target.value) || 0)}
              placeholder="Ex: 0.00"
              min="0"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Ativo</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {inssBracket ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
