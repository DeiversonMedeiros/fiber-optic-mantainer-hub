
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const FIELD_TYPES = {
  texto_curto: 'Texto Curto',
  texto_longo: 'Texto Longo',
  data: 'Data',
  radio: 'Botão de Rádio',
  checkbox: 'Caixa de Seleção',
  dropdown: 'Lista Suspensa',
  upload: 'Upload de Arquivos',
  checklist: 'Checklist'
};

interface ReportTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: any;
}

const ReportTemplateModal = ({ isOpen, onClose, template }: ReportTemplateModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [userClassId, setUserClassId] = useState('');
  const [checklistEnabled, setChecklistEnabled] = useState(false);
  const [checklistClassId, setChecklistClassId] = useState('');
  const [fields, setFields] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userClasses } = useQuery({
    queryKey: ['user-classes-for-template'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_classes')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setUserClassId(template.user_class_id || '');
      setChecklistEnabled(template.checklist_enabled || false);
      setChecklistClassId(template.checklist_class_id || '');
      setFields(Array.isArray(template.fields) ? template.fields : []);
    } else {
      setName('');
      setDescription('');
      setUserClassId('');
      setChecklistEnabled(false);
      setChecklistClassId('');
      setFields([]);
    }
  }, [template]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (template) {
        const { error } = await supabase
          .from('report_templates')
          .update(data)
          .eq('id', template.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('report_templates')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      toast({
        title: template ? "Template atualizado" : "Template criado",
        description: `O template de relatório foi ${template ? 'atualizado' : 'criado'} com sucesso.`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível ${template ? 'atualizar' : 'criar'} o template de relatório.`,
        variant: "destructive",
      });
    }
  });

  const addField = () => {
    setFields([...fields, {
      id: Date.now().toString(),
      name: '',
      type: 'texto_curto',
      label: '',
      required: false,
      options: []
    }]);
  };

  const updateField = (index: number, key: string, value: any) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setFields(newFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    mutation.mutate({
      name: name.trim(),
      description: description.trim(),
      user_class_id: userClassId || null,
      checklist_enabled: checklistEnabled,
      checklist_class_id: checklistEnabled ? (checklistClassId || null) : null,
      fields: fields
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Editar Template de Relatório' : 'Criar Novo Template de Relatório'}
          </DialogTitle>
          <DialogDescription>
            {template 
              ? 'Edite as informações do template de relatório.'
              : 'Crie um novo template de relatório com campos customizáveis.'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Template</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite o nome do template"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-class">Classe Vinculada</Label>
              <Select value={userClassId} onValueChange={setUserClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma classe" />
                </SelectTrigger>
                <SelectContent>
                  {userClasses?.map((userClass) => (
                    <SelectItem key={userClass.id} value={userClass.id}>
                      {userClass.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Digite uma descrição para o template"
              rows={2}
            />
          </div>

          {/* Configurações de checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurações de Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="checklist-enabled"
                  checked={checklistEnabled}
                  onCheckedChange={(checked) => setChecklistEnabled(checked === true)}
                />
                <Label htmlFor="checklist-enabled">Habilitar checklist de itens</Label>
              </div>
              
              {checklistEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="checklist-class">Classe do Checklist</Label>
                  <Select value={checklistClassId} onValueChange={setChecklistClassId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a classe dos itens" />
                    </SelectTrigger>
                    <SelectContent>
                      {userClasses?.map((userClass) => (
                        <SelectItem key={userClass.id} value={userClass.id}>
                          {userClass.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Campos customizáveis */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Campos do Formulário</CardTitle>
                <Button type="button" onClick={addField} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Campo
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Campo</Label>
                      <Input
                        value={field.name}
                        onChange={(e) => updateField(index, 'name', e.target.value)}
                        placeholder="nome_do_campo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rótulo</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => updateField(index, 'label', e.target.value)}
                        placeholder="Rótulo do campo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value) => updateField(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(FIELD_TYPES).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={field.required}
                        onCheckedChange={(checked) => updateField(index, 'required', checked === true)}
                      />
                      <Label>Campo obrigatório</Label>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeField(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
              
              {fields.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum campo adicionado. Clique em "Adicionar Campo" para começar.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending 
                ? 'Salvando...' 
                : template ? 'Atualizar' : 'Criar'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportTemplateModal;
