import React, { useState } from 'react';
import { ConvenioEmpresa, ConvenioEmpresaInsert, ConvenioEmpresaUpdate } from '@/integrations/supabase/rh-types';
import { useConveniosEmpresas } from '@/hooks/rh/useConveniosEmpresas';
import { ConveniosEmpresasTable } from './ConveniosEmpresasTable';
import { ConveniosEmpresasForm } from './ConveniosEmpresasForm';
import { ConveniosPlanosManagement } from './ConveniosPlanosManagement';
import { FormModal } from './FormModal';
import { Button } from '@/components/ui/button';
import { Plus, Stethoscope, Building2, Users, DollarSign, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ConveniosEmpresasManagementProps {
  companyId: string;
  className?: string;
}

export function ConveniosEmpresasManagement({ companyId, className = '' }: ConveniosEmpresasManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedConvenio, setSelectedConvenio] = useState<ConvenioEmpresa | null>(null);
  const { toast } = useToast();

  const {
    conveniosEmpresas,
    isLoading,
    error,
    createConvenioEmpresa,
    updateConvenioEmpresa,
    deleteConvenioEmpresa,
  } = useConveniosEmpresas(companyId);

  const handleCreate = async (data: ConvenioEmpresaInsert) => {
    try {
      await createConvenioEmpresa.mutateAsync({
        ...data,
        company_id: companyId,
        is_active: data.is_active ?? true,
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar convênio empresa:', error);
    }
  };

  const handleUpdate = async (data: ConvenioEmpresaUpdate) => {
    try {
      await updateConvenioEmpresa.mutateAsync({
        ...data,
        id: selectedConvenio?.id || '',
      });
      setIsEditModalOpen(false);
      setSelectedConvenio(null);
    } catch (error) {
      console.error('Erro ao atualizar convênio empresa:', error);
    }
  };

  const handleDelete = async (convenio: ConvenioEmpresa) => {
    try {
      await deleteConvenioEmpresa.mutateAsync(convenio.id);
    } catch (error) {
      console.error('Erro ao excluir convênio empresa:', error);
    }
  };

  const handleEdit = (convenio: ConvenioEmpresa) => {
    setSelectedConvenio(convenio);
    setIsEditModalOpen(true);
  };

  const handleView = (convenio: ConvenioEmpresa) => {
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
          <p>Erro ao carregar convênios empresas</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Calcular estatísticas
  const totalConvenios = conveniosEmpresas.length;
  const activeConvenios = conveniosEmpresas.filter(c => c.is_active).length;
  const medicosConvenios = conveniosEmpresas.filter(c => c.tipo === 'medico').length;
  const odontologicosConvenios = conveniosEmpresas.filter(c => c.tipo === 'odontologico').length;
  const ambosConvenios = conveniosEmpresas.filter(c => c.tipo === 'ambos').length;

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
              <p className="text-sm font-medium text-muted-foreground">Ambos</p>
              <p className="text-2xl font-bold text-emerald-600">{ambosConvenios}</p>
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
            Gerencie as empresas prestadoras de convênios de saúde
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Empresa Convênio
        </Button>
      </div>

      {/* Tabs para Convênios e Planos */}
      <Tabs defaultValue="convenios" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="convenios">Empresas Convênios</TabsTrigger>
          <TabsTrigger value="planos">Planos dos Convênios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="convenios" className="space-y-4">
          {/* Tabela de Convênios Empresas */}
          <ConveniosEmpresasTable
            data={conveniosEmpresas}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            isLoading={isLoading}
          />
        </TabsContent>
        
        <TabsContent value="planos" className="space-y-4">
          {/* Gestão de Planos */}
          <ConveniosPlanosManagement companyId={companyId} />
        </TabsContent>
      </Tabs>

      {/* Modal de Criação */}
      <FormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Nova Empresa Convênio"
        description="Cadastre uma nova empresa prestadora de convênios"
      >
        <ConveniosEmpresasForm
          onSubmit={handleCreate}
          onCancel={handleCloseCreateModal}
          companyId={companyId}
        />
      </FormModal>

      {/* Modal de Edição */}
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Empresa Convênio"
        description="Edite as informações da empresa convênio"
      >
        {selectedConvenio && (
          <ConveniosEmpresasForm
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
        title="Detalhes da Empresa Convênio"
        description="Visualize as informações completas da empresa convênio"
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
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm">{selectedConvenio.is_active ? 'Ativo' : 'Inativo'}</p>
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

