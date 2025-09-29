import React, { useState } from 'react';
import { BeneficioTipo, BeneficioTipoInsert, BeneficioTipoUpdate } from '@/integrations/supabase/rh-types';
import { useBeneficioTipos } from '@/hooks/rh/useBeneficioTipos';
import { BeneficioTiposTable } from './BeneficioTiposTable';
import { BeneficioTiposForm } from './BeneficioTiposForm';
import { FormModal } from './FormModal';
import { Button } from '@/components/ui/button';
import { Plus, Gift, Shield, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BeneficioTiposManagementProps {
  companyId: string;
  className?: string;
}

export function BeneficioTiposManagement({ companyId, className = '' }: BeneficioTiposManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<BeneficioTipo | null>(null);
  const { toast } = useToast();

  const {
    beneficioTipos,
    isLoading,
    error,
    createBeneficioTipo,
    updateBeneficioTipo,
    deleteBeneficioTipo,
  } = useBeneficioTipos(companyId);

  const handleCreate = async (data: BeneficioTipoInsert) => {
    try {
      await createBeneficioTipo.mutateAsync({
        ...data,
        company_id: companyId,
        is_active: data.is_active ?? true,
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar tipo de benefício:', error);
    }
  };

  const handleUpdate = async (data: BeneficioTipoUpdate) => {
    try {
      await updateBeneficioTipo.mutateAsync({
        ...data,
        id: selectedTipo?.id || '',
      });
      setIsEditModalOpen(false);
      setSelectedTipo(null);
    } catch (error) {
      console.error('Erro ao atualizar tipo de benefício:', error);
    }
  };

  const handleDelete = async (tipo: BeneficioTipo) => {
    try {
      await deleteBeneficioTipo.mutateAsync(tipo.id);
    } catch (error) {
      console.error('Erro ao excluir tipo de benefício:', error);
    }
  };

  const handleEdit = (tipo: BeneficioTipo) => {
    setSelectedTipo(tipo);
    setIsEditModalOpen(true);
  };

  const handleView = (tipo: BeneficioTipo) => {
    setSelectedTipo(tipo);
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
    setSelectedTipo(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedTipo(null);
  };

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-destructive mb-4">
          <p>Erro ao carregar tipos de benefícios</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Calcular estatísticas
  const totalTipos = beneficioTipos.length;
  const activeTipos = beneficioTipos.filter(t => t.is_active).length;
  const convenioTipos = beneficioTipos.filter(t => t.categoria === 'convenio').length;
  const vrVaTipos = beneficioTipos.filter(t => t.categoria === 'vr_va').length;
  const transporteTipos = beneficioTipos.filter(t => t.categoria === 'transporte').length;
  const outrosTipos = beneficioTipos.filter(t => t.categoria === 'outros').length;

  const getCategoriaLabel = (categoria: string) => {
    switch (categoria) {
      case 'convenio':
        return 'Convênios';
      case 'vr_va':
        return 'VR/VA';
      case 'transporte':
        return 'Transporte';
      case 'outros':
        return 'Outros';
      default:
        return categoria;
    }
  };

  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'convenio':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'vr_va':
        return <Gift className="h-4 w-4 text-green-600" />;
      case 'transporte':
        return <Target className="h-4 w-4 text-orange-600" />;
      case 'outros':
        return <Gift className="h-4 w-4 text-purple-600" />;
      default:
        return <Gift className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Tipos</p>
              <p className="text-2xl font-bold">{totalTipos}</p>
            </div>
            <Gift className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tipos Ativos</p>
              <p className="text-2xl font-bold text-green-600">{activeTipos}</p>
            </div>
            <Target className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Convênios</p>
              <p className="text-2xl font-bold text-blue-600">{convenioTipos}</p>
            </div>
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">VR/VA</p>
              <p className="text-2xl font-bold text-green-600">{vrVaTipos}</p>
            </div>
            <Gift className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Transporte</p>
              <p className="text-2xl font-bold text-orange-600">{transporteTipos}</p>
            </div>
            <Target className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Tipos de Benefícios</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os tipos de benefícios que podem ter regras de elegibilidade
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Tipo
        </Button>
      </div>

      {/* Tabela de Tipos de Benefícios */}
      <BeneficioTiposTable
        data={beneficioTipos}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
      />

      {/* Modal de Criação */}
      <FormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Novo Tipo de Benefício"
        description="Cadastre um novo tipo de benefício"
      >
        <BeneficioTiposForm
          onSubmit={handleCreate}
          onCancel={handleCloseCreateModal}
          companyId={companyId}
        />
      </FormModal>

      {/* Modal de Edição */}
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Tipo de Benefício"
        description="Edite as informações do tipo de benefício"
      >
        {selectedTipo && (
          <BeneficioTiposForm
            initialData={selectedTipo}
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
        title="Detalhes do Tipo de Benefício"
        description="Visualize as informações completas do tipo de benefício"
      >
        {selectedTipo && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome</label>
                <p className="text-sm">{selectedTipo.nome}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                <div className="flex items-center gap-2">
                  {getCategoriaIcon(selectedTipo.categoria)}
                  <span className="text-sm">{getCategoriaLabel(selectedTipo.categoria)}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm">{selectedTipo.is_active ? 'Ativo' : 'Inativo'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Criado em</label>
                <p className="text-sm">{new Date(selectedTipo.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            {selectedTipo.descricao && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                <p className="text-sm">{selectedTipo.descricao}</p>
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
