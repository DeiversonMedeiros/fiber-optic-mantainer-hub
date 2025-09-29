import React, { useState } from 'react';
import { useRubricas, useNaturezasESocial } from '@/hooks/rh/useRubricas';
import { Rubrica, RubricaInsert, RubricaUpdate } from '@/integrations/supabase/rh-types';
import { RubricasTable } from './RubricasTable';
import { RubricasForm } from './RubricasForm';
import { FormModal } from './FormModal';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, Tag, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RubricasManagementProps {
  companyId: string;
  className?: string;
}

export function RubricasManagement({ companyId, className = '' }: RubricasManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRubrica, setSelectedRubrica] = useState<Rubrica | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'provento' | 'desconto'>('all');
  const { toast } = useToast();

  const {
    rubricas,
    isLoading,
    error,
    createRubrica,
    updateRubrica,
    deleteRubrica,
    refetch,
  } = useRubricas({ companyId });

  const { naturezas } = useNaturezasESocial(companyId);

  // Filtrar rubricas
  const filteredRubricas = rubricas.filter(rubrica => {
    const matchesSearch = rubrica.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rubrica.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || rubrica.tipo === filterType;
    return matchesSearch && matchesType;
  });

  const handleCreate = async (data: RubricaInsert) => {
    try {
      await createRubrica.mutateAsync(data);
      setIsCreateModalOpen(false);
      toast({
        title: 'Sucesso!',
        description: 'Rubrica criada com sucesso.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao criar rubrica:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível criar a rubrica.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async (data: RubricaUpdate) => {
    if (!selectedRubrica) return;

    try {
      await updateRubrica.mutateAsync({
        id: selectedRubrica.id,
        data,
      });
      setIsEditModalOpen(false);
      setSelectedRubrica(null);
      toast({
        title: 'Sucesso!',
        description: 'Rubrica atualizada com sucesso.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao atualizar rubrica:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível atualizar a rubrica.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRubrica.mutateAsync(id);
      toast({
        title: 'Sucesso!',
        description: 'Rubrica excluída com sucesso.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao excluir rubrica:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível excluir a rubrica.',
        variant: 'destructive',
      });
    }
  };

  const handleView = (rubrica: Rubrica) => {
    setSelectedRubrica(rubrica);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (rubrica: Rubrica) => {
    setSelectedRubrica(rubrica);
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-full animate-pulse mx-auto mb-2"></div>
          <p className="text-muted-foreground">Carregando rubricas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive">Erro ao carregar rubricas: {error.message}</p>
        <Button onClick={() => refetch()} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Rubricas</CardTitle>
            <Tag className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rubricas.length}</div>
            <p className="text-xs text-muted-foreground">Rubricas ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proventos</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {rubricas.filter(r => r.tipo === 'provento').length}
            </div>
            <p className="text-xs text-muted-foreground">Rubricas de provento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descontos</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {rubricas.filter(r => r.tipo === 'desconto').length}
            </div>
            <p className="text-xs text-muted-foreground">Rubricas de desconto</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e ações */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle>Gestão de Rubricas</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar rubricas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full sm:w-64"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'provento' | 'desconto')}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="all">Todos os tipos</option>
                  <option value="provento">Proventos</option>
                  <option value="desconto">Descontos</option>
                </select>
              </div>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Rubrica
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <RubricasTable
            rubricas={filteredRubricas}
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
        title="Nova Rubrica"
      >
        <RubricasForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
          naturezas={naturezas}
        />
      </FormModal>

      <FormModal
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) setSelectedRubrica(null);
        }}
        title="Editar Rubrica"
      >
        {selectedRubrica && (
          <RubricasForm
            rubrica={selectedRubrica}
            onSubmit={handleEdit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedRubrica(null);
            }}
            naturezas={naturezas}
          />
        )}
      </FormModal>

      <FormModal
        open={isViewModalOpen}
        onOpenChange={(open) => {
          setIsViewModalOpen(open);
          if (!open) setSelectedRubrica(null);
        }}
        title="Visualizar Rubrica"
      >
        {selectedRubrica && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Código</label>
                <p className="text-sm">{selectedRubrica.codigo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                <p className="text-sm capitalize">{selectedRubrica.tipo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                <p className="text-sm">{selectedRubrica.descricao}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Natureza eSocial</label>
                <p className="text-sm">
                  {selectedRubrica.natureza_esocial_id ? `ID: ${selectedRubrica.natureza_esocial_id}` : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Referência</label>
                <p className="text-sm">{selectedRubrica.referencia || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Unidade</label>
                <p className="text-sm">{selectedRubrica.unidade || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}
      </FormModal>
    </div>
  );
}
