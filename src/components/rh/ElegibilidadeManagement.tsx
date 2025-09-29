import React, { useState } from 'react';
import { BeneficioTipo, BeneficioElegibilidade } from '@/integrations/supabase/rh-types';
import { useBeneficioTipos } from '@/hooks/rh/useBeneficioTipos';
import { useBeneficioElegibilidade } from '@/hooks/rh/useBeneficioElegibilidade';
import { useFuncionarioElegibilidade } from '@/hooks/rh/useFuncionarioElegibilidade';
import { ElegibilidadeTable } from './ElegibilidadeTable';
import { ElegibilidadeForm } from './ElegibilidadeForm';
import { BeneficioTiposManagement } from './BeneficioTiposManagement';
import { FuncionariosElegiveisTable } from './FuncionariosElegiveisTable';
import { FormModal } from './FormModal';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, Shield, Target, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ElegibilidadeManagementProps {
  companyId: string;
  className?: string;
}

export function ElegibilidadeManagement({ companyId, className = '' }: ElegibilidadeManagementProps) {
  const [selectedBeneficioTipo, setSelectedBeneficioTipo] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedElegibilidade, setSelectedElegibilidade] = useState<BeneficioElegibilidade | null>(null);
  const { toast } = useToast();

  const {
    beneficioTipos,
    isLoading: isLoadingTipos,
  } = useBeneficioTipos(companyId);

  const {
    elegibilidadeRules,
    isLoading: isLoadingRules,
    error,
    createElegibilidadeRule,
    updateElegibilidadeRule,
    deleteElegibilidadeRule,
  } = useBeneficioElegibilidade(companyId);

  const {
    funcionariosElegiveis,
    isLoading: isLoadingFuncionarios,
    recalcularElegibilidade,
  } = useFuncionarioElegibilidade(companyId, selectedBeneficioTipo);

  const handleCreate = async (data: any) => {
    try {
      await createElegibilidadeRule.mutateAsync({
        ...data,
        company_id: companyId,
        is_active: data.is_active ?? true,
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar regra de elegibilidade:', error);
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      await updateElegibilidadeRule.mutateAsync({
        ...data,
        id: selectedElegibilidade?.id || '',
      });
      setIsEditModalOpen(false);
      setSelectedElegibilidade(null);
    } catch (error) {
      console.error('Erro ao atualizar regra de elegibilidade:', error);
    }
  };

  const handleDelete = async (elegibilidade: BeneficioElegibilidade) => {
    try {
      await deleteElegibilidadeRule.mutateAsync(elegibilidade.id);
    } catch (error) {
      console.error('Erro ao excluir regra de elegibilidade:', error);
    }
  };

  const handleEdit = (elegibilidade: BeneficioElegibilidade) => {
    setSelectedElegibilidade(elegibilidade);
    setIsEditModalOpen(true);
  };

  const handleView = (elegibilidade: BeneficioElegibilidade) => {
    setSelectedElegibilidade(elegibilidade);
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
    setSelectedElegibilidade(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedElegibilidade(null);
  };

  const handleRecalcularElegibilidade = async () => {
    try {
      await recalcularElegibilidade.mutateAsync(selectedBeneficioTipo);
    } catch (error) {
      console.error('Erro ao recalcular elegibilidade:', error);
    }
  };

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-destructive mb-4">
          <p>Erro ao carregar regras de elegibilidade</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Calcular estatísticas
  const totalRules = elegibilidadeRules.length;
  const activeRules = elegibilidadeRules.filter(r => r.is_active).length;
  const cargoRules = elegibilidadeRules.filter(r => r.tipo_regra === 'cargo').length;
  const departamentoRules = elegibilidadeRules.filter(r => r.tipo_regra === 'departamento').length;
  const ambosRules = elegibilidadeRules.filter(r => r.tipo_regra === 'ambos').length;
  const todosRules = elegibilidadeRules.filter(r => r.tipo_regra === 'todos').length;

  const getTipoRegraLabel = (tipo: string) => {
    switch (tipo) {
      case 'cargo':
        return 'Por Cargo';
      case 'departamento':
        return 'Por Departamento';
      case 'ambos':
        return 'Cargo + Departamento';
      case 'todos':
        return 'Todos os Funcionários';
      default:
        return tipo;
    }
  };

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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Regras</p>
              <p className="text-2xl font-bold">{totalRules}</p>
            </div>
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Regras Ativas</p>
              <p className="text-2xl font-bold text-green-600">{activeRules}</p>
            </div>
            <Target className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Por Cargo</p>
              <p className="text-2xl font-bold text-orange-600">{cargoRules}</p>
            </div>
            <Users className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Por Departamento</p>
              <p className="text-2xl font-bold text-purple-600">{departamentoRules}</p>
            </div>
            <Shield className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Todos</p>
              <p className="text-2xl font-bold text-emerald-600">{todosRules}</p>
            </div>
            <Target className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Elegibilidade de Benefícios</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie as regras de elegibilidade por cargo e departamento
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      {/* Tabs para diferentes funcionalidades */}
      <Tabs defaultValue="regras" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="regras">Regras de Elegibilidade</TabsTrigger>
          <TabsTrigger value="tipos">Tipos de Benefícios</TabsTrigger>
          <TabsTrigger value="funcionarios">Funcionários Elegíveis</TabsTrigger>
          <TabsTrigger value="calculo">Cálculo de Elegibilidade</TabsTrigger>
        </TabsList>
        
        <TabsContent value="regras" className="space-y-4">
          {/* Tabela de Regras de Elegibilidade */}
          <ElegibilidadeTable
            data={elegibilidadeRules}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            isLoading={isLoadingRules}
          />
        </TabsContent>
        
        <TabsContent value="tipos" className="space-y-4">
          {/* Gestão de Tipos de Benefícios */}
          <BeneficioTiposManagement companyId={companyId} />
        </TabsContent>
        
        <TabsContent value="funcionarios" className="space-y-4">
          {/* Filtro de Tipo de Benefício */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground">Selecione o Tipo de Benefício</label>
              <Select value={selectedBeneficioTipo} onValueChange={setSelectedBeneficioTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tipo de benefício" />
                </SelectTrigger>
                <SelectContent>
                  {beneficioTipos.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.nome} - {getCategoriaLabel(tipo.categoria)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleRecalcularElegibilidade}
              disabled={!selectedBeneficioTipo || recalcularElegibilidade.isPending}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recalcular
            </Button>
          </div>

          {/* Tabela de Funcionários Elegíveis */}
          {selectedBeneficioTipo && (
            <FuncionariosElegiveisTable
              data={funcionariosElegiveis}
              isLoading={isLoadingFuncionarios}
            />
          )}
        </TabsContent>
        
        <TabsContent value="calculo" className="space-y-4">
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Cálculo de Elegibilidade</h3>
            <p className="text-muted-foreground mb-4">
              O sistema calcula automaticamente a elegibilidade dos funcionários baseado nas regras definidas.
            </p>
            <Button onClick={handleRecalcularElegibilidade} disabled={recalcularElegibilidade.isPending}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Recalcular Todas as Elegibilidades
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Criação */}
      <FormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Nova Regra de Elegibilidade"
        description="Crie uma nova regra de elegibilidade para benefícios"
      >
        <ElegibilidadeForm
          onSubmit={handleCreate}
          onCancel={handleCloseCreateModal}
          companyId={companyId}
          beneficioTipos={beneficioTipos}
        />
      </FormModal>

      {/* Modal de Edição */}
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Regra de Elegibilidade"
        description="Edite as informações da regra de elegibilidade"
      >
        {selectedElegibilidade && (
          <ElegibilidadeForm
            initialData={selectedElegibilidade}
            onSubmit={handleUpdate}
            onCancel={handleCloseEditModal}
            companyId={companyId}
            beneficioTipos={beneficioTipos}
          />
        )}
      </FormModal>

      {/* Modal de Visualização */}
      <FormModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        title="Detalhes da Regra de Elegibilidade"
        description="Visualize as informações completas da regra"
      >
        {selectedElegibilidade && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome da Regra</label>
                <p className="text-sm">{selectedElegibilidade.nome}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo de Regra</label>
                <p className="text-sm">{getTipoRegraLabel(selectedElegibilidade.tipo_regra)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data Início</label>
                <p className="text-sm">{new Date(selectedElegibilidade.data_inicio).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data Fim</label>
                <p className="text-sm">{selectedElegibilidade.data_fim ? new Date(selectedElegibilidade.data_fim).toLocaleDateString('pt-BR') : 'Não definida'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm">{selectedElegibilidade.is_active ? 'Ativa' : 'Inativa'}</p>
              </div>
            </div>
            {selectedElegibilidade.descricao && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                <p className="text-sm">{selectedElegibilidade.descricao}</p>
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
