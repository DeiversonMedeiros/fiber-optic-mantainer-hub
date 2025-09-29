import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { type AllowanceType, type AllowanceTypeInsert } from '@/hooks/rh/useAllowanceTypes';

interface AllowanceTypesFormProps {
  allowanceType?: AllowanceType | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AllowanceTypeInsert) => void;
}

const TIPOS = [
  { value: 'PERCENTUAL', label: 'Percentual' },
  { value: 'VALOR_FIXO', label: 'Valor Fixo' },
  { value: 'HORA_EXTRA', label: 'Hora Extra' }
];

const UNIDADES = [
  { value: 'PERCENTUAL', label: 'Percentual (%)' },
  { value: 'REAIS', label: 'Reais (R$)' },
  { value: 'HORAS', label: 'Horas' }
];

const BASE_CALCULO = [
  { value: 'SALARIO_BASE', label: 'Salário Base' },
  { value: 'SALARIO_TOTAL', label: 'Salário Total' },
  { value: 'HORAS_TRABALHADAS', label: 'Horas Trabalhadas' }
];

export const AllowanceTypesForm: React.FC<AllowanceTypesFormProps> = ({
  allowanceType,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<AllowanceTypeInsert>({
    codigo: '',
    descricao: '',
    tipo: 'PERCENTUAL',
    valor: 0,
    unidade: 'PERCENTUAL',
    base_calculo: 'SALARIO_BASE',
    is_cumulative: false,
    requires_approval: true,
    is_active: true
  });

  const { toast } = useToast();

  useEffect(() => {
    if (allowanceType) {
      setFormData(allowanceType);
    } else {
      setFormData({
        codigo: '',
        descricao: '',
        tipo: 'PERCENTUAL',
        valor: 0,
        unidade: 'PERCENTUAL',
        base_calculo: 'SALARIO_BASE',
        is_cumulative: false,
        requires_approval: true,
        is_active: true
      });
    }
  }, [allowanceType, isOpen]);

  const handleInputChange = (field: keyof AllowanceTypeInsert, value: any) => {
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

    if (formData.valor <= 0) {
      toast({
        title: "Erro",
        description: "Valor deve ser maior que zero",
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
          {allowanceType ? 'Editar Tipo de Adicional' : 'Novo Tipo de Adicional'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="codigo">Código *</Label>
            <Input
              id="codigo"
              value={formData.codigo}
              onChange={(e) => handleInputChange('codigo', e.target.value)}
              placeholder="Ex: NOTURNO"
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
              placeholder="Ex: Adicional noturno"
              required
            />
          </div>

          <div>
            <Label htmlFor="tipo">Tipo</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => handleInputChange('tipo', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="valor">Valor *</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={(e) => handleInputChange('valor', parseFloat(e.target.value) || 0)}
              placeholder="Ex: 20.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="unidade">Unidade</Label>
            <Select
              value={formData.unidade}
              onValueChange={(value) => handleInputChange('unidade', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {UNIDADES.map((unidade) => (
                  <SelectItem key={unidade.value} value={unidade.value}>
                    {unidade.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="base_calculo">Base de Cálculo</Label>
            <Select
              value={formData.base_calculo}
              onValueChange={(value) => handleInputChange('base_calculo', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a base" />
              </SelectTrigger>
              <SelectContent>
                {BASE_CALCULO.map((base) => (
                  <SelectItem key={base.value} value={base.value}>
                    {base.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_cumulative"
                checked={formData.is_cumulative}
                onCheckedChange={(checked) => handleInputChange('is_cumulative', checked)}
              />
              <Label htmlFor="is_cumulative">Pode ser cumulativo</Label>
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
              {allowanceType ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};































































