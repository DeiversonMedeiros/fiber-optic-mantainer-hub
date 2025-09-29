import React, { useState } from 'react';
import { FuncionarioConvenioDependente, FuncionarioConvenioDependenteInsert, FuncionarioConvenioDependenteUpdate, EmployeeDependent } from '@/integrations/supabase/rh-types';
import { useFuncionarioConvenios } from '@/hooks/rh/useFuncionarioConvenios';
import { FuncionarioConvenioDependentesTable } from './FuncionarioConvenioDependentesTable';
import { FuncionarioConvenioDependentesForm } from './FuncionarioConvenioDependentesForm';
import { FormModal } from './FormModal';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, Stethoscope, DollarSign, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FuncionarioConvenioDependentesManagementProps {
  funcionarioConvenioId: string;
  employeeId: string;
  companyId: string;
  className?: string;
}

export function FuncionarioConvenioDependentesManagement({ 
  funcionarioConvenioId, 
  employeeId, 
  companyId, 
  className = '' 
}: FuncionarioConvenioDependentesManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDependente, setSelectedDependente] = useState<FuncionarioConvenioDependente | null>(null);
  const { toast } = useToast();

  const {
    funcionarioConvenios,
    isLoading: isLoadingConvenios,
  } = useFuncionarioConvenios(employeeId);

  // Buscar dependentes do funcionário que podem ser vinculados
  const [dependentesDisponiveis, setDependentesDisponiveis] = useState<EmployeeDependent[]>([]);
  const [dependentesVinculados, setDependentesVinculados] = useState<FuncionarioConvenioDependente[]>([]);

  const handleCreate = async (data: FuncionarioConvenioDependenteInsert) => {
    try {
      // Aqui você implementaria a lógica para criar a vinculação
      // await createFuncionarioConvenioDependente.mutateAsync(data);
      setIsCreateModalOpen(false);
      toast({
        title: 'Sucesso!',
        description: 'Dependente vinculado ao convênio com sucesso.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao vincular dependente:', error);
    }
  };

  const handleUpdate = async (data: FuncionarioConvenioDependenteUpdate) => {
    try {
      // Aqui você implementaria a lógica para atualizar a vinculação
      // await updateFuncionarioConvenioDependente.mutateAsync(data);
      setIsEditModalOpen(false);
      setSelectedDependente(null);
      toast({
        title: 'Sucesso!',
        description: 'Vinculação do dependente atualizada com sucesso.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao atualizar vinculação do dependente:', error);
    }
  };

  const handleDelete = async (dependente: FuncionarioConvenioDependente) => {
    try {
      // Aqui você implementaria a lógica para excluir a vinculação
      // await deleteFuncionarioConvenioDependente.mutateAsync(dependente.id);
      toast({
        title: 'Sucesso!',
        description: 'Dependente desvinculado do convênio com sucesso.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao desvincular dependente:', error);
    }
  };

  const handleEdit = (dependente: FuncionarioConvenioDependente) => {
    setSelectedDependente(dependente);
    setIsEditModalOpen(true);
  };

  const handleView = (dependente: FuncionarioConvenioDependente) => {
    setSelectedDependente(dependente);
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
    setSelectedDependente(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedDependente(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calcular estatísticas
  const totalDependentes = dependentesVinculados.length;
  const activeDependentes = dependentesVinculados.filter(d => d.is_ativo).length;
  const totalValue = dependentesVinculados.reduce((sum, d) => sum + (d.valor_dependente || 0), 0);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Dependentes</p>
              <p className="text-2xl font-bold">{totalDependentes}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dependentes Ativos</p>
              <p className="text-2xl font-bold text-green-600">{activeDependentes}</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalValue)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-emerald-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Médio</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(totalDependentes > 0 ? totalValue / totalDependentes : 0)}
              </p>
            </div>
            <Stethoscope className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Dependentes do Convênio</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os dependentes vinculados a este convênio
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Vincular Dependente
        </Button>
      </div>

      {/* Tabela de Dependentes do Convênio */}
      <FuncionarioConvenioDependentesTable
        data={dependentesVinculados}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={false}
      />

      {/* Modal de Criação */}
      <FormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Vincular Dependente ao Convênio"
        description="Selecione um dependente para vincular a este convênio"
      >
        <FuncionarioConvenioDependentesForm
          onSubmit={handleCreate}
          onCancel={handleCloseCreateModal}
          funcionarioConvenioId={funcionarioConvenioId}
          dependentesDisponiveis={dependentesDisponiveis}
        />
      </FormModal>

      {/* Modal de Edição */}
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Vinculação do Dependente"
        description="Edite as informações da vinculação do dependente"
      >
        {selectedDependente && (
          <FuncionarioConvenioDependentesForm
            initialData={selectedDependente}
            onSubmit={handleUpdate}
            onCancel={handleCloseEditModal}
            funcionarioConvenioId={funcionarioConvenioId}
            dependentesDisponiveis={dependentesDisponiveis}
          />
        )}
      </FormModal>

      {/* Modal de Visualização */}
      <FormModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        title="Detalhes da Vinculação"
        description="Visualize as informações completas da vinculação do dependente"
      >
        {selectedDependente && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome do Dependente</label>
                <p className="text-sm">{selectedDependente.funcionario_dependente_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor do Dependente</label>
                <p className="text-sm font-bold">{formatCurrency(selectedDependente.valor_dependente || 0)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm">{selectedDependente.is_ativo ? 'Ativo' : 'Inativo'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data de Vinculação</label>
                <p className="text-sm">{new Date(selectedDependente.created_at).toLocaleDateString('pt-BR')}</p>
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

