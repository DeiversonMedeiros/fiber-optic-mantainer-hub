import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  FileText, 
  MapPin, 
  Heart, 
  CreditCard, 
  GraduationCap,
  Edit,
  Trash2,
  Users,
  Gift,
  FileSignature,
  Calculator,
  Clock,
  Shield, 
  Bus,
  Minus
} from 'lucide-react';
import { Employee, EmployeeUpdate, EmployeeDiscount } from '@/integrations/supabase/rh-types';
import { EmployeeForm } from './EmployeeForm';
import { EmployeeDocuments } from './EmployeeDocuments';
import { EmployeeAddresses } from './EmployeeAddresses';
import { EmployeeSpouse } from './EmployeeSpouse';
import { EmployeeBankAccounts } from './EmployeeBankAccounts';
import { EmployeeEducation } from './EmployeeEducation';
import { EmployeeDependents } from './EmployeeDependents';
import { EmployeeContracts } from './EmployeeContracts';
import { EmployeeFiscal } from './EmployeeFiscal';
import { EmployeeConvenios } from './EmployeeConvenios';
import { EmployeeVrVa } from './EmployeeVrVa';
import { EmployeeTransporte } from './EmployeeTransporte';
// EmployeeBenefitAssignments removido - substituído pelo sistema unificado
// EmployeeBenefits removido - substituído pelo sistema unificado
import { EmployeeEditInfo } from './EmployeeEditInfo';
import { EmployeeHistory } from './EmployeeHistory';
import { EmployeeDiscountsTable } from './EmployeeDiscountsTable';
import { EmployeeDiscountsForm } from './EmployeeDiscountsForm';
import { EmployeeDiscountViewModal } from './EmployeeDiscountViewModal';
import { 
  useEmployeeDocuments, 
  useEmployeeAddresses, 
  useEmployeeSpouse, 
  useEmployeeBankAccounts, 
  useEmployeeEducation,
  useEmployeeDependents,
  useEmployeeContracts,
  // useEmployeeBenefits removido - substituído pelo sistema unificado
} from '@/hooks/rh';
import { useEmployeeDiscounts } from '@/hooks/rh/useEmployeeDiscounts';
import { useWorkShifts } from '@/hooks/rh/useWorkShifts';

export interface EmployeeDetailsTabsProps {
  employee: Employee;
  companyId: string;
  onUpdateEmployee: (employee: EmployeeUpdate) => void;
  onDeleteEmployee: (employeeId: string) => void;
  loading?: boolean;
  className?: string;
}

