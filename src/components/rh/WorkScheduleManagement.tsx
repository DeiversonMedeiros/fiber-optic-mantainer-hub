// @ts-nocheck
import React, { useState } from 'react';
import { WorkSchedule, WorkScheduleInsert, WorkScheduleUpdate } from '@/integrations/supabase/rh-types';
import { useWorkSchedules } from '@/hooks/rh';
import { WorkScheduleTable } from './WorkScheduleTable';
import { WorkScheduleForm } from './WorkScheduleForm';
import { FormModal } from './FormModal';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Clock, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WorkScheduleManagementProps {
  companyId: string;
  className?: string;
}

export function WorkScheduleManagement({ companyId, className = '' }: WorkScheduleManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedWorkSchedule, setSelectedWorkSchedule] = useState<WorkSchedule | null>(null);
  const { toast } = useToast();

  const {
    workSchedules,
    isLoading,
    error,
    createWorkSchedule,
    updateWorkSchedule,
    deleteWorkSchedule,
    refetch,
  } = useWorkSchedules(companyId);

  const handleCreate = async (data: WorkScheduleInsert) => {
    try {
      await createWorkSchedule(data);
      setIsCreateModalOpen(false);
      toast({
        title: 'Sucesso!',
        description: 'Escala de trabalho criada com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao criar escala:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível criar a escala de trabalho.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (data: WorkScheduleUpdate) => {
    try {
      await updateWorkSchedule(data);
      setIsEditModalOpen(false);
      setSelectedWorkSchedule(null);
      toast({
        title: 'Sucesso!',
        description: 'Escala de trabalho atualizada com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar escala:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível atualizar a escala de trabalho.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (workSchedule: WorkSchedule) => {
    try {
      await deleteWorkSchedule(workSchedule.id);
      toast({
        title: 'Sucesso!',
        description: 'Escala de trabalho excluída com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao excluir escala:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível excluir a escala de trabalho.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (workSchedule: WorkSchedule) => {
    setSelectedWorkSchedule(workSchedule);
    setIsEditModalOpen(true);
  };

  const handleView = (workSchedule: WorkSchedule) => {
    setSelectedWorkSchedule(workSchedule);
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
    setSelectedWorkSchedule(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedWorkSchedule(null);
  };

  if (isLoading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Carregando escalas de trabalho...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-destructive mb-4">
          <p>Erro ao carregar escalas de trabalho</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Calcular estatísticas
  const totalSchedules = workSchedules?.length || 0;
  const activeSchedules = workSchedules?.filter(ws => ws.is_active).length || 0;
  const totalWeeklyHours = workSchedules?.reduce((sum, ws) => sum + (ws.carga_horaria_semanal || 0), 0) || 0;
  const averageWeeklyHours = totalSchedules > 0 ? Math.round(totalWeeklyHours / totalSchedules) : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Escalas</p>
              <p className="text-2xl font-bold">{totalSchedules}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Escalas Ativas</p>
              <p className="text-2xl font-bold text-green-600">{activeSchedules}</p>
            </div>
            <Clock className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Horas Semanais</p>
              <p className="text-2xl font-bold text-orange-600">{totalWeeklyHours}h</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Média por Escala</p>
              <p className="text-2xl font-bold text-purple-600">{averageWeeklyHours}h</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Escalas de Trabalho</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie as escalas de trabalho da empresa
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Escala
        </Button>
      </div>

      {/* Tabela */}
      <WorkScheduleTable
        data={workSchedules || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
      />

      {/* Modal de Criação */}
      <FormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Nova Escala de Trabalho"
        description="Crie uma nova escala de trabalho para a empresa"
      >
        <WorkScheduleForm
          onSubmit={handleCreate}
          onCancel={handleCloseCreateModal}
          companyId={companyId}
        />
      </FormModal>

      {/* Modal de Edição */}
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Escala de Trabalho"
        description="Edite as informações da escala de trabalho"
      >
        {selectedWorkSchedule && (
          <WorkScheduleForm
            initialData={selectedWorkSchedule}
            onSubmit={handleUpdate}
            onCancel={handleCloseEditModal}
            companyId={companyId}
          />
        )}
      </FormModal>

      {/* Modal de Visualização */}
      <FormModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        title="Detalhes da Escala de Trabalho"
        description="Visualize as informações completas da escala"
      >
        {selectedWorkSchedule && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome</label>
                <p className="text-sm">{selectedWorkSchedule.nome}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Hora de Entrada</label>
                <p className="text-sm">{selectedWorkSchedule.hora_entrada || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Hora de Saída</label>
                <p className="text-sm">{selectedWorkSchedule.hora_saida || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Início do Intervalo</label>
                <p className="text-sm">{selectedWorkSchedule.intervalo_inicio || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fim do Intervalo</label>
                <p className="text-sm">{selectedWorkSchedule.intervalo_fim || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Carga Horária</label>
                <p className="text-sm">{selectedWorkSchedule.carga_horaria_semanal}h/semana</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm">{selectedWorkSchedule.is_active ? 'Ativa' : 'Inativa'}</p>
              </div>
            </div>
            {selectedWorkSchedule.dias_semana && selectedWorkSchedule.dias_semana.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Dias da Semana</label>
                <p className="text-sm">
                  {selectedWorkSchedule.dias_semana.map(dia => {
                    const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
                    return dias[dia - 1];
                  }).join(', ')}
                </p>
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
