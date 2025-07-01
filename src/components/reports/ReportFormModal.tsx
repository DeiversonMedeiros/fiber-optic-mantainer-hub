
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
}

interface ChecklistItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  notes: string;
}

const ReportFormModal = ({ isOpen, onClose, templateId }: ReportFormModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [checklistData, setChecklistData] = useState<ChecklistItem[]>([]);
  const [serviceOrderId, setServiceOrderId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Buscar template
  const { data: template } = useQuery({
    queryKey: ['report-template', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!templateId
  });

  // Buscar itens do checklist se o template tiver checklist habilitado
  const { data: availableChecklistItems = [] } = useQuery({
    queryKey: ['checklist-items-for-template', template?.checklist_class_id],
    queryFn: async () => {
      if (!template?.checklist_enabled || !template?.checklist_class_id) return [];
      
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('user_class_id', template.checklist_class_id)
        .eq('is_active', true)
        .order('category')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!template?.checklist_enabled && !!template?.checklist_class_id
  });

  // Buscar ordens de serviço
  const { data: serviceOrders = [] } = useQuery({
    queryKey: ['service-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_orders')
        .select('id, number, title')
        .eq('status', 'em_andamento')
        .order('number');
      if (error) throw error;
      return data;
    }
  });

  const createReportMutation = useMutation({
    mutationFn: async (reportData: any) => {
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          title: reportData.title,
          description: reportData.description,
          technician_id: user?.id,
          service_order_id: reportData.serviceOrderId || null,
          template_id: templateId,
          form_data: reportData.formData,
          checklist_data: reportData.checklistData,
          status: 'pendente'
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // Se há itens do checklist, criar os registros na tabela de relacionamento
      if (reportData.checklistData && reportData.checklistData.length > 0) {
        const checklistInserts = reportData.checklistData.map((item: ChecklistItem) => ({
          report_id: report.id,
          checklist_item_id: item.id,
          quantity: item.quantity,
          notes: item.notes
        }));

        const { error: checklistError } = await supabase
          .from('report_checklist_items')
          .insert(checklistInserts);

        if (checklistError) throw checklistError;
      }

      return report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
      toast({
        title: "Relatório criado",
        description: "O relatório foi criado com sucesso.",
      });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o relatório.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({});
    setChecklistData([]);
    setServiceOrderId('');
    setTitle('');
    setDescription('');
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const addChecklistItem = (itemId: string) => {
    const item = availableChecklistItems.find(i => i.id === itemId);
    if (!item) return;

    const existingItem = checklistData.find(i => i.id === itemId);
    if (existingItem) {
      setChecklistData(prev => prev.map(i => 
        i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setChecklistData(prev => [...prev, {
        id: itemId,
        name: item.name,
        category: item.category,
        quantity: 1,
        notes: ''
      }]);
    }
  };

  const updateChecklistItem = (itemId: string, field: 'quantity' | 'notes', value: number | string) => {
    setChecklistData(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const removeChecklistItem = (itemId: string) => {
    setChecklistData(prev => prev.filter(item => item.id !== itemId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Título e descrição são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    createReportMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      serviceOrderId,
      formData,
      checklistData
    });
  };

  const renderField = (field: any) => {
    const fieldId = field.id || field.name;
    
    switch (field.type) {
      case 'texto_curto':
        return (
          <Input
            value={formData[fieldId] || ''}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
      
      case 'texto_longo':
        return (
          <Textarea
            value={formData[fieldId] || ''}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
      
      case 'dropdown':
        return (
          <Select 
            value={formData[fieldId] || ''} 
            onValueChange={(value) => handleFieldChange(fieldId, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string, idx: number) => (
                <SelectItem key={idx} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option: string, idx: number) => (
              <div key={idx} className="flex items-center space-x-2">
                <Checkbox
                  id={`${fieldId}_${idx}`}
                  checked={formData[fieldId]?.includes(option) || false}
                  onCheckedChange={(checked) => {
                    const currentValues = formData[fieldId] || [];
                    if (checked) {
                      handleFieldChange(fieldId, [...currentValues, option]);
                    } else {
                      handleFieldChange(fieldId, currentValues.filter((v: string) => v !== option));
                    }
                  }}
                />
                <Label htmlFor={`${fieldId}_${idx}`}>{option}</Label>
              </div>
            ))}
          </div>
        );
      
      default:
        return (
          <Input
            value={formData[fieldId] || ''}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
    }
  };

  const groupedChecklistItems = availableChecklistItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  if (!template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Relatório - {template.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campos básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do relatório"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-order">Ordem de Serviço</Label>
              <Select value={serviceOrderId} onValueChange={setServiceOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma OS (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {serviceOrders.map(order => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.number} - {order.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do relatório"
              required
            />
          </div>

          {/* Campos dinâmicos do template */}
          {template.fields && Array.isArray(template.fields) && template.fields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Informações Específicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {template.fields.map((field: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <Label>
                      {field.label || field.name}
                      {field.required && ' *'}
                    </Label>
                    {renderField(field)}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Checklist */}
          {template.checklist_enabled && availableChecklistItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Adicionar itens */}
                <div className="space-y-4">
                  {Object.entries(groupedChecklistItems).map(([category, items]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="font-medium">{category === 'materiais' ? 'Materiais' : 'Serviços'}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {items.map(item => (
                          <Button
                            key={item.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addChecklistItem(item.id)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            {item.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Itens selecionados */}
                {checklistData.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Itens Selecionados</h4>
                    <div className="space-y-2">
                      {checklistData.map(item => (
                        <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
                          <span className="flex-1">{item.name}</span>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateChecklistItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                          <Input
                            placeholder="Observações"
                            value={item.notes}
                            onChange={(e) => updateChecklistItem(item.id, 'notes', e.target.value)}
                            className="w-32"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeChecklistItem(item.id)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createReportMutation.isPending}>
              Criar Relatório
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportFormModal;
