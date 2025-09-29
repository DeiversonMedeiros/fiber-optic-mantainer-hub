import React, { useState } from 'react';
import { TrainingData, TrainingInsert, TrainingUpdate } from '@/hooks/rh/useTraining';
import { useTraining } from '@/hooks/rh';
import { TrainingTable } from './TrainingTable';
import { TrainingForm } from './TrainingForm';
import { FormModal } from './FormModal';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Users, TrendingUp, GraduationCap, AlertCircle, Clock, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TrainingManagementProps {
  companyId: string;
  className?: string;
}

export function TrainingManagement({ companyId, className = '' }: TrainingManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<TrainingData | null>(null);
  const { toast } = useToast();

  const {
    trainingData,
    isLoading,
    error,
    createTraining,
    updateTraining,
    deleteTraining,
    refetch,
  } = useTraining(companyId);

  const handleCreate = async (data: TrainingInsert) => {
    try {
      await createTraining(data);
      setIsCreateModalOpen(false);
      toast({
        title: 'Sucesso!',
        description: 'Treinamento criado com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao criar treinamento:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível criar o treinamento.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (data: TrainingUpdate) => {
    try {
      await updateTraining(data);
      setIsEditModalOpen(false);
      setSelectedTraining(null);
      toast({
        title: 'Sucesso!',
        description: 'Treinamento atualizado com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar treinamento:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível atualizar o treinamento.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (training: TrainingData) => {
    try {
      await deleteTraining(training.id);
      toast({
        title: 'Sucesso!',
        description: 'Treinamento excluído com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao excluir treinamento:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível excluir o treinamento.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (training: TrainingData) => {
    setSelectedTraining(training);
    setIsEditModalOpen(true);
  };

  const handleView = (training: TrainingData) => {
    setSelectedTraining(training);
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
    setSelectedTraining(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedTraining(null);
  };

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-destructive mb-4">
          <p>Erro ao carregar treinamentos</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Calcular estatísticas
  const totalTreinamentos = trainingData.length;
  const treinamentosPlanejados = trainingData.filter(t => t.status === 'planejado').length;
  const treinamentosEmAndamento = trainingData.filter(t => t.status === 'em_andamento').length;
  const treinamentosConcluidos = trainingData.filter(t => t.status === 'concluido').length;
  const totalParticipantes = trainingData.reduce((sum, t) => sum + t.participantes_inscritos, 0);
  const totalHoras = trainingData.reduce((sum, t) => sum + t.duracao_horas, 0);

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planejado': return 'Planejado';
      case 'em_andamento': return 'Em Andamento';
      case 'concluido': return 'Concluído';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const getTipoTreinamentoLabel = (tipo: string) => {
    switch (tipo) {
      case 'obrigatorio': return 'Obrigatório';
      case 'opcional': return 'Opcional';
      case 'desenvolvimento': return 'Desenvolvimento';
      case 'compliance': return 'Compliance';
      case 'seguranca': return 'Segurança';
      default: return 'N/A';
    }
  };

  const getCategoriaLabel = (categoria: string) => {
    switch (categoria) {
      case 'tecnico': return 'Técnico';
      case 'soft_skills': return 'Soft Skills';
      case 'gestao': return 'Gestão';
      case 'compliance': return 'Compliance';
      case 'seguranca_trabalho': return 'Segurança do Trabalho';
      default: return 'N/A';
    }
  };

  const getModalidadeLabel = (modalidade: string) => {
    switch (modalidade) {
      case 'presencial': return 'Presencial';
      case 'online': return 'Online';
      case 'hibrido': return 'Híbrido';
      case 'e-learning': return 'E-learning';
      default: return 'N/A';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Treinamentos</p>
              <p className="text-2xl font-bold">{totalTreinamentos}</p>
            </div>
            <GraduationCap className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Planejados</p>
              <p className="text-2xl font-bold text-orange-600">{treinamentosPlanejados}</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
              <p className="text-2xl font-bold text-blue-600">{treinamentosEmAndamento}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Concluídos</p>
              <p className="text-2xl font-bold text-green-600">{treinamentosConcluidos}</p>
            </div>
            <Award className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Participantes</p>
              <p className="text-2xl font-bold text-purple-600">{totalParticipantes}</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Horas</p>
              <p className="text-2xl font-bold text-indigo-600">{totalHoras}h</p>
            </div>
            <Clock className="h-8 w-8 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Gestão de Treinamentos</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os treinamentos e capacitações da empresa
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Treinamento
        </Button>
      </div>

      {/* Tabela */}
      <TrainingTable
        data={trainingData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
      />

      {/* Modal de Criação */}
      <FormModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title="Novo Treinamento"
        description="Crie um novo treinamento para a empresa"
      >
        <TrainingForm
          onSubmit={handleCreate}
          onCancel={handleCloseCreateModal}
          companyId={companyId}
        />
      </FormModal>

      {/* Modal de Edição */}
      <FormModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title="Editar Treinamento"
        description="Edite as informações do treinamento"
      >
        {selectedTraining && (
          <TrainingForm
            initialData={selectedTraining}
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
        title="Detalhes do Treinamento"
        description="Visualize as informações completas do treinamento"
      >
        {selectedTraining && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Título</label>
                <p className="text-sm font-medium">{selectedTraining.titulo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                <p className="text-sm">{getTipoTreinamentoLabel(selectedTraining.tipo_treinamento)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                <p className="text-sm">{getCategoriaLabel(selectedTraining.categoria)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Modalidade</label>
                <p className="text-sm">{getModalidadeLabel(selectedTraining.modalidade)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm capitalize">{getStatusLabel(selectedTraining.status)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Duração</label>
                <p className="text-sm font-medium">{selectedTraining.duracao_horas}h</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data de Início</label>
                <p className="text-sm">{formatDate(selectedTraining.data_inicio)}</p>
              </div>
              {selectedTraining.data_fim && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Fim</label>
                  <p className="text-sm">{formatDate(selectedTraining.data_fim)}</p>
                </div>
              )}
              {selectedTraining.local && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Local</label>
                  <p className="text-sm">{selectedTraining.local}</p>
                </div>
              )}
              {selectedTraining.instrutor && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Instrutor</label>
                  <p className="text-sm">{selectedTraining.instrutor}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Custo por Participante</label>
                <p className="text-sm font-medium">
                  {selectedTraining.custo_por_participante > 0 
                    ? formatCurrency(selectedTraining.custo_por_participante)
                    : 'Gratuito'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Participantes</label>
                <p className="text-sm font-medium">
                  {selectedTraining.participantes_inscritos}/{selectedTraining.max_participantes}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Certificação</label>
                <p className="text-sm">{selectedTraining.certificacao ? 'Sim' : 'Não'}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Descrição</label>
              <p className="text-sm">{selectedTraining.descricao}</p>
            </div>
            
            {selectedTraining.requisitos && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Requisitos</label>
                <p className="text-sm">{selectedTraining.requisitos}</p>
              </div>
            )}
            
            {selectedTraining.material_apoio && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Material de Apoio</label>
                <p className="text-sm">{selectedTraining.material_apoio}</p>
              </div>
            )}
            
            {selectedTraining.observacoes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Observações</label>
                <p className="text-sm">{selectedTraining.observacoes}</p>
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
