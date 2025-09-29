// @ts-nocheck
import React, { useState } from 'react';
import { Union, UnionInsert, UnionUpdate } from '@/integrations/supabase/rh-types';
import { useUnions } from '@/hooks/rh';
import { UnionTable } from './UnionTable';
import { UnionForm } from './UnionForm';
import { FormModal } from './FormModal';
import { Button } from '@/components/ui/button';
import { Plus, Building2, Users, MapPin, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UnionManagementProps {
  companyId: string;
  className?: string;
}

export function UnionManagement({ companyId, className = '' }: UnionManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUnion, setSelectedUnion] = useState<Union | null>(null);
  const { toast } = useToast();

  const {
    unions,
    isLoading,
    error,
    createUnion,
    updateUnion,
    deleteUnion,
    refetch,
  } = useUnions(companyId);

  const handleCreate = async (data: UnionInsert) => {
    try {
      await createUnion(data);
      setIsCreateModalOpen(false);
      toast({
        title: 'Sucesso!',
        description: 'Sindicato criado com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao criar sindicato:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível criar o sindicato.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (data: UnionUpdate) => {
    try {
      await updateUnion(data);
      setIsEditModalOpen(false);
      setSelectedUnion(null);
      toast({
        title: 'Sucesso!',
        description: 'Sindicato atualizado com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar sindicato:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível atualizar o sindicato.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (union: Union) => {
    try {
      await deleteUnion(union.id);
      toast({
        title: 'Sucesso!',
        description: 'Sindicato excluído com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao excluir sindicato:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível excluir o sindicato.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (union: Union) => {
    setSelectedUnion(union);
    setIsEditModalOpen(true);
  };

  const handleView = (union: Union) => {
    setSelectedUnion(union);
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
    setSelectedUnion(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedUnion(null);
  };

  if (isLoading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <div className="w-8 h-8 bg-white rounded-full"></div>
        </div>
        <p className="text-muted-foreground">Carregando sindicatos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-destructive mb-4">
          <p>Erro ao carregar sindicatos</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Calcular estatísticas
  const totalUnions = unions?.length || 0;
  const activeUnions = unions?.filter(u => u.is_active).length || 0;
  const unionsWithAddress = unions?.filter(u => u.endereco).length || 0;
  const unionsWithContact = unions?.filter(u => u.contato).length || 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Sindicatos</p>
              <p className="text-2xl font-bold">{totalUnions}</p>
            </div>
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sindicatos Ativos</p>
              <p className="text-2xl font-bold text-green-600">{activeUnions}</p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Com Endereço</p>
              <p className="text-2xl font-bold text-orange-600">{unionsWithAddress}</p>
            </div>
            <MapPin className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Com Contato</p>
              <p className="text-2xl font-bold text-purple-600">{unionsWithContact}</p>
            </div>
            <Phone className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Sindicatos</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os sindicatos relacionados à empresa
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Sindicato
        </Button>
      </div>

      {/* Tabela */}
      <UnionTable
        data={unions || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
      />

      {/* Modal de Criação */}
      <FormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Novo Sindicato"
        description="Cadastre um novo sindicato"
      >
        <UnionForm
          onSubmit={handleCreate}
          onCancel={handleCloseCreateModal}
          companyId={companyId}
        />
      </FormModal>

      {/* Modal de Edição */}
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Sindicato"
        description="Edite as informações do sindicato"
      >
        {selectedUnion && (
          <UnionForm
            initialData={selectedUnion}
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
        title="Detalhes do Sindicato"
        description="Visualize as informações completas do sindicato"
      >
        {selectedUnion && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome</label>
                <p className="text-sm">{selectedUnion.nome}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">CNPJ</label>
                <p className="text-sm">{selectedUnion.cnpj || 'Não informado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm">{selectedUnion.is_active ? 'Ativo' : 'Inativo'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Contato</label>
                <p className="text-sm">{selectedUnion.contato || 'Não informado'}</p>
              </div>
            </div>
            {selectedUnion.endereco && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Endereço</label>
                <p className="text-sm">{selectedUnion.endereco}</p>
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




















