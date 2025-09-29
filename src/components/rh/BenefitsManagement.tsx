import React, { useState } from 'react';
import { Benefit, BenefitInsert, BenefitUpdate } from '@/integrations/supabase/rh-types-export';
import { useBenefits } from '@/hooks/rh';
import { BenefitsTable } from './BenefitsTable';
import { BenefitsForm } from './BenefitsForm';
import { FormModal } from './FormModal';
import { Button } from '@/components/ui/button';
import { Plus, Gift, DollarSign, Tag, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BenefitsManagementProps {
  companyId: string;
  className?: string;
}

export function BenefitsManagement({ companyId, className = '' }: BenefitsManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const { toast } = useToast();

  const {
    benefits,
    isLoading,
    error,
    createBenefit,
    updateBenefit,
    deleteBenefit,
  } = useBenefits(companyId);

  const handleCreate = async (data: BenefitInsert) => {
    try {
      await createBenefit.mutateAsync({
        ...data,
        company_id: companyId,
        is_active: data.is_active ?? true,
        valor: data.valor ?? 0,
        percentual: data.percentual ?? 0,
      });
      setIsCreateModalOpen(false);
      toast({
        title: 'Sucesso!',
        description: 'Benefício criado com sucesso.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao criar benefício:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível criar o benefício.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (data: BenefitUpdate) => {
    try {
      await updateBenefit.mutateAsync({
        ...data,
        id: selectedBenefit?.id || '',
      });
      setIsEditModalOpen(false);
      setSelectedBenefit(null);
      toast({
        title: 'Sucesso!',
        description: 'Benefício atualizado com sucesso.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao atualizar benefício:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível atualizar o benefício.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (benefit: Benefit) => {
    try {
      await deleteBenefit.mutateAsync(benefit.id);
      toast({
        title: 'Sucesso!',
        description: 'Benefício excluído com sucesso.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao excluir benefício:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível excluir o benefício.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
    setIsEditModalOpen(true);
  };

  const handleView = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
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
    setSelectedBenefit(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedBenefit(null);
  };

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-destructive mb-4">
          <p>Erro ao carregar benefícios</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Calcular estatísticas
  const totalBenefits = benefits.length;
  const activeBenefits = benefits.filter(b => b.is_active).length;
  const fixedValueBenefits = benefits.filter(b => b.tipo === 'valor_fixo').length;
  const percentageBenefits = benefits.filter(b => b.tipo === 'percentual').length;
  const totalFixedValue = benefits
    .filter(b => b.tipo === 'valor_fixo')
    .reduce((sum, b) => sum + (b.valor || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Benefícios</p>
              <p className="text-2xl font-bold">{totalBenefits}</p>
            </div>
            <Gift className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Benefícios Ativos</p>
              <p className="text-2xl font-bold text-green-600">{activeBenefits}</p>
            </div>
            <Tag className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Fixo</p>
              <p className="text-2xl font-bold text-orange-600">{fixedValueBenefits}</p>
            </div>
            <DollarSign className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Total Fixo</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalFixedValue)}</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Benefícios</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os benefícios oferecidos pela empresa
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Benefício
        </Button>
      </div>

      {/* Tabela */}
      <BenefitsTable
        data={benefits}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
      />

      {/* Modal de Criação */}
      <FormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Novo Benefício"
        description="Crie um novo benefício para a empresa"
      >
        <BenefitsForm
          onSubmit={handleCreate}
          onCancel={handleCloseCreateModal}
          companyId={companyId}
        />
      </FormModal>

      {/* Modal de Edição */}
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Benefício"
        description="Edite as informações do benefício"
      >
        {selectedBenefit && (
          <BenefitsForm
            initialData={selectedBenefit}
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
        title="Detalhes do Benefício"
        description="Visualize as informações completas do benefício"
      >
        {selectedBenefit && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome</label>
                <p className="text-sm">{selectedBenefit.nome}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                <p className="text-sm">
                  {selectedBenefit.tipo === 'valor_fixo' ? 'Valor Fixo' : 'Percentual'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor</label>
                <p className="text-sm">
                  {selectedBenefit.tipo === 'valor_fixo' 
                    ? formatCurrency(selectedBenefit.valor || 0)
                    : `${selectedBenefit.valor || 0}%`
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                <p className="text-sm">{selectedBenefit.percentual ? 'Percentual' : 'Valor Fixo'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm">{selectedBenefit.is_active ? 'Ativo' : 'Inativo'}</p>
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
