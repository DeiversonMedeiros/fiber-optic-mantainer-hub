import React, { useState } from 'react';
import { BeneficioRateio, BeneficioTipo } from '@/integrations/supabase/rh-types';
import { useBeneficioRateios, useBeneficioRateioDepartamentos } from '@/hooks/rh/useBeneficioRateios';
import { useBeneficioTipos } from '@/hooks/rh/useBeneficioTipos';
import { useDepartments } from '@/hooks/rh';
import { RateiosTable } from './RateiosTable';
import { RateioDepartamentosTable } from './RateioDepartamentosTable';
import { RateioForm } from './RateioForm';
import { FormModal } from './FormModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calculator, Play, DollarSign, Percent, Users, TrendingUp, Building2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RateiosManagementProps {
  companyId: string;
  className?: string;
}

export function RateiosManagement({ companyId, className = '' }: RateiosManagementProps) {
  const [selectedRateio, setSelectedRateio] = useState<BeneficioRateio | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDepartamentosModalOpen, setIsDepartamentosModalOpen] = useState(false);
  const { toast } = useToast();

  const {
    rateios,
    isLoading: isLoadingRateios,
    error,
    createRateio,
    updateRateio,
    deleteRateio,
    calcularRateio,
    aplicarRateio,
    resumoRateios,
    isLoadingResumo,
  } = useBeneficioRateios(companyId);

  const {
    departamentos,
    isLoading: isLoadingDepartamentos,
    addDepartamento,
    updateDepartamento,
    removeDepartamento,
  } = useBeneficioRateioDepartamentos(selectedRateio?.id);

  const {
    beneficioTipos,
    isLoading: isLoadingTipos,
  } = useBeneficioTipos(companyId);

  const {
    departments,
    isLoading: isLoadingDepartments,
  } = useDepartments(companyId);

  const handleCreate = async (data: any) => {
    try {
      await createRateio.mutateAsync({
        ...data,
        company_id: companyId,
      });
      setIsCreateModalOpen(false);
      toast({
        title: 'Sucesso',
        description: 'Rateio criado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao criar rateio:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar rateio. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      await updateRateio.mutateAsync({
        ...data,
        id: selectedRateio?.id || '',
      });
      setIsEditModalOpen(false);
      setSelectedRateio(null);
      toast({
        title: 'Sucesso',
        description: 'Rateio atualizado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao atualizar rateio:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar rateio. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (rateio: BeneficioRateio) => {
    try {
      await deleteRateio.mutateAsync(rateio.id);
      toast({
        title: 'Sucesso',
        description: 'Rateio excluído com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao excluir rateio:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir rateio. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleCalcular = async (rateio: BeneficioRateio) => {
    try {
      await calcularRateio.mutateAsync(rateio.id);
      toast({
        title: 'Sucesso',
        description: 'Rateio calculado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao calcular rateio:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao calcular rateio. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleAplicar = async (rateio: BeneficioRateio) => {
    try {
      await aplicarRateio.mutateAsync(rateio.id);
      toast({
        title: 'Sucesso',
        description: 'Rateio aplicado com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao aplicar rateio:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao aplicar rateio. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (rateio: BeneficioRateio) => {
    setSelectedRateio(rateio);
    setIsEditModalOpen(true);
  };

  const handleView = (rateio: BeneficioRateio) => {
    setSelectedRateio(rateio);
    setIsViewModalOpen(true);
  };

  const handleViewDepartamentos = (rateio: BeneficioRateio) => {
    setSelectedRateio(rateio);
    setIsDepartamentosModalOpen(true);
  };

  const getTipoRateioLabel = (tipo: string) => {
    switch (tipo) {
      case 'percentual':
        return 'Percentual';
      case 'valor_fixo':
        return 'Valor Fixo';
      case 'proporcional_funcionarios':
        return 'Proporcional Funcionários';
      case 'proporcional_custo':
        return 'Proporcional Custo';
      default:
        return tipo;
    }
  };

  const getTipoRateioIcon = (tipo: string) => {
    switch (tipo) {
      case 'percentual':
        return <Percent className="h-4 w-4 text-blue-600" />;
      case 'valor_fixo':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'proporcional_funcionarios':
        return <Users className="h-4 w-4 text-orange-600" />;
      case 'proporcional_custo':
        return <TrendingUp className="h-4 w-4 text-purple-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-destructive mb-4">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>Erro ao carregar rateios</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Calcular estatísticas
  const totalRateios = rateios.length;
  const activeRateios = rateios.filter(r => r.is_active).length;
  const totalValor = rateios.reduce((sum, r) => sum + (r.valor_total || 0), 0);
  const valorDistribuido = resumoRateios.reduce((sum, r) => sum + (r.valor_distribuido || 0), 0);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Rateios</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRateios}</div>
            <p className="text-xs text-muted-foreground">
              {activeRateios} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValor)}</div>
            <p className="text-xs text-muted-foreground">
              Em todos os rateios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Distribuído</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(valorDistribuido)}</div>
            <p className="text-xs text-muted-foreground">
              Já distribuído
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Distribuição</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalValor > 0 ? ((valorDistribuido / totalValor) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Do valor total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Rateios de Benefícios</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie a distribuição de benefícios entre departamentos
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Rateio
        </Button>
      </div>

      {/* Tabela de Rateios */}
      <RateiosTable
        data={rateios}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onCalcular={handleCalcular}
        onAplicar={handleAplicar}
        isLoading={isLoadingRateios}
      />

      {/* Modal de Criação */}
      <FormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Novo Rateio"
        description="Crie um novo rateio de benefícios"
      >
        <RateioForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
          beneficioTipos={beneficioTipos}
          isLoading={createRateio.isPending}
        />
      </FormModal>

      {/* Modal de Edição */}
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Rateio"
        description="Edite as informações do rateio"
      >
        {selectedRateio && (
          <RateioForm
            initialData={selectedRateio}
            onSubmit={handleUpdate}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedRateio(null);
            }}
            beneficioTipos={beneficioTipos}
            isLoading={updateRateio.isPending}
          />
        )}
      </FormModal>

      {/* Modal de Visualização */}
      <FormModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        title="Detalhes do Rateio"
        description="Visualize as informações completas do rateio"
      >
        {selectedRateio && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome</label>
                <p className="text-sm">{selectedRateio.nome}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo de Rateio</label>
                <div className="flex items-center gap-2">
                  {getTipoRateioIcon(selectedRateio.tipo_rateio)}
                  <span className="text-sm">{getTipoRateioLabel(selectedRateio.tipo_rateio)}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor Total</label>
                <p className="text-sm font-mono">{formatCurrency(selectedRateio.valor_total)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <Badge variant={selectedRateio.is_active ? 'default' : 'secondary'}>
                  {selectedRateio.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
            {selectedRateio.descricao && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                <p className="text-sm">{selectedRateio.descricao}</p>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => handleViewDepartamentos(selectedRateio)}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Ver Departamentos
              </Button>
              <Button onClick={() => setIsViewModalOpen(false)} variant="outline">
                Fechar
              </Button>
            </div>
          </div>
        )}
      </FormModal>

      {/* Modal de Departamentos */}
      <FormModal
        open={isDepartamentosModalOpen}
        onOpenChange={setIsDepartamentosModalOpen}
        title="Departamentos do Rateio"
        description="Visualize e gerencie os departamentos incluídos no rateio"
        size="lg"
      >
        {selectedRateio && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedRateio.nome}</h3>
                <p className="text-sm text-muted-foreground">
                  {getTipoRateioLabel(selectedRateio.tipo_rateio)} - {formatCurrency(selectedRateio.valor_total)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleCalcular(selectedRateio)}
                  disabled={calcularRateio.isPending}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Calcular
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleAplicar(selectedRateio)}
                  disabled={aplicarRateio.isPending}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Aplicar
                </Button>
              </div>
            </div>
            
            <RateioDepartamentosTable
              data={departamentos}
              onEdit={() => {}}
              onDelete={() => {}}
              isLoading={isLoadingDepartamentos}
              tipoRateio={selectedRateio.tipo_rateio}
            />
          </div>
        )}
      </FormModal>
    </div>
  );
}
