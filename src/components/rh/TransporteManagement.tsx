import React, { useState } from 'react';
import { TransporteConfig, TransporteConfigInsert, TransporteConfigUpdate } from '@/integrations/supabase/rh-types';
import { useTransporteConfigs } from '@/hooks/rh/useTransporteConfigs';
import { TransporteTable } from './TransporteTable';
import { TransporteForm } from './TransporteForm';
import { FormModal } from './FormModal';
import { Button } from '@/components/ui/button';
import { Plus, Bus, DollarSign, Fuel, Ticket, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TransporteManagementProps {
  companyId: string;
  className?: string;
}

export function TransporteManagement({ companyId, className = '' }: TransporteManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTransporte, setSelectedTransporte] = useState<TransporteConfig | null>(null);
  const { toast } = useToast();

  const {
    transporteConfigs,
    isLoading,
    error,
    createTransporteConfig,
    updateTransporteConfig,
    deleteTransporteConfig,
  } = useTransporteConfigs(companyId);

  const handleCreate = async (data: TransporteConfigInsert) => {
    try {
      await createTransporteConfig.mutateAsync({
        ...data,
        company_id: companyId,
        is_active: data.is_active ?? true,
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar configuração de transporte:', error);
    }
  };

  const handleUpdate = async (data: TransporteConfigUpdate) => {
    try {
      await updateTransporteConfig.mutateAsync({
        ...data,
        id: selectedTransporte?.id || '',
      });
      setIsEditModalOpen(false);
      setSelectedTransporte(null);
    } catch (error) {
      console.error('Erro ao atualizar configuração de transporte:', error);
    }
  };

  const handleDelete = async (transporte: TransporteConfig) => {
    try {
      await deleteTransporteConfig.mutateAsync(transporte.id);
    } catch (error) {
      console.error('Erro ao excluir configuração de transporte:', error);
    }
  };

  const handleEdit = (transporte: TransporteConfig) => {
    setSelectedTransporte(transporte);
    setIsEditModalOpen(true);
  };

  const handleView = (transporte: TransporteConfig) => {
    setSelectedTransporte(transporte);
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
    setSelectedTransporte(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedTransporte(null);
  };

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-destructive mb-4">
          <p>Erro ao carregar configurações de transporte</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Calcular estatísticas
  const totalConfigs = transporteConfigs.length;
  const activeConfigs = transporteConfigs.filter(c => c.is_active).length;
  const passagemConfigs = transporteConfigs.filter(c => c.tipo === 'passagem').length;
  const combustivelConfigs = transporteConfigs.filter(c => c.tipo === 'combustivel').length;
  const ambosConfigs = transporteConfigs.filter(c => c.tipo === 'ambos').length;
  const totalValorPassagem = transporteConfigs
    .filter(c => c.is_active)
    .reduce((sum, c) => sum + (c.valor_passagem || 0), 0);
  const totalValorCombustivel = transporteConfigs
    .filter(c => c.is_active)
    .reduce((sum, c) => sum + (c.valor_combustivel || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'passagem':
        return 'Passagem';
      case 'combustivel':
        return 'Combustível';
      case 'ambos':
        return 'Passagem + Combustível';
      default:
        return tipo;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Configurações</p>
              <p className="text-2xl font-bold">{totalConfigs}</p>
            </div>
            <Bus className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Configurações Ativas</p>
              <p className="text-2xl font-bold text-green-600">{activeConfigs}</p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Passagem</p>
              <p className="text-2xl font-bold text-orange-600">{passagemConfigs}</p>
            </div>
            <Ticket className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Combustível</p>
              <p className="text-2xl font-bold text-purple-600">{combustivelConfigs}</p>
            </div>
            <Fuel className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Total Passagens</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalValorPassagem)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-emerald-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Total Combustível</p>
              <p className="text-2xl font-bold text-cyan-600">{formatCurrency(totalValorCombustivel)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-cyan-600" />
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Configurações de Transporte</h2>
          <p className="text-sm text-muted-foreground">
            Configure os valores e regras para transporte (passagens e combustível)
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Configuração
        </Button>
      </div>

      {/* Tabela */}
      <TransporteTable
        data={transporteConfigs}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
      />

      {/* Modal de Criação */}
      <FormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Nova Configuração de Transporte"
        description="Configure os valores e regras para transporte"
      >
        <TransporteForm
          onSubmit={handleCreate}
          onCancel={handleCloseCreateModal}
          companyId={companyId}
        />
      </FormModal>

      {/* Modal de Edição */}
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Configuração de Transporte"
        description="Edite as configurações de transporte"
      >
        {selectedTransporte && (
          <TransporteForm
            initialData={selectedTransporte}
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
        title="Detalhes da Configuração de Transporte"
        description="Visualize as configurações completas"
      >
        {selectedTransporte && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                <p className="text-sm">{getTipoLabel(selectedTransporte.tipo)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor da Passagem</label>
                <p className="text-sm">{formatCurrency(selectedTransporte.valor_passagem || 0)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Quantidade de Passagens</label>
                <p className="text-sm">{selectedTransporte.quantidade_passagens}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor do Combustível</label>
                <p className="text-sm">{formatCurrency(selectedTransporte.valor_combustivel || 0)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Desconto por Ausência</label>
                <p className="text-sm">{selectedTransporte.desconto_por_ausencia ? 'Sim' : 'Não'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Desconto por Férias</label>
                <p className="text-sm">{selectedTransporte.desconto_por_ferias ? 'Sim' : 'Não'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Desconto por Licença</label>
                <p className="text-sm">{selectedTransporte.desconto_por_licenca ? 'Sim' : 'Não'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm">{selectedTransporte.is_active ? 'Ativo' : 'Inativo'}</p>
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

