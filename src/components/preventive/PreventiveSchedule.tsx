import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, Edit, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import * as XLSX from 'xlsx';
import { RequireAuth } from '@/components/RequireAuth';
import { compressImage } from '@/lib/imageOptimization';
import { exportToCSV } from "@/utils/csvExport";
import { usePagination } from "@/hooks/usePagination";

const scheduleSchema = z.object({
  cable_number: z.string().min(1, "Número do cabo é obrigatório"),
  client_site: z.string().min(1, "Cliente/Site é obrigatório"),
  scheduled_month: z.number().min(1).max(12),
  scheduled_year: z.number().min(2020),
  inspector_id: z.string().min(1, "Vistoriador é obrigatório"),
  observations: z.string().optional(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

interface PreventiveScheduleItem {
  id: string;
  cable_number: string;
  client_site: string;
  scheduled_month: number;
  scheduled_year: number;
  inspector_id: string;
  observations: string | null;
  created_at: string;
  inspector: {
    name: string;
  } | null;
  attachments?: { name: string; url: string; size: number; type: string; }[] | string | null;
  is_completed: boolean;
}

// ScheduleFormData precisa aceitar attachments para o insert funcionar
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ScheduleFormDataWithAttachments extends ScheduleFormData {
  attachments?: any;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 2; // Máximo 2 arquivos
const STORAGE_BUCKET = 'preventive-attachments';

const PreventiveSchedule = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PreventiveScheduleItem | null>(null);
  const [filters, setFilters] = useState({
    cableNumber: '',
    clientSite: '',
    inspector: '',
    month: '',
    year: '',
    dateFrom: '',
    dateTo: '',
    status: 'all', // novo filtro
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      cable_number: '',
      client_site: '',
      scheduled_month: new Date().getMonth() + 1,
      scheduled_year: new Date().getFullYear(),
      inspector_id: '',
      observations: '',
    }
  });

  // Preencher anexos ao editar
  useEffect(() => {
    if (editingItem) {
      let atts = editingItem.attachments;
      if (typeof atts === 'string') {
        try { atts = JSON.parse(atts); } catch { atts = []; }
      }
      if (!Array.isArray(atts)) atts = [];
      setAttachments(atts);
    } else {
      setAttachments([]);
    }
  }, [editingItem]);

  // Buscar cronograma
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['preventive-schedule'],
    queryFn: async () => {
      let query = supabase
        .from('preventive_schedule')
        .select(`
          *,
          inspector:profiles!inspector_id(name)
        `)
        .order('scheduled_year', { ascending: false })
        .order('scheduled_month', { ascending: false });
      // (Opcional: filtros pesados, como datas)
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Filtro local igual ao RisksManagement
  const filteredSchedules = useMemo(() => {
    return schedules.filter(item => {
      const cableNumberMatch = !filters.cableNumber || (item.cable_number && item.cable_number.toLowerCase().includes(filters.cableNumber.toLowerCase()));
      const clientSiteMatch = !filters.clientSite || (item.client_site && item.client_site.toLowerCase().includes(filters.clientSite.toLowerCase()));
      const monthMatch = !filters.month || item.scheduled_month === parseInt(filters.month);
      const yearMatch = !filters.year || item.scheduled_year === parseInt(filters.year);
      const statusMatch = filters.status === 'all' ||
        (filters.status === 'concluido' && item.is_completed) ||
        (filters.status === 'pendente' && !item.is_completed);
      const dateFromMatch = !filters.dateFrom || (item.created_at && item.created_at >= filters.dateFrom);
      const dateToMatch = !filters.dateTo || (item.created_at && item.created_at <= filters.dateTo + 'T23:59:59');
      return cableNumberMatch && clientSiteMatch && monthMatch && yearMatch && statusMatch && dateFromMatch && dateToMatch;
    });
  }, [schedules, filters]);

  // Buscar inspetores
  const { data: inspectors = [] } = useQuery({
    queryKey: ['inspectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('is_active', true)
        .eq('access_profile_id', '38a5d358-75d6-4ae6-a109-1456a7dba714')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar e contar relatórios enviados por vistoria (inspection_reports)
  const { data: inspectionReports = [] } = useQuery({
    queryKey: ['all-inspection-reports-for-schedule'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inspection_reports')
        .select('id, schedule_id')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Mapear quantidade de relatórios por schedule_id
  const reportsCountBySchedule = useMemo(() => {
    const counts: Record<string, number> = {};
    inspectionReports.forEach((report: any) => {
      if (report.schedule_id) {
        counts[report.schedule_id] = (counts[report.schedule_id] || 0) + 1;
      }
    });
    return counts;
  }, [inspectionReports]);

  // Use filteredSchedules no lugar de schedules para paginação
  const {
    visibleItems: paginatedSchedules,
    hasMore: hasMoreSchedules,
    showMore: showMoreSchedules,
    reset: resetSchedules
  } = usePagination(filteredSchedules, 10, 10);

  // Criar/Editar cronograma
  const mutation = useMutation({
    mutationFn: async (data: ScheduleFormDataWithAttachments) => {
      console.log('mutationFn chamada com:', data);
      if (editingItem) {
        const { error } = await supabase
          .from('preventive_schedule')
          .update({
            cable_number: data.cable_number,
            client_site: data.client_site,
            scheduled_month: data.scheduled_month,
            scheduled_year: data.scheduled_year,
            inspector_id: data.inspector_id,
            observations: data.observations || null,
            attachments: (data as any).attachments || null
          })
          .eq('id', editingItem.id);
        if (error) {
          console.error('Erro no update:', error);
          throw error;
        }
      } else {
        const { data: user } = await supabase.auth.getUser();
        console.log('Usuário retornado pelo supabase.auth.getUser():', user);
        if (!user?.user?.id) {
          toast({
            title: "Erro",
            description: "Usuário não autenticado.",
            variant: "destructive",
          });
          return;
        }
        // Logar dados do insert
        const insertPayload = {
            cable_number: data.cable_number,
            client_site: data.client_site,
            scheduled_month: data.scheduled_month,
            scheduled_year: data.scheduled_year,
            inspector_id: data.inspector_id,
            observations: data.observations || null,
          attachments: (data as any).attachments || null,
          created_by: user.user.id
        };
        console.log('Payload do insert:', insertPayload);
        const { error } = await supabase
          .from('preventive_schedule')
          .insert(insertPayload);
        if (error) {
          console.error('Erro no insert:', error);
          throw error;
        }
      }
    },
    onSuccess: () => {
      toast({
        title: editingItem ? "Cronograma atualizado" : "Cronograma criado",
        description: "Operação realizada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['preventive-schedule'] });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
      setAttachments([]); // Limpar anexos após salvar
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      console.error('Erro na mutation:', error);
    }
  });

  // Excluir cronograma
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('preventive_schedule')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Cronograma excluído",
        description: "Item removido com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['preventive-schedule'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  const getMonthName = (month: number) => {
    return months.find(m => m.value === month)?.label || month.toString();
  };

  // Use filteredSchedules no exportToExcel e handleExportCsv
  const exportToExcel = () => {
    const exportData = filteredSchedules.map(schedule => ({
      'Nº Cabo': schedule.cable_number,
      'Cliente/Site': schedule.client_site,
      'Mês': getMonthName(schedule.scheduled_month),
      'Ano': schedule.scheduled_year,
      'Vistoriador': schedule.inspector?.name || '',
      'Observações': schedule.observations || '',
      'Data Criação': format(new Date(schedule.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cronograma Preventiva');
    XLSX.writeFile(wb, `cronograma_preventiva_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const handleEdit = (item: PreventiveScheduleItem) => {
    setEditingItem(item);
    form.reset({
      cable_number: item.cable_number,
      client_site: item.client_site,
      scheduled_month: item.scheduled_month,
      scheduled_year: item.scheduled_year,
      inspector_id: item.inspector_id,
      observations: item.observations || '',
      // NÃO passar attachments aqui
    });
    let atts = item.attachments;
    if (typeof atts === 'string') {
      try { atts = JSON.parse(atts); } catch { atts = []; }
    }
    if (!Array.isArray(atts)) atts = [];
    setAttachments(atts);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = async (data: ScheduleFormDataWithAttachments) => {
    setUploadError(null);
    let uploadedAttachments = attachments;
    // Se houver arquivos novos para upload
    if (fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files.length > 0) {
      setUploading(true);
      try {
        const files = Array.from(fileInputRef.current.files);
        
        // Validar número máximo de arquivos
        if (files.length > MAX_FILES) {
          throw new Error(`Máximo de ${MAX_FILES} arquivos permitidos.`);
        }
        
        // Validar se o total de arquivos não excede o limite
        if (attachments.length + files.length > MAX_FILES) {
          throw new Error(`Máximo de ${MAX_FILES} arquivos permitidos. Você já tem ${attachments.length} arquivo(s) anexado(s).`);
        }
        
        // Validar tamanho dos arquivos
        for (const file of files) {
          if (file.size > MAX_FILE_SIZE) {
            throw new Error(`Arquivo ${file.name} excede 10MB.`);
          }
        }
        
        const newAttachments = [];
        for (const file of files) {
          let uploadFile = file;
          let filePath = `${Date.now()}_${file.name}`;
          // Só comprime se for imagem
          if (file.type.startsWith('image/')) {
            try {
              const optimized = await compressImage(file, { format: 'jpeg', quality: 0.8, maxWidth: 1920, maxHeight: 1080 });
              uploadFile = optimized.file;
              filePath = `${Date.now()}_${file.name.replace(/\.[^.]+$/, '.jpg')}`;
            } catch (err) {
              console.error('Erro ao comprimir imagem:', err);
              setUploadError('Falha ao comprimir imagem');
              setUploading(false);
              return;
            }
          }
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, uploadFile, { upsert: false });
          if (uploadError) throw uploadError;
          const { data: publicUrl } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
          newAttachments.push({
            name: uploadFile.name,
            url: publicUrl.publicUrl,
            size: uploadFile.size,
            type: uploadFile.type
          });
        }
        uploadedAttachments = [...attachments, ...newAttachments];
      } catch (err: any) {
        setUploadError(err.message || 'Erro ao fazer upload.');
        setUploading(false);
        console.error('Erro no upload:', err);
        return;
      }
      setUploading(false);
    }
    // Logar payload antes do insert
    console.log('Payload enviado para mutation:', { ...data, attachments: uploadedAttachments });
    // Chamar mutação com attachments (não passar para o form)
    mutation.mutate({ ...data, attachments: uploadedAttachments });
  };

  // Função para exportar CSV dos cronogramas filtrados
  function handleExportCsv() {
    const { dateFrom, dateTo } = filters;
    if (!dateFrom || !dateTo) {
      toast({ title: "Selecione as duas datas.", variant: "destructive" });
      return;
    }
    const start = new Date(dateFrom);
    const end = new Date(dateTo);
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
    // Filtrar os cronogramas conforme os filtros atuais da tela
    const filteredForExport = filteredSchedules.filter((item) => {
      const dateFromMatch = !filters.dateFrom || (item.created_at && item.created_at >= filters.dateFrom);
      const dateToMatch = !filters.dateTo || (item.created_at && item.created_at <= filters.dateTo + 'T23:59:59');
      return dateFromMatch && dateToMatch;
    });
    if (!filteredForExport || filteredForExport.length === 0) {
      toast({ title: "Nenhum cronograma encontrado no período selecionado.", variant: "destructive" });
      return;
    }
    // Mapeia para substituir o inspector_id pelo nome do vistoriador e converte objetos/arrays para string JSON
    const exportData = filteredForExport.map((item) => {
      const { inspector_id, inspector, ...rest } = item;
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
        inspector_nome: inspector?.name || ""
      };
    });
    exportToCSV(exportData, `cronogramas_${dateFrom}_a_${dateTo}`);
  }

  if (isLoading) {
    return <div>Carregando cronograma...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <Label htmlFor="cableNumber">Nº do Cabo</Label>
          <Input
            id="cableNumber"
            placeholder="Buscar por cabo"
            value={filters.cableNumber}
            onChange={(e) => setFilters(prev => ({ ...prev, cableNumber: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="clientSite">Cliente/Site</Label>
          <Input
            id="clientSite"
            placeholder="Buscar por cliente/site"
            value={filters.clientSite}
            onChange={(e) => setFilters(prev => ({ ...prev, clientSite: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="month">Mês</Label>
          <Select value={filters.month} onValueChange={(value) => setFilters(prev => ({ ...prev, month: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os meses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="year">Ano</Label>
          <Input
            id="year"
            type="number"
            placeholder="Ex: 2024"
            value={filters.year}
            onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={filters.status} onValueChange={value => setFilters(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="dateFrom">Data Início</Label>
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom}
            onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="dateTo">Data Fim</Label>
          <Input
            id="dateTo"
            type="date"
            value={filters.dateTo}
            onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
          />
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingItem(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cronograma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Cronograma' : 'Adicionar Cronograma'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="cable_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº do Cabo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: CABO-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="client_site"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente/Site</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Cliente A - Site Principal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="scheduled_month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mês</FormLabel>
                        <Select value={field.value.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {months.map((month) => (
                              <SelectItem key={month.value} value={month.value.toString()}>
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduled_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="2020" 
                            max="2050" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="inspector_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vistoriador</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um vistoriador" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {inspectors.map((inspector) => (
                            <SelectItem key={inspector.id} value={inspector.id}>
                              {inspector.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observações sobre a inspeção..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo de upload fora do react-hook-form */}
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Anexos (opcional, máximo 2 arquivos, 10MB cada)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80"
                    accept="*"
                  />
                  {uploadError && <div className="text-red-500 text-xs mt-1">{uploadError}</div>}
                  {attachments.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs">
                      {attachments.map((att, idx) => (
                        <li key={idx}>
                          <a href={att.url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">{att.name}</a> ({(att.size/1024/1024).toFixed(2)} MB)
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={mutation.isPending || uploading}>
                    {mutation.isPending || uploading ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Button onClick={handleExportCsv} variant="default">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Nº do Cabo</TableHead>
              <TableHead>Cliente/Site</TableHead>
              <TableHead>Mês</TableHead>
              <TableHead>Ano</TableHead>
              <TableHead>Vistoriador</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Relatórios Enviados</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSchedules.map((schedule) => (
              <TableRow key={schedule.id}>
                <TableCell>{schedule.cable_number}</TableCell>
                <TableCell>{schedule.client_site}</TableCell>
                <TableCell>{getMonthName(schedule.scheduled_month)}</TableCell>
                <TableCell>{schedule.scheduled_year}</TableCell>
                <TableCell>{schedule.inspector?.name || '-'}</TableCell>
                <TableCell>
                  {schedule.is_completed ? (
                    <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs">Concluída</span>
                  ) : (
                    <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs">Pendente</span>
                  )}
                </TableCell>
                <TableCell>
                  {reportsCountBySchedule[schedule.id] || 0}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(schedule as PreventiveScheduleItem)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(schedule.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {hasMoreSchedules && (
          <div className="flex justify-center mt-4">
            <Button onClick={showMoreSchedules} variant="outline">Ver mais</Button>
          </div>
        )}
        <div className="text-xs text-gray-500 text-center mt-2">
          Mostrando {paginatedSchedules.length} de {schedules.length} cronogramas
        </div>
      </div>
    </div>
  );
};

export default PreventiveSchedule;
