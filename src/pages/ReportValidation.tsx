import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, XCircle, Edit, AlertTriangle, DollarSign, Trash2, ChevronDown, ChevronRight, Filter, FileText, ZoomIn, History, Clock, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { ChecklistFormSection } from '@/components/reports/ChecklistFormSection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';


import { exportToCSV } from "@/utils/csvExport";

import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Tipos para otimização
interface ValidationReportsResponse {
  data: any[];
  total: number;
  page: number;
  pageSize: number;
}

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
    reportNumber: '',
    userClass: 'all',
    startDate: '',
    endDate: '',
    formDataSearch: '', // NOVO FILTRO - Busca apenas em form_data
  });

  // Estado separado para o input do número do serviço para evitar perda de foco
  const [serviceNumberInput, setServiceNumberInput] = useState('');
  
  // Estado separado para o input do número do relatório para evitar perda de foco
  const [reportNumberInput, setReportNumberInput] = useState('');
  
  // Estado separado para o input de busca em form_data para evitar perda de foco
  const [formDataSearchInput, setFormDataSearchInput] = useState('');
  
  // Aplicar debounce de 500ms no serviceNumber para evitar consultas excessivas
  const debouncedServiceNumber = useDebounce(serviceNumberInput, 500);
  
  // Aplicar debounce de 500ms no reportNumber para evitar consultas excessivas
  const debouncedReportNumber = useDebounce(reportNumberInput, 500);
  
  // Aplicar debounce de 500ms no formDataSearch para evitar consultas excessivas
  const debouncedFormDataSearch = useDebounce(formDataSearchInput, 500);

  // Sincronizar valor com debounce com o estado de filtros
  useEffect(() => {
    setFilters(prev => ({ ...prev, serviceNumber: debouncedServiceNumber }));
  }, [debouncedServiceNumber]);
  
  // Sincronizar valor com debounce com o estado de filtros
  useEffect(() => {
    setFilters(prev => ({ ...prev, reportNumber: debouncedReportNumber }));
  }, [debouncedReportNumber]);
  
  // Sincronizar valor com debounce com o estado de filtros
  useEffect(() => {
    setFilters(prev => ({ ...prev, formDataSearch: debouncedFormDataSearch }));
  }, [debouncedFormDataSearch]);

  const [editReportId, setEditReportId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [editDescription, setEditDescription] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [editFormData, setEditFormData] = React.useState<Record<string, any>>({});
  const [editChecklist, setEditChecklist] = React.useState<any[]>([]);
  const [editAttachments, setEditAttachments] = React.useState<any[]>([]);
  const [editFilesToUpload, setEditFilesToUpload] = React.useState<File[]>([]);
  const [editUploadError, setEditUploadError] = React.useState<string | null>(null);

  // Estados para paginação otimizada
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

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
    'Falta o relatório da outra equipe',
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
    setLoadingActivities((prev) => ({ ...prev, [reportId]: true }));
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('entity_type', 'report')
      .eq('entity_id', reportId)
      .order('created_at', { ascending: false });
    if (!error) {
      setActivities((prev) => ({ ...prev, [reportId]: data }));
      // Buscar nomes dos usuários únicos
      const userIds = Array.from(new Set((data || []).map((a: any) => a.user_id).filter(Boolean)));
      if (userIds.length > 0) {
        const { data: profiles, error: errorProfiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);
        if (profiles) {
          const map: Record<string, string> = {};
          profiles.forEach((p: any) => { map[p.id] = p.name; });
          setUserNames((prev) => ({ ...prev, ...map }));
        }
      }
    }
    setLoadingActivities((prev) => ({ ...prev, [reportId]: false }));
  }

  // --- QUERY OTIMIZADA COM PAGINAÇÃO NO BACKEND ---
  const { data: reportsResponse, isLoading, error: reportsError } = useQuery<ValidationReportsResponse>({
    queryKey: ['validation-reports', filters, currentPage, pageSize],
    queryFn: async () => {
      try {
        const offset = (currentPage - 1) * pageSize;
        
        // Query SIMPLIFICADA para eliminar erro 400
        let query = supabase
          .from('reports')
          .select(`
            id, title, description, status, created_at, updated_at, 
            numero_servico, pending_reason, pending_notes, assigned_to, 
            attachments, form_data, checklist_data, report_number, parent_report_id,
            validated_by, validated_at, technician_id, template_id, manager_id
          `, { count: 'exact' })
          .neq('template_id', '4b45c601-e5b7-4a33-98f9-1769aad319e9')
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1);
        
        // Aplicar filtros no backend com validação
        console.log('🔍 Filtros aplicados:', filters);
        
        if (filters.technician && filters.technician !== 'all') {
          query = query.eq('technician_id', filters.technician);
          console.log('🔍 Filtro técnico aplicado:', filters.technician);
        }
        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status as any);
          console.log('🔍 Filtro status aplicado:', filters.status);
        }
        if (filters.serviceNumber && filters.serviceNumber.trim()) {
          query = query.ilike('numero_servico', `%${filters.serviceNumber.trim()}%`);
          console.log('🔍 Filtro número do serviço aplicado:', filters.serviceNumber);
        }
        if (filters.reportNumber && filters.reportNumber.trim()) {
          // Remover "REL-" se o usuário digitou
          const cleanReportNumber = filters.reportNumber.trim().replace(/^REL-?/i, '');
          if (cleanReportNumber) {
            query = query.eq('report_number', parseInt(cleanReportNumber));
            console.log('🔍 Filtro número do relatório aplicado:', cleanReportNumber);
          }
        }
        if (filters.startDate && filters.startDate.trim()) {
          query = query.gte('created_at', filters.startDate);
          console.log('🔍 Filtro data inicial aplicado:', filters.startDate);
        }
        if (filters.endDate && filters.endDate.trim()) {
          query = query.lte('created_at', filters.endDate + 'T23:59:59');
          console.log('🔍 Filtro data final aplicado:', filters.endDate);
        }
        
        // NOVO: Filtro para busca em form_data - VERSÃO SIMPLIFICADA
        if (filters.formDataSearch && filters.formDataSearch.trim()) {
          const searchTerm = filters.formDataSearch.trim();
          console.log('🔍 Aplicando filtro de busca em form_data:', searchTerm);
          
          // Busca simplificada em campos básicos como fallback
          query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,numero_servico.ilike.%${searchTerm}%`);
          console.log('🔍 Query após filtro de form_data (fallback):', query);
        }
        
        // Filtro por classe de usuário
        if (filters.userClass && filters.userClass !== 'all') {
          // Buscar técnicos da classe selecionada
          const { data: techniciansFromClass } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_class_id', filters.userClass)
            .eq('is_active', true);
          
          if (techniciansFromClass && techniciansFromClass.length > 0) {
            const technicianIds = techniciansFromClass.map(t => t.id);
            query = query.in('technician_id', technicianIds);
          } else {
            // Se não há técnicos nesta classe, retornar vazio
            query = query.eq('technician_id', 'no-technicians-found');
          }
        }
        
        const { data, count, error } = await query;
        
        if (error) {
          console.error('❌ Erro na query principal:', error);
          console.error('❌ Detalhes do erro:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }
        
        console.log('✅ Query executada com sucesso');
        console.log('📊 Resultados encontrados:', count || 0);
        console.log('📋 Dados retornados:', data?.length || 0);
        

      
      // Buscar dados dos técnicos e templates separadamente para evitar erros de join
      const reports = data || [];
      if (reports.length > 0) {
        // Buscar técnicos únicos
        const technicianIds = [...new Set(reports.map((r: any) => r.technician_id).filter(Boolean))];
        const templateIds = [...new Set(reports.map((r: any) => r.template_id).filter(Boolean))];
        const managerIds = [...new Set(reports.map((r: any) => r.manager_id).filter(Boolean))];
        
        // Buscar dados dos técnicos
        let techniciansData: any[] = [];
        if (technicianIds.length > 0) {
          const { data: techData } = await supabase
            .from('profiles')
            .select('id, name, user_class:user_classes(id, name)')
            .in('id', technicianIds);
          techniciansData = techData || [];
        }
        
        // Buscar dados dos templates
        let templatesData: any[] = [];
        if (templateIds.length > 0) {
          const { data: tempData } = await supabase
            .from('report_templates')
            .select('*')
            .in('id', templateIds);
          templatesData = tempData || [];
        }
        
        // Buscar dados dos gestores
        let managersData: any[] = [];
        if (managerIds.length > 0) {
          const { data: mgrData } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', managerIds);
          managersData = mgrData || [];
        }
        
        // Mapear dados para incluir relacionamentos
        const reportsWithRelations = reports.map((report: any) => {
          const technician = techniciansData.find(t => t.id === report.technician_id);
          const template = templatesData.find(t => t.id === report.template_id);
          const manager = managersData.find(m => m.id === report.manager_id);
          
          return {
            ...report,
            technician,
            template,
            manager
          };
        });
        
        return {
          data: reportsWithRelations,
          total: count || 0,
          page: currentPage,
          pageSize
        };
      }
      
      return {
        data: reports,
        total: count || 0,
        page: currentPage,
        pageSize
      };
    } catch (error) {
      console.error('❌ Erro completo na query de relatórios:', error);
      console.error('❌ Stack trace:', error.stack);
      return {
        data: [],
        total: 0,
        page: currentPage,
        pageSize
      };
    }
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000,    // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Extrair dados da resposta com verificação robusta
  const reports = useMemo(() => {
    return reportsResponse?.data || [];
  }, [reportsResponse?.data]);
  
  const totalReports = reportsResponse?.total || 0;
  const totalPages = Math.ceil(totalReports / pageSize);

  // Buscar técnicos para filtro - apenas técnicos ativos (otimizado com cache)
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
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000,    // 30 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Buscar classes de usuário (otimizado com cache)
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
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000,    // 30 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Criar queryKey estável para adequação reports
  const adequacaoQueryKey = useMemo(() => {
    if (!reports || reports.length === 0) return ['adequacao-reports', 'empty'];
    const reportIds = reports.map((r: any) => r?.id).filter(Boolean).sort();
    return ['adequacao-reports', reportIds.join(',')];
  }, [reports]);

  // Buscar relatórios de adequação (que são filhos dos relatórios exibidos)
  const { data: adequacaoReports = {} } = useQuery({
    queryKey: adequacaoQueryKey,
    queryFn: async () => {
      try {
        if (!reports || reports.length === 0) return {};
        
        const reportIds = reports.map((r: any) => r?.id).filter(Boolean);
        if (reportIds.length === 0) return {};
      
      // Query SIMPLIFICADA para relatórios de adequação
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id, title, description, status, created_at, updated_at, parent_report_id,
          attachments, form_data, checklist_data, technician_id, template_id, report_number
        `)
        .in('parent_report_id', reportIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Buscar dados dos técnicos e templates para adequação separadamente
      const adequacaoData = data || [];
      if (adequacaoData.length > 0) {
        const techIds = [...new Set(adequacaoData.map((r: any) => r.technician_id).filter(Boolean))];
        const tempIds = [...new Set(adequacaoData.map((r: any) => r.template_id).filter(Boolean))];
        
        // NOVO: Buscar dados dos relatórios principais (parent_report_id)
        const parentReportIds = [...new Set(adequacaoData.map((r: any) => r.parent_report_id).filter(Boolean))];
        
        let technicians: any[] = [];
        let templates: any[] = [];
        let parentReports: any[] = [];
        
        if (techIds.length > 0) {
          const { data: techData } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', techIds);
          technicians = techData || [];
        }
        
        if (tempIds.length > 0) {
          const { data: tempData } = await supabase
            .from('report_templates')
            .select('*')
            .in('id', tempIds);
          templates = tempData || [];
        }
        
        // NOVO: Buscar relatórios principais
        if (parentReportIds.length > 0) {
          const { data: parentData } = await supabase
            .from('reports')
            .select('id, title, report_number')
            .in('id', parentReportIds);
          parentReports = parentData || [];
        }
        
        // Mapear adequações com relacionamentos
        const adequacoesWithRelations = adequacaoData.map((adequacao: any) => {
          const technician = technicians.find(t => t.id === adequacao.technician_id);
          const template = templates.find(t => t.id === adequacao.template_id);
          const parentReport = parentReports.find(p => p.id === adequacao.parent_report_id);
          
          return {
            ...adequacao,
            technician,
            template,
            parentReport // NOVO: incluir dados do relatório principal
          };
        });
        
        // Organizar por parent_report_id
        const grouped: Record<string, any> = {};
        adequacoesWithRelations.forEach((adequacaoReport: any) => {
          if (adequacaoReport.parent_report_id) {
            grouped[adequacaoReport.parent_report_id] = adequacaoReport;
          }
        });
        
        return grouped;
      }
      
      return {};
      } catch (error) {
        console.error('Erro na query de adequação:', error);
        return {};
      }
    },
    enabled: !!reports && reports.length > 0 && !isLoading,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,   // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Criar queryKey estável para checklist items
  const checklistQueryKey = useMemo(() => {
    return [
      'report-checklist-items', 
      currentPage, 
      pageSize, 
      filters.technician, 
      filters.status,
      reports?.length || 0
    ];
  }, [currentPage, pageSize, filters.technician, filters.status, reports?.length]);

  // Buscar itens do checklist para todos os relatórios exibidos (otimizado)
  const { data: checklistItemsByReport = {} } = useQuery({
    queryKey: checklistQueryKey,
    queryFn: async () => {
      try {
        if (!reports || reports.length === 0) return {};
        
        const reportIds = reports.map((r: any) => r?.id).filter(Boolean);
        if (reportIds.length === 0) return {};
      // 1. Buscar todos os report_checklist_items
      const { data: checklistLinks, error: errorLinks } = await supabase
        .from('report_checklist_items')
        .select('report_id, checklist_item_id, quantity, notes')
        .in('report_id', reportIds);
      if (errorLinks) throw errorLinks;
      const checklistItemIds = [...new Set((checklistLinks || []).map((item: any) => item.checklist_item_id))];
      // 2. Buscar todos os checklist_items necessários
      const { data: checklistItems, error: errorItems } = await supabase
        .from('checklist_items')
        .select('id, name, category, standard_quantity')
        .in('id', checklistItemIds);
      if (errorItems) throw errorItems;
      const checklistItemMap: Record<string, any> = {};
      (checklistItems || []).forEach((item: any) => { checklistItemMap[item.id] = item; });
      // 3. Agrupar por report_id e adicionar nome
      const grouped: Record<string, any[]> = {};
      (checklistLinks || []).forEach((item: any) => {
        if (!grouped[item.report_id]) grouped[item.report_id] = [];
        grouped[item.report_id].push({
          ...item,
          name: checklistItemMap[item.checklist_item_id]?.name || '-',
          category: checklistItemMap[item.checklist_item_id]?.category || ''
        });
      });
      
      // 4. FALLBACK: Para relatórios que não têm dados na tabela report_checklist_items,
      // buscar do campo checklist_data
      const reportsWithoutChecklist = reports.filter((report: any) => 
        !grouped[report.id] || grouped[report.id].length === 0
      );
      
      for (const report of reportsWithoutChecklist) {
        if (Array.isArray(report.checklist_data) && report.checklist_data.length > 0) {
          if (!grouped[report.id]) grouped[report.id] = [];
          
          // Buscar nomes dos itens do checklist_data
          const checklistItemIdsFromData = [...new Set(
            report.checklist_data
              .filter((item: any) => item && typeof item === 'object' && 'id' in item)
              .map((item: any) => item.id)
              .filter((id: any) => typeof id === 'string')
          )];
          
          if (checklistItemIdsFromData.length > 0) {
            const { data: fallbackItems, error: fallbackError } = await supabase
              .from('checklist_items')
              .select('id, name, category, standard_quantity')
              .in('id', checklistItemIdsFromData as string[]);
            
            if (!fallbackError && fallbackItems) {
              const fallbackItemMap: Record<string, any> = {};
              fallbackItems.forEach((item: any) => { fallbackItemMap[item.id] = item; });
              
              report.checklist_data.forEach((item: any) => {
                if (item && typeof item === 'object' && 'id' in item) {
                  grouped[report.id].push({
                    report_id: report.id,
                    checklist_item_id: item.id,
                    quantity: item.quantity || 1,
                    notes: item.notes || '',
                    name: fallbackItemMap[item.id]?.name || item.name || '-',
                    category: fallbackItemMap[item.id]?.category || item.category || ''
                  });
                }
              });
            }
          }
        }
      }
      
      return grouped;
      } catch (error) {
        console.error('Erro na query de checklist items:', error);
        return {};
      }
    },
    enabled: reports.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,   // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // [ADICIONAR] Buscar todos os itens ativos do checklist (otimizado com cache)
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
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000,    // 30 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // [ADICIONAR] Buscar dados do checklist do relatório sendo editado - DESABILITADO TEMPORARIAMENTE
  const editReportChecklistData: any[] = [];

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
      queryClient.invalidateQueries({ queryKey: ['adequacao-reports'] });
      queryClient.invalidateQueries({ queryKey: ['report-checklist-items'] });
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
      queryClient.invalidateQueries({ queryKey: ['adequacao-reports'] });
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
      'adequado': 'bg-teal-100 text-teal-800',
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
      'adequado': 'Adequado',
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

  // Funções para paginação
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedCards(new Set()); // Reset expanded cards on page change
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page
    setExpandedCards(new Set()); // Reset expanded cards
  };

  // Sincronizar campos ao abrir o modal - REMOVIDO PARA EVITAR LOOPS
  // Os campos serão sincronizados diretamente nos handlers

  const reportToEdit = editReportId ? reports.find(r => r.id === editReportId) : null;
  
  const template = reportToEdit?.template;

  const handleEditFieldChange = (fieldId: string, value: any) => {
    setEditFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  // Função para sincronizar campos quando abrir modal de edição
  const handleOpenEditModal = (reportId: string) => {
    const reportToEdit = reports.find(r => r.id === reportId);
    if (reportToEdit) {
      setEditReportId(reportId);
      setEditTitle(reportToEdit.title || '');
      setEditDescription(reportToEdit.description || '');
      setEditFormData(
        typeof reportToEdit.form_data === 'object' && !Array.isArray(reportToEdit.form_data)
          ? reportToEdit.form_data
          : {}
      );
      setEditAttachments(
        Array.isArray(reportToEdit.attachments)
          ? reportToEdit.attachments
          : []
      );
      setEditFilesToUpload([]);
      setEditUploadError(null);
      
      // Sincronizar checklist do relatório
      if (Array.isArray(reportToEdit.checklist_data)) {
        setEditChecklist(reportToEdit.checklist_data);
      } else {
        setEditChecklist([]);
      }
    }
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
      queryClient.invalidateQueries({ queryKey: ['adequacao-reports'] });
      queryClient.invalidateQueries({ queryKey: ['report-checklist-items'] });
      queryClient.invalidateQueries({ queryKey: ['edit-report-checklist'] });
      queryClient.invalidateQueries({ queryKey: ['all-checklist-items'] });
      setEditReportId(null);
      toast({ title: 'Relatório atualizado', description: 'As alterações foram salvas com sucesso.' });
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' });
    }
    setIsSaving(false);
  };

  // Dialog de edição removido pois não há edição para inspection_reports

  // Buscar nomes dos assigned - REMOVIDO PARA EVITAR LOOPS
  // Será feito via query separada se necessário

  // Buscar activities - REMOVIDO PARA EVITAR LOOPS
  // Será feito via query separada se necessário

  // Buscar nomes dos gestores - REMOVIDO PARA EVITAR LOOPS
  // Será feito via query separada se necessário

  // [CORRIGIR] Montar lista de checklist para edição
  const reportChecklistMap = (() => {
    if (!editReportId || !reportToEdit || !Array.isArray(allChecklistItems) || allChecklistItems.length === 0) {
      return [];
    }
    
    // Obter o id da classe do usuário responsável pelo relatório
    const userClassId = reportToEdit.technician?.user_class?.id;
    
    if (!userClassId) {
      return [];
    }
    
    // Filtrar apenas itens da classe do usuário
    const filteredItems = allChecklistItems.filter(item => String(item.user_class_id) === String(userClassId));
    
    return filteredItems;
  })();

  // [ADICIONAR] Sincronizar editChecklist com os dados do relatório - REMOVIDO PARA EVITAR LOOPS
  // O checklist será sincronizado diretamente nos handlers

  // Mapa de números de relatório otimizado
  const reportNumbersMap = (() => {
    if (!reports || reports.length === 0) return {};
    
    const map: Record<string, string> = {};
    reports.forEach((report: any) => {
      if (report.report_number && report.report_number > 0) {
        map[report.id] = `REL-${report.report_number}`;
      } else {
        const shortId = report.id.replace(/-/g, '').slice(0, 8);
        map[report.id] = `REL-${shortId}`;
      }
    });
    return map;
  })();

  // Função para obter o número do relatório com prefixo REL-
  const getReportNumber = (report: any) => {
    const cachedNumber = reportNumbersMap[report.id];
    if (cachedNumber) {
      return cachedNumber;
    }
    
    // Fallback caso o mapa não tenha o relatório
    if (report.report_number && report.report_number > 0) {
      return `REL-${report.report_number}`;
    }
    
    const shortId = report.id.replace(/-/g, '').slice(0, 8);
    return `REL-${shortId}`;
  };

  // NOVO: Função para obter o código do relatório principal
  const getParentReportCode = (adequacaoReport: any) => {
    if (!adequacaoReport?.parentReport) return null;
    
    if (adequacaoReport.parentReport.report_number) {
      return `REL-${adequacaoReport.parentReport.report_number}`;
    }
    
    // Fallback para relatórios antigos
    const shortId = adequacaoReport.parentReport.id.replace(/-/g, '').slice(0, 8);
    return `REL-${shortId}`;
  };

  // SOLUÇÃO 1 IMPLEMENTADA: Otimização da Query com Seleção Seletiva de Campos
  // - Busca inicial apenas campos essenciais para evitar timeout
  // - Busca form_data e checklist_data separadamente em lotes menores
  // - Reduz drasticamente o volume de dados transferidos por lote
  // ATENÇÃO: Filtros complexos foram temporariamente desabilitados para resolver problema de timeout
  // Apenas filtros de data estão ativos. Outros filtros serão aplicados no JavaScript após buscar os dados.
  async function handleExportCsvOptimized() {
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

          // NOVO: Processar exportação em lotes usando paginação por ID (muito mais eficiente)
      try {
        const BATCH_SIZE = 500; // Reduzir tamanho do lote para melhor performance
        let lastId: string | null = null;
        let allReports: any[] = [];
        let hasMoreData = true;
        let batchCount = 0;

        // Mostrar toast de início da exportação
        toast({ 
          title: "Iniciando exportação...", 
          description: "Buscando relatórios em lotes otimizados para evitar timeout.", 
          variant: "default" 
        });

        // SOLUÇÃO 1 IMPLEMENTADA: Buscar relatórios em lotes usando paginação por ID (cursor-based pagination)
        // Primeiro buscar apenas campos essenciais para evitar timeout com form_data JSONB
        while (hasMoreData) {
          batchCount++;
          console.log(`📦 Processando lote ${batchCount}${lastId ? ` (após ID: ${lastId.slice(0, 8)}...)` : ''}`);
          
          // OTIMIZAÇÃO: Selecionar apenas campos essenciais inicialmente
          let query = supabase
            .from('reports')
            .select(`
              id, title, description, status, created_at, updated_at, 
              numero_servico, pending_reason, pending_notes, assigned_to, 
              report_number, parent_report_id, validated_by, validated_at, 
              technician_id, template_id
            `)
            .neq('template_id', '4b45c601-e5b7-4a33-98f9-1769aad319e9')
            .gte('created_at', startDate)
            .lte('created_at', endDate + 'T23:59:59')
            .order('id', { ascending: false }) // Ordenar por ID em vez de created_at (mais eficiente)
            .limit(BATCH_SIZE);
          
          // Aplicar cursor-based pagination (muito mais eficiente que offset)
          if (lastId) {
            query = query.lt('id', lastId); // Buscar registros com ID menor que o último
          }

                  // COMENTADO TEMPORARIAMENTE: Filtros que podem estar causando timeout
          // Por enquanto, apenas filtros de data estão sendo aplicados no SQL
          /*
          // Aplicar outros filtros se definidos
          if (filters.technician && filters.technician !== 'all') {
            query = query.eq('technician_id', filters.technician);
          }
          if (filters.status && filters.status !== 'all') {
            query = query.eq('status', filters.status as any);
          }
          if (filters.serviceNumber && filters.serviceNumber.trim()) {
            query = query.ilike('numero_servico', `%${filters.serviceNumber.trim()}%`);
          }
          if (filters.reportNumber && filters.reportNumber.trim()) {
            const cleanReportNumber = filters.reportNumber.trim().replace(/^REL-?/i, '');
            if (cleanReportNumber) {
              query = query.eq('report_number', parseInt(cleanReportNumber));
            }
          }
          if (filters.formDataSearch && filters.formDataSearch.trim()) {
            const searchTerm = filters.formDataSearch.trim();
            query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,numero_servico.ilike.%${searchTerm}%`);
          }
          if (filters.userClass && filters.userClass !== 'all') {
            const { data: techniciansFromClass } = await supabase
              .from('profiles')
              .select('id')
              .eq('user_class_id', filters.userClass)
              .eq('is_active', true);
            
            if (techniciansFromClass && techniciansFromClass.length > 0) {
              const technicianIds = techniciansFromClass.map(t => t.id);
              query = query.eq('technician_id', technicianIds);
            } else {
              query = query.eq('technician_id', 'no-technicians-found');
            }
          }
          */

        const { data: batchReports, error, count } = await query;
        
        if (error) {
          console.error(`❌ Erro ao buscar lote ${batchCount}:`, error);
          console.error(`❌ Detalhes completos do erro:`, {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            batchCount: batchCount,
            lastId: lastId ? lastId.slice(0, 8) + '...' : 'null',
            startDate: startDate,
            endDate: endDate
          });
          
          // Mostrar erro mais detalhado para o usuário
          let errorMessage = 'Erro desconhecido';
          if (error.message) {
            errorMessage = error.message;
          } else if (error.details) {
            errorMessage = error.details;
          } else if (error.hint) {
            errorMessage = error.hint;
          }
          
          toast({ 
            title: `Erro no lote ${batchCount}`, 
            description: `Código: ${error.code || 'N/A'} - ${errorMessage}`, 
            variant: "destructive" 
          });
          return;
        }

        if (!batchReports || batchReports.length === 0) {
          hasMoreData = false;
          break;
        }

        // Adicionar relatórios do lote ao array principal
        allReports.push(...batchReports);
        console.log(`✅ Lote ${batchCount} processado: ${batchReports.length} relatórios`);

        // Verificar se há mais dados para buscar
        if (batchReports.length < BATCH_SIZE) {
          hasMoreData = false;
        } else {
          // Atualizar lastId para o próximo lote (cursor-based pagination)
          lastId = batchReports[batchReports.length - 1].id;
          
          // Adicionar delay entre lotes para evitar sobrecarga
          if (batchCount < 5) { // Apenas nos primeiros lotes
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        // Atualizar progresso para o usuário
        if (batchCount === 1) {
          toast({ 
            title: "Exportação em andamento...", 
            description: `Processando lote ${batchCount}...`, 
            variant: "default" 
          });
        }
        
        // Mostrar progresso dos dados dinâmicos
        if (batchCount > 1 && batchCount % 3 === 0) {
          toast({ 
            title: "Exportação em andamento...", 
            description: `Lote ${batchCount} processado. Aguarde o processamento dos dados dinâmicos...`, 
            variant: "default" 
          });
        }
      }

      if (allReports.length === 0) {
        toast({ title: "Nenhum relatório encontrado no período selecionado.", variant: "destructive" });
        return;
      }

      console.log(`📊 Total de relatórios coletados: ${allReports.length} em ${batchCount} lotes`);

      // ✅ IMPLEMENTAÇÃO OTIMIZADA: Paginação por ID (cursor-based) em vez de offset
      // Esta abordagem é muito mais eficiente para grandes volumes de dados
      
      // SOLUÇÃO 1 IMPLEMENTADA: Buscar form_data e checklist_data separadamente para evitar timeout
      console.log(`🔄 Buscando dados dinâmicos (form_data e checklist_data) em lotes...`);
      
      // Buscar form_data e checklist_data em lotes menores para evitar timeout
      const FORM_DATA_BATCH_SIZE = 100; // Lotes menores para dados JSONB pesados
      let formDataProcessed = 0;
      
      for (let i = 0; i < allReports.length; i += FORM_DATA_BATCH_SIZE) {
        const batchIds = allReports.slice(i, i + FORM_DATA_BATCH_SIZE).map(r => r.id);
        
        console.log(`📦 Processando lote de dados dinâmicos ${Math.floor(i / FORM_DATA_BATCH_SIZE) + 1}/${Math.ceil(allReports.length / FORM_DATA_BATCH_SIZE)}`);
        
        const { data: formDataBatch, error: formDataError } = await supabase
          .from('reports')
          .select('id, form_data, checklist_data, attachments')
          .in('id', batchIds);
        
        if (formDataError) {
          console.error(`❌ Erro ao buscar dados dinâmicos do lote ${Math.floor(i / FORM_DATA_BATCH_SIZE) + 1}:`, formDataError);
          // Continuar com os outros lotes mesmo se houver erro em um
          continue;
        }
        
        // Mesclar dados dinâmicos com os relatórios
        if (formDataBatch) {
          formDataBatch.forEach(formData => {
            const reportIndex = allReports.findIndex(r => r.id === formData.id);
            if (reportIndex !== -1) {
              allReports[reportIndex].form_data = formData.form_data;
              allReports[reportIndex].checklist_data = formData.checklist_data;
              allReports[reportIndex].attachments = formData.attachments;
            }
          });
          
          formDataProcessed += formDataBatch.length;
          console.log(`✅ Lote de dados dinâmicos processado: ${formDataBatch.length} relatórios`);
        }
        
        // Pequeno delay entre lotes para evitar sobrecarga
        if (i + FORM_DATA_BATCH_SIZE < allReports.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`🎯 Total de relatórios com dados dinâmicos carregados: ${formDataProcessed}/${allReports.length}`);
      
      // TODO: Aplicar filtros adicionais no JavaScript aqui (quando resolvermos o timeout)
      // Por enquanto, apenas filtros de data estão sendo aplicados no SQL

      // Buscar dados dos técnicos e templates para todos os relatórios coletados
      const technicianIds = [...new Set(allReports.map((r: any) => r.technician_id).filter(Boolean))];
      const templateIds = [...new Set(allReports.map((r: any) => r.template_id).filter(Boolean))];
      
      let techniciansData: any[] = [];
      let templatesData: any[] = [];
      
      if (technicianIds.length > 0) {
        console.log(`👥 Buscando dados de ${technicianIds.length} técnicos...`);
        const { data: techData } = await supabase
          .from('profiles')
          .select('id, name, user_class:user_classes(id, name)')
          .in('id', technicianIds);
        techniciansData = techData || [];
      }
      
      if (templateIds.length > 0) {
        console.log(`📋 Buscando dados de ${templateIds.length} templates...`);
        const { data: tempData } = await supabase
          .from('report_templates')
          .select('*')
          .in('id', templateIds);
        templatesData = tempData || [];
      }
      
      // Mapear dados para incluir relacionamentos
      const reportsWithRelations = allReports.map((report: any) => {
        const technician = techniciansData.find(t => t.id === report.technician_id);
        const template = templatesData.find(t => t.id === report.template_id);
        
        return {
          ...report,
          technician,
          template
        };
      });

      // Função para limpar e normalizar texto para CSV
      const cleanTextForCSV = (text: string): string => {
        if (!text) return '';
        
        return text
          .replace(/\r\n/g, ' ') // Substituir quebras de linha por espaço
          .replace(/\n/g, ' ')   // Substituir quebras de linha por espaço
          .replace(/\r/g, ' ')   // Substituir retornos por espaço
          .replace(/\t/g, ' ')   // Substituir tabs por espaço
          .replace(/\s+/g, ' ')  // Múltiplos espaços por um só
          .trim();               // Remover espaços no início e fim
      };

      // Função para extrair dados do form_data usando os labels dos campos
      const extractFormDataWithLabels = (formData: any, template: any) => {
        if (!formData) return {};
        
        let parsedFormData = formData;
        if (typeof formData === 'string') {
          try {
            parsedFormData = JSON.parse(formData);
          } catch {
            return {};
          }
        }
        
        const extracted: Record<string, any> = {};
        
        // Função auxiliar para processar valores
        const processValue = (value: any): string => {
          if (value === null || value === undefined) return '';
          if (typeof value === 'string') return cleanTextForCSV(value);
          if (typeof value === 'object' && value !== null) {
            if (value.url) return value.url;
            if (value.name) return value.name;
            if (value.id) return String(value.id);
            return JSON.stringify(value);
          }
          return String(value);
        };
        
        // Extrair campos usando os labels dos templates
        if (template?.fields && Array.isArray(template.fields)) {
          template.fields.forEach((field: any) => {
            const fieldKey = field.id || field.name;
            const fieldLabel = field.label || field.name;
            const value = parsedFormData[fieldKey];
            
            if (value !== undefined && value !== null) {
              if (typeof value === 'string') {
                extracted[fieldLabel] = cleanTextForCSV(value);
              } else if (Array.isArray(value)) {
                extracted[fieldLabel] = value.map(processValue).join('; ');
              } else if (typeof value === 'object' && value !== null) {
                extracted[fieldLabel] = processValue(value);
              } else {
                extracted[fieldLabel] = String(value);
              }
            } else {
              extracted[fieldLabel] = '';
            }
          });
        }
        
        // Extrair campos específicos que podem estar com nomes diferentes
        const specificFields = {
          'Data do Serviço': parsedFormData.data_servico || parsedFormData.data || parsedFormData.data_do_servico || '',
          'Endereço': parsedFormData.endereco || parsedFormData.address || parsedFormData.endereco_servico || '',
          'Bairro': parsedFormData.bairro || parsedFormData.neighborhood || parsedFormData.bairro_servico || '',
          'Cidade': parsedFormData.cidade || parsedFormData.city || parsedFormData.cidade_servico || '',
          'Serviço Finalizado?': parsedFormData.servico_finalizado || parsedFormData.finalizado || parsedFormData.concluido || '',
          'Observações': parsedFormData.observacoes || parsedFormData.observations || parsedFormData.obs || ''
        };
        
        // Adicionar campos específicos apenas se não estiverem vazios
        Object.entries(specificFields).forEach(([label, value]) => {
          if (value && value !== '') {
            extracted[label] = cleanTextForCSV(String(value));
          }
        });
        
        // Extrair todos os outros campos do form_data que não foram capturados pelos templates
        Object.keys(parsedFormData).forEach(key => {
          const value = parsedFormData[key];
          if (value !== undefined && value !== null) {
            // Verificar se o campo já foi processado
            const existingField = Object.values(extracted).find(v => v === cleanTextForCSV(String(value)));
            if (!existingField) {
              // Usar o nome do campo como label se não foi processado
              const fieldLabel = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
              if (typeof value === 'string') {
                extracted[fieldLabel] = cleanTextForCSV(value);
              } else if (Array.isArray(value)) {
                extracted[fieldLabel] = value.map(processValue).join('; ');
              } else if (typeof value === 'object' && value !== null) {
                extracted[fieldLabel] = processValue(value);
              } else {
                extracted[fieldLabel] = String(value);
              }
            }
          }
        });
        
        return extracted;
      };

      // Mapeia para criar uma estrutura mais organizada para CSV
      const exportData = reportsWithRelations.map((report: any) => {
        const { form_data, checklist_data, attachments } = report;
        
        // Extrair dados do form_data usando labels
        const formDataExtracted = extractFormDataWithLabels(form_data, report.template);
        
        // Processar checklist_data se existir
        let checklistInfo = '';
        if (checklist_data) {
          try {
            const checklist = typeof checklist_data === 'string' ? JSON.parse(checklist_data) : checklist_data;
            if (Array.isArray(checklist)) {
              checklistInfo = checklist.map((item: any) => {
                if (typeof item === 'object' && item !== null) {
                  return `${item.name || item.material || item.id}: ${item.quantity || 0}`;
                }
                return String(item);
              }).join('; ');
            }
          } catch (e) {
            checklistInfo = 'Erro ao processar checklist';
          }
        }
        
        // Processar attachments se existir
        let attachmentsInfo = '';
        if (attachments) {
          try {
            const atts = typeof attachments === 'string' ? JSON.parse(attachments) : attachments;
            if (Array.isArray(atts)) {
              attachmentsInfo = atts.map((att: any) => {
                if (typeof att === 'object' && att !== null) {
                  return att.url || att.name || 'arquivo';
                }
                return String(att);
              }).join('; ');
            }
          } catch (e) {
            attachmentsInfo = 'Erro ao processar anexos';
          }
        }
        
        // Definir ordem fixa das colunas
        return {
          'Código Único': getReportNumber(report),
          'ID do Relatório': report.id || '',
          'Número do Serviço': report.numero_servico || '',
          'Título': cleanTextForCSV(report.title || ''),
          'FCA': cleanTextForCSV(report.description || ''),
          'Status': report.status || '',
          'Técnico': report.technician?.name || '',
          'Data de Criação': report.created_at ? new Date(report.created_at).toLocaleDateString('pt-BR') : '',
          'Data de Atualização': report.updated_at ? new Date(report.updated_at).toLocaleDateString('pt-BR') : '',
          'Validado em': report.validated_at ? new Date(report.validated_at).toLocaleDateString('pt-BR') : '',
          'Validado por': report.validated_by || '',
          'ID da Ordem de Serviço': report.service_order_id || '',
          'Atribuído para': report.assigned_to || '',
          'Motivo da Pendência': cleanTextForCSV(report.pending_reason || ''),
          'Observações da Pendência': cleanTextForCSV(report.pending_notes || ''),
          'ID do Relatório Pai': report.parent_report_id || '',
          'Informações do Checklist': checklistInfo,
          'Anexos': attachmentsInfo,
          // Incluir campos dinâmicos do formulário em ordem alfabética
          ...Object.keys(formDataExtracted)
            .sort()
            .reduce((acc, key) => {
              acc[key] = formDataExtracted[key];
              return acc;
            }, {} as Record<string, any>)
        };
      });
      
      console.log(`📤 Gerando CSV com ${exportData.length} registros...`);
      
      // Mostrar toast de conclusão com informações da Solução 1
      toast({ 
        title: "Exportação concluída com otimização!", 
        description: `${exportData.length} relatórios processados em ${batchCount} lotes principais + ${Math.ceil(allReports.length / 100)} lotes de dados dinâmicos.`, 
        variant: "default" 
      });
      
      exportToCSV(exportData, `relatorios_validacao_${startDate}_a_${endDate}`);
      
    } catch (error) {
      console.error('❌ Erro ao exportar CSV:', error);
      toast({ title: "Erro ao exportar CSV.", description: "Tente novamente.", variant: "destructive" });
    }
  }

  // SOLUÇÃO 2 IMPLEMENTADA: Exportação progressiva com streaming
  // Esta função cria um CSV progressivamente, processando um relatório por vez
  // para evitar timeout e melhorar a experiência do usuário
  async function handleExportCsvProgressive() {
    const { startDate, endDate } = filters;
    if (!startDate || !endDate) {
      toast({ title: "Selecione as duas datas.", variant: "destructive" });
      return;
    }

    try {
      const BATCH_SIZE = 50; // Lotes muito pequenos para evitar timeout
      let lastId: string | null = null;
      let batchCount = 0;
      let hasMoreData = true;
      let totalProcessed = 0;

      // Criar arquivo CSV progressivamente
      const csvHeader = [
        'Código Único', 'ID do Relatório', 'Número do Serviço', 'Título', 
        'FCA', 'Status', 'Técnico', 'Data de Criação', 'Data de Atualização',
        'Validado em', 'Validado por', 'Motivo da Pendência', 'Observações da Pendência',
        'ID do Relatório Pai', 'Informações do Checklist', 'Anexos'
      ].join(',');

      let csvContent = csvHeader + '\n';

      toast({ 
        title: "Exportação progressiva iniciada...", 
        description: "Processando em lotes pequenos para evitar timeout.", 
        variant: "default" 
      });

      while (hasMoreData) {
        batchCount++;
        
        // Buscar apenas dados essenciais
        let query = supabase
          .from('reports')
          .select(`
            id, title, description, status, created_at, updated_at, 
            numero_servico, pending_reason, pending_notes, assigned_to, report_number,
            validated_by, validated_at, technician_id, parent_report_id
          `)
          .neq('template_id', '4b45c601-e5b7-4a33-98f9-1769aad319e9')
          .gte('created_at', startDate)
          .lte('created_at', endDate + 'T23:59:59')
          .order('id', { ascending: false })
          .limit(BATCH_SIZE);

        if (lastId) {
          query = query.lt('id', lastId);
        }

        const { data: batchReports, error } = await query;
        
        if (error) {
          console.error(`❌ Erro no lote ${batchCount}:`, error);
          toast({ 
            title: `Erro no lote ${batchCount}`, 
            description: `Código: ${error.code} - ${error.message}`, 
            variant: "destructive" 
          });
          return;
        }

        if (!batchReports || batchReports.length === 0) {
          hasMoreData = false;
          break;
        }

        // Processar cada relatório individualmente para evitar timeout
        for (const report of batchReports) {
          try {
            // Buscar form_data individualmente para evitar timeout
            const { data: formData } = await supabase
              .from('reports')
              .select('form_data, checklist_data, attachments')
              .eq('id', report.id)
              .single();

            if (formData) {
              (report as any).form_data = formData.form_data;
              (report as any).checklist_data = formData.checklist_data;
              (report as any).attachments = formData.attachments;
            }

            // Processar checklist_data
            let checklistInfo = '';
            if ((report as any).checklist_data) {
              try {
                const checklist = typeof (report as any).checklist_data === 'string' ? 
                  JSON.parse((report as any).checklist_data) : (report as any).checklist_data;
                if (Array.isArray(checklist)) {
                  checklistInfo = checklist.map((item: any) => {
                    if (typeof item === 'object' && item !== null) {
                      return `${item.name || item.material || item.id}: ${item.quantity || 0}`;
                    }
                    return String(item);
                  }).join('; ');
                }
              } catch (e) {
                checklistInfo = 'Erro ao processar checklist';
              }
            }

            // Processar attachments
            let attachmentsInfo = '';
            if ((report as any).attachments) {
              try {
                const atts = typeof (report as any).attachments === 'string' ? 
                  JSON.parse((report as any).attachments) : (report as any).attachments;
                if (Array.isArray(atts)) {
                  attachmentsInfo = atts.map((att: any) => {
                    if (typeof att === 'object' && att !== null) {
                      return att.url || att.name || 'arquivo';
                    }
                    return String(att);
                  }).join('; ');
                }
              } catch (e) {
                attachmentsInfo = 'Erro ao processar anexos';
              }
            }

            // Função para limpar texto para CSV
            const cleanTextForCSV = (text: string): string => {
              if (!text) return '';
              return text
                .replace(/\r\n/g, ' ')
                .replace(/\n/g, ' ')
                .replace(/\r/g, ' ')
                .replace(/\t/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            };

            // Adicionar linha ao CSV
            const csvLine = [
              getReportNumber(report),
              report.id || '',
              report.numero_servico || '',
              cleanTextForCSV(report.title || ''),
              cleanTextForCSV(report.description || ''),
              report.status || '',
              '', // Técnico será preenchido depois
              report.created_at ? new Date(report.created_at).toLocaleDateString('pt-BR') : '',
              report.updated_at ? new Date(report.updated_at).toLocaleDateString('pt-BR') : '',
              report.validated_at ? new Date(report.validated_at).toLocaleDateString('pt-BR') : '',
              report.validated_by || '',
              cleanTextForCSV(report.pending_reason || ''),
              cleanTextForCSV(report.pending_notes || ''),
              report.parent_report_id || '',
              checklistInfo,
              attachmentsInfo
            ].map(field => `"${field}"`).join(',');

            csvContent += csvLine + '\n';
            totalProcessed++;

            // Atualizar progresso a cada 10 relatórios
            if (totalProcessed % 10 === 0) {
              toast({ 
                title: `Progresso da exportação...`, 
                description: `${totalProcessed} relatórios processados. Lote ${batchCount}.`, 
                variant: "default" 
              });
            }

          } catch (reportError) {
            console.error(`❌ Erro ao processar relatório ${report.id}:`, reportError);
            // Continuar com o próximo relatório
            continue;
          }
        }

        // Verificar se há mais dados
        if (batchReports.length < BATCH_SIZE) {
          hasMoreData = false;
        } else {
          lastId = batchReports[batchReports.length - 1].id;
          // Delay entre lotes para evitar sobrecarga
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Atualizar progresso do lote
        toast({ 
          title: `Lote ${batchCount} processado`, 
          description: `${batchReports.length} relatórios adicionados ao CSV. Total: ${totalProcessed}`, 
          variant: "default" 
        });
      }

      if (totalProcessed === 0) {
        toast({ title: "Nenhum relatório encontrado no período selecionado.", variant: "destructive" });
        return;
      }

      // Download do CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorios_validacao_progressivo_${startDate}_a_${endDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ 
        title: "Exportação progressiva concluída!", 
        description: `CSV gerado com sucesso: ${totalProcessed} relatórios em ${batchCount} lotes.`, 
        variant: "default" 
      });

    } catch (error) {
      console.error('❌ Erro na exportação progressiva:', error);
      toast({ title: "Erro na exportação progressiva.", description: "Tente novamente.", variant: "destructive" });
    }
  }

  // 🎯 FUNÇÃO PRINCIPAL INTELIGENTE: Escolhe automaticamente a melhor solução
  // Esta função analisa o período selecionado e escolhe a estratégia mais adequada
  async function handleExportCsvIntelligent() {
    const { startDate, endDate } = filters;
    
    // Validar datas
    if (!startDate || !endDate) {
      toast({ title: "Selecione as duas datas.", variant: "destructive" });
      return;
    }
    
    // Calcular período em dias
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    // Validar período máximo (opcional - pode ser removido se não necessário)
    if (diffDays > 365) {
      toast({ 
        title: "Período muito longo", 
        description: "Para períodos acima de 1 ano, considere usar filtros mais específicos (técnico, status, etc.)", 
        variant: "destructive" 
      });
      return;
    }
    
    // Escolher solução automaticamente baseada no período
    if (diffDays <= 60) { // Até 2 meses
      console.log(`📊 Período: ${diffDays} dias (${Math.round(diffDays/30)} meses) - Usando Solução 1 (Otimizada)`);
      toast({
        title: "Exportação iniciada com Solução Otimizada",
        description: `Período: ${diffDays} dias - Processamento rápido e confiável`,
        variant: "default"
      });
      return handleExportCsvOptimized();
      
    } else if (diffDays <= 180) { // 2-6 meses
      console.log(`📊 Período: ${diffDays} dias (${Math.round(diffDays/30)} meses) - Usando Solução 2 (Progressiva)`);
      toast({
        title: "Exportação iniciada com Solução Progressiva",
        description: `Período: ${diffDays} dias - Processamento em lotes para evitar timeout`,
        variant: "default"
      });
      return handleExportCsvProgressive();
      
    } else { // 6+ meses
      console.log(`📊 Período: ${diffDays} dias (${Math.round(diffDays/30)} meses) - Usando Solução 4 (Worker)`);
      toast({
        title: "Exportação iniciada com Solução Worker",
        description: `Período: ${diffDays} dias - Processamento em background para volumes grandes`,
        variant: "default"
      });
      return handleExportCsvWithWorker();
    }
  }

  // SOLUÇÃO 4 IMPLEMENTADA: Exportação usando Web Worker para não bloquear a UI
  // Esta função usa um worker em background para processar CSV sem bloquear a interface
  async function handleExportCsvWithWorker() {
    const { startDate, endDate } = filters;
    if (!startDate || !endDate) {
      toast({ title: "Selecione as duas datas.", variant: "destructive" });
      return;
    }

    try {
      // Verificar se o browser suporta Web Workers
      if (typeof Worker === 'undefined') {
        toast({ 
          title: "Web Worker não suportado", 
          description: "Falling back para exportação normal...", 
          variant: "default" 
        });
        // Fallback para função normal
        return handleExportCsvOptimized();
      }

      // Criar worker para processar CSV em background
      const worker = new Worker(new URL('@/workers/csvExport.worker.ts', import.meta.url));
      
      let workerReady = false;
      let exportStarted = false;

      // Configurar listeners do worker
      worker.onmessage = async (event) => {
        const { type, message, csvContent, filename, processedCount, error } = event.data;
        
        switch (type) {
          case 'WORKER_READY':
            workerReady = true;
            console.log('✅ Worker CSV inicializado:', message);
            
            // Iniciar exportação quando worker estiver pronto
            if (!exportStarted) {
              exportStarted = true;
              worker.postMessage({
                type: 'EXPORT_CSV',
                filters: { startDate, endDate },
                batchSize: 100 // Lotes pequenos para evitar timeout
              });
            }
            break;
            
          case 'EXPORT_STARTED':
            toast({ 
              title: "Exportação com Worker iniciada...", 
              description: "Processando em background para não bloquear a interface.", 
              variant: "default" 
            });
            break;
            
          case 'PROGRESS_UPDATE':
            // Atualizar progresso (opcional - pode ser comentado para reduzir notificações)
            if (processedCount % 200 === 0) {
              const percentage = Math.round((processedCount / (event.data.total || 1)) * 100);
              toast({ 
                title: `Progresso da exportação...`, 
                description: `${processedCount} relatórios processados (${percentage}%)`, 
                variant: "default" 
              });
            }
            break;
            
          case 'CSV_READY':
            // Download do CSV gerado pelo worker
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast({ 
              title: "Exportação com Worker concluída!", 
              description: `CSV gerado com sucesso: ${processedCount} relatórios processados em background.`, 
              variant: "default" 
            });
            
            // Terminar worker
            worker.terminate();
            break;
            
          case 'ERROR':
            console.error('❌ Erro no worker:', error);
            toast({ 
              title: "Erro no Worker", 
              description: error || "Erro desconhecido no processamento em background.", 
              variant: "destructive" 
            });
            worker.terminate();
            break;
        }
      };

      worker.onerror = (error) => {
        console.error('❌ Erro no worker:', error);
        toast({ 
          title: "Erro no Worker", 
          description: "Erro crítico no processamento em background. Tente a exportação normal.", 
          variant: "destructive" 
        });
        worker.terminate();
      };

      // Timeout de segurança para o worker
      setTimeout(() => {
        if (worker && !workerReady) {
          toast({ 
            title: "Timeout do Worker", 
            description: "Worker não respondeu. Tente a exportação normal.", 
            variant: "default" 
          });
          worker.terminate();
        }
      }, 10000); // 10 segundos de timeout

      // Iniciar busca de dados para enviar ao worker
      toast({ 
        title: "Iniciando exportação com Worker...", 
        description: "Buscando dados para processamento em background.", 
        variant: "default" 
      });

      // Buscar dados em lotes para enviar ao worker
      const BATCH_SIZE = 200; // Lotes maiores para o worker
      let lastId: string | null = null;
      let allReports: any[] = [];
      let hasMoreData = true;
      let batchCount = 0;

      while (hasMoreData) {
        batchCount++;
        
        let query = supabase
          .from('reports')
          .select(`
            id, title, description, status, created_at, updated_at, 
            numero_servico, pending_reason, pending_notes, assigned_to, report_number,
            validated_by, validated_at, technician_id, parent_report_id
          `)
          .neq('template_id', '4b45c601-e5b7-4a33-98f9-1769aad319e9')
          .gte('created_at', startDate)
          .lte('created_at', endDate + 'T23:59:59')
          .order('id', { ascending: false })
          .limit(BATCH_SIZE);

        if (lastId) {
          query = query.lt('id', lastId);
        }

        const { data: batchReports, error } = await query;
        
        if (error) {
          console.error(`❌ Erro ao buscar lote ${batchCount}:`, error);
          toast({ 
            title: `Erro no lote ${batchCount}`, 
            description: `Código: ${error.code} - ${error.message}`, 
            variant: "destructive" 
          });
          worker.terminate();
          return;
        }

        if (!batchReports || batchReports.length === 0) {
          hasMoreData = false;
          break;
        }

        // Buscar dados dinâmicos para este lote
        const reportIds = batchReports.map(r => r.id);
        const { data: formDataBatch } = await supabase
          .from('reports')
          .select('id, form_data, checklist_data, attachments')
          .in('id', reportIds);

        // Mesclar dados
        if (formDataBatch) {
          formDataBatch.forEach(formData => {
            const reportIndex = batchReports.findIndex(r => r.id === formData.id);
            if (reportIndex !== -1) {
              // Adicionar propriedades dinâmicas ao objeto
              (batchReports[reportIndex] as any).form_data = formData.form_data;
              (batchReports[reportIndex] as any).checklist_data = formData.checklist_data;
              (batchReports[reportIndex] as any).attachments = formData.attachments;
            }
          });
        }

        allReports.push(...batchReports);

        if (batchReports.length < BATCH_SIZE) {
          hasMoreData = false;
        } else {
          lastId = batchReports[batchReports.length - 1].id;
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      if (allReports.length === 0) {
        toast({ title: "Nenhum relatório encontrado no período selecionado.", variant: "destructive" });
        worker.terminate();
        return;
      }

      // Enviar todos os dados para o worker processar
      console.log(`📤 Enviando ${allReports.length} relatórios para o Worker processar...`);
      worker.postMessage({
        type: 'PROCESS_REPORTS',
        data: allReports
      });

    } catch (error) {
      console.error('❌ Erro ao iniciar exportação com worker:', error);
      toast({ 
        title: "Erro ao iniciar exportação com Worker", 
        description: "Tente a exportação normal.", 
        variant: "destructive" 
      });
    }
  }

  // Função para exportar CSV dos itens do checklist (um por linha) - OTIMIZADA
  async function handleExportCsvChecklist() {
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

    try {
      toast({ 
        title: "Iniciando exportação de checklist...", 
        description: "Processando dados em lotes para evitar timeout", 
        variant: "default" 
      });

      // FASE 1: Buscar apenas campos essenciais dos relatórios (incluindo form_data para data_servico)
      let query = supabase
        .from('reports')
        .select(`
          id, title, status, created_at, numero_servico, 
          report_number, parent_report_id, technician_id, template_id,
          form_data
        `)
        .neq('template_id', '4b45c601-e5b7-4a33-98f9-1769aad319e9')
        .order('created_at', { ascending: false });

      // Aplicar filtros de data
      query = query.gte('created_at', startDate);
      query = query.lte('created_at', endDate + 'T23:59:59');

      // Aplicar outros filtros se definidos
      if (filters.technician && filters.technician !== 'all') {
        query = query.eq('technician_id', filters.technician);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status as any);
      }
      if (filters.serviceNumber && filters.serviceNumber.trim()) {
        query = query.ilike('numero_servico', `%${filters.serviceNumber.trim()}%`);
      }
      if (filters.reportNumber && filters.reportNumber.trim()) {
        const cleanReportNumber = filters.reportNumber.trim().replace(/^REL-?/i, '');
        if (cleanReportNumber) {
          query = query.eq('report_number', parseInt(cleanReportNumber));
        }
      }
      if (filters.formDataSearch && filters.formDataSearch.trim()) {
        const searchTerm = filters.formDataSearch.trim();
        query = query.or(`title.ilike.%${searchTerm}%,numero_servico.ilike.%${searchTerm}%`);
      }
      if (filters.userClass && filters.userClass !== 'all') {
        const { data: techniciansFromClass } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_class_id', filters.userClass)
          .eq('is_active', true);
        
        if (techniciansFromClass && techniciansFromClass.length > 0) {
          const technicianIds = techniciansFromClass.map(t => t.id);
          query = query.in('technician_id', technicianIds);
        } else {
          query = query.eq('technician_id', 'no-technicians-found');
        }
      }

      const { data: allReports, error } = await query;
      
      if (error) {
        console.error('❌ Erro ao buscar relatórios para exportação de checklist:', error);
        toast({ title: "Erro ao buscar relatórios.", description: error.message, variant: "destructive" });
        return;
      }

      if (!allReports || allReports.length === 0) {
        toast({ title: "Nenhum relatório encontrado no período selecionado.", variant: "default" });
        return;
      }
      
      // Debug: Verificar se form_data está sendo buscado
      console.log('📋 Relatórios encontrados:', allReports.length);
      console.log('🔍 Primeiro relatório com form_data:', {
        id: allReports[0]?.id,
        hasFormData: !!allReports[0]?.form_data,
        formDataKeys: allReports[0]?.form_data ? Object.keys(allReports[0].form_data) : [],
        sampleFormData: allReports[0]?.form_data
      });

      toast({ 
        title: `Processando ${allReports.length} relatórios...`, 
        description: "Buscando dados de checklist em lotes", 
        variant: "default" 
      });

      // FASE 2: Buscar dados dos técnicos
      const technicianIds = [...new Set(allReports.map((r: any) => r.technician_id).filter(Boolean))];
      
      let techniciansData: any[] = [];
      if (technicianIds.length > 0) {
        const { data: techData } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', technicianIds);
        techniciansData = techData || [];
      }
      
      // FASE 3: Buscar dados de checklist em lotes para evitar timeout
      const reportIds = allReports.map((r: any) => r.id);
      const BATCH_SIZE = 100; // Processar em lotes de 100
      let allChecklistLinks: any[] = [];
      
      for (let i = 0; i < reportIds.length; i += BATCH_SIZE) {
        const batchIds = reportIds.slice(i, i + BATCH_SIZE);
        
        const { data: batchLinks, error: batchError } = await supabase
          .from('report_checklist_items')
          .select('report_id, checklist_item_id, quantity, notes')
          .in('report_id', batchIds);
        
        if (batchError) {
          console.error(`❌ Erro ao buscar lote ${Math.floor(i/BATCH_SIZE) + 1}:`, batchError);
          continue; // Continuar com próximo lote
        }
        
        if (batchLinks) {
          allChecklistLinks.push(...batchLinks);
        }
        
        // Feedback de progresso
        if (i % (BATCH_SIZE * 2) === 0) {
          toast({ 
            title: `Processando checklist...`, 
            description: `${Math.min(i + BATCH_SIZE, reportIds.length)} de ${reportIds.length} relatórios`, 
            variant: "default" 
          });
        }
      }
      
      if (allChecklistLinks.length === 0) {
        toast({ title: "Nenhum item de checklist encontrado.", variant: "default" });
        return;
      }

      // FASE 4: Buscar dados dos itens de checklist
      const checklistItemIds = [...new Set(allChecklistLinks.map((item: any) => item.checklist_item_id))];
      
      const { data: checklistItems, error: errorItems } = await supabase
        .from('checklist_items')
        .select('id, name, category, standard_quantity')
        .in('id', checklistItemIds);
      
      if (errorItems) {
        console.error('❌ Erro ao buscar dados dos itens do checklist:', errorItems);
        toast({ title: "Erro ao buscar dados dos itens do checklist.", description: errorItems.message, variant: "destructive" });
        return;
      }

      const checklistItemMap: Record<string, any> = {};
      (checklistItems || []).forEach((item: any) => { 
        checklistItemMap[item.id] = item; 
      });

      // FASE 5: Montar linhas do CSV
      const checklistRows: any[] = [];
      
      allReports.forEach((report: any) => {
        const technician = techniciansData.find(t => t.id === report.technician_id);
        const reportChecklistItems = allChecklistLinks.filter((item: any) => item.report_id === report.id);
        
        reportChecklistItems.forEach((item: any) => {
          const checklistItem = checklistItemMap[item.checklist_item_id];
          
          // Extrair data_servico do form_data (campo dinâmico)
          let dataServico = "";
          if (report.form_data && typeof report.form_data === 'object') {
            // Debug: Log para verificar estrutura do form_data
            console.log('🔍 Debug form_data para relatório', report.id, ':', report.form_data);
            
            // Função para identificar se um valor é uma data válida
            const isDateValue = (value: any): boolean => {
              if (typeof value !== 'string') return false;
              
              // Padrões de data comuns
              const datePatterns = [
                /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
                /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
                /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
                /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
              ];
              
              return datePatterns.some(pattern => pattern.test(value));
            };
            
            // Função para validar se a data é realista (não no futuro)
            const isValidRealisticDate = (dateStr: string): boolean => {
              try {
                let date: Date;
                
                // Converter string para Date baseado no formato
                if (dateStr.includes('-')) {
                  // Formato YYYY-MM-DD ou DD-MM-YYYY
                  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    date = new Date(dateStr);
                  } else if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
                    const [day, month, year] = dateStr.split('-');
                    date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                  }
                } else if (dateStr.includes('/')) {
                  // Formato DD/MM/YYYY ou YYYY/MM/DD
                  if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                    const [day, month, year] = dateStr.split('/');
                    date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                  } else if (dateStr.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
                    date = new Date(dateStr);
                  }
                }
                
                if (!date || isNaN(date.getTime())) return false;
                
                // Verificar se a data não está no futuro (com tolerância de 1 dia para timezone)
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                
                return date <= tomorrow;
              } catch {
                return false;
              }
            };
            
            // Estratégia 1: Tentar campos diretos conhecidos
            dataServico = report.form_data.data_servico || 
                          report.form_data['data_servico'] || 
                          report.form_data?.data_servico?.value || 
                          report.form_data?.data_servico?.text || 
                          report.form_data?.data_servico?.label ||
                          report.form_data?.data_servico?.content ||
                          "";
            
            // Estratégia 2: Se não encontrou, procurar por qualquer campo que contenha uma data válida e realista
            if (!dataServico || dataServico === "") {
              console.log('🔍 Procurando por campos de data válida e realista no form_data...');
              
              // Percorrer todos os campos do form_data
              Object.entries(report.form_data).forEach(([key, value]) => {
                if (isDateValue(value) && isValidRealisticDate(String(value))) {
                  console.log(`📅 Data válida e realista encontrada no campo '${key}': ${value}`);
                  dataServico = String(value);
                  return;
                }
              });
            }
            
            // Estratégia 3: Se ainda não encontrou, procurar por campos que contenham "data" no nome
            if (!dataServico || dataServico === "") {
              console.log('🔍 Procurando por campos com "data" no nome...');
              
              Object.entries(report.form_data).forEach(([key, value]) => {
                if (key.toLowerCase().includes('data') && isDateValue(value) && isValidRealisticDate(String(value))) {
                  console.log(`📅 Data válida e realista encontrada no campo '${key}' (contém "data"): ${value}`);
                  dataServico = String(value);
                  return;
                }
              });
            }
            
            // Estratégia 4: Procurar por campos relacionados a "serviço" que possam conter datas
            if (!dataServico || dataServico === "") {
              console.log('🔍 Procurando por campos relacionados a serviço...');
              
              const serviceRelatedKeys = ['servico', 'service', 'execucao', 'execution', 'realizacao', 'realization'];
              
              Object.entries(report.form_data).forEach(([key, value]) => {
                const keyLower = key.toLowerCase();
                if (serviceRelatedKeys.some(serviceKey => keyLower.includes(serviceKey)) && isDateValue(value) && isValidRealisticDate(String(value))) {
                  console.log(`📅 Data válida e realista encontrada no campo '${key}' (relacionado a serviço): ${value}`);
                  dataServico = String(value);
                  return;
                }
              });
            }
            
            // Estratégia 5: Se ainda não encontrou, usar a data de criação do relatório como fallback
            if (!dataServico || dataServico === "") {
              console.log('🔍 Usando data de criação do relatório como fallback...');
              
              // Formatar a data de criação para DD/MM/YYYY
              const createdDate = new Date(report.created_at);
              const day = String(createdDate.getDate()).padStart(2, '0');
              const month = String(createdDate.getMonth() + 1).padStart(2, '0');
              const year = createdDate.getFullYear();
              
              dataServico = `${day}/${month}/${year}`;
              console.log(`📅 Data de criação formatada: ${dataServico}`);
            }
            
            // Debug: Log do valor extraído
            console.log('📅 Data do serviço extraída:', dataServico);
          }
          
          const csvRow = {
            codigo_unico: getReportNumber(report),
            id_relatorio: report.id,
            numero_servico: report.numero_servico,
            tecnico_nome: technician?.name || "",
            data_servico: dataServico || "Não informado",
            material_servico: checklistItem?.name || item.checklist_item_id,
            quantidade: item.quantity ?? "",
            tipo: checklistItem?.category ?? ""
          };
          
          // Debug: Log da linha do CSV
          console.log('📊 Linha CSV criada:', csvRow);
          
          checklistRows.push(csvRow);
        });
      });

      if (checklistRows.length === 0) {
        toast({ title: "Nenhum material/serviço encontrado no período selecionado.", variant: "default" });
        return;
      }
      
      // Debug: Verificar estrutura final antes da exportação
      console.log('🎯 Estrutura final do CSV:', {
        totalRows: checklistRows.length,
        sampleRow: checklistRows[0],
        headers: Object.keys(checklistRows[0]),
        allRows: checklistRows
      });
      
      toast({ 
        title: "Exportação concluída!", 
        description: `${checklistRows.length} itens de checklist exportados com sucesso`, 
        variant: "default" 
      });
      
      exportToCSV(checklistRows, `relatorios_checklist_${startDate}_a_${endDate}`);
      
    } catch (error) {
      console.error('❌ Erro ao exportar CSV do checklist:', error);
      toast({ title: "Erro ao exportar CSV do checklist.", description: "Tente novamente.", variant: "destructive" });
    }
  }

  // Função para buscar em campos dinâmicos usando query SQL


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner text="Carregando relatórios..." />
        </div>
      </div>
    );
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
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 space-y-6">
        
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
              {/* Primeira linha de filtros */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Técnico</label>
                  <Select 
                    value={filters.technician} 
                    onValueChange={(value) => setFilters(prev => ({...prev, technician: value}))}
                  >
                    <SelectTrigger className="w-full" >
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
                      <SelectItem value="adequado">Adequado</SelectItem>
                      <SelectItem value="sem_pendencia">Sem pendência</SelectItem>
                      <SelectItem value="faturado">Faturado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Número do Serviço</label>
                  <Input
                    placeholder="Número"
                    value={serviceNumberInput}
                    onChange={(e) => setServiceNumberInput(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Código do Relatório</label>
                  <Input
                    placeholder="REL-607"
                    value={reportNumberInput}
                    onChange={(e) => setReportNumberInput(e.target.value)}
                  />
                </div>
              </div>

              {/* Segunda linha de filtros */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Buscar em Campos Dinâmicos</label>
                  <Input
                    placeholder="Buscar em form_data..."
                    value={formDataSearchInput}
                    onChange={(e) => setFormDataSearchInput(e.target.value)}
                  />
                                  </div>
                </div>
                

                
                <div className="flex justify-end gap-2 flex-wrap">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={handleExportCsvIntelligent} 
                        variant={(() => {
                          const { startDate, endDate } = filters;
                          if (!startDate || !endDate) return "default";
                          const start = new Date(startDate);
                          const end = new Date(endDate);
                          const diffDays = Math.round(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                          if (diffDays <= 60) return "default"; // Verde
                          if (diffDays <= 180) return "outline"; // Amarelo
                          return "destructive"; // Vermelho
                        })()}
                        className="min-w-[200px]"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Exportar CSV
                        {(() => {
                          const { startDate, endDate } = filters;
                          if (!startDate || !endDate) return null;
                          const start = new Date(startDate);
                          const end = new Date(endDate);
                          const diffDays = Math.round(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                          if (diffDays > 0) {
                            return (
                              <span className="ml-2 text-xs opacity-75">
                                ({Math.round(diffDays/30)} meses)
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs p-3">
                      <div className="space-y-2">
                        <p className="font-semibold text-sm">🎯 Botão Inteligente</p>
                        <p className="text-xs">Escolhe automaticamente a melhor solução baseada no período selecionado</p>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>• Até 2 meses: Solução Otimizada</p>
                          <p>• 2-6 meses: Solução Progressiva</p>
                          <p>• 6+ meses: Solução Worker</p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>



                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleExportCsvChecklist} variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Exportar CSV Checklist
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs p-3">
                      <div className="space-y-2">
                        <p className="font-semibold text-sm">📋 Exportação específica de checklist</p>
                        <p className="text-xs">Lista todos os materiais e serviços utilizados</p>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>• Um item por linha no CSV</p>
                          <p>• Inclui quantidades e observações</p>
                          <p>• Sem limite de período</p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Relatórios */}
        <div className="space-y-4">
          {reports
            .filter(report => report && typeof report === 'object' && 'id' in report && report.id)
            .map((report) => {
              const isFaturado = typeof report.status === 'string' && report.status === 'faturado';
              const adequacaoReport = reports.find(r =>
                r.service_order_id === report.service_order_id &&
                r.technician_id === report.assigned_to &&
                r.id !== report.id
              );
              // NOVA LÓGICA: Verificar se já foi validado usando os campos validated_by e validated_at
              const hasBeenValidated = report.validated_by && report.validated_at;
              // Verificar se já foi adequado em algum momento (manter lógica atual para compatibilidade)
              const hasBeenAdequado = Array.isArray(activities[report.id]) && activities[report.id].some(a => a.action === "em_adequacao");

              return (
                <Card key={report.id} className="shadow-sm break-words">
                  <Collapsible open={expandedCards.has(report.id)} onOpenChange={() => toggleCardExpansion(report.id)}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col items-start gap-1">
                                                          <div className="flex items-center gap-2">
                                <span className="font-mono font-medium text-primary">
                                  {getReportNumber(report)}
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
                              <div className="space-y-2 text-sm break-words whitespace-normal">
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
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {report.attachments.map((attachment: any, index) => (
                                  <div key={index} className="relative">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <div className="relative cursor-pointer group">
                                          <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group-hover:scale-105 border border-gray-200">
                                            <img
                                              src={attachment?.url || ''}
                                              alt={`Anexo ${index + 1}`}
                                              className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-110"
                                              onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                target.nextElementSibling?.classList.remove('hidden');
                                              }}
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-xl"></div>
                                          </div>
                                          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-xl hidden">
                                            <span className="text-xs text-gray-500">Erro ao carregar</span>
                                          </div>
                                        </div>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-4xl max-h-none p-0 overflow-hidden">
                                        <DialogHeader className="absolute top-4 left-4 z-10">
                                          <DialogTitle className="text-white text-lg">Visualizar Imagem</DialogTitle>
                                          <DialogDescription className="text-white text-sm">
                                            Clique no X para fechar
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="relative h-full">
                                          <div className="absolute top-4 right-4 z-10">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => document.querySelector('[data-radix-dialog-close]')?.dispatchEvent(new Event('click'))}
                                              className="text-white hover:bg-white hover:text-black"
                                            >
                                              <X className="w-4 h-4" />
                                            </Button>
                                          </div>
                                          
                                          <div className="h-full max-h-[80vh] flex items-center justify-center overflow-y-auto overflow-x-hidden">
                                            <img
                                              src={attachment?.url || ''}
                                              alt={`Anexo ${index + 1}`}
                                              className="w-auto h-auto max-w-full object-contain"
                                            />
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
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
                            const adequacaoReport = adequacaoReports[report.id];
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
                                  <div className="space-y-4">
                                    {/* NOVO: Cabeçalho com informações principais */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Número do próprio relatório de adequação */}
                                        <div className="text-sm">
                                          <span className="font-medium text-gray-700">Código da Adequação:</span>
                                          <div className="mt-1">
                                            <span className="font-mono font-bold text-lg text-blue-600">
                                              {adequacaoReport.report_number 
                                                ? `REL-${adequacaoReport.report_number}` 
                                                : `REL-${adequacaoReport.id.replace(/-/g, '').slice(0, 8)}`
                                              }
                                            </span>
                                          </div>
                                        </div>
                                        
                                        {/* Número do relatório principal vinculado */}
                                        {adequacaoReport.parentReport && (
                                          <div className="text-sm">
                                            <span className="font-medium text-gray-700">Relatório Principal:</span>
                                            <div className="mt-1">
                                              <span className="font-mono font-bold text-lg text-green-600">
                                                {getParentReportCode(adequacaoReport)}
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Informações básicas */}
                                    <div className="space-y-2">
                                      <div><b>Título:</b> {adequacaoReport.title}</div>
                                      <div><b>FCA:</b> {adequacaoReport.description}</div>
                                      <div><b>Status:</b> {getStatusLabel(adequacaoReport.status)}</div>
                                      <div><b>Criado em:</b> {new Date(adequacaoReport.created_at).toLocaleString('pt-BR')}</div>
                                    </div>
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
                              onClick={() => handleOpenEditModal(report.id)}
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
                  <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center pt-4 border-t gap-2">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" className="min-w-[44px] min-h-[44px] w-full sm:w-auto" onClick={() => fetchActivities(report.id)}>
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

          <div className="text-xs text-gray-500 text-center mt-2">
            Mostrando {reports.length} de {totalReports} relatórios
          </div>
        </div>
      </main>

      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 py-4 bg-white border-t">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Itens por página:</span>
            <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {field.label || field.name}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            
                            {/* Campo de texto curto */}
                            {field.type === 'texto_curto' && (
                              <Input
                                value={editFormData[field.id || field.name] ?? ''}
                                onChange={e => handleEditFieldChange(field.id || field.name, e.target.value)}
                                placeholder={field.placeholder}
                                required={field.required}
                              />
                            )}
                            
                            {/* Campo de texto longo */}
                            {field.type === 'texto_longo' && (
                              <Textarea
                                value={editFormData[field.id || field.name] ?? ''}
                                onChange={e => handleEditFieldChange(field.id || field.name, e.target.value)}
                                placeholder={field.placeholder}
                                required={field.required}
                              />
                            )}
                            
                            {/* Campo de data */}
                            {field.type === 'data' && (
                              <Input
                                type="date"
                                value={editFormData[field.id || field.name] ?? ''}
                                onChange={e => handleEditFieldChange(field.id || field.name, e.target.value)}
                                required={field.required}
                              />
                            )}
                            
                            {/* Campo dropdown */}
                            {field.type === 'dropdown' && Array.isArray(field.options) && (
                              <Select
                                value={editFormData[field.id || field.name] ?? ''}
                                onValueChange={(value) => handleEditFieldChange(field.id || field.name, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma opção" />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options.map((option: string, i: number) => (
                                    <SelectItem key={i} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            
                            {/* Campo de radio */}
                            {field.type === 'radio' && Array.isArray(field.options) && (
                              <div className="flex flex-col gap-1">
                                {field.options.map((option: string, i: number) => (
                                  <label key={i} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={field.id || field.name}
                                      value={option}
                                      checked={editFormData[field.id || field.name] === option}
                                      onChange={() => handleEditFieldChange(field.id || field.name, option)}
                                      required={field.required}
                                    />
                                    {option}
                                  </label>
                                ))}
                              </div>
                            )}
                            
                            {/* Campo de checkbox */}
                            {field.type === 'checkbox' && Array.isArray(field.options) && (
                              <div className="flex flex-col gap-1">
                                {field.options.map((option: string, i: number) => (
                                  <label key={i} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      name={field.id || field.name}
                                      value={option}
                                      checked={Array.isArray(editFormData[field.id || field.name]) && 
                                               editFormData[field.id || field.name].includes(option)}
                                      onChange={e => {
                                        const prev = Array.isArray(editFormData[field.id || field.name]) 
                                          ? editFormData[field.id || field.name] 
                                          : [];
                                        if (e.target.checked) {
                                          handleEditFieldChange(field.id || field.name, [...prev, option]);
                                        } else {
                                          handleEditFieldChange(field.id || field.name, prev.filter((v: any) => v !== option));
                                        }
                                      }}
                                    />
                                    {option}
                                  </label>
                                ))}
                              </div>
                            )}
                            
                            {/* Fallback para campos não reconhecidos (incluindo upload) */}
                            {!['texto_curto', 'texto_longo', 'data', 'dropdown', 'radio', 'checkbox'].includes(field.type) && (
                              <Input
                                value={editFormData[field.id || field.name] ?? ''}
                                onChange={e => handleEditFieldChange(field.id || field.name, e.target.value)}
                                placeholder={field.placeholder}
                              />
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

