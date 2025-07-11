
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, FileText, CheckCircle, AlertTriangle, Clock, CheckSquare, User as UserIcon } from "lucide-react";
import InspectionReportModal from "@/components/preventive/InspectionReportModal";
import { useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ThumbnailImage, FullImage } from "@/components/ui/OptimizedImage";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { usePagination } from "@/hooks/usePagination";

interface ScheduleItem {
  id: string;
  cable_number: string;
  client_site: string;
  scheduled_month: number;
  scheduled_year: number;
  attachments: any[];
  observations: string | null;
  created_at: string;
  is_completed?: boolean;
  completed_at?: string;
}

interface InspectionRisk {
  id: string;
  risk_number: string | null;
  title: string;
  photos: string[];
  created_at: string;
}

const Vistoria = () => {
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [observations, setObservations] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [riskTabFilters, setRiskTabFilters] = useState({
    riskType: '',
    riskLevel: '',
    city: '',
    cableNumber: '',
    networkType: '',
    dateFrom: '',
    dateTo: ''
  });

  // Adicionar estados para modal de detalhes e imagem ampliada
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<string | null>(null);

  const TEMPLATE_ID = "4b45c601-e5b7-4a33-98f9-1769aad319e9";

  // Buscar todos os relatórios do técnico para o template de vistoria
  const { data: allReports = [] } = useQuery({
    queryKey: ['all-inspection-reports', TEMPLATE_ID],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não logado');
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('technician_id', user.user.id)
        .eq('template_id', TEMPLATE_ID);
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar programação do vistoriador logado
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['inspector-schedule'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não logado');

      const { data, error } = await supabase
        .from('preventive_schedule')
        .select('*')
        .eq('inspector_id', user.user.id)
        .order('scheduled_year', { ascending: false })
        .order('scheduled_month', { ascending: false });

      if (error) throw error;
      
      // Transform data to match ScheduleItem interface
      return (data || []).map(item => ({
        ...item,
        attachments: Array.isArray(item.attachments) ? item.attachments : [],
        is_completed: item.is_completed || false,
        completed_at: item.completed_at || null
      })) as ScheduleItem[];
    }
  });

  // Buscar riscos já enviados
  const { data: risks = [] } = useQuery({
    queryKey: ['inspection-risks'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não logado');

      const { data, error } = await supabase
        .from('risks')
        .select('id, risk_number, title, photos, created_at, status')
        .eq('reported_by', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(risk => ({
        ...risk,
        photos: Array.isArray(risk.photos) 
          ? (risk.photos as any[]).filter(photo => typeof photo === 'string') as string[]
          : []
      })) as InspectionRisk[];
    }
  });

  // Adicionar busca dos relatórios de vistoria preventiva (inspection_reports)
  const { data: preventiveReports = [] } = useQuery({
    queryKey: ['my-preventive-inspection-reports'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) throw new Error('Usuário não logado');
      const { data, error } = await supabase
        .from('inspection_reports')
        .select(`*, technician:profiles!technician_id(name)`)
        .eq('technician_id', user.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Filtros para a aba Riscos (vistoria preventiva)
  const filteredPreventiveReports = useMemo(() => {
    return preventiveReports.filter((report: any) => {
      const riskTypeMatch = riskTabFilters.riskType === '' || (report.risk_type && report.risk_type === riskTabFilters.riskType);
      const riskLevelMatch = riskTabFilters.riskLevel === '' || (report.risk_level && report.risk_level === riskTabFilters.riskLevel);
      const cityMatch = riskTabFilters.city === '' || (report.city && report.city === riskTabFilters.city);
      const cableNumberMatch = riskTabFilters.cableNumber === '' || (report.cable_number && report.cable_number.toLowerCase().includes(riskTabFilters.cableNumber.toLowerCase()));
      const networkTypeMatch = riskTabFilters.networkType === '' || (report.network_type && report.network_type === riskTabFilters.networkType);
      const dateFromMatch = riskTabFilters.dateFrom === '' || (report.created_at && report.created_at >= riskTabFilters.dateFrom);
      const dateToMatch = riskTabFilters.dateTo === '' || (report.created_at && report.created_at <= riskTabFilters.dateTo + 'T23:59:59');
      return riskTypeMatch && riskLevelMatch && cityMatch && cableNumberMatch && networkTypeMatch && dateFromMatch && dateToMatch;
    });
  }, [preventiveReports, riskTabFilters]);

  // Numeração sequencial global dos relatórios preventivos
  const preventiveReportSequenceMap = useMemo(() => {
    const sorted = [...preventiveReports].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const map: Record<string, number> = {};
    sorted.forEach((report, idx) => {
      map[report.id] = idx + 1;
    });
    return map;
  }, [preventiveReports]);

  // Atualizar observações
  const updateObservationsMutation = useMutation({
    mutationFn: async ({ scheduleId, obs }: { scheduleId: string; obs: string }) => {
      const { error } = await supabase
        .from('preventive_schedule')
        .update({ observations: obs })
        .eq('id', scheduleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Observações salvas",
        description: "As observações foram atualizadas com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['inspector-schedule'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar observações",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Marcar vistoria como concluída
  const completeInspectionMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const { error } = await supabase
        .from('preventive_schedule')
        .update({ 
          is_completed: true, 
          completed_at: new Date().toISOString() 
        })
        .eq('id', scheduleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Vistoria concluída",
        description: "A vistoria foi marcada como concluída com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['inspector-schedule'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao concluir vistoria",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSaveObservations = (scheduleId: string) => {
    const obs = observations[scheduleId] || '';
    updateObservationsMutation.mutate({ scheduleId, obs });
  };

  const handleCompleteInspection = (scheduleId: string) => {
    completeInspectionMutation.mutate(scheduleId);
  };

  const handleDownloadAttachment = (attachment: any) => {
    // Implementar download do anexo
    if (attachment.url) {
      window.open(attachment.url, '_blank');
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1] || month.toString();
  };

  // Novo: contagem de relatórios enviados por vistoria usando inspection_reports
  const reportsCount = useMemo(() => {
    const counts: Record<string, number> = {};
    preventiveReports.forEach((report: any) => {
      if (report.schedule_id) {
        counts[report.schedule_id] = (counts[report.schedule_id] || 0) + 1;
      }
    });
    return counts;
  }, [preventiveReports]);

  const canCompleteInspection = (scheduleId: string) => {
    return (reportsCount[scheduleId] || 0) >= 1;
  };

  // Funções utilitárias para exibir status com cor e label corretos
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-orange-100 text-orange-800';
      case 'concluido': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-gray-200 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'concluido': return 'Concluído';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  // Separar vistorias pendentes e concluídas
  const pendingSchedules = schedules.filter(schedule => !schedule.is_completed);
  const completedSchedules = schedules.filter(schedule => schedule.is_completed);

  // Remover filteredRiskReports e reportSequenceMap antigos se não forem mais usados

  // Hooks de paginação devem ser chamados antes de qualquer return condicional
  const {
    visibleItems: paginatedPending,
    hasMore: hasMorePending,
    showMore: showMorePending,
    reset: resetPending
  } = usePagination(pendingSchedules || [], 10, 10);
  const {
    visibleItems: paginatedCompleted,
    hasMore: hasMoreCompleted,
    showMore: showMoreCompleted,
    reset: resetCompleted
  } = usePagination(completedSchedules || [], 10, 10);
  const {
    visibleItems: paginatedRisks,
    hasMore: hasMoreRisks,
    showMore: showMoreRisks,
    reset: resetRisks
  } = usePagination(filteredPreventiveReports || [], 10, 10);

  if (isLoading) {
    return <div className="p-6">Carregando programação...</div>;
  }

  const renderScheduleCard = (schedule: ScheduleItem, isCompleted: boolean = false) => {
    const reportsForSchedule = preventiveReports.filter((r: any) => r.schedule_id && r.schedule_id === schedule.id);
    const relatoriosEnviados = reportsForSchedule.length;
    const podeConcluir = relatoriosEnviados >= 1;

  return (
      <Card key={schedule.id} className="shadow border">
        <CardContent className="p-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <div className="font-bold text-lg">{schedule.cable_number}</div>
                <div className="text-sm text-muted-foreground">Cabo</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="bg-green-100 text-green-800 rounded px-2 py-0.5 text-xs font-medium flex items-center">
                  <UserIcon className="w-4 h-4 mr-1" />
                  {schedule.client_site}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">
                  {format(new Date(schedule.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </span>
              <Badge variant={isCompleted ? "default" : "secondary"} className="ml-2">
                {isCompleted ? "Concluída" : "Pendente"}
              </Badge>
            </div>
      </div>

                  {schedule.attachments && schedule.attachments.length > 0 && (
  <div className="flex flex-col gap-2">
    {schedule.attachments.map((att, idx) => (
      <Button
        key={att.url || idx}
        variant="outline"
        size="sm"
        className="w-full flex items-center justify-center gap-2"
        onClick={() => handleDownloadAttachment(att)}
      >
        <Download className="w-4 h-4" />
        Baixar Anexo {schedule.attachments.length > 1 ? `(${att.name || `anexo ${idx + 1}`})` : (att.name || "anexo")}
      </Button>
    ))}
  </div>
)}

                  <div>
                    <Label htmlFor={`obs-${schedule.id}`}>Observações</Label>
                    <Textarea
                      id={`obs-${schedule.id}`}
                      value={observations[schedule.id] || schedule.observations || ''}
                      onChange={(e) => setObservations(prev => ({
                        ...prev,
                        [schedule.id]: e.target.value
                      }))}
                      placeholder="Adicione suas observações sobre esta inspeção..."
              disabled={isCompleted}
                    />
            {!isCompleted && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleSaveObservations(schedule.id)}
                      disabled={updateObservationsMutation.isPending}
                    >
                      Salvar Observações
                    </Button>
            )}
                  </div>

          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">
              {relatoriosEnviados} relatório(s) enviado(s)
            </Badge>
          </div>
          {/* Lista de relatórios enviados */}
          {reportsForSchedule.length > 0 && (
            <div className="mt-2">
              <div className="font-semibold text-sm mb-1">Relatórios enviados:</div>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {reportsForSchedule.map((report: any) => (
                  <li key={report.id}>
                    {report.title || 'Relatório'} - {report.created_at ? new Date(report.created_at).toLocaleString('pt-BR') : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {!isCompleted && (
              <>
                    <Button
                  className="w-full flex items-center justify-center gap-2"
                      onClick={() => {
                        setSelectedSchedule(schedule);
                        setReportModalOpen(true);
                      }}
                    >
                  <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                  Enviar Formulário de Risco
                    </Button>
                <AlertDialog open={confirmDialogOpen === schedule.id} onOpenChange={open => setConfirmDialogOpen(open ? schedule.id : null)}>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="w-full flex items-center justify-center gap-2"
                      variant="outline"
                      disabled={!podeConcluir || completeInspectionMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Concluir Vistoria
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Concluir Vistoria</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja concluir esta vistoria? Esta ação não poderá ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          handleCompleteInspection(schedule.id);
                          setConfirmDialogOpen(null);
                        }}
                      >
                        Sim, concluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                {!podeConcluir && (
                  <div className="text-xs text-muted-foreground text-center">
                    É necessário registrar pelo menos um relatório para concluir a vistoria
                  </div>
                )}
              </>
            )}
            {isCompleted && (
              <div className="text-xs text-green-700 text-center">
                Concluída em: {schedule.completed_at ? format(new Date(schedule.completed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : ''}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Vistoria</h1>
        <p className="text-muted-foreground">
          Sua programação de inspeções preventivas
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Vistorias Pendentes ({pendingSchedules.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Vistorias Concluídas ({completedSchedules.length})
          </TabsTrigger>
          <TabsTrigger value="risks" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Riscos ({preventiveReports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {paginatedPending.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma vistoria pendente</h3>
                <p className="text-muted-foreground">
                  Você não possui vistorias pendentes no momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {paginatedPending.map(schedule => renderScheduleCard(schedule, false))}
              {hasMorePending && (
                <div className="flex justify-center mt-4">
                  <Button onClick={showMorePending} variant="outline">Ver mais</Button>
                </div>
              )}
              <div className="text-xs text-gray-500 text-center mt-2">
                Mostrando {paginatedPending.length} de {pendingSchedules.length} vistorias
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="completed">
          {paginatedCompleted.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckSquare className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma vistoria concluída</h3>
                <p className="text-muted-foreground">
                  Você não possui vistorias concluídas no momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {paginatedCompleted.map(schedule => renderScheduleCard(schedule, true))}
              {hasMoreCompleted && (
                <div className="flex justify-center mt-4">
                  <Button onClick={showMoreCompleted} variant="outline">Ver mais</Button>
                </div>
              )}
              <div className="text-xs text-gray-500 text-center mt-2">
                Mostrando {paginatedCompleted.length} de {completedSchedules.length} vistorias
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="risks">
          {paginatedRisks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                <h3 className="text-lg font-semibold mb-2">Nenhum relatório encontrado</h3>
                <p className="text-muted-foreground">
                  Nenhum relatório de vistoria preventiva enviado encontrado com os filtros atuais.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {paginatedRisks.map((report: any) => (
                <Card key={report.id}>
                    <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-4">
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          Nº: <span className="text-primary font-mono">{preventiveReportSequenceMap[report.id]}</span>
                          {report.risk_type || 'Relatório de Vistoria Preventiva'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="mr-2">Cabo: {report.cable_number || '-'}</span>
                          <span className="mr-2">Cidade: {report.city || '-'}</span>
                          <span>Data: {report.created_at ? new Date(report.created_at).toLocaleDateString('pt-BR') : '-'}</span>
                        </div>
                      </div>
                      <div>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedReport(report); setShowDetailsDialog(true); }}>
                          Ver Detalhes
                        </Button>
                      </div>
                  </CardContent>
                </Card>
              ))}
              {hasMoreRisks && (
                <div className="flex justify-center mt-4">
                  <Button onClick={showMoreRisks} variant="outline">Ver mais</Button>
                </div>
              )}
              <div className="text-xs text-gray-500 text-center mt-2">
                Mostrando {paginatedRisks.length} de {filteredPreventiveReports.length} relatórios
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <InspectionReportModal
        isOpen={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setSelectedSchedule(null);
        }}
        schedule={selectedSchedule}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['inspection-reports-count'] });
        }}
      />
      {/* Dialog de detalhes do relatório preventivo */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Relatório de Vistoria</DialogTitle>
          </DialogHeader>
          {selectedReport ? (
            <div className="space-y-2">
              <div><b>Nº:</b> {preventiveReportSequenceMap[selectedReport.id]}</div>
              <div><b>Status:</b> <span className={`inline-block align-middle px-2 py-0.5 rounded ${getStatusColor(selectedReport.status)}`}>{getStatusLabel(selectedReport.status)}</span></div>
              <div><b>Técnico:</b> {selectedReport.technician?.name || '-'}</div>
              <div><b>Data:</b> {selectedReport.created_at ? new Date(selectedReport.created_at).toLocaleDateString('pt-BR') : '-'}</div>
              <div><b>Tipo de Risco:</b> {selectedReport.risk_type || '-'}</div>
              <div><b>Grau de Risco:</b> {selectedReport.risk_level || '-'}</div>
              <div><b>Cidade:</b> {selectedReport.city || '-'}</div>
              <div><b>Bairro:</b> {selectedReport.neighborhood || '-'}</div>
              <div><b>Endereço:</b> {selectedReport.address || '-'}</div>
              <div><b>Número do Cabo:</b> {selectedReport.cable_number || '-'}</div>
              <div><b>Rede:</b> {selectedReport.network_type || '-'}</div>
              <div><b>Descrição:</b> {selectedReport.description || '-'}</div>
              <div><b>Fotos:</b></div>
              <div className="flex flex-wrap gap-2">
                {selectedReport.photos && selectedReport.photos.length > 0 ? (
                  selectedReport.photos.map((url: string, idx: number) => (
                    <ThumbnailImage
                      key={idx}
                      src={url}
                      alt={`Foto ${idx + 1}`}
                      className="w-32 h-32 rounded border"
                      onClick={() => setZoomedImage(url)}
                    />
                  ))
                ) : (
                  <span className="text-muted-foreground">Nenhuma foto enviada.</span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Nenhum relatório selecionado.</div>
          )}
        </DialogContent>
      </Dialog>
      {/* Dialog de imagem ampliada */}
      <Dialog open={!!zoomedImage} onOpenChange={open => !open && setZoomedImage(null)}>
        <DialogContent className="max-w-3xl flex flex-col items-center">
          {zoomedImage ? (
            <FullImage
              src={zoomedImage}
              alt="Foto ampliada"
              className="max-h-[70vh] w-auto rounded shadow"
            />
          ) : (
            <div className="text-gray-500">Nenhuma imagem selecionada.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vistoria;
