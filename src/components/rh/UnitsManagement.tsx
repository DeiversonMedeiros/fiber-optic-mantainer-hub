// @ts-nocheck
import React, { useState } from 'react';
import { useUnits } from '@/hooks/rh/useUnits';
import { Unit, UnitInsert, UnitUpdate } from '@/integrations/supabase/rh-types';
import { UnitsTable } from './UnitsTable';
import { UnitsForm } from './UnitsForm';
import { FormModal } from './FormModal';
import { OrganogramViewComponent } from './OrganogramView';
import { Button } from '@/components/ui/button';
import { Plus, Building2, Search, TreePine, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UnitsManagementProps {
  companyId: string;
  className?: string;
}

export function UnitsManagement({ companyId, className = '' }: UnitsManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const {
    units,
    unitsForSelect,
    isLoading,
    error,
    createUnit,
    updateUnit,
    deleteUnit,
    moveUnit,
    refetch,
  } = useUnits({ companyId });

  // Filtrar unidades
  const filteredUnits = units.filter(unit => 
    unit.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (unit.descricao && unit.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Organizar unidades em árvore
  const buildTree = (units: Unit[], parentId: string | null = null): Unit[] => {
    return units
      .filter(unit => unit.parent_id === parentId)
      .map(unit => ({
        ...unit,
        children: buildTree(units, unit.id)
      }));
  };

  const treeUnits = buildTree(filteredUnits);

  const handleCreate = async (data: UnitInsert) => {
    try {
      await createUnit.mutateAsync(data);
      setIsCreateModalOpen(false);
      toast({
        title: 'Sucesso!',
        description: 'Unidade criada com sucesso.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao criar unidade:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível criar a unidade.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async (data: UnitUpdate) => {
    if (!selectedUnit) return;

    try {
      await updateUnit.mutateAsync({
        id: selectedUnit.id,
        data,
      });
      setIsEditModalOpen(false);
      setSelectedUnit(null);
      toast({
        title: 'Sucesso!',
        description: 'Unidade atualizada com sucesso.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao atualizar unidade:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível atualizar a unidade.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUnit.mutateAsync(id);
      toast({
        title: 'Sucesso!',
        description: 'Unidade excluída com sucesso.',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Erro ao excluir unidade:', error);
      toast({
        title: 'Erro!',
        description: error.message || 'Não foi possível excluir a unidade.',
        variant: 'destructive',
      });
    }
  };

  const handleMove = async (id: string, newParentId: string | null) => {
    try {
      await moveUnit.mutateAsync({ id, newParentId });
      toast({
        title: 'Sucesso!',
        description: 'Unidade movida com sucesso.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erro ao mover unidade:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível mover a unidade.',
        variant: 'destructive',
      });
    }
  };

  const handleView = (unit: Unit) => {
    setSelectedUnit(unit);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (unit: Unit) => {
    setSelectedUnit(unit);
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-full animate-pulse mx-auto mb-2"></div>
          <p className="text-muted-foreground">Carregando unidades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive">Erro ao carregar unidades: {error.message}</p>
        <Button onClick={() => refetch()} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Abas para diferentes visualizações */}
      <Tabs defaultValue="organogram" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="organogram" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>Visualização</span>
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>Gestão de Unidades</span>
          </TabsTrigger>
        </TabsList>

        {/* Aba do Organograma Visual */}
        <TabsContent value="organogram" className="mt-6">
          <OrganogramViewComponent companyId={companyId} />
        </TabsContent>

        {/* Aba de Gestão de Unidades */}
        <TabsContent value="management" className="mt-6">
          {/* Header com estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Unidades</CardTitle>
                <Building2 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{units.length}</div>
                <p className="text-xs text-muted-foreground">Unidades ativas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Níveis Hierárquicos</CardTitle>
                <TreePine className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {Math.max(...units.map(u => u.nivel_hierarquico || 1))}
                </div>
                <p className="text-xs text-muted-foreground">Níveis de hierarquia</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unidades Raiz</CardTitle>
                <Building2 className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {units.filter(u => !u.parent_id).length}
                </div>
                <p className="text-xs text-muted-foreground">Unidades principais</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros e ações */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <CardTitle>Gestão de Unidades</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar unidades..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-full sm:w-64"
                    />
                  </div>
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Unidade
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <UnitsTable
                units={treeUnits}
                onEdit={handleEditClick}
                onDelete={handleDelete}
                onView={handleView}
                onMove={handleMove}
                isLoading={isLoading}
                unitsForSelect={unitsForSelect}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modais */}
      <FormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Nova Unidade"
      >
        <UnitsForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
          unitsForSelect={unitsForSelect}
        />
      </FormModal>

      <FormModal
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) setSelectedUnit(null);
        }}
        title="Editar Unidade"
      >
        {selectedUnit && (
          <UnitsForm
            unit={selectedUnit}
            onSubmit={handleEdit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedUnit(null);
            }}
            unitsForSelect={unitsForSelect}
          />
        )}
      </FormModal>

      <FormModal
        open={isViewModalOpen}
        onOpenChange={(open) => {
          setIsViewModalOpen(open);
          if (!open) setSelectedUnit(null);
        }}
        title="Visualizar Unidade"
      >
        {selectedUnit && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Código</label>
                <p className="text-sm">{selectedUnit.codigo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome</label>
                <p className="text-sm">{selectedUnit.nome}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                <p className="text-sm">{selectedUnit.descricao || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nível Hierárquico</label>
                <p className="text-sm">{selectedUnit.nivel_hierarquico}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Unidade Pai</label>
                <p className="text-sm">
                  {selectedUnit.parent ? 
                    `${selectedUnit.parent.codigo} - ${selectedUnit.parent.nome}` : 
                    'Unidade raiz'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <Badge variant={selectedUnit.is_active ? 'default' : 'secondary'}>
                  {selectedUnit.is_active ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </FormModal>
    </div>
  );
}
