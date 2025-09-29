import React, { useState } from 'react';
import { useDeficiencyTypes } from '@/hooks/rh/usePcdDependents';
import { DeficiencyType, DeficiencyTypeInsert, DeficiencyTypeUpdate } from '@/integrations/supabase/rh-types';
import { DeficiencyTypesTable } from './DeficiencyTypesTable';
import { DeficiencyTypesForm } from './DeficiencyTypesForm';
import { FormModal } from './FormModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeficiencyTypesManagementProps {
  companyId: string;
  className?: string;
}

export function DeficiencyTypesManagement({ companyId, className = '' }: DeficiencyTypesManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDeficiencyType, setSelectedDeficiencyType] = useState<DeficiencyType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();

  const {
    deficiencyTypes,
    isLoading,
    error,
    createDeficiencyType,
    updateDeficiencyType,
    deleteDeficiencyType,
    refetch,
  } = useDeficiencyTypes(companyId);

  // Filtrar tipos de deficiência
  const filteredDeficiencyTypes = deficiencyTypes.filter(deficiencyType =>
    deficiencyType.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deficiencyType.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (data: DeficiencyTypeInsert) => {
    try {
      await createDeficiencyType.mutateAsync(data);
      setIsCreateModalOpen(false);
      toast({
        title: 'Sucesso',
        description: 'Tipo de deficiência criado com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar tipo de deficiência. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async (data: DeficiencyTypeUpdate) => {
    if (!selectedDeficiencyType) return;
    
    try {
      await updateDeficiencyType.mutateAsync({
        id: selectedDeficiencyType.id,
        data,
      });
      setIsEditModalOpen(false);
      setSelectedDeficiencyType(null);
      toast({
        title: 'Sucesso',
        description: 'Tipo de deficiência atualizado com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar tipo de deficiência. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDeficiencyType.mutateAsync(id);
      toast({
        title: 'Sucesso',
        description: 'Tipo de deficiência excluído com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir tipo de deficiência. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleEditClick = (deficiencyType: DeficiencyType) => {
    setSelectedDeficiencyType(deficiencyType);
    setIsEditModalOpen(true);
  };

  const handleView = (deficiencyType: DeficiencyType) => {
    setSelectedDeficiencyType(deficiencyType);
    setIsViewModalOpen(true);
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">Erro ao carregar tipos de deficiência</p>
        <Button onClick={() => refetch()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">Tipos de Deficiência</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar tipos de deficiência..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Tipo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DeficiencyTypesTable
            deficiencyTypes={filteredDeficiencyTypes}
            onEdit={handleEditClick}
            onDelete={handleDelete}
            onView={handleView}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Modais */}
      <FormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Novo Tipo de Deficiência"
      >
        <DeficiencyTypesForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </FormModal>

      <FormModal
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) setSelectedDeficiencyType(null);
        }}
        title="Editar Tipo de Deficiência"
      >
        {selectedDeficiencyType && (
          <DeficiencyTypesForm
            deficiencyType={selectedDeficiencyType}
            onSubmit={handleEdit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedDeficiencyType(null);
            }}
          />
        )}
      </FormModal>

      <FormModal
        open={isViewModalOpen}
        onOpenChange={(open) => {
          setIsViewModalOpen(open);
          if (!open) setSelectedDeficiencyType(null);
        }}
        title="Visualizar Tipo de Deficiência"
      >
        {selectedDeficiencyType && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Código</label>
                <p className="text-sm">{selectedDeficiencyType.codigo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm">
                  {selectedDeficiencyType.is_active ? 'Ativo' : 'Inativo'}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Descrição</label>
              <p className="text-sm">{selectedDeficiencyType.descricao}</p>
            </div>
          </div>
        )}
      </FormModal>
    </div>
  );
}





















