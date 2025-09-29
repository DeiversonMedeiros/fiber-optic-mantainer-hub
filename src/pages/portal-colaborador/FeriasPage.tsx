import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { VacationNotificationWidget } from '@/components/vacation/VacationNotificationWidget';
import { VacationStatusCard } from '@/components/vacation/VacationStatusCard';
import { FractionedVacationFormComponent } from '@/components/rh/FractionedVacationForm';
import { FractionedVacationForm } from '@/integrations/supabase/rh-types';

const FeriasPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Buscar férias do colaborador
  const { data: ferias, isLoading } = useQuery({
    queryKey: ['ferias', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await rhSupabase
        .from('rh.vacations')
        .select('*')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Mutation para criar nova solicitação de férias
  const createVacationMutation = useMutation({
    mutationFn: async (data: FractionedVacationForm) => {
      if (data.tipoFracionamento === 'fracionado') {
        // Usar função de férias fracionadas
        const periodosData = data.periodos.map(p => ({
          data_inicio: p.dataInicio,
          data_fim: p.dataFim,
          dias_ferias: p.diasFerias,
          dias_abono: p.diasAbono,
          observacoes: p.observacoes
        }));

        const { data: vacationId, error } = await rhSupabase
          .rpc('criar_ferias_fracionadas', {
            p_company_id: user?.id,
            p_employee_id: user?.id,
            p_ano: data.ano,
            p_periodos: JSON.stringify(periodosData),
            p_observacoes: data.observacoes
          });

        if (error) throw error;
        return vacationId;
      } else {
        // Férias integrais - usar método tradicional
        const { error } = await rhSupabase
          .from('rh.vacations')
          .insert([{
            company_id: user?.id,
            employee_id: user?.id,
            ano: data.ano,
            periodo: 'Férias Integrais',
            data_inicio: data.periodos[0].dataInicio,
            data_fim: data.periodos[0].dataFim,
            dias_ferias: data.periodos[0].diasFerias,
            dias_abono: data.periodos[0].diasAbono,
            tipo_fracionamento: 'integral',
            total_periodos: 1,
            observacoes: data.observacoes,
            status: 'solicitado'
          }]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada!",
        description: "Sua solicitação de férias foi enviada para aprovação.",
      });
      queryClient.invalidateQueries({ queryKey: ['ferias', user?.id] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (data: FractionedVacationForm) => {
    createVacationMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'solicitado':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Solicitado</Badge>;
      case 'rejeitado':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleScheduleVacation = () => {
    setIsDialogOpen(true);
  };

  const handleViewDetails = () => {
    // Implementar navegação para detalhes ou abrir modal com informações
    toast({
      title: "Detalhes das Férias",
      description: "Funcionalidade de detalhes será implementada em breve.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitações de Férias</h1>
          <p className="text-gray-600">Solicite e acompanhe suas férias</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nova Solicitação</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Nova Solicitação de Férias</span>
              </DialogTitle>
              <DialogDescription>
                Preencha os dados para solicitar suas férias. Você pode escolher entre férias integrais (30 dias seguidos) ou férias fracionadas (até 3 períodos).
              </DialogDescription>
            </DialogHeader>
            
            <FractionedVacationFormComponent
              onSubmit={handleSubmit}
              onCancel={() => setIsDialogOpen(false)}
              isLoading={createVacationMutation.isPending}
              companyId={user?.id || ''}
              employeeId={user?.id || ''}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Seção de Notificações e Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Widget de Notificações */}
        <div className="lg:col-span-2">
          <VacationNotificationWidget employeeId={user?.id} />
        </div>
        
        {/* Card de Status */}
        <div className="lg:col-span-1">
          <VacationStatusCard 
            employeeId={user?.id}
            showActions={true}
            onScheduleVacation={handleScheduleVacation}
            onViewDetails={handleViewDetails}
          />
        </div>
      </div>

      {/* Lista de Solicitações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Histórico de Solicitações</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando solicitações...</p>
            </div>
          ) : ferias && ferias.length > 0 ? (
            <div className="space-y-4">
              {ferias.map((feriasItem) => (
                <div key={feriasItem.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-medium">
                          {feriasItem.periodo} - {feriasItem.ano}
                          {feriasItem.tipo_fracionamento === 'fracionado' && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Fracionadas ({feriasItem.total_periodos} períodos)
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {feriasItem.tipo_fracionamento === 'fracionado' 
                            ? `${feriasItem.total_periodos} períodos de férias`
                            : `${new Date(feriasItem.data_inicio).toLocaleDateString()} até ${new Date(feriasItem.data_fim).toLocaleDateString()}`
                          }
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(feriasItem.status)}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Dias de Férias</p>
                      <p className="font-medium">{feriasItem.dias_ferias}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Dias de Abono</p>
                      <p className="font-medium">{feriasItem.dias_abono || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total de Dias</p>
                      <p className="font-medium">{(feriasItem.dias_ferias || 0) + (feriasItem.dias_abono || 0)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-sm text-gray-600">
                    <p>Solicitado em: {new Date(feriasItem.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma solicitação encontrada
              </h3>
              <p className="text-gray-600">
                Você ainda não fez nenhuma solicitação de férias.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FeriasPage;
