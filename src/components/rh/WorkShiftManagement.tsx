import React, { useState } from 'react';
import { WorkShift, WorkShiftInsert, WorkShiftUpdate } from '@/integrations/supabase/rh-types';
import { useWorkShifts } from '@/hooks/rh';
import { WorkShiftTable } from './WorkShiftTable';
import { WorkShiftForm } from './WorkShiftForm';
import { FormModal } from './FormModal';
import { Button } from '@/components/ui/button';
import { Plus, Clock, Timer, Calendar, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WorkShiftManagementProps {
  companyId: string;
  className?: string;
}

export function WorkShiftManagement({ companyId, className = '' }: WorkShiftManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedWorkShift, setSelectedWorkShift] = useState<WorkShift | null>(null);
  const { toast } = useToast();

  const {
    workShifts,
    isLoading,
    error,
    createWorkShift,
    updateWorkShift,
    deleteWorkShift,
    refetch,
  } = useWorkShifts(companyId);

  const handleCreate = async (data: WorkShiftInsert) => {
    try {
      await createWorkShift(data);
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

  const handleUpdate = async (data: WorkShiftUpdate) => {
    try {
      await updateWorkShift(data);
      setIsEditModalOpen(false);
      setSelectedWorkShift(null);
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

  const handleDelete = async (workShift: WorkShift) => {
    try {
      await deleteWorkShift(workShift.id);
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

  const handleEdit = (workShift: WorkShift) => {
    setSelectedWorkShift(workShift);
    setIsEditModalOpen(true);
  };

  const handleView = (workShift: WorkShift) => {
    setSelectedWorkShift(workShift);
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
    setSelectedWorkShift(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedWorkShift(null);
  };

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
  const totalWorkShifts = workShifts.length;
  const activeWorkShifts = workShifts.filter(ws => ws.is_active).length;
  const uniqueShifts = new Set(workShifts.map(ws => `${ws.hora_inicio}-${ws.hora_fim}`)).size;

  // Função para formatar dias da semana
  const formatDaysOfWeek = (days: number[]) => {
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days.map(day => dayNames[day]).join(', ');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Escalas</p>
              <p className="text-2xl font-bold">{totalWorkShifts}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Escalas Ativas</p>
              <p className="text-2xl font-bold text-green-600">{activeWorkShifts}</p>
            </div>
            <Timer className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Turnos Diferentes</p>
              <p className="text-2xl font-bold text-orange-600">{uniqueShifts}</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Funcionários Escalados</p>
              <p className="text-2xl font-bold text-purple-600">0</p>
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
            Gerencie as escalas e turnos de trabalho da empresa
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Escala
        </Button>
      </div>

      {/* Tabela */}
      <WorkShiftTable
        data={workShifts}
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
        <WorkShiftForm
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
        {selectedWorkShift && (
          <WorkShiftForm
            initialData={selectedWorkShift}
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
        title="Detalhes da Escala"
        description="Visualize as informações completas da escala de trabalho"
      >
        {selectedWorkShift && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome</label>
                <p className="text-sm">{selectedWorkShift.nome}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm">{selectedWorkShift.is_active ? 'Ativo' : 'Inativo'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Hora Início</label>
                <p className="text-sm">{selectedWorkShift.hora_inicio}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Hora Fim</label>
                <p className="text-sm">{selectedWorkShift.hora_fim}</p>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Dias da Semana</label>
                <p className="text-sm">
                  {selectedWorkShift.dias_semana ? formatDaysOfWeek(selectedWorkShift.dias_semana) : 'Não definido'}
                </p>
              </div>
            </div>
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



















