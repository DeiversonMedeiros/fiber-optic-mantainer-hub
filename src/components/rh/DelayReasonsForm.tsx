import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { type DelayReason, type DelayReasonInsert } from '@/hooks/rh/useDelayReasons';

interface DelayReasonsFormProps {
  delayReason?: DelayReason | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DelayReasonInsert) => void;
}

const CATEGORIAS = [
  { value: 'JUSTIFICADO', label: 'Justificado' },
  { value: 'INJUSTIFICADO', label: 'Injustificado' },
  { value: 'FORCA_MAIOR', label: 'Força Maior' }
];

export const DelayReasonsForm: React.FC<DelayReasonsFormProps> = ({
  delayReason,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<DelayReasonInsert>({
    codigo: '',
    descricao: '',
    categoria: 'JUSTIFICADO',
    requires_justification: true,
    requires_medical_certificate: false,
    is_active: true
  });

  const { toast } = useToast();

  useEffect(() => {
    if (delayReason) {
      setFormData(delayReason);
    } else {
      setFormData({
        codigo: '',
        descricao: '',
        categoria: 'JUSTIFICADO',
        requires_justification: true,
        requires_medical_certificate: false,
        is_active: true
      });
    }
  }, [delayReason, isOpen]);

  const handleInputChange = (field: keyof DelayReasonInsert, value: any) => {
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
          {delayReason ? 'Editar Motivo de Atraso' : 'Novo Motivo de Atraso'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="codigo">Código *</Label>
            <Input
              id="codigo"
              value={formData.codigo}
              onChange={(e) => handleInputChange('codigo', e.target.value)}
              placeholder="Ex: DOENCA"
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
              placeholder="Ex: Doença/Problema de saúde"
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

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requires_justification"
                checked={formData.requires_justification}
                onCheckedChange={(checked) => handleInputChange('requires_justification', checked)}
              />
              <Label htmlFor="requires_justification">Requer justificativa</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requires_medical_certificate"
                checked={formData.requires_medical_certificate}
                onCheckedChange={(checked) => handleInputChange('requires_medical_certificate', checked)}
              />
              <Label htmlFor="requires_medical_certificate">Requer atestado médico</Label>
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
              {delayReason ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
