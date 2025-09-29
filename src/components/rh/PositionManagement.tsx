// @ts-nocheck
import React, { useState } from 'react';
import { Position, PositionInsert, PositionUpdate } from '@/integrations/supabase/rh-types';
import { usePositions } from '@/hooks/rh';
import { PositionTable } from './PositionTable';
import { PositionForm } from './PositionForm';
import { FormModal } from './FormModal';
import { Button } from '@/components/ui/button';
import { Plus, Briefcase, Building2, Target, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PositionManagementProps {
  companyId: string;
  className?: string;
}

export function PositionManagement({ companyId, className = '' }: PositionManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const { toast } = useToast();

  const {
    positions,
    isLoading,
    error,
    createPosition,
    updatePosition,
    deletePosition,
    refetch,
  } = usePositions(companyId);

  const handleCreate = async (data: PositionInsert) => {
    try {
      await createPosition(data);
      setIsCreateModalOpen(false);
      toast({
        title: 'Sucesso!',
        description: 'Cargo criado com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao criar cargo:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível criar o cargo.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (data: PositionUpdate) => {
    try {
      await updatePosition(data);
      setIsEditModalOpen(false);
      setSelectedPosition(null);
      toast({
        title: 'Sucesso!',
        description: 'Cargo atualizado com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar cargo:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível atualizar o cargo.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (position: Position) => {
    try {
      await deletePosition(position.id);
      toast({
        title: 'Sucesso!',
        description: 'Cargo excluído com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao excluir cargo:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível excluir o cargo.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (position: Position) => {
    setSelectedPosition(position);
    setIsEditModalOpen(true);
  };

  const handleView = (position: Position) => {
    setSelectedPosition(position);
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
    setSelectedPosition(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedPosition(null);
  };

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-destructive mb-4">
          <p>Erro ao carregar cargos</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Calcular estatísticas
  const totalPositions = positions.length;
  const activePositions = positions.filter(p => p.is_active).length;
  const uniqueLevels = new Set(positions.map(p => p.nivel_hierarquico)).size;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Cargos</p>
              <p className="text-2xl font-bold">{totalPositions}</p>
            </div>
            <Briefcase className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cargos Ativos</p>
              <p className="text-2xl font-bold text-green-600">{activePositions}</p>
            </div>
            <Target className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Níveis Hierárquicos</p>
              <p className="text-2xl font-bold text-orange-600">{uniqueLevels}</p>
            </div>
            <Building2 className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Funcionários Vinculados</p>
              <p className="text-2xl font-bold text-purple-600">0</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Cargos</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os cargos e posições da empresa
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cargo
        </Button>
      </div>

      {/* Tabela */}
      <PositionTable
        data={positions}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
      />

      {/* Modal de Criação */}
      <FormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Novo Cargo"
        description="Crie um novo cargo para a empresa"
        size="lg"
      >
        <PositionForm
          onSubmit={handleCreate}
          onCancel={handleCloseCreateModal}
        />
      </FormModal>

      {/* Modal de Edição */}
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Cargo"
        description="Edite as informações do cargo"
        size="lg"
      >
        {selectedPosition && (
          <PositionForm
            position={selectedPosition}
            onSubmit={handleUpdate}
            onCancel={handleCloseEditModal}
          />
        )}
      </FormModal>

      {/* Modal de Visualização */}
      <FormModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        title="Detalhes do Cargo"
        description="Visualize as informações completas do cargo"
        size="lg"
      >
        {selectedPosition && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Código</label>
                <p className="text-sm">{selectedPosition.codigo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome</label>
                <p className="text-sm">{selectedPosition.nome}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nível Hierárquico</label>
                <p className="text-sm">{selectedPosition.nivel_hierarquico || 'Não definido'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm">{selectedPosition.is_active ? 'Ativo' : 'Inativo'}</p>
              </div>
            </div>
            {selectedPosition.descricao && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                <p className="text-sm">{selectedPosition.descricao}</p>
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
