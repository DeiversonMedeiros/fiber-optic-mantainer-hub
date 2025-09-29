import React, { useState, useEffect } from 'react';
import { Rubrica, RubricaInsert, RubricaUpdate } from '@/integrations/supabase/rh-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RubricasFormProps {
  rubrica?: Rubrica;
  onSubmit: (data: RubricaInsert | RubricaUpdate) => void;
  onCancel: () => void;
  naturezas: Array<{ id: string; codigo: string; descricao: string }>;
}

export function RubricasForm({ rubrica, onSubmit, onCancel, naturezas }: RubricasFormProps) {
  const [formData, setFormData] = useState({
    codigo: '',
    descricao: '',
    natureza_esocial_id: '',
    tipo: 'provento' as 'provento' | 'desconto',
    referencia: '',
    unidade: '',
    incidencias: {
      INSS: false,
      FGTS: false,
      IRRF: false,
      FGTS_base: false,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (rubrica) {
      setFormData({
        codigo: rubrica.codigo,
        descricao: rubrica.descricao,
        natureza_esocial_id: rubrica.natureza_esocial_id || '',
        tipo: rubrica.tipo,
        referencia: rubrica.referencia || '',
        unidade: rubrica.unidade || '',
        incidencias: rubrica.incidencias || {
          INSS: false,
          FGTS: false,
          IRRF: false,
          FGTS_base: false,
        },
      });
    }
  }, [rubrica]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.codigo.trim()) {
      newErrors.codigo = 'Código é obrigatório';
    }

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }

    if (!formData.tipo) {
      newErrors.tipo = 'Tipo é obrigatório';
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
      incidencias: formData.incidencias,
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

  const handleIncidenciasChange = (field: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      incidencias: {
        ...prev.incidencias,
        [field]: checked,
      },
    }));
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
            placeholder="Ex: 1001"
            className={errors.codigo ? 'border-destructive' : ''}
          />
          {errors.codigo && (
            <p className="text-sm text-destructive">{errors.codigo}</p>
          )}
        </div>

        {/* Tipo */}
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo *</Label>
          <Select
            value={formData.tipo}
            onValueChange={(value) => handleInputChange('tipo', value)}
          >
            <SelectTrigger className={errors.tipo ? 'border-destructive' : ''}>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="provento">Provento</SelectItem>
              <SelectItem value="desconto">Desconto</SelectItem>
            </SelectContent>
          </Select>
          {errors.tipo && (
            <p className="text-sm text-destructive">{errors.tipo}</p>
          )}
        </div>
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição *</Label>
        <Input
          id="descricao"
          value={formData.descricao}
          onChange={(e) => handleInputChange('descricao', e.target.value)}
          placeholder="Ex: Salário Base"
          className={errors.descricao ? 'border-destructive' : ''}
        />
        {errors.descricao && (
          <p className="text-sm text-destructive">{errors.descricao}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Natureza eSocial */}
        <div className="space-y-2">
          <Label htmlFor="natureza_esocial_id">Natureza eSocial</Label>
          <Select
            value={formData.natureza_esocial_id}
            onValueChange={(value) => handleInputChange('natureza_esocial_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a natureza" />
            </SelectTrigger>
            <SelectContent>
              {naturezas.length > 0 ? (
                naturezas.map((natureza) => (
                  <SelectItem key={natureza.id} value={natureza.id}>
                    {natureza.codigo} - {natureza.descricao}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-data" disabled>
                  Nenhuma natureza encontrada
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Unidade */}
        <div className="space-y-2">
          <Label htmlFor="unidade">Unidade</Label>
          <Input
            id="unidade"
            value={formData.unidade}
            onChange={(e) => handleInputChange('unidade', e.target.value)}
            placeholder="Ex: R$, %, horas"
          />
        </div>
      </div>

      {/* Referência */}
      <div className="space-y-2">
        <Label htmlFor="referencia">Referência</Label>
        <Input
          id="referencia"
          value={formData.referencia}
          onChange={(e) => handleInputChange('referencia', e.target.value)}
          placeholder="Ex: Base de cálculo para horas extras"
        />
      </div>

      {/* Incidências */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Incidências</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="INSS"
                checked={formData.incidencias.INSS}
                onCheckedChange={(checked) => handleIncidenciasChange('INSS', checked as boolean)}
              />
              <Label htmlFor="INSS" className="text-sm">INSS</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="FGTS"
                checked={formData.incidencias.FGTS}
                onCheckedChange={(checked) => handleIncidenciasChange('FGTS', checked as boolean)}
              />
              <Label htmlFor="FGTS" className="text-sm">FGTS</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="IRRF"
                checked={formData.incidencias.IRRF}
                onCheckedChange={(checked) => handleIncidenciasChange('IRRF', checked as boolean)}
              />
              <Label htmlFor="IRRF" className="text-sm">IRRF</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="FGTS_base"
                checked={formData.incidencias.FGTS_base}
                onCheckedChange={(checked) => handleIncidenciasChange('FGTS_base', checked as boolean)}
              />
              <Label htmlFor="FGTS_base" className="text-sm">FGTS Base</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {rubrica ? 'Atualizar' : 'Criar'} Rubrica
        </Button>
      </div>
    </form>
  );
}
