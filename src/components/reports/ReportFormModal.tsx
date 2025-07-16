
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
import { ChecklistFormSection, ChecklistItem } from "./ChecklistFormSection";
import { useImageUpload } from '@/hooks/useImageUpload';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface ReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  scheduleId?: string | null;
  onSuccess?: () => void;
  parentReportId?: string | null; // <-- nova prop
}

const STORAGE_BUCKET = 'report-attachments';
const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 10;

// IDs dos perfis de gestor
const GESTOR_PROFILE_ID = '8e720f2f-a69e-4660-8f6e-e8601892dda7';
const GESTOR_PREVENTIVA_PROFILE_ID = '93fa8f08-9666-4f96-bee7-c378398cfd76';

async function uploadFiles(files: File[], userId: string) {
  console.log('🚀 uploadFiles iniciado com:', files.length, 'arquivos');
  const uploaded = [];
  for (const file of files) {
    const timestamp = Date.now();
    const filePath = `reports/${userId}/${timestamp}_${file.name}`;
    console.log('📤 Fazendo upload de:', filePath, file);
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, { upsert: false });
    if (error) {
      console.error('❌ Erro ao fazer upload:', error);
      throw error;
    }
    console.log('✅ Upload bem-sucedido:', data);
    const { data: publicUrl } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
    uploaded.push({
      name: file.name,
      url: publicUrl.publicUrl,
      path: filePath,
      size: file.size,
      type: file.type
    });
    console.log('📋 Arquivo adicionado à lista:', uploaded[uploaded.length - 1]);
  }
  console.log('🎉 Upload concluído. Total de arquivos:', uploaded.length);
  return uploaded;
}

