import React, { useState } from 'react';
import { VrVaConfig, VrVaConfigInsert, VrVaConfigUpdate } from '@/integrations/supabase/rh-types';
import { useVrVaConfigs } from '@/hooks/rh/useVrVaConfigs';
import { VrVaTable } from './VrVaTable';
import { VrVaForm } from './VrVaForm';
import { FormModal } from './FormModal';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard, DollarSign, Calendar, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VrVaManagementProps {
  companyId: string;
  className?: string;
}

export function VrVaManagement({ companyId, className = '' }: VrVaManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedVrVa, setSelectedVrVa] = useState<VrVaConfig | null>(null);
  const { toast } = useToast();

  const {
    vrVaConfigs,
    isLoading,
    error,
    createVrVaConfig,
    updateVrVaConfig,
    deleteVrVaConfig,
  } = useVrVaConfigs(companyId);

  const handleCreate = async (data: VrVaConfigInsert) => {
    try {
      await createVrVaConfig.mutateAsync({
        ...data,
        company_id: companyId,
        is_active: data.is_active ?? true,
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar configuração VR/VA:', error);
    }
  };

  const handleUpdate = async (data: VrVaConfigUpdate) => {
    try {
      await updateVrVaConfig.mutateAsync({
        ...data,
        id: selectedVrVa?.id || '',
      });
      setIsEditModalOpen(false);
      setSelectedVrVa(null);
    } catch (error) {
      console.error('Erro ao atualizar configuração VR/VA:', error);
    }
  };

  const handleDelete = async (vrVa: VrVaConfig) => {
    try {
      await deleteVrVaConfig.mutateAsync(vrVa.id);
    } catch (error) {
      console.error('Erro ao excluir configuração VR/VA:', error);
    }
  };

  const handleEdit = (vrVa: VrVaConfig) => {
    setSelectedVrVa(vrVa);
    setIsEditModalOpen(true);
  };

  const handleView = (vrVa: VrVaConfig) => {
    setSelectedVrVa(vrVa);
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
    setSelectedVrVa(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedVrVa(null);
  };

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-destructive mb-4">
          <p>Erro ao carregar configurações VR/VA</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Calcular estatísticas
  const totalConfigs = vrVaConfigs.length;
  const activeConfigs = vrVaConfigs.filter(c => c.is_active).length;
  const vrConfigs = vrVaConfigs.filter(c => c.tipo === 'VR').length;
  const vaConfigs = vrVaConfigs.filter(c => c.tipo === 'VA').length;
  const totalValorMensal = vrVaConfigs
    .filter(c => c.is_active)
    .reduce((sum, c) => sum + (c.valor_mensal || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'VR':
        return 'Vale Refeição';
      case 'VA':
        return 'Vale Alimentação';
      default:
        return tipo;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Configurações</p>
              <p className="text-2xl font-bold">{totalConfigs}</p>
            </div>
            <CreditCard className="h-8 w-8 text-blue-600" />
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
              <p className="text-sm font-medium text-muted-foreground">Vale Refeição</p>
              <p className="text-2xl font-bold text-orange-600">{vrConfigs}</p>
            </div>
            <CreditCard className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Vale Alimentação</p>
              <p className="text-2xl font-bold text-purple-600">{vaConfigs}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Total Mensal</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalValorMensal)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Vale Refeição e Vale Alimentação</h2>
          <p className="text-sm text-muted-foreground">
            Configure os valores e regras para VR e VA
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Configuração
        </Button>
      </div>

      {/* Tabela */}
      <VrVaTable
        data={vrVaConfigs}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
      />

      {/* Modal de Criação */}
      <FormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Nova Configuração VR/VA"
        description="Configure os valores e regras para Vale Refeição ou Vale Alimentação"
      >
        <VrVaForm
          onSubmit={handleCreate}
          onCancel={handleCloseCreateModal}
          companyId={companyId}
        />
      </FormModal>

      {/* Modal de Edição */}
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Configuração VR/VA"
        description="Edite as configurações de VR/VA"
      >
        {selectedVrVa && (
          <VrVaForm
            initialData={selectedVrVa}
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
        title="Detalhes da Configuração VR/VA"
        description="Visualize as configurações completas"
      >
        {selectedVrVa && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                <p className="text-sm">{getTipoLabel(selectedVrVa.tipo)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor Diário</label>
                <p className="text-sm">{formatCurrency(selectedVrVa.valor_diario || 0)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor Mensal</label>
                <p className="text-sm">{formatCurrency(selectedVrVa.valor_mensal || 0)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Dias Úteis no Mês</label>
                <p className="text-sm">{selectedVrVa.dias_uteis_mes}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Desconto por Ausência</label>
                <p className="text-sm">{selectedVrVa.desconto_por_ausencia ? 'Sim' : 'Não'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Desconto por Férias</label>
                <p className="text-sm">{selectedVrVa.desconto_por_ferias ? 'Sim' : 'Não'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Desconto por Licença</label>
                <p className="text-sm">{selectedVrVa.desconto_por_licenca ? 'Sim' : 'Não'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm">{selectedVrVa.is_active ? 'Ativo' : 'Inativo'}</p>
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

