// @ts-nocheck
import React, { useState } from 'react';
import { FuncionarioConvenio, FuncionarioConvenioInsert, FuncionarioConvenioUpdate } from '@/integrations/supabase/rh-types';
import { useFuncionarioConvenios } from '@/hooks/rh/useFuncionarioConvenios';
import { useConveniosEmpresas } from '@/hooks/rh/useConveniosEmpresas';
import { useConveniosPlanos } from '@/hooks/rh/useConveniosPlanos';
import { FuncionarioConveniosTable } from './FuncionarioConveniosTable';
import { FuncionarioConveniosForm } from './FuncionarioConveniosForm';
import { FormModal } from './FormModal';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, Stethoscope, DollarSign, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FuncionarioConveniosManagementProps {
  employeeId: string;
  companyId: string;
  className?: string;
}

export function FuncionarioConveniosManagement({ 
  employeeId, 
  companyId, 
  className = '' 
}: FuncionarioConveniosManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedConvenio, setSelectedConvenio] = useState<FuncionarioConvenio | null>(null);
  const { toast } = useToast();

  const {
    funcionarioConvenios,
    isLoading,
    error,
    createFuncionarioConvenio,
    updateFuncionarioConvenio,
    deleteFuncionarioConvenio,
  } = useFuncionarioConvenios(employeeId);

  const {
    conveniosEmpresas,
    isLoading: isLoadingConvenios,
  } = useConveniosEmpresas(companyId);

  const handleCreate = async (data: FuncionarioConvenioInsert) => {
    try {
      await createFuncionarioConvenio.mutateAsync({
        ...data,
        employee_id: employeeId,
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar adesão ao convênio:', error);
    }
  };

  const handleUpdate = async (data: FuncionarioConvenioUpdate) => {
    try {
      await updateFuncionarioConvenio.mutateAsync({
        ...data,
        id: selectedConvenio?.id || '',
      });
      setIsEditModalOpen(false);
      setSelectedConvenio(null);
    } catch (error) {
      console.error('Erro ao atualizar adesão ao convênio:', error);
    }
  };

  const handleDelete = async (convenio: FuncionarioConvenio) => {
    try {
      await deleteFuncionarioConvenio.mutateAsync(convenio.id);
    } catch (error) {
      console.error('Erro ao excluir adesão ao convênio:', error);
    }
  };

  const handleEdit = (convenio: FuncionarioConvenio) => {
    setSelectedConvenio(convenio);
    setIsEditModalOpen(true);
  };

  const handleView = (convenio: FuncionarioConvenio) => {
    setSelectedConvenio(convenio);
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
    setSelectedConvenio(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedConvenio(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'Ativo';
      case 'suspenso':
        return 'Suspenso';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'default';
      case 'suspenso':
        return 'secondary';
      case 'cancelado':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-destructive mb-4">
          <p>Erro ao carregar convênios do funcionário</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Calcular estatísticas
  const totalConvenios = funcionarioConvenios.length;
  const activeConvenios = funcionarioConvenios.filter(c => c.status === 'ativo').length;
  const suspendedConvenios = funcionarioConvenios.filter(c => c.status === 'suspenso').length;
  const cancelledConvenios = funcionarioConvenios.filter(c => c.status === 'cancelado').length;
  const totalValue = funcionarioConvenios.reduce((sum, c) => sum + (c.valor_total || 0), 0);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Convênios</p>
              <p className="text-2xl font-bold">{totalConvenios}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Convênios Ativos</p>
              <p className="text-2xl font-bold text-green-600">{activeConvenios}</p>
            </div>
            <Stethoscope className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Suspensos</p>
              <p className="text-2xl font-bold text-yellow-600">{suspendedConvenios}</p>
            </div>
            <Calendar className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cancelados</p>
              <p className="text-2xl font-bold text-red-600">{cancelledConvenios}</p>
            </div>
            <Calendar className="h-8 w-8 text-red-600" />
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
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Convênios do Funcionário</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os convênios de saúde do funcionário
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Adesão
        </Button>
      </div>

      {/* Tabela de Convênios do Funcionário */}
      <FuncionarioConveniosTable
        data={funcionarioConvenios}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
      />

      {/* Modal de Criação */}
      <FormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Nova Adesão ao Convênio"
        description="Cadastre uma nova adesão do funcionário a um convênio"
      >
        <FuncionarioConveniosForm
          onSubmit={handleCreate}
          onCancel={handleCloseCreateModal}
          employeeId={employeeId}
          conveniosEmpresas={conveniosEmpresas}
        />
      </FormModal>

      {/* Modal de Edição */}
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Adesão ao Convênio"
        description="Edite as informações da adesão ao convênio"
      >
        {selectedConvenio && (
          <FuncionarioConveniosForm
            initialData={selectedConvenio}
            onSubmit={handleUpdate}
            onCancel={handleCloseEditModal}
            employeeId={employeeId}
            conveniosEmpresas={conveniosEmpresas}
          />
        )}
      </FormModal>

      {/* Modal de Visualização */}
      <FormModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        title="Detalhes da Adesão"
        description="Visualize as informações completas da adesão ao convênio"
      >
        {selectedConvenio && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Convênio</label>
                <p className="text-sm">{selectedConvenio.convenios_planos?.convenios_empresas?.nome}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Plano</label>
                <p className="text-sm">{selectedConvenio.convenios_planos?.nome}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data Início</label>
                <p className="text-sm">{new Date(selectedConvenio.data_inicio).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data Fim</label>
                <p className="text-sm">{selectedConvenio.data_fim ? new Date(selectedConvenio.data_fim).toLocaleDateString('pt-BR') : 'Não definida'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor Titular</label>
                <p className="text-sm">{formatCurrency(selectedConvenio.valor_titular || 0)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor Dependentes</label>
                <p className="text-sm">{formatCurrency(selectedConvenio.valor_dependentes || 0)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor Total</label>
                <p className="text-sm font-bold">{formatCurrency(selectedConvenio.valor_total || 0)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm">{getStatusLabel(selectedConvenio.status || 'ativo')}</p>
              </div>
            </div>
            {selectedConvenio.observacoes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Observações</label>
                <p className="text-sm">{selectedConvenio.observacoes}</p>
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

