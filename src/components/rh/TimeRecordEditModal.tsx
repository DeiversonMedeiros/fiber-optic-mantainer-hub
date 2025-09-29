// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Save, X, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useToast } from '@/hooks/use-toast';

interface TimeRecordEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string | null;
  record: any;
  delayReasons: any[];
  correctionEnabled: boolean;
}

export function TimeRecordEditModal({
  isOpen,
  onClose,
  date,
  record,
  delayReasons,
  correctionEnabled
}: TimeRecordEditModalProps) {
  const { user } = useAuth();
  const { data: company } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    hora_entrada: '',
    hora_saida: '',
    intervalo_inicio: '',
    intervalo_fim: '',
    hora_adicional_inicio: '',
    hora_adicional_fim: '',
    justificativa: '',
    delay_reason_id: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  // Preencher formulário quando o modal abrir
  useEffect(() => {
    if (record) {
      setFormData({
        hora_entrada: record.hora_entrada || '',
        hora_saida: record.hora_saida || '',
        intervalo_inicio: record.intervalo_inicio || '',
        intervalo_fim: record.intervalo_fim || '',
        hora_adicional_inicio: record.hora_adicional_inicio || '',
        hora_adicional_fim: record.hora_adicional_fim || '',
        justificativa: record.justificativa || '',
        delay_reason_id: record.delay_reason_id || ''
      });
    } else {
      setFormData({
        hora_entrada: '',
        hora_saida: '',
        intervalo_inicio: '',
        intervalo_fim: '',
        hora_adicional_inicio: '',
        hora_adicional_fim: '',
        justificativa: '',
        delay_reason_id: ''
      });
    }
  }, [record, isOpen]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user?.id || !company?.id || !date) throw new Error('Dados inválidos');

      if (record) {
        // Atualizar registro existente
        const { error } = await rhSupabase
          .from('time_records')
          .update({
            hora_entrada: data.hora_entrada || null,
            hora_saida: data.hora_saida || null,
            intervalo_inicio: data.intervalo_inicio || null,
            intervalo_fim: data.intervalo_fim || null,
            hora_adicional_inicio: data.hora_adicional_inicio || null,
            hora_adicional_fim: data.hora_adicional_fim || null,
            justificativa: data.justificativa || null,
            delay_reason_id: data.delay_reason_id || null,
            tipo: 'correcao'
          })
          .eq('id', record.id);

        if (error) throw error;
      } else {
        // Criar novo registro
        const { error } = await rhSupabase
          .from('time_records')
          .insert([{
            company_id: company.id,
            employee_id: user.id,
            data: date,
            hora_entrada: data.hora_entrada || null,
            hora_saida: data.hora_saida || null,
            intervalo_inicio: data.intervalo_inicio || null,
            intervalo_fim: data.intervalo_fim || null,
            hora_adicional_inicio: data.hora_adicional_inicio || null,
            hora_adicional_fim: data.hora_adicional_fim || null,
            justificativa: data.justificativa || null,
            delay_reason_id: data.delay_reason_id || null,
            tipo: 'correcao'
          }]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: record ? "Registro atualizado!" : "Registro criado!",
        description: "As alterações foram salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['monthly-time-records'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await mutation.mutateAsync(formData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateWorkHours = () => {
    if (!formData.hora_entrada) return '0h 0min';
    
    const entrada = new Date(`2000-01-01T${formData.hora_entrada}`);
    let saida = new Date();
    
    if (formData.hora_saida) {
      saida = new Date(`2000-01-01T${formData.hora_saida}`);
    }
    
    // Subtrair intervalo se existir
    let intervaloMinutos = 0;
    if (formData.intervalo_inicio && formData.intervalo_fim) {
      const inicioIntervalo = new Date(`2000-01-01T${formData.intervalo_inicio}`);
      const fimIntervalo = new Date(`2000-01-01T${formData.intervalo_fim}`);
      intervaloMinutos = (fimIntervalo.getTime() - inicioIntervalo.getTime()) / (1000 * 60);
    }
    
    const totalMinutos = (saida.getTime() - entrada.getTime()) / (1000 * 60) - intervaloMinutos;
    const horas = Math.floor(totalMinutos / 60);
    const minutos = Math.floor(totalMinutos % 60);
    
    return `${horas}h ${minutos}min`;
  };

  if (!correctionEnabled) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span>Correção Bloqueada</span>
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">
              A correção de ponto não está liberada para este mês.
            </p>
            <Button onClick={onClose} variant="outline">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>
              {record ? 'Editar' : 'Criar'} Registro de Ponto
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">
              {date ? formatDate(date) : 'Data não selecionada'}
            </h3>
          </div>

          {/* Horários Principais */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Horários de Trabalho</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hora_entrada">Entrada</Label>
                  <Input
                    id="hora_entrada"
                    type="time"
                    value={formData.hora_entrada}
                    onChange={(e) => handleInputChange('hora_entrada', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hora_saida">Saída</Label>
                  <Input
                    id="hora_saida"
                    type="time"
                    value={formData.hora_saida}
                    onChange={(e) => handleInputChange('hora_saida', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Intervalo */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Intervalo</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="intervalo_inicio">Início do Intervalo</Label>
                  <Input
                    id="intervalo_inicio"
                    type="time"
                    value={formData.intervalo_inicio}
                    onChange={(e) => handleInputChange('intervalo_inicio', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intervalo_fim">Fim do Intervalo</Label>
                  <Input
                    id="intervalo_fim"
                    type="time"
                    value={formData.intervalo_fim}
                    onChange={(e) => handleInputChange('intervalo_fim', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Horas Adicionais */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Horas Adicionais</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hora_adicional_inicio">Início Hora Adicional</Label>
                  <Input
                    id="hora_adicional_inicio"
                    type="time"
                    value={formData.hora_adicional_inicio}
                    onChange={(e) => handleInputChange('hora_adicional_inicio', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hora_adicional_fim">Fim Hora Adicional</Label>
                  <Input
                    id="hora_adicional_fim"
                    type="time"
                    value={formData.hora_adicional_fim}
                    onChange={(e) => handleInputChange('hora_adicional_fim', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Justificativa */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium text-gray-900 mb-4">Justificativa</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="delay_reason_id">Motivo da Correção</Label>
                  <Select
                    value={formData.delay_reason_id}
                    onValueChange={(value) => handleInputChange('delay_reason_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {delayReasons.map((reason) => (
                        <SelectItem key={reason.id} value={reason.id}>
                          {reason.codigo} - {reason.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="justificativa">Descrição da Correção</Label>
                  <Textarea
                    id="justificativa"
                    placeholder="Descreva o motivo da correção ou inclusão do registro..."
                    value={formData.justificativa}
                    onChange={(e) => handleInputChange('justificativa', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo */}
          <Card className="bg-blue-50">
            <CardContent className="pt-6">
              <h3 className="font-medium text-gray-900 mb-2">Resumo</h3>
              <div className="text-sm text-gray-600">
                <p><strong>Horas trabalhadas:</strong> {calculateWorkHours()}</p>
                <p><strong>Tipo:</strong> {record ? 'Correção de registro' : 'Novo registro'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
