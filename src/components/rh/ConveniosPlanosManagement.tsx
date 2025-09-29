import React, { useState } from 'react';
import { ConvenioEmpresa, ConvenioPlano, ConvenioPlanoInsert, ConvenioPlanoUpdate } from '@/integrations/supabase/rh-types';
import { useConveniosEmpresas } from '@/hooks/rh/useConveniosEmpresas';
import { useConveniosPlanos } from '@/hooks/rh/useConveniosPlanos';
import { ConveniosPlanosTable } from './ConveniosPlanosTable';
import { ConveniosPlanosForm } from './ConveniosPlanosForm';
import { FormModal } from './FormModal';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, CreditCard, DollarSign, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConveniosPlanosManagementProps {
  companyId: string;
  className?: string;
}

export function ConveniosPlanosManagement({ companyId, className = '' }: ConveniosPlanosManagementProps) {
  const [selectedConvenioEmpresaId, setSelectedConvenioEmpresaId] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPlano, setSelectedPlano] = useState<ConvenioPlano | null>(null);
  const { toast } = useToast();

  const {
    conveniosEmpresas,
    isLoading: isLoadingConvenios,
  } = useConveniosEmpresas(companyId);

  const {
    conveniosPlanos,
    isLoading: isLoadingPlanos,
    error,
    createConvenioPlano,
    updateConvenioPlano,
    deleteConvenioPlano,
  } = useConveniosPlanos(selectedConvenioEmpresaId);

  const handleCreate = async (data: ConvenioPlanoInsert) => {
    try {
      await createConvenioPlano.mutateAsync({
        ...data,
        convenio_empresa_id: selectedConvenioEmpresaId,
        is_active: data.is_active ?? true,
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar plano do convênio:', error);
    }
  };

  const handleUpdate = async (data: ConvenioPlanoUpdate) => {
    try {
      await updateConvenioPlano.mutateAsync({
        ...data,
        id: selectedPlano?.id || '',
      });
      setIsEditModalOpen(false);
      setSelectedPlano(null);
    } catch (error) {
      console.error('Erro ao atualizar plano do convênio:', error);
    }
  };

  const handleDelete = async (plano: ConvenioPlano) => {
    try {
      await deleteConvenioPlano.mutateAsync(plano.id);
    } catch (error) {
      console.error('Erro ao excluir plano do convênio:', error);
    }
  };

  const handleEdit = (plano: ConvenioPlano) => {
    setSelectedPlano(plano);
    setIsEditModalOpen(true);
  };

  const handleView = (plano: ConvenioPlano) => {
    setSelectedPlano(plano);
    setIsViewModalOpen(true);
  };

  const handleCreateClick = () => {
    if (!selectedConvenioEmpresaId) {
      toast({
        title: 'Atenção!',
        description: 'Selecione um convênio empresa primeiro.',
        variant: 'destructive',
      });
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedPlano(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedPlano(null);
  };

  const getTipoPlanoLabel = (tipo: string) => {
    switch (tipo) {
      case 'basico':
        return 'Básico';
      case 'intermediario':
        return 'Intermediário';
      case 'master':
        return 'Master';
      case 'premium':
        return 'Premium';
      case 'executivo':
        return 'Executivo';
      default:
        return tipo;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filtro de Convênio Empresa */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <label className="text-sm font-medium text-muted-foreground">Selecione o Convênio Empresa</label>
          <Select value={selectedConvenioEmpresaId} onValueChange={setSelectedConvenioEmpresaId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um convênio empresa" />
            </SelectTrigger>
            <SelectContent>
              {conveniosEmpresas.map((convenio) => (
                <SelectItem key={convenio.id} value={convenio.id}>
                  {convenio.nome} - {convenio.prestador}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button 
          onClick={handleCreateClick}
          disabled={!selectedConvenioEmpresaId}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {error && (
        <div className="text-center py-8">
          <div className="text-destructive mb-4">
            <p>Erro ao carregar planos do convênio</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </div>
      )}

      {selectedConvenioEmpresaId && (
        <>
          {/* Estatísticas dos Planos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Planos</p>
                  <p className="text-2xl font-bold">{conveniosPlanos.length}</p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Planos Ativos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {conveniosPlanos.filter(p => p.is_active).length}
                  </p>
                </div>
                <Settings className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor Médio Titular</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(
                      conveniosPlanos.length > 0 
                        ? conveniosPlanos.reduce((sum, p) => sum + (p.valor_titular || 0), 0) / conveniosPlanos.length
                        : 0
                    )}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
            </div>

            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor Médio Dependente</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(
                      conveniosPlanos.length > 0 
                        ? conveniosPlanos.reduce((sum, p) => sum + (p.valor_dependente || 0), 0) / conveniosPlanos.length
                        : 0
                    )}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Tabela de Planos */}
          <ConveniosPlanosTable
            data={conveniosPlanos}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            isLoading={isLoadingPlanos}
          />
        </>
      )}

      {/* Modal de Criação */}
      <FormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Novo Plano do Convênio"
        description="Cadastre um novo plano para o convênio selecionado"
      >
        <ConveniosPlanosForm
          onSubmit={handleCreate}
          onCancel={handleCloseCreateModal}
          convenioEmpresaId={selectedConvenioEmpresaId}
        />
      </FormModal>

      {/* Modal de Edição */}
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Plano do Convênio"
        description="Edite as informações do plano"
      >
        {selectedPlano && (
          <ConveniosPlanosForm
            initialData={selectedPlano}
            onSubmit={handleUpdate}
            onCancel={handleCloseEditModal}
            convenioEmpresaId={selectedConvenioEmpresaId}
          />
        )}
      </FormModal>

      {/* Modal de Visualização */}
      <FormModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        title="Detalhes do Plano"
        description="Visualize as informações completas do plano"
      >
        {selectedPlano && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome do Plano</label>
                <p className="text-sm">{selectedPlano.nome}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo do Plano</label>
                <p className="text-sm">{getTipoPlanoLabel(selectedPlano.tipo_plano)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor Titular</label>
                <p className="text-sm">{formatCurrency(selectedPlano.valor_titular || 0)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor Dependente</label>
                <p className="text-sm">{formatCurrency(selectedPlano.valor_dependente || 0)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor Coparticipação</label>
                <p className="text-sm">{formatCurrency(selectedPlano.valor_coparticipacao || 0)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm">{selectedPlano.is_active ? 'Ativo' : 'Inativo'}</p>
              </div>
            </div>
            {selectedPlano.descricao && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                <p className="text-sm">{selectedPlano.descricao}</p>
              </div>
            )}
            {selectedPlano.cobertura && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cobertura</label>
                <p className="text-sm">{selectedPlano.cobertura}</p>
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

