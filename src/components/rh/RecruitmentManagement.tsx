import React, { useState } from 'react';
import { RecruitmentData, RecruitmentInsert, RecruitmentUpdate } from '@/hooks/rh/useRecruitment';
import { useRecruitment } from '@/hooks/rh';
import { RecruitmentTable } from './RecruitmentTable';
import { RecruitmentForm } from './RecruitmentForm';
import { FormModal } from './FormModal';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Users, TrendingUp, Briefcase, AlertCircle, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RecruitmentManagementProps {
  companyId: string;
  className?: string;
}

export function RecruitmentManagement({ companyId, className = '' }: RecruitmentManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRecruitment, setSelectedRecruitment] = useState<RecruitmentData | null>(null);
  const { toast } = useToast();

  const {
    recruitmentData,
    isLoading,
    error,
    createRecruitment,
    updateRecruitment,
    deleteRecruitment,
    refetch,
  } = useRecruitment(companyId);

  const handleCreate = async (data: RecruitmentInsert) => {
    try {
      await createRecruitment(data);
      setIsCreateModalOpen(false);
      toast({
        title: 'Sucesso!',
        description: 'Vaga de recrutamento criada com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao criar vaga de recrutamento:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível criar a vaga de recrutamento.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (data: RecruitmentUpdate) => {
    try {
      await updateRecruitment(data);
      setIsEditModalOpen(false);
      setSelectedRecruitment(null);
      toast({
        title: 'Sucesso!',
        description: 'Vaga de recrutamento atualizada com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar vaga de recrutamento:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível atualizar a vaga de recrutamento.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (recruitment: RecruitmentData) => {
    try {
      await deleteRecruitment(recruitment.id);
      toast({
        title: 'Sucesso!',
        description: 'Vaga de recrutamento excluída com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao excluir vaga de recrutamento:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível excluir a vaga de recrutamento.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (recruitment: RecruitmentData) => {
    setSelectedRecruitment(recruitment);
    setIsEditModalOpen(true);
  };

  const handleView = (recruitment: RecruitmentData) => {
    setSelectedRecruitment(recruitment);
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
    setSelectedRecruitment(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedRecruitment(null);
  };

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-destructive mb-4">
          <p>Erro ao carregar vagas de recrutamento</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Calcular estatísticas
  const totalVagas = recruitmentData.length;
  const vagasAbertas = recruitmentData.filter(v => v.status === 'aberta').length;
  const vagasEmAndamento = recruitmentData.filter(v => v.status === 'em_andamento').length;
  const vagasFechadas = recruitmentData.filter(v => v.status === 'fechada').length;
  const totalCandidatos = recruitmentData.reduce((sum, v) => sum + v.candidatos_interessados, 0);

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
      case 'aberta': return 'Aberta';
      case 'em_andamento': return 'Em Andamento';
      case 'fechada': return 'Fechada';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  const getTipoContratoLabel = (tipo: string) => {
    switch (tipo) {
      case 'clt': return 'CLT';
      case 'pj': return 'PJ';
      case 'estagio': return 'Estágio';
      case 'temporario': return 'Temporário';
      default: return 'N/A';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Vagas</p>
              <p className="text-2xl font-bold">{totalVagas}</p>
            </div>
            <Briefcase className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Vagas Abertas</p>
              <p className="text-2xl font-bold text-green-600">{vagasAbertas}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
              <p className="text-2xl font-bold text-orange-600">{vagasEmAndamento}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Vagas Fechadas</p>
              <p className="text-2xl font-bold text-gray-600">{vagasFechadas}</p>
            </div>
            <MapPin className="h-8 w-8 text-gray-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Candidatos</p>
              <p className="text-2xl font-bold text-purple-600">{totalCandidatos}</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Gestão de Recrutamento</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie as vagas de recrutamento da empresa
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Vaga
        </Button>
      </div>

      {/* Tabela */}
      <RecruitmentTable
        data={recruitmentData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
      />

      {/* Modal de Criação */}
      <FormModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title="Nova Vaga de Recrutamento"
        description="Crie uma nova vaga de recrutamento para a empresa"
      >
        <RecruitmentForm
          onSubmit={handleCreate}
          onCancel={handleCloseCreateModal}
          companyId={companyId}
        />
      </FormModal>

      {/* Modal de Edição */}
      <FormModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title="Editar Vaga de Recrutamento"
        description="Edite as informações da vaga de recrutamento"
      >
        {selectedRecruitment && (
          <RecruitmentForm
            initialData={selectedRecruitment}
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
        title="Detalhes da Vaga de Recrutamento"
        description="Visualize as informações completas da vaga"
      >
        {selectedRecruitment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Título da Vaga</label>
                <p className="text-sm font-medium">{selectedRecruitment.titulo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cargo</label>
                <p className="text-sm">{selectedRecruitment.position_nome}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm capitalize">{getStatusLabel(selectedRecruitment.status)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo de Contrato</label>
                <p className="text-sm">{getTipoContratoLabel(selectedRecruitment.tipo_contrato)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Local de Trabalho</label>
                <p className="text-sm">{selectedRecruitment.local_trabalho}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Vagas Disponíveis</label>
                <p className="text-sm font-medium">{selectedRecruitment.vagas_disponiveis} vaga(s)</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Candidatos Interessados</label>
                <p className="text-sm">{selectedRecruitment.candidatos_interessados} candidato(s)</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Faixa Salarial</label>
                <p className="text-sm font-medium">
                  {formatCurrency(selectedRecruitment.salario_min)} - {formatCurrency(selectedRecruitment.salario_max)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data de Abertura</label>
                <p className="text-sm">{formatDate(selectedRecruitment.data_abertura)}</p>
              </div>
              {selectedRecruitment.data_fechamento && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Fechamento</label>
                  <p className="text-sm">{formatDate(selectedRecruitment.data_fechamento)}</p>
                </div>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Descrição</label>
              <p className="text-sm">{selectedRecruitment.descricao}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Requisitos</label>
              <p className="text-sm">{selectedRecruitment.requisitos}</p>
            </div>
            
            {selectedRecruitment.observacoes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Observações</label>
                <p className="text-sm">{selectedRecruitment.observacoes}</p>
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
