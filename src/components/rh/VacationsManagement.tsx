import React, { useState } from 'react';
import { Vacation, VacationInsert, VacationUpdate } from '@/integrations/supabase/rh-types';
import { useVacations } from '@/hooks/rh';
import { VacationsTable } from './VacationsTable';
import { VacationsForm } from './VacationsForm';
import { FormModal } from './FormModal';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Users, TrendingUp, Plane } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VacationsManagementProps {
  companyId: string;
  className?: string;
}

export function VacationsManagement({ companyId, className = '' }: VacationsManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedVacation, setSelectedVacation] = useState<Vacation | null>(null);
  const { toast } = useToast();

  const {
    vacations,
    isLoading,
    error,
    createVacation,
    updateVacation,
    deleteVacation,
    refetch,
  } = useVacations(companyId);

  const handleCreate = async (data: VacationInsert) => {
    try {
      await createVacation(data);
      setIsCreateModalOpen(false);
      toast({
        title: 'Sucesso!',
        description: 'Férias criadas com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao criar férias:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível criar as férias.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (data: VacationUpdate) => {
    try {
      await updateVacation(data);
      setIsEditModalOpen(false);
      setSelectedVacation(null);
      toast({
        title: 'Sucesso!',
        description: 'Férias atualizadas com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar férias:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível atualizar as férias.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (vacation: Vacation) => {
    try {
      await deleteVacation(vacation.id);
      toast({
        title: 'Sucesso!',
        description: 'Férias excluídas com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao excluir férias:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível excluir as férias.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (vacation: Vacation) => {
    setSelectedVacation(vacation);
    setIsEditModalOpen(true);
  };

  const handleView = (vacation: Vacation) => {
    setSelectedVacation(vacation);
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
    setSelectedVacation(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedVacation(null);
  };

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-destructive mb-4">
          <p>Erro ao carregar férias</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Carregando férias...</p>
      </div>
    );
  }

  // Calcular estatísticas - garantir que vacations é um array
  const vacationsArray = vacations || [];
  const totalVacations = vacationsArray.length;
  const activeVacations = vacationsArray.filter(v => v.status === 'em_andamento').length;
  const pendingVacations = vacationsArray.filter(v => v.status === 'pendente').length;
  const totalDays = vacationsArray.reduce((sum, v) => sum + (v.dias_ferias || 0), 0);
  const totalValue = vacationsArray.reduce((sum, v) => sum + (v.valor_ferias || 0), 0);

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

  const getTipoFeriasLabel = (tipo: string) => {
    switch (tipo) {
      case 'ferias_normais': return 'Férias Normais';
      case 'ferias_antecipadas': return 'Férias Antecipadas';
      case 'abono_pecuniario': return 'Abono Pecuniário';
      default: return 'N/A';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'aprovada': return 'Aprovada';
      case 'em_andamento': return 'Em Andamento';
      case 'concluida': return 'Concluída';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Férias</p>
              <p className="text-2xl font-bold">{totalVacations}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
              <p className="text-2xl font-bold text-green-600">{activeVacations}</p>
            </div>
            <Plane className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold text-orange-600">{pendingVacations}</p>
            </div>
            <Users className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Dias</p>
              <p className="text-2xl font-bold text-purple-600">{totalDays}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Gestão de Férias</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie as férias dos funcionários da empresa
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Férias
        </Button>
      </div>

      {/* Tabela */}
      <VacationsTable
        data={vacationsArray}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
      />

      {/* Modal de Criação */}
      <FormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Nova Férias"
        description="Crie um novo registro de férias para um funcionário"
      >
        <VacationsForm
          onSubmit={handleCreate}
          onCancel={handleCloseCreateModal}
          companyId={companyId}
        />
      </FormModal>

      {/* Modal de Edição */}
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Férias"
        description="Edite as informações das férias"
      >
        {selectedVacation && (
          <VacationsForm
            initialData={selectedVacation}
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
        title="Detalhes das Férias"
        description="Visualize as informações completas das férias"
      >
        {selectedVacation && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Funcionário ID</label>
                <p className="text-sm">{selectedVacation.funcionario_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Ano de Referência</label>
                <p className="text-sm">{selectedVacation.ano_referencia}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data Início</label>
                <p className="text-sm">{formatDate(selectedVacation.data_inicio)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data Fim</label>
                <p className="text-sm">{formatDate(selectedVacation.data_fim)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Dias de Férias</label>
                <p className="text-sm font-medium">{selectedVacation.dias_ferias} dias</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm capitalize">{getStatusLabel(selectedVacation.status)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo de Férias</label>
                <p className="text-sm">{getTipoFeriasLabel(selectedVacation.tipo_ferias)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor das Férias</label>
                <p className="text-sm font-bold text-green-600">
                  {formatCurrency(selectedVacation.valor_ferias || 0)}
                </p>
              </div>
            </div>
            {selectedVacation.observacoes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Observações</label>
                <p className="text-sm">{selectedVacation.observacoes}</p>
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
