import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { type CidCode, type CidCodeInsert } from '@/hooks/rh/useCidCodes';

interface CidCodesFormProps {
  cidCode?: CidCode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CidCodeInsert) => void;
}

const CATEGORIAS = [
  { value: 'Doenças respiratórias', label: 'Doenças respiratórias' },
  { value: 'Doenças gastrointestinais', label: 'Doenças gastrointestinais' },
  { value: 'Doenças musculoesqueléticas', label: 'Doenças musculoesqueléticas' },
  { value: 'Transtornos mentais', label: 'Transtornos mentais' },
  { value: 'Doenças cardiovasculares', label: 'Doenças cardiovasculares' },
  { value: 'Doenças infecciosas', label: 'Doenças infecciosas' }
];

export const CidCodesForm: React.FC<CidCodesFormProps> = ({
  cidCode,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<CidCodeInsert>({
    codigo: '',
    descricao: '',
    categoria: 'Doenças respiratórias',
    requires_work_restriction: false,
    max_absence_days: undefined,
    is_active: true
  });

  const { toast } = useToast();

  useEffect(() => {
    if (cidCode) {
      setFormData(cidCode);
    } else {
      setFormData({
        codigo: '',
        descricao: '',
        categoria: 'Doenças respiratórias',
        requires_work_restriction: false,
        max_absence_days: undefined,
        is_active: true
      });
    }
  }, [cidCode, isOpen]);

  const handleInputChange = (field: keyof CidCodeInsert, value: any) => {
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

    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          {cidCode ? 'Editar Código CID' : 'Novo Código CID'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="codigo">Código CID *</Label>
            <Input
              id="codigo"
              value={formData.codigo}
              onChange={(e) => handleInputChange('codigo', e.target.value)}
              placeholder="Ex: J00"
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
              placeholder="Ex: Resfriado comum"
              required
            />
          </div>

          <div>
            <Label htmlFor="categoria">Categoria</Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) => handleInputChange('categoria', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((categoria) => (
                  <SelectItem key={categoria.value} value={categoria.value}>
                    {categoria.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="max_absence_days">Máximo de dias de afastamento</Label>
            <Input
              id="max_absence_days"
              type="number"
              value={formData.max_absence_days || ''}
              onChange={(e) => handleInputChange('max_absence_days', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Ex: 5"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requires_work_restriction"
                checked={formData.requires_work_restriction}
                onCheckedChange={(checked) => handleInputChange('requires_work_restriction', checked)}
              />
              <Label htmlFor="requires_work_restriction">Requer restrição de trabalho</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label htmlFor="is_active">Ativo</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {cidCode ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};




















