import React, { useState } from 'react';
import { Convenio, ConvenioInsert, ConvenioUpdate } from '@/integrations/supabase/rh-types';
import { useConvenios } from '@/hooks/rh/useConvenios';
import { ConveniosTable } from './ConveniosTable';
import { ConveniosForm } from './ConveniosForm';
import { FormModal } from './FormModal';
import { Button } from '@/components/ui/button';
import { Plus, Stethoscope, Building2, Users, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConveniosManagementProps {
  companyId: string;
  className?: string;
}

export function ConveniosManagement({ companyId, className = '' }: ConveniosManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedConvenio, setSelectedConvenio] = useState<Convenio | null>(null);
  const { toast } = useToast();

  const {
    convenios,
    isLoading,
    error,
    createConvenio,
    updateConvenio,
    deleteConvenio,
  } = useConvenios(companyId);

  const handleCreate = async (data: ConvenioInsert) => {
    try {
      await createConvenio.mutateAsync({
        ...data,
        company_id: companyId,
        is_active: data.is_active ?? true,
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar convênio:', error);
    }
  };

  const handleUpdate = async (data: ConvenioUpdate) => {
    try {
      await updateConvenio.mutateAsync({
        ...data,
        id: selectedConvenio?.id || '',
      });
      setIsEditModalOpen(false);
      setSelectedConvenio(null);
    } catch (error) {
      console.error('Erro ao atualizar convênio:', error);
    }
  };

  const handleDelete = async (convenio: Convenio) => {
    try {
      await deleteConvenio.mutateAsync(convenio.id);
    } catch (error) {
      console.error('Erro ao excluir convênio:', error);
    }
  };

  const handleEdit = (convenio: Convenio) => {
    setSelectedConvenio(convenio);
    setIsEditModalOpen(true);
  };

  const handleView = (convenio: Convenio) => {
    setSelectedConvenio(convenio);
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
    setSelectedConvenio(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedConvenio(null);
  };

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-destructive mb-4">
          <p>Erro ao carregar convênios</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Calcular estatísticas
  const totalConvenios = convenios.length;
  const activeConvenios = convenios.filter(c => c.is_active).length;
  const medicosConvenios = convenios.filter(c => c.tipo === 'medico').length;
  const odontologicosConvenios = convenios.filter(c => c.tipo === 'odontologico').length;
  const ambosConvenios = convenios.filter(c => c.tipo === 'ambos').length;
  const totalValorMensal = convenios
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
      case 'medico':
        return 'Médico';
      case 'odontologico':
        return 'Odontológico';
      case 'ambos':
        return 'Médico + Odontológico';
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
              <p className="text-sm font-medium text-muted-foreground">Total de Convênios</p>
              <p className="text-2xl font-bold">{totalConvenios}</p>
            </div>
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Convênios Ativos</p>
              <p className="text-2xl font-bold text-green-600">{activeConvenios}</p>
            </div>
            <Stethoscope className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Médicos</p>
              <p className="text-2xl font-bold text-orange-600">{medicosConvenios}</p>
            </div>
            <Stethoscope className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Odontológicos</p>
              <p className="text-2xl font-bold text-purple-600">{odontologicosConvenios}</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
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
          <h2 className="text-lg font-semibold">Convênios Médicos e Odontológicos</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os convênios de saúde oferecidos pela empresa
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Convênio
        </Button>
      </div>

      {/* Tabela */}
      <ConveniosTable
        data={convenios}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
      />

      {/* Modal de Criação */}
      <FormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Novo Convênio"
        description="Cadastre um novo convênio médico ou odontológico"
      >
        <ConveniosForm
          onSubmit={handleCreate}
          onCancel={handleCloseCreateModal}
          companyId={companyId}
        />
      </FormModal>

      {/* Modal de Edição */}
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Convênio"
        description="Edite as informações do convênio"
      >
        {selectedConvenio && (
          <ConveniosForm
            initialData={selectedConvenio}
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
        title="Detalhes do Convênio"
        description="Visualize as informações completas do convênio"
      >
        {selectedConvenio && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome</label>
                <p className="text-sm">{selectedConvenio.nome}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                <p className="text-sm">{getTipoLabel(selectedConvenio.tipo)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Prestador</label>
                <p className="text-sm">{selectedConvenio.prestador}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">CNPJ</label>
                <p className="text-sm">{selectedConvenio.cnpj || 'Não informado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor Mensal</label>
                <p className="text-sm">{formatCurrency(selectedConvenio.valor_mensal || 0)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor por Funcionário</label>
                <p className="text-sm">{formatCurrency(selectedConvenio.valor_por_funcionario || 0)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm">{selectedConvenio.is_active ? 'Ativo' : 'Inativo'}</p>
              </div>
            </div>
            {selectedConvenio.cobertura && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cobertura</label>
                <p className="text-sm">{selectedConvenio.cobertura}</p>
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

