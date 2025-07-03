
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import InspectionReportModal from "@/components/preventive/InspectionReportModal";

interface ScheduleItem {
  id: string;
  cable_number: string;
  client_site: string;
  scheduled_month: number;
  scheduled_year: number;
  attachments: any[];
  observations: string | null;
  created_at: string;
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      return data || [];
    }
  });

  // Buscar relatórios enviados para cada vistoria
  const { data: reportsCount = {} } = useQuery({
    queryKey: ['inspection-reports-count'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não logado');

      const { data, error } = await supabase
        .from('reports')
        .select('id, service_order_id')
        .eq('technician_id', user.user.id);

      if (error) throw error;
      
      // Contar relatórios por vistoria (usando service_order_id como referência da vistoria)
      const counts: Record<string, number> = {};
      data?.forEach(report => {
        if (report.service_order_id) {
          counts[report.service_order_id] = (counts[report.service_order_id] || 0) + 1;
        }
      });
      
      return counts;
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
        .select('id, risk_number, title, photos, created_at')
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

  const handleSaveObservations = (scheduleId: string) => {
    const obs = observations[scheduleId] || '';
    updateObservationsMutation.mutate({ scheduleId, obs });
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

  const canCompleteInspection = (scheduleId: string) => {
    return (reportsCount[scheduleId] || 0) >= 1;
  };

  if (isLoading) {
    return <div className="p-6">Carregando programação...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Vistoria</h1>
        <p className="text-muted-foreground">
          Sua programação de inspeções preventivas
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Programação */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Programação</h2>
          
          {schedules.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma programação</h3>
                <p className="text-muted-foreground">
                  Você não possui inspeções programadas no momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            schedules.map((schedule) => (
              <Card key={schedule.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{schedule.cable_number}</span>
                    <Badge variant={canCompleteInspection(schedule.id) ? "default" : "secondary"}>
                      {reportsCount[schedule.id] || 0} relatório(s)
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {schedule.client_site} - {getMonthName(schedule.scheduled_month)}/{schedule.scheduled_year}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Anexos */}
                  {schedule.attachments && schedule.attachments.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Anexos</Label>
                      <div className="flex gap-2 mt-1">
                        {schedule.attachments.map((attachment, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadAttachment(attachment)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Anexo {index + 1}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Observações */}
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
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleSaveObservations(schedule.id)}
                      disabled={updateObservationsMutation.isPending}
                    >
                      Salvar Observações
                    </Button>
                  </div>

                  {/* Botões de ação */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedSchedule(schedule);
                        setReportModalOpen(true);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Enviar Relatório
                    </Button>
                    
                    {canCompleteInspection(schedule.id) && (
                      <Button variant="outline">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Concluir Vistoria
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Riscos Enviados */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Riscos Enviados</h2>
          
          {risks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                <h3 className="text-lg font-semibold mb-2">Nenhum risco enviado</h3>
                <p className="text-muted-foreground">
                  Você ainda não enviou nenhum relatório de risco.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {risks.map((risk) => (
                <Card key={risk.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{risk.risk_number}</h4>
                        <p className="text-sm text-muted-foreground">{risk.title}</p>
                      </div>
                      <Badge variant="outline">
                        ID: {risk.id.slice(0, 8)}
                      </Badge>
                    </div>
                    
                    {risk.photos && risk.photos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {risk.photos.slice(0, 3).map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-16 object-cover rounded border"
                          />
                        ))}
                        {risk.photos.length > 3 && (
                          <div className="w-full h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-muted-foreground">
                            +{risk.photos.length - 3} fotos
                          </div>
                        )}
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      Enviado em: {format(new Date(risk.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
};

export default Vistoria;
