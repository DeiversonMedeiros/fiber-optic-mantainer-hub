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
import { Plus, Trash2, X, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';
import cloneDeep from 'lodash/cloneDeep';

const FIELD_TYPES = {
  texto_curto: 'Texto Curto',
  texto_longo: 'Texto Longo',
  data: 'Data',
  radio: 'Botão de Rádio',
  checkbox: 'Caixa de Seleção',
  dropdown: 'Lista Suspensa',
  upload: 'Upload de Arquivos'
};

interface ReportTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: any;
}

function FieldLogger({ field, children }: { field: any, children: React.ReactNode }) {
  React.useEffect(() => {
    console.log(`[MOUNT] Campo id=${field.id} | name=${field.name}`);
    return () => {
      console.log(`[UNMOUNT] Campo id=${field.id} | name=${field.name}`);
    };
  }, [field.id]);

  React.useEffect(() => {
    console.log(`[UPDATE] Campo id=${field.id} | name=${field.name}`);
  }, [field.name, field.id]);

  return <>{children}</>;
}

const ReportTemplateModal = ({ isOpen, onClose, template }: ReportTemplateModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [userClassId, setUserClassId] = useState('');
  const [checklistEnabled, setChecklistEnabled] = useState(false);
  const [checklistClassId, setChecklistClassId] = useState('');
  const [fields, setFields] = useState<any[]>([]);
  const [numeroServico, setNumeroServico] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [checklistOpen, setChecklistOpen] = useState(true);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);
  const inputRefs = React.useRef<Record<string, HTMLInputElement | null> & { lastFocused?: string }>({});

  useEffect(() => {
    console.log('MONTADO ReportTemplateModal');
    return () => {
      console.log('DESMONTADO ReportTemplateModal');
    };
  }, []);

  // Remover o useEffect de restauração de foco:
  // React.useEffect(() => {
  //   const last = inputRefs.current.lastFocused;
  //   if (last && document.activeElement !== inputRefs.current[last]) {
  //     inputRefs.current[last]?.focus();
  //   }
  // }, [fields]);

  // LOG DE DIAGNÓSTICO DE REFERÊNCIA DO ARRAY DE FIELDS
  console.log("FIELDS REF:", fields);

  const fieldIds = React.useMemo(() => fields.map(f => f.id), [fields]);

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

  // useEffect de inicialização dos campos
  useEffect(() => {
    if (isOpen && !initialized) {
      if (template) {
        setName(template.name);
        setDescription(template.description || '');
        setUserClassId(template.user_class_id || '');
        setChecklistEnabled(template.checklist_enabled || false);
        setChecklistClassId(template.checklist_class_id || '');
        setFields(Array.isArray(template.fields) ? cloneDeep(template.fields) : []);
        setNumeroServico(template.numero_servico || '');
      } else {
        setName('');
        setDescription('');
        setUserClassId('');
        setChecklistEnabled(false);
        setChecklistClassId('');
        setFields([]);
        setNumeroServico('');
      }
      setInitialized(true);
    }
  }, [isOpen, template?.id, initialized]);

  useEffect(() => {
    if (!isOpen) setInitialized(false);
  }, [isOpen]);

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
      id: uuidv4(),
      name: '',
      type: 'texto_curto',
      label: '',
      required: false,
      options: []
    }]);
  };

  const updateField = (id: string, key: string, value: any) => {
    setFields(fields => fields.map(field =>
      field.id === id ? { ...field, [key]: value } : field
    ));
  };

  const removeField = (id: string) => {
    setFields(fields => fields.filter(field => field.id !== id));
  };

  const addOption = (fieldId: string) => {
    setFields(fields => fields.map(field => {
      if (field.id === fieldId) {
        return {
          ...field,
          options: [...(field.options || []), '']
        };
      }
      return field;
    }));
  };

  const updateOption = (fieldId: string, optionIndex: number, value: string) => {
    setFields(fields => fields.map(field => {
      if (field.id === fieldId) {
        const newOptions = [...(field.options || [])];
        newOptions[optionIndex] = value;
        return { ...field, options: newOptions };
      }
      return field;
    }));
  };

  const removeOption = (fieldId: string, optionIndex: number) => {
    setFields(fields => fields.map(field => {
      if (field.id === fieldId) {
        const newOptions = [...(field.options || [])];
        newOptions.splice(optionIndex, 1);
        return { ...field, options: newOptions };
      }
      return field;
    }));
  };

  const needsOptions = (fieldType: string) => {
    return ['radio', 'dropdown', 'checkbox'].includes(fieldType);
  };

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex(f => f.id === active.id);
      const newIndex = fields.findIndex(f => f.id === over.id);
      setFields((fields) => arrayMove(fields, oldIndex, newIndex));
    }
  }

  function toggleFieldExpand(id: string) {
    setExpandedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  function SortableFieldCard({ id, children }: { id: string, children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      cursor: 'grab',
    };
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        {children}
      </div>
    );
  }

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
      // numero_servico removido
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
            <Label htmlFor="description">FCA</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Digite uma FCA para o template"
              rows={2}
            />
          </div>

          {/* Configurações de checklist */}
          <Card>
            <CardHeader
              className="flex flex-row items-center justify-between cursor-pointer"
              onClick={() => setChecklistOpen((v) => !v)}
            >
              <div className="flex items-center gap-2">
                {checklistOpen ? <ChevronDown /> : <ChevronRight />}
                <CardTitle className="text-lg">Configurações de Checklist</CardTitle>
              </div>
            </CardHeader>
            {checklistOpen && (
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
            )}
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
              {fields.map((field) => {
                const isExpanded = expandedFields.has(field.id);
                // Log para inspecionar o campo
                console.log("Renderizando campo:", field);

                return (
                  <Card className="p-4" key={field.id}>
                    {/* Cabeçalho do campo */}
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleFieldExpand(field.id)}
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDown /> : <ChevronRight />}
                        <span className="font-semibold">
                          {field.label || "Campo sem rótulo"}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeField(field.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {/* Corpo do campo, só aparece se expandido */}
                    {isExpanded && (
                      <div className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>Nome do Campo</Label>
                            <Input
                              value={field.name}
                              onChange={(e) =>
                                updateField(field.id, "name", e.target.value)
                              }
                              placeholder="nome_do_campo"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Rótulo</Label>
                            <Input
                              value={field.label}
                              onChange={(e) =>
                                updateField(field.id, "label", e.target.value)
                              }
                              placeholder="Rótulo do campo"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select
                              value={field.type}
                              onValueChange={(value) =>
                                updateField(field.id, "type", value)
                              }
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
                          <div className="flex items-center space-x-2 mt-6">
                            {/* Log para garantir que o checkbox está sendo processado */}
                            {console.log("Renderizando checkbox para campo:", field.name, "required:", field.required)}
                            <Checkbox
                              id={`required-${field.id}`}
                              checked={field.required}
                              onCheckedChange={(checked) =>
                                updateField(field.id, "required", checked === true)
                              }
                            />
                            <Label htmlFor={`required-${field.id}`}>Campo obrigatório</Label>
                          </div>
                        </div>
                        {/* Opções para campos que precisam */}
                        {needsOptions(field.type) && (
                          <div className="mt-4">
                            <div className="flex justify-between items-center mb-2">
                              <Label>Opções</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addOption(field.id)}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Opção
                              </Button>
                            </div>
                            {field.options?.map((option: string, idx: number) => (
                              <div className="flex items-center gap-2 mb-2" key={idx}>
                                <Input
                                  value={option}
                                  onChange={(e) =>
                                    updateOption(field.id, idx, e.target.value)
                                  }
                                  placeholder={`Opção ${idx + 1}`}
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => removeOption(field.id, idx)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </CardContent>
          </Card>

          {/* Substituir o bloco removido anteriormente por um campo desabilitado, apenas informativo: */}
          <div className="space-y-2">
            <Label>Número do Serviço *</Label>
            <Input
              value="Campo obrigatório para o usuário"
              disabled
              readOnly
              placeholder="Será preenchido pelo usuário no relatório"
            />
          </div>

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

// Função utilitária para corrigir campos type dos templates de relatório
export async function corrigirTiposUploadTemplates() {
  // Buscar todos os templates
  const { data: templates, error } = await supabase.from('report_templates').select('*');
  if (error) {
    console.error('Erro ao buscar templates:', error);
    return;
  }
  for (const template of templates) {
    if (Array.isArray(template.fields)) {
      let alterado = false;
      const novosCampos = template.fields.map((field: any) => {
        if (field.type === 'Upload de Arquivos') {
          alterado = true;
          return { ...field, type: 'upload' };
        }
        return field;
      });
      if (alterado) {
        const { error: updateError } = await supabase
          .from('report_templates')
          .update({ fields: novosCampos })
          .eq('id', template.id);
        if (updateError) {
          console.error('Erro ao atualizar template', template.id, updateError);
        } else {
          console.log('Corrigido template', template.id);
        }
      }
    }
  }
}

export default ReportTemplateModal;