const ReportFormModal = ({ isOpen, onClose, templateId, scheduleId, onSuccess, parentReportId }: ReportFormModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [checklistData, setChecklistData] = useState<ChecklistItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [numeroServico, setNumeroServico] = useState('');
  const [managers, setManagers] = useState<any[]>([]);
  const [managerId, setManagerId] = useState('');

  // Usar o hook de upload otimizado
  const {
    uploadFiles,
    validateFiles,
    uploading,
    uploadError,
    uploadProgress,
    clearError
  } = useImageUpload({
    bucket: STORAGE_BUCKET,
    maxFiles: MAX_FILES,
    maxFileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    compressionOptions: {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.8,
      format: 'jpeg'
    },
    createThumbnails: true
  });

  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);

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
      
      // Debug: verificar se o template foi carregado
      console.log('🔍 Template carregado:', data);
      console.log('🔍 ID do template:', data.id);
      console.log('🔍 Nome do template:', data.name);
      console.log('🔍 Campos do template:', data.fields);
      
      // Verificar se há campo de upload
      const uploadField = Array.isArray(data.fields) ? data.fields.find((field: any) => field.type === 'upload') : null;
      console.log('🔍 Campo de upload encontrado:', uploadField);
      
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

  // Remover qualquer query ou lógica que utilize a tabela service_orders

  useEffect(() => {
    if (template) {
      // Se for edição, buscar valor do relatório existente (se houver)
      setNumeroServico(''); // Ajuste para edição se necessário
    }
  }, [template]);

  // Buscar gestores ao abrir o modal
  useEffect(() => {
    if (!isOpen) return;
    async function fetchManagers() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .in('access_profile_id', [GESTOR_PROFILE_ID, GESTOR_PREVENTIVA_PROFILE_ID])
        .eq('is_active', true);
      if (!error && data) setManagers(data);
    }
    fetchManagers();
  }, [isOpen]);

  // Adicione log para depuração
  console.log('Gestores carregados:', managers);

  const createReportMutation = useMutation({
    mutationFn: async (reportData: any) => {
      console.log('🗄️ createReportMutation iniciada');
      console.log('🗄️ Dados recebidos:', reportData);
      
      const payload = {
          title: reportData.title,
          description: reportData.description,
        numero_servico: reportData.numero_servico,
          technician_id: user?.id,
          template_id: templateId,
          form_data: reportData.formData,
          checklist_data: reportData.checklistData,
        attachments: Array.isArray(reportData.attachments) ? reportData.attachments : [],
          status: 'nao_validado' as const,
          schedule_id: typeof scheduleId === 'string' ? scheduleId : null,
          parent_report_id: reportData.parent_report_id ?? parentReportId ?? null, // <-- garantir preenchimento
          manager_id: reportData.manager_id // <-- incluir gestor
      };
      console.log('Payload para insert:', payload);
      console.log('🗄️ Attachments no payload:', payload.attachments);
      
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert(payload)
        .select()
        .single();

      if (reportError) {
        console.error('❌ Erro ao inserir relatório:', reportError);
        throw reportError;
      }
      
      console.log('✅ Relatório inserido com sucesso:', report);

      // Registrar atividade de criação
      const { error: activityCreateError } = await supabase.from('activities').insert([
        {
          user_id: user?.id,
          action: 'criar',
          entity_type: 'report',
          entity_id: report.id,
          details: {
            title: report.title,
            description: report.description,
            form_data: report.form_data,
            checklist_data: report.checklist_data,
            attachments: report.attachments
          }
        }
      ]);
      console.log('[activities.insert][criar] Dados enviados:', {
        user_id: user?.id,
        action: 'criar',
        entity_type: 'report',
        entity_id: report.id,
        details: {
          title: report.title,
          description: report.description,
          form_data: report.form_data,
          checklist_data: report.checklist_data,
          attachments: report.attachments
        }
      });
      console.log('[activities.insert][criar] Erro:', activityCreateError);

      // Se há itens do checklist, criar os registros na tabela de relacionamento
      if (reportData.checklistData && reportData.checklistData.length > 0) {
        const checklistInserts = reportData.checklistData.map((item: ChecklistItem) => ({
          report_id: report.id,
          checklist_item_id: item.id,
          quantity: item.quantity || 1,
          notes: item.notes || ''
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
      queryClient.invalidateQueries({ queryKey: ['validation-reports'] });
      toast({
        title: "Relatório criado",
        description: "O relatório foi criado com sucesso.",
      });
      if (onSuccess) onSuccess();
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
    setTitle('');
    setDescription('');
    setFilesToUpload([]); // Resetar arquivos selecionados
    setManagerId(''); // Resetar gestor selecionado
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let files = e.target.files ? Array.from(e.target.files) : [];
    // Filtrar apenas imagens
    files = files.filter(file => file.type.startsWith('image/'));

    setFilesToUpload(prev => {
      const total = prev.length + files.length;
      if (total > MAX_FILES) {
        toast({
          title: "Limite de arquivos",
          description: `Você pode enviar no máximo ${MAX_FILES} imagens.`,
          variant: "destructive",
        });
        // Não adiciona os novos arquivos se exceder o limite
        return prev;
      }
      // Evitar arquivos duplicados pelo nome
      const prevNames = new Set(prev.map(f => f.name));
      const newFiles = files.filter(f => !prevNames.has(f.name));
      return [...prev, ...newFiles];
    });
  };

  // Adicione a função de remoção de arquivo
  const handleRemoveFile = (fileName: string) => {
    setFilesToUpload(prev => prev.filter(file => file.name !== fileName));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 handleSubmit iniciado');
    console.log('📝 Título:', title);
    console.log('📝 Descrição:', description);
    console.log('📝 Número do Serviço:', numeroServico);
    console.log('📝 FormData:', formData);
    console.log('📝 FilesToUpload:', filesToUpload);
    
    if (!title.trim() || !description.trim() || !numeroServico.trim() || !/^[0-9]+$/.test(numeroServico) || !managerId) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios, incluindo o Gestor.",
        variant: "destructive",
      });
      return;
    }
    
    clearError();
    let newFormData = { ...formData };
    let uploadedFiles = [];
    
    if (filesToUpload.length > 0 && user?.id) {
      try {
        console.log('🚀 Iniciando upload otimizado de', filesToUpload.length, 'arquivos...');
        uploadedFiles = await uploadFiles(filesToUpload, user.id, 'reports');
        console.log('✅ Upload concluído. Arquivos:', uploadedFiles);
        newFormData.upload = uploadedFiles;
      } catch (err: any) {
        toast({
          title: "Erro no upload",
          description: err.message || 'Erro ao fazer upload.',
          variant: "destructive",
        });
        console.error('❌ Erro no upload:', err);
        return;
      }
    }
    
    const reportData = {
      title: title.trim(),
      description: description.trim(),
      numero_servico: numeroServico.trim(),
      formData: newFormData,
      checklistData,
      attachments: uploadedFiles,
      parent_report_id: parentReportId ?? null,
      manager_id: managerId // <-- incluir gestor
    };
    
    console.log('📤 Enviando dados do relatório:', reportData);
    createReportMutation.mutate(reportData);
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
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option: string, idx: number) => (
              <div key={idx} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`${fieldId}_${idx}`}
                  name={fieldId}
                  value={option}
                  checked={formData[fieldId] === option}
                  onChange={() => handleFieldChange(fieldId, option)}
                  required={field.required}
                />
                <Label htmlFor={`${fieldId}_${idx}`}>{option}</Label>
              </div>
            ))}
          </div>
        );
      case 'data':
        return (
          <Input
            type="date"
            value={formData[fieldId] || ''}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            required={field.required}
          />
        );
      case 'upload':
        return (
          <div className="space-y-2">
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              required={field.required}
              disabled={uploading}
            />
            
            {uploadError && (
              <p className="text-sm text-red-500">{uploadError}</p>
            )}
            
            {uploading && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Fazendo upload... {uploadProgress.toFixed(0)}%
                </p>
              </div>
            )}
            
            {/* Preview dos arquivos selecionados */}
            {filesToUpload.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {filesToUpload.map((file, index) => (
                  <div key={index} className="relative">
                    <OptimizedImage
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-24 object-cover rounded border"
                      thumbnailSize={100}
                    />
                    <p className="text-xs text-gray-500 mt-1 truncate">{file.name}</p>
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 hover:bg-red-100"
                      onClick={() => handleRemoveFile(file.name)}
                      title="Remover"
                    >
                      <span className="text-red-500 font-bold text-lg">×</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
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

  if (!template) return null;

  if (template?.id === '4b45c601-e5b7-4a33-98f9-1769aad319e9' || template?.name === 'Relatório de Vistoria') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Relatório de Vistoria</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center text-muted-foreground">
            O fluxo de criação de Relatório de Vistoria foi migrado. Utilize a tela de Vistoria Preventiva.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Relatório - {template.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dados do Serviço */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Serviço</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
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
                  <Label htmlFor="description">FCA *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="FCA do relatório"
                    required
                  />
                </div>
                {/* Dropdown de Gestor */}
                <div className="space-y-2">
                  <Label htmlFor="manager">Gestor *</Label>
                  <Select value={managerId} onValueChange={setManagerId} required>
                    <SelectTrigger id="manager">
                      <SelectValue placeholder="Selecione o gestor" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero-servico">Número do Serviço *</Label>
                  <Input
                    id="numero-servico"
                    value={numeroServico}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setNumeroServico(val);
                    }}
                    placeholder="Digite o número do serviço"
                    required
                    minLength={1}
                    pattern="^[0-9]+$"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campos dinâmicos do template */}
          {template.fields && Array.isArray(template.fields) && template.fields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Informações Específicas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                {template.fields.map((field: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <Label>
                      {field.label || field.name}
                      {field.required && ' *'}
                    </Label>
                    {renderField(field)}
                  </div>
                ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Checklist */}
          {template.checklist_enabled && availableChecklistItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-2 border rounded-lg bg-green-50 border-green-300">
                  <ChecklistFormSection
                    items={availableChecklistItems}
                    value={checklistData}
                    onChange={setChecklistData}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload de Imagens - Removido campo fixo, usando apenas campo dinâmico do template */}

          {/* Botões de ação */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createReportMutation.isPending || uploading}>
              Criar Relatório
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportFormModal;
