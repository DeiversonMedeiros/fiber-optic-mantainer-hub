import React, { useState } from 'react';
import { ESocialEvent, ESocialEventInsert, ESocialEventUpdate } from '@/integrations/supabase/rh-types';
import { useESocialEvents } from '@/hooks/rh';
import { ESocialEventsTable } from './ESocialEventsTable';
import { ESocialEventsForm } from './ESocialEventsForm';
import { FormModal } from './FormModal';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Users, TrendingUp, Database, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ESocialEventsManagementProps {
  companyId: string;
  className?: string;
}

export function ESocialEventsManagement({ companyId, className = '' }: ESocialEventsManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedESocialEvent, setSelectedESocialEvent] = useState<ESocialEvent | null>(null);
  const { toast } = useToast();

  const {
    eSocialEvents,
    isLoading,
    error,
    createESocialEvent,
    updateESocialEvent,
    deleteESocialEvent,
    refetch,
  } = useESocialEvents(companyId);

  const handleCreate = async (data: ESocialEventInsert) => {
    try {
      await createESocialEvent(data);
      setIsCreateModalOpen(false);
      toast({
        title: 'Sucesso!',
        description: 'Evento eSocial criado com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao criar evento eSocial:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível criar o evento eSocial.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (data: ESocialEventUpdate) => {
    try {
      await updateESocialEvent(data);
      setIsEditModalOpen(false);
      setSelectedESocialEvent(null);
      toast({
        title: 'Sucesso!',
        description: 'Evento eSocial atualizado com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar evento eSocial:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível atualizar o evento eSocial.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (eSocialEvent: ESocialEvent) => {
    try {
      await deleteESocialEvent(eSocialEvent.id);
      toast({
        title: 'Sucesso!',
        description: 'Evento eSocial excluído com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao excluir evento eSocial:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível excluir o evento eSocial.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (eSocialEvent: ESocialEvent) => {
    setSelectedESocialEvent(eSocialEvent);
    setIsEditModalOpen(true);
  };

  const handleView = (eSocialEvent: ESocialEvent) => {
    setSelectedESocialEvent(eSocialEvent);
    setIsViewModalOpen(true);
  };

  const handleCreateClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedESocialEvent(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedESocialEvent(null);
  };

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-destructive mb-4">
          <p>Erro ao carregar eventos eSocial</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Calcular estatísticas
  const totalEvents = eSocialEvents.length;
  const pendingEvents = eSocialEvents.filter(e => e.status === 'pendente').length;
  const sentEvents = eSocialEvents.filter(e => e.status === 'enviado').length;
  const acceptedEvents = eSocialEvents.filter(e => e.status === 'aceito').length;
  const rejectedEvents = eSocialEvents.filter(e => e.status === 'rejeitado').length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
  };

  const getTipoEventoLabel = (tipo: string) => {
    switch (tipo) {
      case 'admissao': return 'Admissão';
      case 'demissao': return 'Demissão';
      case 'ferias': return 'Férias';
      case 'afastamento': return 'Afastamento';
      case 'retorno': return 'Retorno';
      case 'alteracao_contrato': return 'Alteração de Contrato';
      case 'alteracao_salario': return 'Alteração de Salário';
      default: return 'N/A';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'processado': return 'Processado';
      case 'enviado': return 'Enviado';
      case 'aceito': return 'Aceito';
      case 'rejeitado': return 'Rejeitado';
      default: return status;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Eventos</p>
              <p className="text-2xl font-bold">{totalEvents}</p>
            </div>
            <Database className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold text-orange-600">{pendingEvents}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Enviados</p>
              <p className="text-2xl font-bold text-blue-600">{sentEvents}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Aceitos</p>
              <p className="text-2xl font-bold text-green-600">{acceptedEvents}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rejeitados</p>
              <p className="text-2xl font-bold text-red-600">{rejectedEvents}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Gestão de Eventos eSocial</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os eventos do eSocial da empresa
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Evento
        </Button>
      </div>

      {/* Tabela */}
      <ESocialEventsTable
        data={eSocialEvents}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
      />

      {/* Modal de Criação */}
      <FormModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title="Novo Evento eSocial"
        description="Crie um novo evento do eSocial para um funcionário"
      >
        <ESocialEventsForm
          onSubmit={handleCreate}
          onCancel={handleCloseCreateModal}
          companyId={companyId}
        />
      </FormModal>

      {/* Modal de Edição */}
      <FormModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title="Editar Evento eSocial"
        description="Edite as informações do evento eSocial"
      >
        {selectedESocialEvent && (
          <ESocialEventsForm
            initialData={selectedESocialEvent}
            onSubmit={handleUpdate}
            onCancel={handleCloseEditModal}
            companyId={companyId}
          />
        )}
      </FormModal>

      {/* Modal de Visualização */}
      <FormModal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        title="Detalhes do Evento eSocial"
        description="Visualize as informações completas do evento"
      >
        {selectedESocialEvent && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Funcionário ID</label>
                <p className="text-sm">{selectedESocialEvent.funcionario_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo de Evento</label>
                <p className="text-sm">{getTipoEventoLabel(selectedESocialEvent.tipo_evento)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data do Evento</label>
                <p className="text-sm">{formatDate(selectedESocialEvent.data_evento)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm capitalize">{getStatusLabel(selectedESocialEvent.status)}</p>
              </div>
              {selectedESocialEvent.numero_recibo && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Número do Recibo</label>
                  <p className="text-sm font-mono">{selectedESocialEvent.numero_recibo}</p>
                </div>
              )}
              {selectedESocialEvent.protocolo && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Protocolo</label>
                  <p className="text-sm font-mono">{selectedESocialEvent.protocolo}</p>
                </div>
              )}
              {selectedESocialEvent.valor_anterior && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor Anterior</label>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(selectedESocialEvent.valor_anterior)}
                  </p>
                </div>
              )}
              {selectedESocialEvent.valor_novo && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor Novo</label>
                  <p className="text-sm font-bold text-green-600">
                    {formatCurrency(selectedESocialEvent.valor_novo)}
                  </p>
                </div>
              )}
            </div>
            {selectedESocialEvent.observacoes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Observações</label>
                <p className="text-sm">{selectedESocialEvent.observacoes}</p>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={handleCloseViewModal} variant="outline">
                Fechar
              </Button>
            </div>
          </div>
        )}
      </FormModal>
    </div>
  );
}
