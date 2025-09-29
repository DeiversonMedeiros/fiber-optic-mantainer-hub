import React, { useState } from 'react';
import { FormModal } from './FormModal';
import { TimeRecordTable } from './TimeRecordTable';
import { TimeRecordForm, TimeRecordDetails } from './TimeRecordForm';
import { TimeRecord } from '@/integrations/supabase/rh-types';
import { useTimeRecords } from '@/hooks/rh';
import { Button } from '@/components/ui/button';
import { Plus, Clock, Calendar, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface TimeRecordManagementProps {
  companyId: string;
  className?: string;
}

export function TimeRecordManagement({ companyId, className = '' }: TimeRecordManagementProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TimeRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<TimeRecord | null>(null);

  const {
    createTimeRecord,
    updateTimeRecord,
    deleteTimeRecord,
    approveTimeRecord,
  } = useTimeRecords(companyId);

  // Handlers para modais
  const handleAddRecord = () => {
    setSelectedRecord(null);
    setIsAddModalOpen(true);
  };

  const handleEditRecord = (record: TimeRecord) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  };

  const handleViewRecord = (record: TimeRecord) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  const handleDeleteRecord = async (record: TimeRecord) => {
    try {
      await deleteTimeRecord.mutateAsync(record.id);
      // Sucesso - a tabela será atualizada automaticamente
    } catch (error) {
      console.error('Erro ao excluir registro de ponto:', error);
    }
  };

  const handleApproveRecord = async (record: TimeRecord) => {
    try {
      await approveTimeRecord.mutateAsync({ id: record.id, approvedBy: 'current_user' });
      // Sucesso - a tabela será atualizada automaticamente
    } catch (error) {
      console.error('Erro ao aprovar registro de ponto:', error);
    }
  };

  // Handlers para formulários
  const handleCreateRecord = async (data: any) => {
    try {
      await createTimeRecord.mutateAsync(data);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar registro de ponto:', error);
      throw error;
    }
  };

  const handleUpdateRecord = async (data: any) => {
    if (!editingRecord) return;
    
    try {
      await updateTimeRecord.mutateAsync({ id: editingRecord.id, ...data });
      setIsEditModalOpen(false);
      setEditingRecord(null);
    } catch (error) {
      console.error('Erro ao atualizar registro de ponto:', error);
      throw error;
    }
  };

  // Dashboard cards
  const DashboardCard = ({ title, value, icon, color }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`h-4 w-4 ${color}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Controle de Ponto</h1>
          <p className="text-muted-foreground">
            Gerencie todos os registros de ponto dos funcionários
          </p>
        </div>
        <Button onClick={handleAddRecord} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Novo Registro
        </Button>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total de Registros"
          value="0"
          icon={<Clock className="h-4 w-4" />}
          color="text-blue-600"
        />
        <DashboardCard
          title="Registros Pendentes"
          value="0"
          icon={<Clock className="h-4 w-4" />}
          color="text-orange-600"
        />
        <DashboardCard
          title="Registros Aprovados"
          value="0"
          icon={<CheckCircle className="h-4 w-4" />}
          color="text-green-600"
        />
        <DashboardCard
          title="Registros Hoje"
          value="0"
          icon={<Calendar className="h-4 w-4" />}
          color="text-purple-600"
        />
      </div>

      {/* Tabela de Registros de Ponto */}
      <TimeRecordTable
        companyId={companyId}
        onViewRecord={handleViewRecord}
        onEditRecord={handleEditRecord}
        onDeleteRecord={handleDeleteRecord}
      />

      {/* Modal de Adicionar Registro */}
      <FormModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Novo Registro de Ponto"
        description="Preencha os dados para registrar o ponto do funcionário"
        onSubmit={handleCreateRecord}
        onCancel={() => setIsAddModalOpen(false)}
        loading={createTimeRecord.isPending}
        size="xl"
      >
        <TimeRecordForm
          onSubmit={handleCreateRecord}
          onCancel={() => setIsAddModalOpen(false)}
          loading={createTimeRecord.isPending}
        />
      </FormModal>

      {/* Modal de Editar Registro */}
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Registro de Ponto"
        description="Atualize os dados do registro de ponto"
        onSubmit={handleUpdateRecord}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingRecord(null);
        }}
        loading={updateTimeRecord.isPending}
        size="xl"
      >
        {editingRecord && (
          <TimeRecordForm
            timeRecord={editingRecord}
            onSubmit={handleUpdateRecord}
            onCancel={() => {
              setIsEditModalOpen(false);
              setEditingRecord(null);
            }}
            loading={updateTimeRecord.isPending}
          />
        )}
      </FormModal>

      {/* Modal de Visualizar Registro */}
      <FormModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        title="Detalhes do Registro de Ponto"
        description="Visualize as informações completas do registro"
        onCancel={() => {
          setIsViewModalOpen(false);
          setSelectedRecord(null);
        }}
        size="lg"
        showCloseButton={true}
      >
        {selectedRecord && (
          <TimeRecordDetails timeRecord={selectedRecord} />
        )}
      </FormModal>
    </div>
  );
}

// Componente de exemplo para uso em outras páginas
export function TimeRecordManagementPage({ companyId }: { companyId: string }) {
  return (
    <div className="container mx-auto py-6 px-4">
      <TimeRecordManagement companyId={companyId} />
    </div>
  );
}