export function EmployeeDetailsTabs({
  employee,
  companyId,
  onUpdateEmployee,
  onDeleteEmployee,
  loading = false,
  className = '',
}: EmployeeDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<EmployeeDiscount | null>(null);
  const [viewingDiscount, setViewingDiscount] = useState<EmployeeDiscount | null>(null);

  // Hooks para dados relacionados
  const { documents } = useEmployeeDocuments(employee.id);
  const { addresses } = useEmployeeAddresses(employee.id);
  const { spouse } = useEmployeeSpouse(employee.id);
  const { bankAccounts } = useEmployeeBankAccounts(employee.id);
  const { education } = useEmployeeEducation(employee.id);
  const { 
    dependents, 
    dependentTypes, 
    kinshipDegrees, 
    deficiencyTypes, 
    deficiencyDegrees 
  } = useEmployeeDependents(employee.id);
  const { contracts } = useEmployeeContracts(employee.id);
  // benefits removido - substituído pelo sistema unificado
  const benefits: any[] = [];
  const { 
    discounts, 
    isLoading: discountsLoading, 
    createDiscount, 
    updateDiscount, 
    deleteDiscount 
  } = useEmployeeDiscounts(employee.id, companyId);
  
  // Buscar turnos de trabalho disponíveis
  const { workShifts = [], isLoading: workShiftsLoading } = useWorkShifts(companyId);

  const handleUpdateEmployee = async (data: any) => {
    try {
      await onUpdateEmployee(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
    }
  };

  const handleCreateDiscount = async (data: any) => {
    try {
      await createDiscount.mutateAsync(data);
      setIsEditingDiscount(false);
      setSelectedDiscount(null);
    } catch (error) {
      console.error('Erro ao criar desconto:', error);
    }
  };

  const handleUpdateDiscount = async (data: any) => {
    try {
      await updateDiscount.mutateAsync(data);
      setIsEditingDiscount(false);
      setSelectedDiscount(null);
    } catch (error) {
      console.error('Erro ao atualizar desconto:', error);
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    try {
      await deleteDiscount.mutateAsync(id);
    } catch (error) {
      console.error('Erro ao excluir desconto:', error);
    }
  };

  const handleEditDiscount = (discount: EmployeeDiscount) => {
    setSelectedDiscount(discount);
    setIsEditingDiscount(true);
  };

  const handleViewDiscount = (discount: EmployeeDiscount) => {
    setViewingDiscount(discount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'inativo': return 'bg-red-100 text-red-800';
      case 'ferias': return 'bg-blue-100 text-blue-800';
      case 'licenca': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={className}>
      {/* Cabeçalho do Funcionário */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{employee.nome}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getStatusColor(employee.status || 'ativo')}>
                    {employee.status || 'ativo'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ID: {employee.id}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditing ? 'Cancelar' : 'Editar'}
              </Button>
              {onDeleteEmployee && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteEmployee(employee.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Informações sobre Edição */}
      <EmployeeEditInfo isEditing={isEditing} />

      {/* Formulário de Edição */}
      {isEditing && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <EmployeeForm
              employee={employee}
              companyId={companyId}
              onSubmit={handleUpdateEmployee}
              onCancel={() => setIsEditing(false)}
              loading={loading}
              showButtons={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Abas de Detalhes */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8 lg:grid-cols-15 gap-1">
          <TabsTrigger value="personal" className="flex items-center gap-1 text-xs">
            <User className="h-3 w-3" />
            <span className="hidden sm:inline">Pessoal</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-1 text-xs">
            <FileText className="h-3 w-3" />
            <span className="hidden sm:inline">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex items-center gap-1 text-xs">
            <MapPin className="h-3 w-3" />
            <span className="hidden sm:inline">Endereços</span>
          </TabsTrigger>
          <TabsTrigger value="spouse" className="flex items-center gap-1 text-xs">
            <Heart className="h-3 w-3" />
            <span className="hidden sm:inline">Cônjuge</span>
          </TabsTrigger>
          <TabsTrigger value="bank" className="flex items-center gap-1 text-xs">
            <CreditCard className="h-3 w-3" />
            <span className="hidden sm:inline">Banco</span>
          </TabsTrigger>
          <TabsTrigger value="education" className="flex items-center gap-1 text-xs">
            <GraduationCap className="h-3 w-3" />
            <span className="hidden sm:inline">Escola</span>
          </TabsTrigger>
          <TabsTrigger value="dependents" className="flex items-center gap-1 text-xs">
            <Users className="h-3 w-3" />
            <span className="hidden sm:inline">Dep.</span>
          </TabsTrigger>
          <TabsTrigger value="convenios" className="flex items-center gap-1 text-xs">
            <Shield className="h-3 w-3" />
            <span className="hidden sm:inline">Convênios</span>
          </TabsTrigger>
          <TabsTrigger value="additional-benefits" className="flex items-center gap-1 text-xs">
            <Gift className="h-3 w-3" />
            <span className="hidden sm:inline">Benef. Adic.</span>
          </TabsTrigger>
          <TabsTrigger value="benefits" className="flex items-center gap-1 text-xs">
            <Gift className="h-3 w-3" />
            <span className="hidden sm:inline">Benefícios</span>
          </TabsTrigger>
          <TabsTrigger value="discounts" className="flex items-center gap-1 text-xs">
            <Minus className="h-3 w-3" />
            <span className="hidden sm:inline">Descontos</span>
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center gap-1 text-xs">
            <FileSignature className="h-3 w-3" />
            <span className="hidden sm:inline">Contratos</span>
          </TabsTrigger>
          <TabsTrigger value="tax" className="flex items-center gap-1 text-xs">
            <Calculator className="h-3 w-3" />
            <span className="hidden sm:inline">Fiscal</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1 text-xs">
            <Clock className="h-3 w-3" />
            <span className="hidden sm:inline">Histórico</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seção básica simplificada */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Dados Básicos</h3>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Nome:</span>
                    <p className="text-lg">{employee.nome}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Email:</span>
                    <p className="text-lg">{employee.email || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Telefone:</span>
                    <p className="text-lg">{employee.telefone || '-'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Configurações de Trabalho</h3>
                  
                  {/* Checkbox para registrar ponto */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="precisa_registrar_ponto"
                      checked={employee.precisa_registrar_ponto !== false}
                      disabled={!isEditing}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="precisa_registrar_ponto" className="text-sm font-medium text-muted-foreground">
                      Precisa registrar ponto
                    </label>
                  </div>
                  
                  {/* Tipo de banco de horas */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Tipo de Banco de Horas
                    </label>
                    <select
                      disabled={!isEditing}
                      value={employee.tipo_banco_horas || 'compensatorio'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                    >
                      <option value="compensatorio">Compensatório</option>
                      <option value="banco_horas">Banco de Horas</option>
                      <option value="horas_extras">Horas Extras</option>
                      <option value="nao_aplicavel">Não Aplicável</option>
                    </select>
                  </div>
                  
                  {/* Turno de trabalho */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Turno de Trabalho
                    </label>
                    <select
                      disabled={!isEditing || workShiftsLoading}
                      value={employee.work_schedule_id || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                    >
                      <option value="">Selecione o turno</option>
                      {workShifts.map((shift) => (
                        <option key={shift.id} value={shift.id}>
                          {shift.nome} ({shift.hora_inicio} - {shift.hora_fim})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Informações de PCD */}
              {employee.is_pcd && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Informações de PCD</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Tipo de Deficiência:</span>
                      <p className="text-lg">{employee.deficiency_type || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Grau:</span>
                      <p className="text-lg">{employee.deficiency_degree || '-'}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Adicionais */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Adicionais e Complementos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Periculosidade:</span>
                    <p className="text-lg">{employee.periculosidade ? 'Sim' : 'Não'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Insalubridade:</span>
                    <p className="text-lg">{employee.insalubridade ? 'Sim' : 'Não'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Adicional Noturno:</span>
                    <p className="text-sm text-blue-600">Calculado automaticamente</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Adicional FDS:</span>
                    <p className="text-sm text-blue-600">Calculado automaticamente</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <EmployeeDocuments
            employeeId={employee.id}
            documents={documents}
            onSubmit={async () => {}}
          />
        </TabsContent>

        <TabsContent value="addresses" className="mt-6">
          <EmployeeAddresses
            employeeId={employee.id}
            addresses={addresses}
            onSubmit={async () => {}}
          />
        </TabsContent>

        <TabsContent value="spouse" className="mt-6">
          <EmployeeSpouse
            employeeId={employee.id}
            spouse={spouse}
            onSubmit={async () => {}}
          />
        </TabsContent>

        <TabsContent value="bank" className="mt-6">
          <EmployeeBankAccounts
            employeeId={employee.id}
            bankAccounts={bankAccounts}
            onSubmit={async () => {}}
          />
        </TabsContent>

        <TabsContent value="education" className="mt-6">
          <EmployeeEducation
            employeeId={employee.id}
            education={education}
            onSubmit={async () => {}}
          />
        </TabsContent>

        <TabsContent value="dependents" className="mt-6">
          <EmployeeDependents
            employeeId={employee.id}
            dependents={dependents}
            dependentTypes={dependentTypes}
            kinshipDegrees={kinshipDegrees}
            deficiencyTypes={deficiencyTypes}
            deficiencyDegrees={deficiencyDegrees}
            onSubmit={async () => {}}
          />
        </TabsContent>


        <TabsContent value="convenios" className="mt-6">
          <EmployeeConvenios
            employeeId={employee.id}
            companyId={companyId}
          />
        </TabsContent>

        <TabsContent value="additional-benefits" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Benefícios Adicionais</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                A gestão de benefícios adicionais foi movida para o sistema unificado. 
                Acesse a página de <a href="/rh/beneficios-unificados" className="text-primary hover:underline">Gestão de Benefícios</a> para gerenciar os benefícios deste funcionário.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benefits" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Benefícios do Funcionário</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                A gestão de benefícios foi movida para o sistema unificado. 
                Acesse a página de <a href="/rh/beneficios-unificados" className="text-primary hover:underline">Gestão de Benefícios</a> para gerenciar os benefícios deste funcionário.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discounts" className="mt-6">
          <div className="space-y-6">
            {/* Cabeçalho com botão de adicionar */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Descontos do Funcionário</h3>
                <p className="text-sm text-muted-foreground">
                  Gerencie os descontos aplicados na folha de pagamento
                </p>
              </div>
              <Button
                onClick={() => {
                  setSelectedDiscount(null);
                  setIsEditingDiscount(true);
                }}
                disabled={discountsLoading}
              >
                <Minus className="h-4 w-4 mr-2" />
                Novo Desconto
              </Button>
            </div>

            {/* Formulário de edição/criação */}
            {isEditingDiscount && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedDiscount ? 'Editar Desconto' : 'Novo Desconto'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EmployeeDiscountsForm
                    initialData={selectedDiscount || undefined}
                    onSubmit={selectedDiscount ? handleUpdateDiscount : handleCreateDiscount}
                    onCancel={() => {
                      setIsEditingDiscount(false);
                      setSelectedDiscount(null);
                    }}
                    isLoading={createDiscount.isPending || updateDiscount.isPending}
                    employeeId={employee.id}
                    companyId={companyId}
                    employeeSalary={employee.salario_base || 0}
                  />
                </CardContent>
              </Card>
            )}

            {/* Tabela de descontos */}
            <EmployeeDiscountsTable
              discounts={discounts}
              onEdit={handleEditDiscount}
              onDelete={handleDeleteDiscount}
              onView={handleViewDiscount}
              isLoading={discountsLoading}
            />
          </div>
        </TabsContent>

        <TabsContent value="contracts" className="mt-6">
          <EmployeeContracts
            employeeId={employee.id}
            contracts={contracts}
            onSubmit={async () => {}}
          />
        </TabsContent>

        <TabsContent value="tax" className="mt-6">
          <EmployeeFiscal
            employeeId={employee.id}
            employee={employee}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <EmployeeHistory
            employeeId={employee.id}
            employeeName={employee.nome}
            companyId={employee.company_id}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de visualização de desconto */}
      <EmployeeDiscountViewModal
        discount={viewingDiscount}
        isOpen={!!viewingDiscount}
        onClose={() => setViewingDiscount(null)}
        onEdit={handleEditDiscount}
      />
    </div>
  );
}

