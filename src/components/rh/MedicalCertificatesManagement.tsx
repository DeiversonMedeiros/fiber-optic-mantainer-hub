// @ts-nocheck
import React, { useState } from 'react';
import { MedicalCertificate, MedicalCertificateInsert, MedicalCertificateUpdate } from '@/integrations/supabase/rh-types';
import { useMedicalCertificates } from '@/hooks/rh';
import { MedicalCertificatesTable } from './MedicalCertificatesTable';
import { MedicalCertificatesForm } from './MedicalCertificatesForm';
import { FormModal } from './FormModal';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Users, TrendingUp, Stethoscope } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MedicalCertificatesManagementProps {
  companyId: string;
  className?: string;
}

export function MedicalCertificatesManagement({ companyId, className = '' }: MedicalCertificatesManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMedicalCertificate, setSelectedMedicalCertificate] = useState<MedicalCertificate | null>(null);
  const { toast } = useToast();

  const {
    medicalCertificates,
    isLoading,
    error,
    createMedicalCertificate,
    updateMedicalCertificate,
    deleteMedicalCertificate,
    refetch,
  } = useMedicalCertificates(companyId);

  const handleCreate = async (data: MedicalCertificateInsert) => {
    try {
      await createMedicalCertificate(data);
      setIsCreateModalOpen(false);
      toast({
        title: 'Sucesso!',
        description: 'Atestado médico criado com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao criar atestado médico:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível criar o atestado médico.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (data: MedicalCertificateUpdate) => {
    try {
      await updateMedicalCertificate(data);
      setIsEditModalOpen(false);
      setSelectedMedicalCertificate(null);
      toast({
        title: 'Sucesso!',
        description: 'Atestado médico atualizado com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar atestado médico:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível atualizar o atestado médico.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (medicalCertificate: MedicalCertificate) => {
    try {
      await deleteMedicalCertificate(medicalCertificate.id);
      toast({
        title: 'Sucesso!',
        description: 'Atestado médico excluído com sucesso.',
        variant: 'default',
      });
      refetch();
    } catch (error) {
      console.error('Erro ao excluir atestado médico:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível excluir o atestado médico.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (medicalCertificate: MedicalCertificate) => {
    setSelectedMedicalCertificate(medicalCertificate);
    setIsEditModalOpen(true);
  };

  const handleView = (medicalCertificate: MedicalCertificate) => {
    setSelectedMedicalCertificate(medicalCertificate);
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
    setSelectedMedicalCertificate(null);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedMedicalCertificate(null);
  };

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-destructive mb-4">
          <p>Erro ao carregar atestados médicos</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-muted-foreground">
          <p>Carregando atestados médicos...</p>
        </div>
      </div>
    );
  }

  // Calcular estatísticas
  const totalCertificates = medicalCertificates?.length || 0;
  const activeCertificates = medicalCertificates?.filter(m => m.tipo === 'em_andamento').length || 0;
  const pendingCertificates = medicalCertificates?.filter(m => m.tipo === 'pendente').length || 0;
  const totalDays = medicalCertificates?.reduce((sum, m) => sum + (m.dias_afastamento || 0), 0) || 0;
  const totalValue = medicalCertificates?.reduce((sum, m) => sum + (m.valor_beneficio || 0), 0) || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
  };

  const getTipoAtestadoLabel = (tipo: string) => {
    switch (tipo) {
      case 'medico': return 'Médico';
      case 'odontologico': return 'Odontológico';
      case 'psicologico': return 'Psicológico';
      default: return 'N/A';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'aprovado': return 'Aprovado';
      case 'em_andamento': return 'Em Andamento';
      case 'concluido': return 'Concluído';
      case 'rejeitado': return 'Rejeitado';
      default: return status;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Atestados</p>
              <p className="text-2xl font-bold">{totalCertificates}</p>
            </div>
            <Stethoscope className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
              <p className="text-2xl font-bold text-green-600">{activeCertificates}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold text-orange-600">{pendingCertificates}</p>
            </div>
            <Users className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Dias</p>
              <p className="text-2xl font-bold text-purple-600">{totalDays}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Gestão de Atestados Médicos</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os atestados médicos dos funcionários da empresa
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Atestado
        </Button>
      </div>

      {/* Tabela */}
      <MedicalCertificatesTable
        data={medicalCertificates || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
      />

      {/* Modal de Criação */}
      <FormModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Novo Atestado Médico"
        description="Crie um novo registro de atestado médico para um funcionário"
      >
        <MedicalCertificatesForm
          onSubmit={handleCreate}
          onCancel={handleCloseCreateModal}
          companyId={companyId}
        />
      </FormModal>

      {/* Modal de Edição */}
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Atestado Médico"
        description="Edite as informações do atestado médico"
      >
        {selectedMedicalCertificate && (
          <MedicalCertificatesForm
            initialData={selectedMedicalCertificate}
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
        title="Detalhes do Atestado Médico"
        description="Visualize as informações completas do atestado"
      >
        {selectedMedicalCertificate && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Funcionário ID</label>
                <p className="text-sm">{selectedMedicalCertificate.funcionario_id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo de Atestado</label>
                <p className="text-sm">{getTipoAtestadoLabel(selectedMedicalCertificate.tipo_atestado)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data Início</label>
                <p className="text-sm">{formatDate(selectedMedicalCertificate.data_inicio)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data Fim</label>
                <p className="text-sm">{formatDate(selectedMedicalCertificate.data_fim)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Dias de Afastamento</label>
                <p className="text-sm font-medium">{selectedMedicalCertificate.dias_afastamento} dias</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm capitalize">{getStatusLabel(selectedMedicalCertificate.status)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome do Médico</label>
                <p className="text-sm">{selectedMedicalCertificate.medico_nome}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">CRM/CRMO</label>
                <p className="text-sm font-mono">{selectedMedicalCertificate.crm_crmo}</p>
              </div>
              {selectedMedicalCertificate.especialidade && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Especialidade</label>
                  <p className="text-sm">{selectedMedicalCertificate.especialidade}</p>
                </div>
              )}
              {selectedMedicalCertificate.cid && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CID</label>
                  <p className="text-sm">{selectedMedicalCertificate.cid}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor do Benefício</label>
                <p className="text-sm font-bold text-green-600">
                  {formatCurrency(selectedMedicalCertificate.valor_beneficio || 0)}
                </p>
              </div>
            </div>
            {selectedMedicalCertificate.observacoes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Observações</label>
                <p className="text-sm">{selectedMedicalCertificate.observacoes}</p>
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
