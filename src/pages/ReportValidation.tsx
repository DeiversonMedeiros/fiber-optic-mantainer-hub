import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, XCircle, Edit, AlertTriangle, DollarSign, Trash2, ChevronDown, ChevronRight, Filter, FileText, ZoomIn, History, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ChecklistFormSection } from '@/components/reports/ChecklistFormSection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ThumbnailImage, FullImage } from '@/components/ui/OptimizedImage';
import { exportToCSV } from "@/utils/csvExport";
import { usePagination } from "@/hooks/usePagination";

const ReportValidation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [filters, setFilters] = useState({
    technician: 'all',
    status: 'all',
    serviceType: 'all',
    serviceNumber: '',
    userClass: 'all',
    startDate: '',
    endDate: '',
  });
  const [editReportId, setEditReportId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [editDescription, setEditDescription] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [editFormData, setEditFormData] = React.useState<Record<string, any>>({});
  const [editChecklist, setEditChecklist] = React.useState<any[]>([]);
  const [editAttachments, setEditAttachments] = React.useState<any[]>([]);
  const [editFilesToUpload, setEditFilesToUpload] = React.useState<File[]>([]);
  const [editUploadError, setEditUploadError] = React.useState<string | null>(null);

  // 1. Adicionar estado para modal de pendência
  const [pendingModalOpen, setPendingModalOpen] = React.useState<string | null>(null); // id do relatório
  const [pendingReason, setPendingReason] = React.useState('');
  const [pendingNotes, setPendingNotes] = React.useState('');
  const pendingOptions = [
    'Serviço a Mais',
    'Serviço Incorreto',
    'Falta Serviço',
    'Falta Material',
    'Material a Mais',
    'Material Incorreto',
    'Foto sem Localização',
    'Foto fora Padrão',
    'Sem Foto',
    'Falta Foto Caixa Fechada',
    'Falta Foto Caixa Aberta',
    'Falta As built',
    'Falta Croqui',
    'Falta Adequar',
    'Falta foto do sir',
    'Falta Coordenadas',
    'Outros',
  ];

  // Hooks para histórico de atividades (no topo do componente)
  const [activities, setActivities] = useState<Record<string, any[]>>({});
  const [loadingActivities, setLoadingActivities] = useState<Record<string, boolean>>({});
  // Adicionar estado para map de nomes de usuários
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [assignedNames, setAssignedNames] = useState<Record<string, string>>({});
  const [managerNames, setManagerNames] = useState<Record<string, string>>({});

  async function fetchActivities(reportId: string) {
    console.log('🔍 [fetchActivities] Buscando activities para reportId:', reportId);
    setLoadingActivities((prev) => ({ ...prev, [reportId]: true }));
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('entity_type', 'report')
      .eq('entity_id', reportId)
      .order('created_at', { ascending: false });
    console.log('🔍 [fetchActivities] Resultado da query activities:', data, 'Erro:', error);
    if (!error) {
      setActivities((prev) => ({ ...prev, [reportId]: data }));
      // Buscar nomes dos usuários únicos
      const userIds = Array.from(new Set((data || []).map((a: any) => a.user_id).filter(Boolean)));
      console.log('🔍 [fetchActivities] userIds únicos encontrados:', userIds);
      if (userIds.length > 0) {
        const { data: profiles, error: errorProfiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);
        console.log('🔍 [fetchActivities] Perfis retornados:', profiles, 'Erro:', errorProfiles);
        if (profiles) {
          const map: Record<string, string> = {};
          profiles.forEach((p: any) => { map[p.id] = p.name; });
          setUserNames((prev) => ({ ...prev, ...map }));
          console.log('🔍 [fetchActivities] userNames map atualizado:', map);
        }
      }
    }
    setLoadingActivities((prev) => ({ ...prev, [reportId]: false }));
  }

  // Buscar relatórios para validação (tabela reports - templates de relatórios)
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['validation-reports'],
    queryFn: async () => {
      let query = supabase
        .from('reports')
        .select(`
          *,
          pending_reason,
          pending_notes,
          technician:profiles!technician_id(name, user_class:user_classes(id, name)),
          template:report_templates(*)
          // manager:profiles!manager_id(name) // Removido para evitar erro 400
        `)
        .neq('template_id', '4b45c601-e5b7-4a33-98f9-1769aad319e9');
      // (Opcional: filtros pesados, como datas)
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Filtro local
  const filteredReports = useMemo(() => {
    return (reports as any[]).filter((report) => {
      const technicianMatch = filters.technician === 'all' || report.technician_id === filters.technician;
      const statusMatch = filters.status === 'all' || report.status === filters.status;
      const serviceNumberMatch = !filters.serviceNumber || (report.numero_servico && report.numero_servico.toLowerCase().includes(filters.serviceNumber.toLowerCase()));
      const userClassMatch = filters.userClass === 'all' || (report.technician?.user_class?.id === filters.userClass);
      const dateFromMatch = !filters.startDate || (report.created_at && report.created_at >= filters.startDate);
      const dateToMatch = !filters.endDate || (report.created_at && report.created_at <= filters.endDate + 'T23:59:59');
      return technicianMatch && statusMatch && serviceNumberMatch && userClassMatch && dateFromMatch && dateToMatch;
    });
  }, [reports, filters]);

  // TESTE ISOLADO: Buscar apenas os report_checklist_items sem join
  React.useEffect(() => {
    if (!reports || reports.length === 0) return;
    const reportIds = reports.map(r => r.id);
    (async () => {
      const { data: checklistLinks, error: errorLinks } = await supabase
        .from('report_checklist_items')
        .select('report_id, checklist_item_id, quantity, notes')
        .in('report_id', reportIds);
      console.log('TESTE checklistLinks:', checklistLinks);
      if (errorLinks) {
        console.error('TESTE errorLinks:', errorLinks);
        alert('Erro ao buscar report_checklist_items: ' + (errorLinks.message || errorLinks.details || errorLinks.code));
      }
    })();
  }, [reports]);

  // Buscar técnicos para filtro - apenas técnicos ativos
  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('is_active', true)
        .eq('access_profile_id', '38a5d358-75d6-4ae6-a109-1456a7dba714')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Buscar classes de usuário
  const { data: userClasses = [] } = useQuery({
    queryKey: ['user-classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_classes')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Buscar itens do checklist para todos os relatórios exibidos (fallback para dois fetchs)
  const { data: checklistItemsByReport = {} } = useQuery({
    queryKey: ['report-checklist-items', reports.map(r => r.id)],
    queryFn: async () => {
      if (!reports || reports.length === 0) return {};
      const reportIds = reports.map(r => r.id);
      // 1. Buscar todos os report_checklist_items
      const { data: checklistLinks, error: errorLinks } = await supabase
        .from('report_checklist_items')
        .select('report_id, checklist_item_id, quantity, notes')
        .in('report_id', reportIds);
      if (errorLinks) throw errorLinks;
      const checklistItemIds = [...new Set((checklistLinks || []).map(item => item.checklist_item_id))];
      // 2. Buscar todos os checklist_items necessários
      const { data: checklistItems, error: errorItems } = await supabase
        .from('checklist_items')
        .select('id, name, category')
        .in('id', checklistItemIds);
      if (errorItems) throw errorItems;
      const checklistItemMap = {};
      (checklistItems || []).forEach(item => { checklistItemMap[item.id] = item; });
      // 3. Agrupar por report_id e adicionar nome
      const grouped = {};
      (checklistLinks || []).forEach(item => {
        if (!grouped[item.report_id]) grouped[item.report_id] = [];
        grouped[item.report_id].push({
          ...item,
          name: checklistItemMap[item.checklist_item_id]?.name || '-',
          category: checklistItemMap[item.checklist_item_id]?.category || ''
        });
      });
      console.log('DEBUG checklistItemsByReport', grouped); // <--- ADICIONADO
      return grouped;
    },
    enabled: reports.length > 0
  });

  // [ADICIONAR] Buscar todos os itens ativos do checklist
  const { data: allChecklistItems = [] } = useQuery({
    queryKey: ['all-checklist-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  // Mutações para ações nos relatórios
  const updateStatusMutation = useMutation({
    mutationFn: async ({ reportId, status, assignedTo, pending_reason, pending_notes }: { reportId: string, status: string, assignedTo?: string, pending_reason?: string, pending_notes?: string }) => {
      const updateObj: any = { status };
      if (status === "em_adequacao" && assignedTo) {
        updateObj.assigned_to = assignedTo;
      }
      if (status === "validado") {
        updateObj.validated_by = user?.id;
        updateObj.validated_at = new Date().toISOString();
      }
      if (typeof status === 'string' && status === "faturado") {
        (updateObj as any).invoiced_at = new Date().toISOString();
      }
      if (status === "pendente") {
        updateObj.pending_reason = pending_reason;
        updateObj.pending_notes = pending_notes;
      }
      const { error } = await supabase
        .from('reports')
        .update(updateObj)
        .eq('id', reportId);
      if (error) throw error;
      // Registrar atividade
      await supabase.from('activities').insert([
        {
          user_id: user?.id,
          action: status,
          entity_type: 'report',
          entity_id: reportId,
          details: {
            assignedTo,
            pending_reason,
            pending_notes
          }
        }
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validation-reports'] });
      queryClient.invalidateQueries({ queryKey: ['report-checklist-items'] }); // <--- ADICIONADO
      toast({
        title: "Status atualizado",
        description: "O status do relatório foi atualizado com sucesso.",
      });
    }
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase.from('reports').delete().eq('id', reportId);
      if (error) throw error;
      // Registrar atividade
      await supabase.from('activities').insert([
        {
          user_id: user?.id,
          action: 'deletar',
          entity_type: 'report',
          entity_id: reportId,
          details: {}
        }
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validation-reports'] });
      toast({
        title: "Relatório deletado",
        description: "O relatório foi removido com sucesso.",
      });
    }
  });

  const getStatusColor = (status: string) => {
    const colors = {
      'nao_validado': 'bg-orange-100 text-orange-800',
      'validado': 'bg-green-100 text-green-800',
      'pendente': 'bg-red-100 text-red-800',
      'em_adequacao': 'bg-yellow-100 text-yellow-800',
      'faturado': 'bg-blue-100 text-blue-800',
      'sem_pendencia': 'bg-emerald-100 text-emerald-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'nao_validado': 'Não Validado',
      'validado': 'Validado',
      'pendente': 'Pendente',
      'em_adequacao': 'Em adequação',
      'faturado': 'Faturado',
      'sem_pendencia': 'Sem pendência',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const toggleCardExpansion = (reportId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedCards(newExpanded);
  };

  const handleStatusUpdate = (reportId: string, status: string, assignedTo?: string) => {
    updateStatusMutation.mutate({ reportId, status, assignedTo });
  };

  const handleDeleteReport = (reportId: string) => {
    if (window.confirm("Tem certeza que deseja deletar este relatório?")) {
      deleteReportMutation.mutate(reportId);
    }
  };

  // Sincronizar campos ao abrir o modal
  React.useEffect(() => {
    if (editReportId) {
      const reportToEdit = reports.find(r => r.id === editReportId);
      setEditTitle(reportToEdit?.title || '');
      setEditDescription(reportToEdit?.description || '');
      setEditFormData(
        reportToEdit && typeof reportToEdit.form_data === 'object' && !Array.isArray(reportToEdit.form_data)
          ? reportToEdit.form_data
          : {}
      );
      setEditChecklist(
        reportToEdit && Array.isArray(reportToEdit.checklist_data)
          ? reportToEdit.checklist_data
          : []
      );
      setEditAttachments(
        reportToEdit && Array.isArray(reportToEdit.attachments)
          ? reportToEdit.attachments
          : []
      );
      setEditFilesToUpload([]);
      setEditUploadError(null);
    }
  }, [editReportId, reports]);

  const reportToEdit = editReportId ? reports.find(r => r.id === editReportId) : null;
  const template = reportToEdit?.template;

  const handleEditFieldChange = (fieldId: string, value: any) => {
    setEditFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleEditChecklistChange = (selected: any[]) => {
    setEditChecklist(selected);
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    // Limitar quantidade e tamanho
    const totalFiles = editAttachments.length + files.length;
    if (totalFiles > 10) {
      setEditUploadError('Máximo de 10 arquivos permitidos.');
      return;
    }
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setEditUploadError('Cada arquivo deve ter até 10MB.');
        return;
      }
    }
    setEditFilesToUpload(files);
    setEditUploadError(null);
  };

  const handleRemoveAttachment = (idx: number) => {
    setEditAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  async function uploadEditFiles(files: File[], userId: string) {
    const uploaded = [];
    for (const file of files) {
      const timestamp = Date.now();
      const filePath = `reports/${userId}/${timestamp}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('report-attachments')
        .upload(filePath, file, { upsert: false });
      if (error) throw error;
      const { data: publicUrl } = supabase.storage.from('report-attachments').getPublicUrl(filePath);
      uploaded.push({
        name: file.name,
        url: publicUrl.publicUrl,
        path: filePath,
        size: file.size,
        type: file.type
      });
    }
    return uploaded;
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    let newAttachments = [...editAttachments];
    try {
      if (editFilesToUpload.length > 0 && user) {
        const uploaded = await uploadEditFiles(editFilesToUpload, user.id);
        newAttachments = [...editAttachments, ...uploaded];
      }
      const { error } = await supabase
        .from('reports')
        .update({
          title: editTitle,
          description: editDescription,
          form_data: editFormData,
          checklist_data: editChecklist,
          attachments: newAttachments
        })
        .eq('id', editReportId);
      if (error) throw error;
      // Atualizar checklist relacional se necessário (exemplo simplificado)
      await supabase.from('report_checklist_items').delete().eq('report_id', editReportId);
      if (editChecklist.length > 0) {
        const checklistInserts = editChecklist.map((item: any) => ({
          report_id: editReportId,
          checklist_item_id: item.id,
          quantity: item.quantity,
          notes: item.notes
        }));
        await supabase.from('report_checklist_items').insert(checklistInserts);
      }
      // Registrar atividade de edição
      await supabase.from('activities').insert([
        {
          user_id: user?.id,
          action: 'editar',
          entity_type: 'report',
          entity_id: editReportId,
          details: {
            title: editTitle,
            description: editDescription,
            form_data: editFormData,
            checklist_data: editChecklist,
            attachments: newAttachments
          }
        }
      ]);
      queryClient.invalidateQueries({ queryKey: ['validation-reports'] });
      queryClient.invalidateQueries({ queryKey: ['all-checklist-items'] });
      setEditReportId(null);
      toast({ title: 'Relatório atualizado', description: 'As alterações foram salvas com sucesso.' });
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' });
    }
    setIsSaving(false);
  };

  // Dialog de edição removido pois não há edição para inspection_reports

  useEffect(() => {
    if (!reports || reports.length === 0) return;
    const ids = Array.from(new Set(reports.map((r: any) => r.assigned_to).filter(Boolean)));
    if (ids.length === 0) return;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', ids);
      if (!error && data) {
        const map: Record<string, string> = {};
        data.forEach((p: any) => { map[p.id] = p.name; });
        setAssignedNames(map);
      }
    })();
  }, [reports]);

  useEffect(() => {
    reports.forEach(report => {
      if (expandedCards.has(report.id) && !activities[report.id]) {
        fetchActivities(report.id);
      }
    });
  }, [expandedCards, reports]);

  // Buscar nomes dos gestores caso não venham populados
  useEffect(() => {
    if (!reports || reports.length === 0) return;
    const missingManagerIds = Array.from(new Set(
      reports
        .filter((r: any) => r.manager_id && (!r.manager || !r.manager.name))
        .map((r: any) => r.manager_id)
    ));
    if (missingManagerIds.length === 0) return;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', missingManagerIds);
      if (!error && data) {
        const map: Record<string, string> = {};
        data.forEach((p: any) => { map[p.id] = p.name; });
        setManagerNames((prev) => ({ ...prev, ...map }));
      }
    })();
  }, [reports]);

  // [ADICIONAR] Montar lista de checklist para edição
  const reportChecklistMap = React.useMemo(() => {
    if (!reportToEdit || !Array.isArray(allChecklistItems)) return [];
    // Obter o id da classe do usuário responsável pelo relatório
    const userClassId = reportToEdit.technician?.user_class?.id;
    // Mapear os itens já selecionados no relatório
    const selectedMap = {};
    const checklistDataArr = Array.isArray(reportToEdit.checklist_data) ? reportToEdit.checklist_data : [];
    checklistDataArr.forEach(item => {
      if (item && typeof item === 'object' && 'checklist_item_id' in item) {
        selectedMap[(item as any).checklist_item_id] = item;
      }
    });
    // LOGS PARA DEBUG
    console.log('DEBUG userClassId:', userClassId);
    console.log('DEBUG allChecklistItems:', allChecklistItems);
    console.log('DEBUG Estrutura de um item:', allChecklistItems[0]);
    console.log('DEBUG selectedMap:', selectedMap);
    // Filtrar apenas itens da classe do usuário (comparação robusta, apenas user_class_id)
    return allChecklistItems
      .filter(item => String(item.user_class_id) === String(userClassId))
      .map(item => ({
        ...item,
        quantity: selectedMap[item.id]?.quantity || 0,
        notes: selectedMap[item.id]?.notes || "",
        selected: !!selectedMap[item.id]
      }));
  }, [reportToEdit, allChecklistItems]);

  // Numeração sequencial global dos relatórios (mais antigo = 1)
  const reportSequenceMap = useMemo(() => {
    const sorted = [...reports].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const map: Record<string, number> = {};
    sorted.forEach((report, idx) => {
      map[report.id] = idx + 1;
    });
    return map;
  }, [reports]);

  // Função para exportar CSV dos relatórios filtrados
  function handleExportCsv() {
    const { startDate, endDate } = filters;
    if (!startDate || !endDate) {
      toast({ title: "Selecione as duas datas.", variant: "destructive" });
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    if (diffDays > 92) {
      toast({ title: "O intervalo máximo permitido é de 3 meses.", variant: "destructive" });
      return;
    }
    if (end < start) {
      toast({ title: "A data final deve ser maior que a inicial.", variant: "destructive" });
      return;
    }
    // Filtrar os relatórios conforme os filtros atuais da tela
    const filteredReports = (reports as any[]).filter((report) => {
      const technicianMatch = filters.technician === 'all' || report.technician_id === filters.technician;
      const statusMatch = filters.status === 'all' || report.status === filters.status;
      const serviceNumberMatch = !filters.serviceNumber || (report.numero_servico && report.numero_servico.toLowerCase().includes(filters.serviceNumber.toLowerCase()));
      const userClassMatch = filters.userClass === 'all' || (report.technician?.user_class?.id === filters.userClass);
      const dateFromMatch = !filters.startDate || (report.created_at && report.created_at >= filters.startDate);
      const dateToMatch = !filters.endDate || (report.created_at && report.created_at <= filters.endDate + 'T23:59:59');
      return technicianMatch && statusMatch && serviceNumberMatch && userClassMatch && dateFromMatch && dateToMatch;
    });
    if (!filteredReports || filteredReports.length === 0) {
      toast({ title: "Nenhum relatório encontrado no período selecionado.", variant: "destructive" });
      return;
    }
    // Mapeia para substituir o technician_id pelo nome do técnico e converte objetos/arrays para string JSON
    const exportData = filteredReports.map((report) => {
      const { technician_id, technician, ...rest } = report;
      // Converta objetos/arrays para string JSON
      const safeRest = Object.fromEntries(
        Object.entries(rest).map(([key, value]) => {
          if (typeof value === "object" && value !== null) {
            return [key, JSON.stringify(value)];
          }
          return [key, value];
        })
      );
      return {
        ...safeRest,
        tecnico_nome: technician?.name || ""
      };
    });
    exportToCSV(exportData, `relatorios_validacao_${startDate}_a_${endDate}`);
  }

  // Função para exportar CSV dos itens do checklist (um por linha)
  function handleExportCsvChecklist() {
    const { startDate, endDate } = filters;
    if (!startDate || !endDate) {
      toast({ title: "Selecione as duas datas.", variant: "destructive" });
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    if (diffDays > 92) {
      toast({ title: "O intervalo máximo permitido é de 3 meses.", variant: "destructive" });
      return;
    }
    if (end < start) {
      toast({ title: "A data final deve ser maior que a inicial.", variant: "destructive" });
      return;
    }
    // Filtrar os relatórios conforme os filtros atuais da tela
    const filteredReports = (reports as any[]).filter((report) => {
      const technicianMatch = filters.technician === 'all' || report.technician_id === filters.technician;
      const statusMatch = filters.status === 'all' || report.status === filters.status;
      const serviceNumberMatch = !filters.serviceNumber || (report.numero_servico && report.numero_servico.toLowerCase().includes(filters.serviceNumber.toLowerCase()));
      const userClassMatch = filters.userClass === 'all' || (report.technician?.user_class?.id === filters.userClass);
      const dateFromMatch = !filters.startDate || (report.created_at && report.created_at >= filters.startDate);
      const dateToMatch = !filters.endDate || (report.created_at && report.created_at <= filters.endDate + 'T23:59:59');
      return technicianMatch && statusMatch && serviceNumberMatch && userClassMatch && dateFromMatch && dateToMatch;
    });
    // Montar linhas do CSV: uma por item do checklist de cada relatório
    const checklistRows: any[] = [];
    filteredReports.forEach((report) => {
      const checklist = checklistItemsByReport[report.id] || [];
      checklist.forEach((item: any) => {
        checklistRows.push({
          id_relatorio: report.id,
          numero_servico: report.numero_servico,
          tecnico_nome: report.technician?.name || "",
          material_servico: item.name,
          quantidade: item.quantity ?? "",
          tipo: item.category ?? ""
        });
      });
    });
    if (checklistRows.length === 0) {
      toast({ title: "Nenhum material/serviço encontrado no período selecionado.", variant: "destructive" });
      return;
    }
    exportToCSV(checklistRows, `relatorios_checklist_${startDate}_a_${endDate}`);
  }

  // Use filteredReports para paginação
  const {
    visibleItems: paginatedReports,
    hasMore: hasMoreReports,
    showMore: showMoreReports,
    reset: resetReports
  } = usePagination(filteredReports, 10, 10);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Validação de Relatórios Técnicos</h1>
                <p className="text-sm text-gray-600">Valide e gerencie relatórios enviados pelos técnicos</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Técnico</label>
                  <Select 
                    value={filters.technician} 
                    onValueChange={(value) => setFilters(prev => ({...prev, technician: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Técnico" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {technicians.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                  <Select 
                    value={filters.status} 
                    onValueChange={(value) => setFilters(prev => ({...prev, status: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="nao_validado">Não Validado</SelectItem>
                      <SelectItem value="validado">Validado</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_adequacao">Em adequação</SelectItem>
                      <SelectItem value="faturado">Faturado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Número do Serviço</label>
                  <Input
                    placeholder="Número"
                    value={filters.serviceNumber}
                    onChange={(e) => setFilters(prev => ({...prev, serviceNumber: e.target.value}))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Classe</label>
                  <Select 
                    value={filters.userClass} 
                    onValueChange={(value) => setFilters(prev => ({...prev, userClass: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Classe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {userClasses.map((userClass) => (
                        <SelectItem key={userClass.id} value={userClass.id}>
                          {userClass.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Data Inicial</label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({...prev, startDate: e.target.value}))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Data Final</label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({...prev, endDate: e.target.value}))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button onClick={handleExportCsv} variant="default">
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button onClick={handleExportCsvChecklist} variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar CSV Checklist
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Relatórios */}
        <div className="space-y-4">
          {paginatedReports
            .filter(report => report && typeof report === 'object' && 'id' in report && report.id)
            .map((report) => {
              const isFaturado = typeof report.status === 'string' && report.status === 'faturado';
              const adequacaoReport = reports.find(r =>
                r.service_order_id === report.service_order_id &&
                r.technician_id === report.assigned_to &&
                r.id !== report.id
              );
              // NOVO: Verifica se já foi validado em algum momento
              const hasBeenValidated = Array.isArray(activities[report.id]) && activities[report.id].some(a => a.action === "validado");
              // NOVO: Verifica se já foi adequado em algum momento
              const hasBeenAdequado = Array.isArray(activities[report.id]) && activities[report.id].some(a => a.action === "em_adequacao");

              return (
                <Card key={report.id} className="shadow-sm">
                  <Collapsible open={expandedCards.has(report.id)} onOpenChange={() => toggleCardExpansion(report.id)}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium text-primary">
                                Nº {reportSequenceMap[report.id]}
                              </span>
                              <span className="text-lg font-semibold">
                                Nº do Serviço: {report.numero_servico || 'N/A'} | Enviado por: {report.technician?.name || 'N/A'}
                              </span>
                            <Badge className={getStatusColor(report.status)}>
                              {getStatusLabel(report.status)}
                            </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              {new Date(report.created_at).toLocaleDateString('pt-BR')}
                            </span>
                            {expandedCards.has(report.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-6">
                          {/* Informações do Relatório */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Informações Gerais</h4>
                              <div className="space-y-2 text-sm">
                                <div><span className="font-medium">Número do Serviço:</span> {report.numero_servico || 'N/A'}</div>
                                <div><span className="font-medium">Título:</span> {report.title}</div>
                                <div><span className="font-medium">FCA:</span> {report.description}</div>
                                <div><span className="font-medium">Gestor:</span> {report.manager?.name || managerNames[report.manager_id] || '-'}</div>
                                <div><span className="font-medium">Tipo de Manutenção:</span> N/A</div>
                                {(() => {
                                  const adequacaoActivity = activities[report.id]?.find(a => a.action === "em_adequacao");
                                  if (adequacaoActivity && adequacaoActivity.details?.assignedTo) {
                                    return (
                                      <div className="mt-2">
                                        <span className="font-medium">Adequação por:</span> {assignedNames[adequacaoActivity.details.assignedTo] || adequacaoActivity.details.assignedTo}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Datas</h4>
                              <div className="space-y-2 text-sm">
                                <div><span className="font-medium">Criado em:</span> {new Date(report.created_at).toLocaleString('pt-BR')}</div>
                                <div><span className="font-medium">Atualizado em:</span> {new Date(report.updated_at).toLocaleString('pt-BR')}</div>
                                {report.validated_at && (
                                  <div><span className="font-medium">Validado em:</span> {new Date(report.validated_at).toLocaleString('pt-BR')}</div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Exibir campos dinâmicos do formulário */}
                          {report.form_data && Array.isArray(report.template?.fields) && report.template.fields.length > 0 && (
                            <div className="mt-4">
                              <h4 className="font-semibold text-gray-900 mb-2">Campos do Formulário</h4>
                              <div className="space-y-2 text-sm">
                                {report.template.fields.map((field: any, idx: number) => (
                                  <div key={idx}>
                                    <span className="font-medium">{field.label || field.name}:</span>{' '}
                                    {Array.isArray(report.form_data[field.id || field.name])
                                      ? report.form_data[field.id || field.name].join(', ')
                                      : String(report.form_data[field.id || field.name] ?? '-')}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Anexos/Fotos */}
                          {Array.isArray(report.attachments) && report.attachments.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Anexos</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {report.attachments.map((attachment: any, index) => (
                                  <div key={index} className="relative">
                                    <ThumbnailImage
                                      src={attachment?.url || ''} 
                                      alt={`Anexo ${index + 1}`}
                                      className="w-full h-24 rounded-lg"
                                      onClick={() => {
                                        // Abrir modal com imagem completa
                                        const dialog = document.createElement('dialog');
                                        dialog.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
                                        dialog.innerHTML = `
                                          <div class="max-w-4xl max-h-[90vh] overflow-auto bg-white rounded-lg p-4">
                                            <div class="flex justify-between items-center mb-4">
                                              <h3 class="text-lg font-semibold">Anexo ${index + 1}</h3>
                                              <button onclick="this.closest('dialog').close()" class="text-gray-500 hover:text-gray-700">
                                                ✕
                                              </button>
                                            </div>
                                            <img src="${attachment?.url || ''}" alt="Anexo ${index + 1}" class="w-full h-auto object-contain" />
                                          </div>
                                        `;
                                        document.body.appendChild(dialog);
                                        dialog.showModal();
                                        dialog.addEventListener('click', (e) => {
                                          if (e.target === dialog) dialog.close();
                                        });
                                        dialog.addEventListener('close', () => {
                                          document.body.removeChild(dialog);
                                        });
                                      }}
                                    />
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      className="absolute top-1 right-1"
                                      onClick={() => {
                                        // Abrir modal com imagem completa
                                        const dialog = document.createElement('dialog');
                                        dialog.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
                                        dialog.innerHTML = `
                                          <div class="max-w-4xl max-h-[90vh] overflow-auto bg-white rounded-lg p-4">
                                            <div class="flex justify-between items-center mb-4">
                                              <h3 class="text-lg font-semibold">Anexo ${index + 1}</h3>
                                              <button onclick="this.closest('dialog').close()" class="text-gray-500 hover:text-gray-700">
                                                ✕
                                              </button>
                                            </div>
                                            <img src="${attachment?.url || ''}" alt="Anexo ${index + 1}" class="w-full h-auto object-contain" />
                                          </div>
                                        `;
                                        document.body.appendChild(dialog);
                                        dialog.showModal();
                                        dialog.addEventListener('click', (e) => {
                                          if (e.target === dialog) dialog.close();
                                        });
                                        dialog.addEventListener('close', () => {
                                          document.body.removeChild(dialog);
                                        });
                                      }}
                                    >
                                      <ZoomIn className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Checklist */}
                          {expandedCards.has(report.id) && (
                            <div className="mt-4">
                              <h4 className="font-semibold text-gray-900 mb-2">Checklist</h4>
                              {Array.isArray(checklistItemsByReport[report.id]) && checklistItemsByReport[report.id].length > 0 ? (
                                <ul className="space-y-1 text-sm">
                                  {checklistItemsByReport[report.id].map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-2">
                                      <span className="font-medium">{item.name}</span>
                                      <span className="text-gray-500">Qtd: {item.quantity}</span>
                                      {item.notes && <span className="text-gray-400 ml-2">Obs: {item.notes}</span>}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="text-sm text-gray-500">Nenhum item de checklist registrado.</div>
                              )}
                            </div>
                          )}

                          {/* Botão para ver relatório de adequação */}
                          {(() => {
                            const adequacaoReport = reports.find(r => r.parent_report_id === report.id);
                            if (!adequacaoReport) return null;
                            return (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button className="bg-blue-500 hover:bg-blue-600 text-white mt-2">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Ver relatório de adequação
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Relatório de Adequação</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-2">
                                    <div><b>Título:</b> {adequacaoReport.title}</div>
                                    <div><b>Descrição:</b> {adequacaoReport.description}</div>
                                    <div><b>Status:</b> {getStatusLabel(adequacaoReport.status)}</div>
                                    <div><b>Criado em:</b> {new Date(adequacaoReport.created_at).toLocaleString('pt-BR')}</div>
                                    {/* Campos do Formulário */}
                                    {adequacaoReport.form_data && Array.isArray(adequacaoReport.template?.fields) && adequacaoReport.template.fields.length > 0 && (
                                      <div className="mt-4">
                                        <h4 className="font-semibold text-gray-900 mb-2">Campos do Formulário</h4>
                                        <div className="space-y-2 text-sm">
                                          {adequacaoReport.template.fields.map((field: any, idx: number) => (
                                            <div key={idx}>
                                              <span className="font-medium">{field.label || field.name}:</span>{' '}
                                              {Array.isArray(adequacaoReport.form_data[field.id || field.name])
                                                ? adequacaoReport.form_data[field.id || field.name].join(', ')
                                                : String(adequacaoReport.form_data[field.id || field.name] ?? '-')}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {/* Anexos */}
                                    {Array.isArray(adequacaoReport.attachments) && adequacaoReport.attachments.length > 0 && (
                                      <div>
                                        <b>Anexos:</b>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                                          {adequacaoReport.attachments.map((attachment: any, idx: number) => (
                                            <a key={idx} href={attachment.url} target="_blank" rel="noopener noreferrer">
                                              <img src={attachment.url} alt={attachment.name || `Anexo ${idx + 1}`} className="w-full h-24 object-cover rounded" />
                                            </a>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {/* Checklist da adequação */}
                                    {Array.isArray(adequacaoReport.checklist_data) && adequacaoReport.checklist_data.length > 0 && (
                                      <div>
                                        <b>Checklist:</b>
                                        <ul className="space-y-1 text-sm mt-1">
                                          {adequacaoReport.checklist_data.map((item: any, idx: number) => (
                                            <li key={idx} className="flex items-center gap-2">
                                              <span className="font-medium">{item.name || item.checklist_item_id}</span>
                                              {item.quantity && <span className="text-gray-500">Qtd: {item.quantity}</span>}
                                              {item.notes && <span className="text-gray-400 ml-2">Obs: {item.notes}</span>}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            );
                          })()}

                          {/* Após o checklist, exibir motivo e observação da pendência, se existirem */}
                          {report.pending_reason && (
                            <div className="mt-2">
                              <span className="font-semibold">Motivo da Pendência:</span> {report.pending_reason}
                            </div>
                          )}
                          {report.pending_notes && (
                            <div className="mt-1">
                              <span className="font-semibold">Observação:</span> {report.pending_notes}
                            </div>
                          )}

                          {/* Botões de Ação */}
                          <div className="flex flex-wrap gap-2 pt-4 border-t">
                            <Button
                              onClick={() => handleStatusUpdate(report.id, 'validado')}
                              className="bg-green-500 hover:bg-green-600 text-white"
                              disabled={updateStatusMutation.isPending || isFaturado || hasBeenValidated}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Validar
                            </Button>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button className="bg-pink-500 hover:bg-pink-600 text-white" disabled={isFaturado || !hasBeenValidated || hasBeenAdequado}>
                                  <AlertTriangle className="w-4 h-4 mr-2" />
                                  Adequar
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Direcionar para Adequação</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Selecione o Técnico
                                    </label>
                                    <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione um técnico" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {technicians.map((tech) => (
                                          <SelectItem key={tech.id} value={tech.id}>
                                            {tech.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button
                                    onClick={() => {
                                      handleStatusUpdate(report.id, 'em_adequacao', selectedTechnician);
                                    }}
                                    className="w-full"
                                  >
                                    Direcionar Adequação
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="outline"
                              className="border-purple-500 text-purple-500 hover:bg-purple-50"
                              onClick={() => setEditReportId(report.id)}
                              disabled={isFaturado}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </Button>

                            <Button
                              onClick={() => {
                                setPendingModalOpen(report.id);
                                setPendingReason('');
                                setPendingNotes('');
                              }}
                              className="bg-orange-500 hover:bg-orange-600 text-white"
                              disabled={updateStatusMutation.isPending || isFaturado || !hasBeenValidated}
                            >
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Pendenciar
                            </Button>

                            <Button
                              onClick={() => handleStatusUpdate(report.id, 'sem_pendencia')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              disabled={updateStatusMutation.isPending || isFaturado || String(report.status) === 'sem_pendencia' || !hasBeenValidated}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Sem pendência
                            </Button>

                            <Button
                              onClick={() => handleStatusUpdate(report.id, 'faturado')}
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                              disabled={updateStatusMutation.isPending || isFaturado || !hasBeenValidated}
                            >
                              <DollarSign className="w-4 h-4 mr-2" />
                              Faturar
                            </Button>

                            <Button
                              variant="destructive"
                              className="ml-auto"
                              onClick={() => handleDeleteReport(report.id)}
                              disabled={deleteReportMutation.isPending || isFaturado}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Deletar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                  <div className="flex justify-end items-center pt-4 border-t">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" onClick={() => fetchActivities(report.id)}>
                          <History className="w-4 h-4 mr-2" />
                          Histórico
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Histórico do Relatório</SheetTitle>
                        </SheetHeader>
                        <div className="space-y-4 mt-6 max-h-[60vh] overflow-y-auto pr-2">
                          {loadingActivities[report.id] && <div>Carregando...</div>}
                          {activities[report.id] && activities[report.id].length === 0 && <div>Nenhuma atividade encontrada.</div>}
                          {activities[report.id] && activities[report.id].map((activity) => (
                            <div key={activity.id} className="border-l-2 border-blue-200 pl-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">{activity.action}</span>
                                <span className="text-xs text-gray-500">{new Date(activity.created_at).toLocaleString('pt-BR')}</span>
                                {activity.user_id && (
                                  <span className="text-xs text-gray-700 italic">{userNames[activity.user_id] || activity.user_id}</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-600 space-y-1">
                                {activity.details?.title && (
                                  <div><b>Título:</b> {activity.details.title}</div>
                                )}
                                {activity.details?.description && (
                                  <div><b>Descrição:</b> {activity.details.description}</div>
                                )}
                                {activity.details?.form_data && typeof activity.details.form_data === 'object' && (
                                  <div>
                                    <b>Formulário:</b>
                                    <ul className="ml-4">
                                      {Object.entries(activity.details.form_data).map(([key, value], idx) => (
                                        <li key={idx}>
                                          <b>{key}:</b>{' '}
                                          {Array.isArray(value)
                                            ? value.map((v, i) =>
                                                v && v.url ? (
                                                  <span key={i}>
                                                    <a href={v.url} target="_blank" rel="noopener noreferrer">{v.name || v.url}</a>
                                                  </span>
                                                ) : (
                                                  <span key={i}>{JSON.stringify(v)}</span>
                                                )
                                              )
                                            : typeof value === 'object'
                                              ? JSON.stringify(value)
                                              : String(value)}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {activity.details?.checklist_data && Array.isArray(activity.details.checklist_data) && (
                                  <div>
                                    <b>Checklist:</b>
                                    <ul className="list-disc ml-4">
                                      {activity.details.checklist_data.map((item, idx) => (
                                        <li key={idx}>{item.name || item.id} {item.quantity ? `- Qtd: ${item.quantity}` : ''}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {activity.details?.attachments && Array.isArray(activity.details.attachments) && (
                                  <div>
                                    <b>Anexos:</b>
                                    <ul className="ml-4">
                                      {activity.details.attachments.map((att, idx) => (
                                        <li key={idx}>
                                          <a href={att.url} target="_blank" rel="noopener noreferrer">{att.name || att.url}</a>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {/* Outros campos relevantes podem ser adicionados aqui */}
                              </div>
                            </div>
                          ))}
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </Card>
              );
            })}
          {hasMoreReports && (
            <div className="flex justify-center mt-4">
              <Button onClick={showMoreReports} variant="outline">Ver mais</Button>
            </div>
          )}
          <div className="text-xs text-gray-500 text-center mt-2">
            Mostrando {paginatedReports.length} de {reports.length} relatórios
          </div>
        </div>
      </main>

      {/* Modal de edição de relatório */}
      {editReportId && (
        <Dialog open={!!editReportId} onOpenChange={() => setEditReportId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Relatório</DialogTitle>
            </DialogHeader>
            {reportToEdit ? (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} required />
                </div>
                {/* Campos dinâmicos */}
                {Array.isArray(template?.fields) && template.fields.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Campos do Formulário</h4>
                    <div className="space-y-2">
                      {template.fields.map((field: any, idx: number) => (
                        <div key={idx}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label || field.name}</label>
                          {(!field.type || field.type === 'text') && (
                            <Input
                              value={editFormData[field.id || field.name] ?? ''}
                              onChange={e => handleEditFieldChange(field.id || field.name, e.target.value)}
                            />
                          )}
                          {field.type === 'textarea' && (
                            <Textarea
                              value={editFormData[field.id || field.name] ?? ''}
                              onChange={e => handleEditFieldChange(field.id || field.name, e.target.value)}
                            />
                          )}
                          {field.type === 'number' && (
                            <Input
                              type="number"
                              value={editFormData[field.id || field.name] ?? ''}
                              onChange={e => handleEditFieldChange(field.id || field.name, e.target.value)}
                            />
                          )}
                          {field.type === 'select' && Array.isArray(field.options) && (
                            <select
                              className="border rounded px-2 py-1"
                              value={editFormData[field.id || field.name] ?? ''}
                              onChange={e => handleEditFieldChange(field.id || field.name, e.target.value)}
                            >
                              <option value="">Selecione...</option>
                              {field.options.map((opt: any, i: number) => {
                                const label = typeof opt === 'object' ? (opt.label ?? opt.value) : opt;
                                const value = typeof opt === 'object' ? (opt.value ?? opt.label) : opt;
                                return (
                                  <option key={value || i} value={value}>{label}</option>
                                );
                              })}
                            </select>
                          )}
                          {field.type === 'radio' && Array.isArray(field.options) && (
                            <div className="flex flex-col gap-1">
                              {field.options.map((opt: any, i: number) => {
                                const label = typeof opt === 'object' ? (opt.label ?? opt.value) : opt;
                                const value = typeof opt === 'object' ? (opt.value ?? opt.label) : opt;
                                return (
                                  <label key={value || i} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={field.id || field.name}
                                      value={value}
                                      checked={editFormData[field.id || field.name] === value}
                                      onChange={() => handleEditFieldChange(field.id || field.name, value)}
                                    />
                                    {label}
                                  </label>
                                );
                              })}
                            </div>
                          )}
                          {field.type === 'checkbox' && Array.isArray(field.options) && (
                            <div className="flex flex-col gap-1">
                              {field.options.map((opt: any, i: number) => {
                                const label = typeof opt === 'object' ? (opt.label ?? opt.value) : opt;
                                const value = typeof opt === 'object' ? (opt.value ?? opt.label) : opt;
                                return (
                                  <label key={value || i} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      name={field.id || field.name}
                                      value={value}
                                      checked={Array.isArray(editFormData[field.id || field.name]) && editFormData[field.id || field.name].includes(value)}
                                      onChange={e => {
                                        const prev = Array.isArray(editFormData[field.id || field.name]) ? editFormData[field.id || field.name] : [];
                                        if (e.target.checked) {
                                          handleEditFieldChange(field.id || field.name, [...prev, value]);
                                        } else {
                                          handleEditFieldChange(field.id || field.name, prev.filter((v: any) => v !== value));
                                        }
                                      }}
                                    />
                                    {label}
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Checklist */}
                {template?.checklist_enabled && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Checklist</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-2 border rounded-lg bg-green-50 border-green-300">
                        <ChecklistFormSection
                          items={reportChecklistMap}
                          value={editChecklist}
                          onChange={handleEditChecklistChange}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
                {/* Anexos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anexos</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editAttachments.map((att, idx) => (
                      <div key={idx} className="relative">
                        <a href={att.url} target="_blank" rel="noopener noreferrer">
                          <img src={att.url} alt={att.name} className="w-24 h-24 object-cover rounded" />
                        </a>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1"
                          onClick={() => handleRemoveAttachment(idx)}
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleEditFileChange}
                  />
                  {editUploadError && <div className="text-red-500 text-sm mt-1">{editUploadError}</div>}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setEditReportId(null)} disabled={isSaving}>Cancelar</Button>
                  <Button type="submit" className="bg-green-600 text-white" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar'}</Button>
                </div>
              </form>
            ) : (
              <div className="text-gray-500">Relatório não encontrado.</div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de pendência */}
      <Dialog open={!!pendingModalOpen} onOpenChange={() => setPendingModalOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pendenciar Relatório</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
              <select
                className="border rounded px-2 py-1 w-full"
                value={pendingReason}
                onChange={e => setPendingReason(e.target.value)}
              >
                <option value="">Selecione...</option>
                {pendingOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
              <Textarea
                value={pendingNotes}
                onChange={e => setPendingNotes(e.target.value)}
                placeholder="Descreva o motivo da pendência..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPendingModalOpen(null)}>Cancelar</Button>
              <Button
                onClick={async () => {
                  if (!pendingModalOpen) return;
                  await updateStatusMutation.mutateAsync({
                    reportId: pendingModalOpen,
                    status: 'pendente',
                    pending_reason: pendingReason,
                    pending_notes: pendingNotes,
                  });
                  setPendingModalOpen(null);
                }}
                disabled={!pendingReason}
              >
                Confirmar Pendência
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportValidation;