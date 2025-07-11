import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Database } from '@/integrations/supabase/types';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ReportFormModal from '@/components/reports/ReportFormModal';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ThumbnailImage, FullImage } from "@/components/ui/OptimizedImage";
import { usePagination } from "@/hooks/usePagination";
import { Button } from "@/components/ui/button";

// Remover interface Risk e lógica de riscos

const Preventivas = () => {
  const [photoDialog, setPhotoDialog] = useState<{ open: boolean; url: string | null }>({ open: false, url: null });
  const [reportModal, setReportModal] = useState<{ open: boolean; templateId: string | null; scheduleId: string | null }>({ open: false, templateId: null, scheduleId: null });
  const [userClassId, setUserClassId] = useState<string | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [finalizingReportId, setFinalizingReportId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pendente' | 'concluido' | 'cancelado'>('pendente');

  // Buscar user_class_id do usuário logado
  useEffect(() => {
    async function fetchUserClass() {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_class_id')
        .eq('id', user.user.id)
        .single();
      setUserClassId(profile?.user_class_id || null);
    }
    fetchUserClass();
  }, []);

  // Função para atualizar status para concluído
  async function setReportConcluido(reportId: string) {
    console.log('Chamando setReportConcluido para:', reportId);
    const { data, error, count } = await supabase
      .from('inspection_reports')
      .update({ status: 'concluido' })
      .eq('id', reportId)
      .select('*');
    console.log('Resultado do update:', data, error);
    if (error) {
      console.error('Erro ao atualizar status do inspection_report:', error);
    } else if (data && data.length === 0) {
      console.warn('Update não afetou nenhuma linha! Verifique RLS ou se o ID está correto.');
    } else {
      console.log('Status atualizado com sucesso!');
    }
    // Forçar refetch dos relatórios preventivos
    queryClient.invalidateQueries({ queryKey: ['assigned-inspection-reports'] });
  }

  // Buscar relatórios de vistoria preventiva direcionados ao técnico logado
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['assigned-inspection-reports'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) throw new Error('Usuário não logado');
      const { data, error } = await supabase
        .from('inspection_reports')
        .select('*')
        .eq('assigned_to', user.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const pendingReports = reports.filter((r: any) => r.status !== 'concluido' && r.status !== 'cancelado');
  const completedReports = reports.filter((r: any) => r.status === 'concluido');
  const canceledReports = reports.filter((r: any) => r.status === 'cancelado');

  const {
    visibleItems: paginatedPending,
    hasMore: hasMorePending,
    showMore: showMorePending,
    reset: resetPending
  } = usePagination(pendingReports, 10, 10);
  const {
    visibleItems: paginatedCompleted,
    hasMore: hasMoreCompleted,
    showMore: showMoreCompleted,
    reset: resetCompleted
  } = usePagination(completedReports, 10, 10);
  const {
    visibleItems: paginatedCanceled,
    hasMore: hasMoreCanceled,
    showMore: showMoreCanceled,
    reset: resetCanceled
  } = usePagination(canceledReports, 10, 10);

  const getRiskLevelColor = (level: string) => {
    if (level === 'alto') return 'bg-red-100 text-red-800';
    if (level === 'medio') return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enviado': return 'bg-blue-100 text-blue-800';
      case 'direcionado': return 'bg-yellow-100 text-yellow-800';
      case 'concluido': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-gray-200 text-gray-600';
      default: return 'bg-yellow-100 text-yellow-800'; // para 'pendente' e outros
    }
  };

  if (isLoading) {
    return <div className="p-6">Carregando relatórios...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Preventivas</h1>
        <p className="text-muted-foreground">
          Relatórios de vistoria preventiva direcionados para você
        </p>
      </div>
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'pendente' | 'concluido' | 'cancelado')} className="w-full mb-6">
        <TabsList className="w-full">
          <TabsTrigger value="pendente">Pendentes</TabsTrigger>
          <TabsTrigger value="concluido">Concluídos</TabsTrigger>
          <TabsTrigger value="cancelado">Cancelados</TabsTrigger>
        </TabsList>
        <TabsContent value="pendente">
          {pendingReports.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold mb-2">Nenhum relatório pendente</h3>
            <p className="text-muted-foreground">
                  Você não possui relatórios de vistoria preventiva pendentes no momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
              {paginatedPending.map((report: any) => (
                <Card key={report.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                        {report.risk_type} - {report.cable_number}
                  </CardTitle>
                      <div className="flex gap-2 items-center">
                        <Badge className={getRiskLevelColor(report.risk_level)}>
                          Grau: {report.risk_level}
                        </Badge>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status === 'concluido' ? 'Concluído' : 'Pendente'}
                  </Badge>
                      </div>
                </div>
                <CardDescription>
                      Direcionado em: {report.created_at ? format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Descrição</h4>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Endereço</h4>
                  <p className="text-sm text-muted-foreground">{report.address || '-'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                        <h4 className="font-semibold mb-1">Cidade</h4>
                        <p className="text-sm">{report.city || '-'}</p>
                  </div>
                  <div>
                        <h4 className="font-semibold mb-1">Bairro</h4>
                        <p className="text-sm">{report.neighborhood || '-'}</p>
                  </div>
                  <div>
                        <h4 className="font-semibold mb-1">Rede</h4>
                        <p className="text-sm">{report.network_type || '-'}</p>
                  </div>
                  <div>
                        <h4 className="font-semibold mb-1">Número do Cabo</h4>
                        <p className="text-sm">{report.cable_number || '-'}</p>
                  </div>
                </div>
                    {report.photos && report.photos.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Fotos</h4>
                    <div className="grid grid-cols-3 gap-2">
                          {report.photos.map((photo: string, index: number) => (
                        <ThumbnailImage
                          key={index} 
                          src={photo} 
                          alt={`Foto ${index + 1}`} 
                              className="w-full h-24 rounded border"
                              onClick={() => setPhotoDialog({ open: true, url: photo })}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end pt-4">
                      <button
                        className={
                          `px-4 py-2 rounded transition-colors ` +
                          (report.status === 'concluido' || loadingTemplate || !userClassId
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-primary text-white hover:bg-primary/90')
                        }
                        onClick={async () => {
                          if (!userClassId) return;
                          setLoadingTemplate(true);
                          setFinalizingReportId(report.id);
                          // Buscar template de relatório vinculado à classe do usuário
                          const { data: template } = await supabase
                            .from('report_templates')
                            .select('id')
                            .eq('user_class_id', userClassId)
                            .eq('is_active', true)
                            .single();
                          setLoadingTemplate(false);
                          if (template?.id) {
                            setReportModal({ open: true, templateId: template.id, scheduleId: report.schedule_id });
                          } else {
                            alert('Nenhum template de relatório vinculado à sua classe.');
                            setFinalizingReportId(null);
                          }
                        }}
                        disabled={loadingTemplate || !userClassId || report.status === 'concluido'}
                      >
                        Finalizar Preventiva
                      </button>
                </div>
              </CardContent>
            </Card>
          ))}
          {hasMorePending && (
            <div className="flex justify-center mt-4">
              <Button onClick={showMorePending} variant="outline">Ver mais</Button>
            </div>
          )}
          <div className="text-xs text-gray-500 text-center mt-2">
            Mostrando {paginatedPending.length} de {pendingReports.length} relatórios
          </div>
        </div>
      )}
        </TabsContent>
        <TabsContent value="concluido">
          {completedReports.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold mb-2">Nenhum relatório concluído</h3>
                <p className="text-muted-foreground">
                  Você não possui relatórios de vistoria preventiva concluídos no momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {paginatedCompleted.map((report: any) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {report.risk_type} - {report.cable_number}
                      </CardTitle>
                      <div className="flex gap-2 items-center">
                        <Badge className={getRiskLevelColor(report.risk_level)}>
                          Grau: {report.risk_level}
                        </Badge>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status === 'concluido' ? 'Concluído' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>
                      Direcionado em: {report.created_at ? format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Descrição</h4>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Endereço</h4>
                      <p className="text-sm text-muted-foreground">{report.address || '-'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-1">Cidade</h4>
                        <p className="text-sm">{report.city || '-'}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Bairro</h4>
                        <p className="text-sm">{report.neighborhood || '-'}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Rede</h4>
                        <p className="text-sm">{report.network_type || '-'}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Número do Cabo</h4>
                        <p className="text-sm">{report.cable_number || '-'}</p>
                      </div>
                    </div>
                    {report.photos && report.photos.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Fotos</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {report.photos.map((photo: string, index: number) => (
                            <ThumbnailImage
                              key={index}
                              src={photo}
                              alt={`Foto ${index + 1}`}
                              className="w-full h-24 rounded border"
                              onClick={() => setPhotoDialog({ open: true, url: photo })}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {hasMoreCompleted && (
                <div className="flex justify-center mt-4">
                  <Button onClick={showMoreCompleted} variant="outline">Ver mais</Button>
                </div>
              )}
              <div className="text-xs text-gray-500 text-center mt-2">
                Mostrando {paginatedCompleted.length} de {completedReports.length} relatórios
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="cancelado">
          {canceledReports.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                <h3 className="text-lg font-semibold mb-2">Nenhum relatório cancelado</h3>
                <p className="text-muted-foreground">
                  Você não possui relatórios de vistoria preventiva cancelados no momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {paginatedCanceled.map((report: any) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {report.risk_type} - {report.cable_number}
                      </CardTitle>
                      <div className="flex gap-2 items-center">
                        <Badge className={getStatusColor(report.status)}>
                          Cancelado
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>
                      Direcionado em: {report.created_at ? format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Descrição</h4>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Endereço</h4>
                      <p className="text-sm text-muted-foreground">{report.address || '-'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-1">Cidade</h4>
                        <p className="text-sm">{report.city || '-'}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Bairro</h4>
                        <p className="text-sm">{report.neighborhood || '-'}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Rede</h4>
                        <p className="text-sm">{report.network_type || '-'}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Número do Cabo</h4>
                        <p className="text-sm">{report.cable_number || '-'}</p>
                      </div>
                    </div>
                    {report.photos && report.photos.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Fotos</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {report.photos.map((photo: string, index: number) => (
                            <ThumbnailImage
                              key={index}
                              src={photo}
                              alt={`Foto ${index + 1}`}
                              className="w-full h-24 rounded border"
                              onClick={() => setPhotoDialog({ open: true, url: photo })}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {hasMoreCanceled && (
                <div className="flex justify-center mt-4">
                  <Button onClick={showMoreCanceled} variant="outline">Ver mais</Button>
                </div>
              )}
              <div className="text-xs text-gray-500 text-center mt-2">
                Mostrando {paginatedCanceled.length} de {canceledReports.length} relatórios
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      {/* Dialog para ampliar foto */}
      <Dialog open={photoDialog.open} onOpenChange={open => setPhotoDialog(s => ({ ...s, open }))}>
        <DialogContent className="flex flex-col items-center justify-center">
          {photoDialog.url && (
            <img src={photoDialog.url} alt="Foto ampliada" className="max-w-full max-h-[80vh] rounded shadow-lg" />
          )}
        </DialogContent>
      </Dialog>
      <ReportFormModal
        isOpen={reportModal.open}
        onClose={() => setReportModal({ open: false, templateId: null, scheduleId: null })}
        templateId={reportModal.templateId || ''}
        scheduleId={reportModal.scheduleId || null}
        onSuccess={async () => {
          console.log('onSuccess chamado, finalizingReportId:', finalizingReportId);
          if (finalizingReportId) {
            await setReportConcluido(finalizingReportId);
            setFinalizingReportId(null);
          }
        }}
      />
    </div>
  );
};

export default Preventivas;
