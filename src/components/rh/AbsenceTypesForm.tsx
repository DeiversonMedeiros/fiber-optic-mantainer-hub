import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { type AbsenceType, type AbsenceTypeInsert } from '@/hooks/rh/useAbsenceTypes';

interface AbsenceTypesFormProps {
  absenceType?: AbsenceType | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AbsenceTypeInsert) => void;
}

const CATEGORIAS = [
  { value: 'FERIAS', label: 'Férias' },
  { value: 'LICENCA_MEDICA', label: 'Licença Médica' },
  { value: 'LICENCA_MATERNIDADE', label: 'Licença Maternidade' },
  { value: 'LICENCA_PATERNIDADE', label: 'Licença Paternidade' },
  { value: 'LICENCA_SEM_VENCIMENTO', label: 'Licença Sem Vencimento' },
  { value: 'AFASTAMENTO', label: 'Afastamento' }
];

export const AbsenceTypesForm: React.FC<AbsenceTypesFormProps> = ({
  absenceType,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<AbsenceTypeInsert>({
    codigo: '',
    descricao: '',
    categoria: 'FERIAS',
    is_paid: true,
    requires_medical_certificate: false,
    requires_approval: true,
    max_days: undefined,
    is_active: true
  });

  const { toast } = useToast();

  useEffect(() => {
    if (absenceType) {
      setFormData(absenceType);
    } else {
      setFormData({
        codigo: '',
        descricao: '',
        categoria: 'FERIAS',
        is_paid: true,
        requires_medical_certificate: false,
        requires_approval: true,
        max_days: undefined,
        is_active: true
      });
    }
  }, [absenceType, isOpen]);

  const handleInputChange = (field: keyof AbsenceTypeInsert, value: any) => {
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
          {absenceType ? 'Editar Tipo de Afastamento' : 'Novo Tipo de Afastamento'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="codigo">Código *</Label>
            <Input
              id="codigo"
              value={formData.codigo}
              onChange={(e) => handleInputChange('codigo', e.target.value)}
              placeholder="Ex: FERIAS"
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
              placeholder="Ex: Férias anuais"
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
            <Label htmlFor="max_days">Máximo de dias</Label>
            <Input
              id="max_days"
              type="number"
              value={formData.max_days || ''}
              onChange={(e) => handleInputChange('max_days', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Ex: 30"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_paid"
                checked={formData.is_paid}
                onCheckedChange={(checked) => handleInputChange('is_paid', checked)}
              />
              <Label htmlFor="is_paid">É remunerado</Label>
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
                id="requires_approval"
                checked={formData.requires_approval}
                onCheckedChange={(checked) => handleInputChange('requires_approval', checked)}
              />
              <Label htmlFor="requires_approval">Requer aprovação</Label>
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
              {absenceType ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};




















