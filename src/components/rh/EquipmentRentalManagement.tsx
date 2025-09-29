import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Package,
  DollarSign,
  Plus,
  BarChart3,
  Car,
  Laptop,
  Smartphone,
  Settings
} from 'lucide-react';
import { EquipmentRentalTable } from './EquipmentRentalTable';
import { EquipmentRentalForm } from './EquipmentRentalForm';
import { EquipmentRentalPayments } from './EquipmentRentalPayments';
import { useEquipmentRental, useEquipmentRentalPayments } from '@/hooks/rh/useEquipmentRental';
import { 
  EquipmentRentalWithEmployee, 
  EquipmentRentalInsert, 
  EquipmentRentalUpdate,
  EquipmentRentalStats,
  EquipmentRentalPayment,
  EquipmentRentalPaymentInsert,
  EquipmentRentalPaymentUpdate
} from '@/integrations/supabase/rh-equipment-rental-types';
import { useToast } from '@/hooks/use-toast';
import { rhSupabase } from '@/integrations/supabase/client';

interface EquipmentRentalManagementProps {
  companyId: string;
  className?: string;
}

export function EquipmentRentalManagement({ 
  companyId, 
  className = '' 
}: EquipmentRentalManagementProps) {
  const [activeTab, setActiveTab] = useState('equipments');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentRentalWithEmployee | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<EquipmentRentalPayment | null>(null);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; cpf: string }>>([]);
  const [stats, setStats] = useState<EquipmentRentalStats | null>(null);
  
  const { toast } = useToast();
  
  const {
    equipments,
    loading: equipmentsLoading,
    error: equipmentsError,
    fetchEquipments,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    fetchStats
  } = useEquipmentRental(companyId);

  // Se há erro de tabela não encontrada, mostrar mensagem
  if (equipmentsError && typeof equipmentsError === 'string' && (
    equipmentsError.includes('404') || 
    equipmentsError.includes('Could not find the table') ||
    equipmentsError.includes('does not exist')
  )) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Locação de Equipamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">
                <Package className="h-16 w-16 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Tabelas não encontradas</h2>
                <p className="text-muted-foreground">
                  As tabelas do sistema de locação de equipamentos não foram criadas no banco de dados.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4 text-left">
                  <p className="text-sm text-red-700">
                    <strong>Erro:</strong> {equipmentsError}
                  </p>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-yellow-800 mb-2">Para resolver:</h3>
                <ol className="text-sm text-yellow-700 space-y-1">
                  <li>1. Acesse o Supabase SQL Editor</li>
                  <li>2. Execute o arquivo <code className="bg-yellow-100 px-1 rounded">create_equipment_rental_tables.sql</code></li>
                  <li>3. Aguarde a criação das tabelas</li>
                  <li>4. Recarregue esta página</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    payments,
    loading: paymentsLoading,
    error: paymentsError,
    fetchPayments,
    createPayment,
    updatePayment,
    deletePayment
  } = useEquipmentRentalPayments(companyId);

  // Carregar funcionários
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const { data, error } = await rhSupabase
          .from('employees')
          .select('id, nome, cpf')
          .eq('company_id', companyId)
          .eq('status', 'ativo')
          .order('nome');

        if (error) throw error;
        const formattedEmployees = data?.map(emp => ({
          id: emp.id,
          name: emp.nome,
          cpf: emp.cpf
        })) || [];
        setEmployees(formattedEmployees);
      } catch (error) {
        console.error('Erro ao carregar funcionários:', error);
      }
    };

    if (companyId) {
      loadEmployees();
    }
  }, [companyId]);

  // Carregar estatísticas
  useEffect(() => {
    const loadStats = async () => {
      const statsData = await fetchStats();
      if (statsData) {
        setStats(statsData);
      }
    };

    if (companyId) {
      loadStats();
    }
  }, [companyId, fetchStats]);

  const handleCreateEquipment = async (data: EquipmentRentalInsert) => {
    try {
      await createEquipment(data);
      setIsFormOpen(false);
      setSelectedEquipment(null);
      toast({
        title: 'Sucesso',
        description: 'Equipamento criado com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar equipamento. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateEquipment = async (data: EquipmentRentalUpdate) => {
    if (!selectedEquipment) return;

    try {
      await updateEquipment(selectedEquipment.id, data);
      setIsFormOpen(false);
      setSelectedEquipment(null);
      toast({
        title: 'Sucesso',
        description: 'Equipamento atualizado com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar equipamento. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEquipment = async (equipment: EquipmentRentalWithEmployee) => {
    if (window.confirm('Tem certeza que deseja excluir este equipamento?')) {
      try {
        await deleteEquipment(equipment.id);
        toast({
          title: 'Sucesso',
          description: 'Equipamento excluído com sucesso!',
        });
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao excluir equipamento. Tente novamente.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleCreatePayment = async (data: EquipmentRentalPaymentInsert) => {
    try {
      await createPayment(data);
      setIsPaymentFormOpen(false);
      setSelectedPayment(null);
      toast({
        title: 'Sucesso',
        description: 'Pagamento registrado com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao registrar pagamento. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePayment = async (data: EquipmentRentalPaymentUpdate) => {
    if (!selectedPayment) return;

    try {
      await updatePayment(selectedPayment.id, data);
      setIsPaymentFormOpen(false);
      setSelectedPayment(null);
      toast({
        title: 'Sucesso',
        description: 'Pagamento atualizado com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar pagamento. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePayment = async (payment: EquipmentRentalPayment) => {
    if (window.confirm('Tem certeza que deseja excluir este pagamento?')) {
      try {
        await deletePayment(payment.id);
        toast({
          title: 'Sucesso',
          description: 'Pagamento excluído com sucesso!',
        });
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao excluir pagamento. Tente novamente.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleEditEquipment = (equipment: EquipmentRentalWithEmployee) => {
    setSelectedEquipment(equipment);
    setIsFormOpen(true);
  };

  const handleEditPayment = (payment: EquipmentRentalPayment) => {
    setSelectedPayment(payment);
    setIsPaymentFormOpen(true);
  };

  const handleViewPayments = (equipment: EquipmentRentalWithEmployee) => {
    setSelectedEquipment(equipment);
    setActiveTab('payments');
  };

  const handleAddPayment = () => {
    setSelectedPayment(null);
    setIsPaymentFormOpen(true);
  };

  const handleAddEquipment = () => {
    setSelectedEquipment(null);
    setIsFormOpen(true);
  };

  // Cards de estatísticas
  const StatsCards = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Equipamentos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_equipments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active_equipments} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Mensal Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.total_monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Equipamentos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Veículos</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.equipments_by_type.vehicle}</div>
            <p className="text-xs text-muted-foreground">
              Locados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tecnologia</CardTitle>
            <Laptop className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.equipments_by_type.computer + stats.equipments_by_type.phone}
            </div>
            <p className="text-xs text-muted-foreground">
              Computadores e celulares
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Locação de Equipamentos</h1>
          <p className="text-muted-foreground">
            Gerencie equipamentos locados pelos funcionários
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Relatórios
          </Button>
          <Button onClick={handleAddEquipment}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Equipamento
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <StatsCards />

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="equipments">Equipamentos</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="equipments" className="space-y-4">
          <EquipmentRentalTable
            equipments={equipments}
            loading={equipmentsLoading}
            onView={handleEditEquipment}
            onEdit={handleEditEquipment}
            onDelete={handleDeleteEquipment}
            onViewPayments={handleViewPayments}
            onAdd={handleAddEquipment}
          />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <EquipmentRentalPayments
            payments={payments}
            loading={paymentsLoading}
            onEdit={handleEditPayment}
            onDelete={handleDeletePayment}
            onAdd={handleAddPayment}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Relatórios em desenvolvimento
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Formulário de Equipamento */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEquipment ? 'Editar Equipamento' : 'Novo Equipamento'}
            </DialogTitle>
            <DialogDescription>
              {selectedEquipment 
                ? 'Atualize as informações do equipamento' 
                : 'Cadastre um novo equipamento para locação'
              }
            </DialogDescription>
          </DialogHeader>
          <EquipmentRentalForm
            equipment={selectedEquipment || undefined}
            employees={employees}
            onSubmit={selectedEquipment ? handleUpdateEquipment : handleCreateEquipment}
            onCancel={() => {
              setIsFormOpen(false);
              setSelectedEquipment(null);
            }}
            loading={equipmentsLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Formulário de Pagamento */}
      <Dialog open={isPaymentFormOpen} onOpenChange={setIsPaymentFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPayment ? 'Editar Pagamento' : 'Novo Pagamento'}
            </DialogTitle>
            <DialogDescription>
              {selectedPayment 
                ? 'Atualize as informações do pagamento' 
                : 'Registre um novo pagamento de locação'
              }
            </DialogDescription>
          </DialogHeader>
          {/* Aqui seria o formulário de pagamento - por simplicidade, vou pular por agora */}
          <div className="text-center py-8 text-muted-foreground">
            Formulário de pagamento em desenvolvimento
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
