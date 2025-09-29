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
  Calculator
} from 'lucide-react';
import { Employee } from '@/integrations/supabase/rh-types';
import { EmployeeForm } from './EmployeeForm';
import { EmployeeDocuments } from './EmployeeDocuments';
import { EmployeeAddresses } from './EmployeeAddresses';
import { EmployeeSpouse } from './EmployeeSpouse';
import { EmployeeBankAccounts } from './EmployeeBankAccounts';
import { EmployeeEducation } from './EmployeeEducation';
import { EmployeeDependents } from './EmployeeDependents';
import { EmployeeBenefits } from './EmployeeBenefits';
import { EmployeeContracts } from './EmployeeContracts';
import { 
  useEmployeeDocuments, 
  useEmployeeAddresses, 
  useEmployeeSpouse, 
  useEmployeeBankAccounts, 
  useEmployeeEducation,
  useEmployeeDependents,
  useEmployeeBenefits,
  useEmployeeContracts
} from '@/hooks/rh';

export interface EmployeeDetailsTabsProps {
  employee: Employee;
  companyId?: string;
  onUpdateEmployee: (data: any) => Promise<void>;
  onDeleteEmployee?: (id: string) => Promise<void>;
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

  // Debug: verificar se o componente está sendo renderizado
  console.log('EmployeeDetailsTabs renderizado com employee:', employee?.nome);

  // Hooks para as diferentes seções
  const { 
    documents, 
    isLoading: documentsLoading, 
    createDocument, 
    updateDocument, 
    deleteDocument 
  } = useEmployeeDocuments(employee.id);

  const { 
    addresses, 
    residentialAddress, 
    isLoading: addressesLoading, 
    createAddress, 
    updateAddress, 
    deleteAddress 
  } = useEmployeeAddresses(employee.id);

  const { 
    spouse, 
    isLoading: spouseLoading, 
    createSpouse, 
    updateSpouse, 
    deleteSpouse 
  } = useEmployeeSpouse(employee.id);

  const { 
    bankAccounts, 
    primaryAccount, 
    isLoading: bankLoading, 
    createBankAccount, 
    updateBankAccount, 
    deleteBankAccount 
  } = useEmployeeBankAccounts(employee.id);

  const { 
    education, 
    highestEducation, 
    isLoading: educationLoading, 
    createEducation, 
    updateEducation, 
    deleteEducation 
  } = useEmployeeEducation(employee.id);

  const { 
    dependents = [], 
    dependentTypes = [], 
    kinshipDegrees = [], 
    deficiencyTypes = [], 
    deficiencyDegrees = [],
    isLoading: dependentsLoading, 
    createDependent, 
    updateDependent, 
    deleteDependent 
  } = useEmployeeDependents(employee.id);

  const { 
    benefits = [], 
    benefitTypes = [],
    isLoading: benefitsLoading, 
    createBenefit, 
    updateBenefit, 
    deleteBenefit 
  } = useEmployeeBenefits(employee.id);

  const { 
    contracts = [], 
    positions = [], 
    workSchedules = [],
    isLoading: contractsLoading, 
    createContract, 
    updateContract, 
    deleteContract 
  } = useEmployeeContracts(employee.id);

  const handleUpdateEmployee = async (data: any) => {
    try {
      await onUpdateEmployee(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'inativo': return 'bg-gray-100 text-gray-800';
      case 'demitido': return 'bg-red-100 text-red-800';
      case 'aposentado': return 'bg-blue-100 text-blue-800';
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
                  {employee.matricula && (
                    <span className="text-sm text-muted-foreground">
                      Matrícula: {employee.matricula}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
              showButtons={false} // Não mostra botões no modal de edição
            />
          </CardContent>
        </Card>
      )}

      {/* Abas de Detalhes */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 gap-1">
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
          <TabsTrigger value="benefits" className="flex items-center gap-1 text-xs">
            <Gift className="h-3 w-3" />
            <span className="hidden sm:inline">Benef.</span>
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center gap-1 text-xs">
            <FileSignature className="h-3 w-3" />
            <span className="hidden sm:inline">Contratos</span>
          </TabsTrigger>
          <TabsTrigger value="tax" className="flex items-center gap-1 text-xs">
            <Calculator className="h-3 w-3" />
            <span className="hidden sm:inline">Fiscal</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Dados Básicos</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Nome:</span>
                      <p className="text-lg">{employee.nome}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">CPF:</span>
                      <p className="text-lg font-mono">
                        {employee.cpf ? employee.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">RG:</span>
                      <p className="text-lg">{employee.rg || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Telefone:</span>
                      <p className="text-lg">{employee.telefone || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Email:</span>
                      <p className="text-lg">{employee.email || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Informações Adicionais</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Estado Civil:</span>
                      <p className="text-lg capitalize">{employee.estado_civil || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Nacionalidade:</span>
                      <p className="text-lg">{employee.nacionalidade || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Naturalidade:</span>
                      <p className="text-lg">{employee.naturalidade || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Nome da Mãe:</span>
                      <p className="text-lg">{employee.nome_mae || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Nome do Pai:</span>
                      <p className="text-lg">{employee.nome_pai || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Datas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Data de Nascimento:</span>
                    <p className="text-lg">
                      {employee.data_nascimento ? new Date(employee.data_nascimento).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Data de Admissão:</span>
                    <p className="text-lg">
                      {employee.data_admissao ? new Date(employee.data_admissao).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Data de Demissão:</span>
                    <p className="text-lg">
                      {employee.data_demissao ? new Date(employee.data_demissao).toLocaleDateString('pt-BR') : '-'}
                    </p>
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
            onSubmit={createDocument.mutateAsync}
            onDelete={deleteDocument.mutateAsync}
            loading={documentsLoading || createDocument.isPending || deleteDocument.isPending}
          />
        </TabsContent>

        <TabsContent value="addresses" className="mt-6">
          <EmployeeAddresses
            employeeId={employee.id}
            addresses={addresses}
            onSubmit={createAddress.mutateAsync}
            onDelete={deleteAddress.mutateAsync}
            loading={addressesLoading || createAddress.isPending || deleteAddress.isPending}
          />
        </TabsContent>

        <TabsContent value="spouse" className="mt-6">
          <EmployeeSpouse
            employeeId={employee.id}
            spouse={spouse}
            onSubmit={spouse ? updateSpouse.mutateAsync : createSpouse.mutateAsync}
            onDelete={spouse ? deleteSpouse.mutateAsync : undefined}
            loading={spouseLoading || createSpouse.isPending || updateSpouse.isPending || deleteSpouse.isPending}
          />
        </TabsContent>

        <TabsContent value="bank" className="mt-6">
          <EmployeeBankAccounts
            employeeId={employee.id}
            bankAccounts={bankAccounts}
            onSubmit={createBankAccount.mutateAsync}
            onDelete={deleteBankAccount.mutateAsync}
            loading={bankLoading || createBankAccount.isPending || deleteBankAccount.isPending}
          />
        </TabsContent>

        <TabsContent value="education" className="mt-6">
          <EmployeeEducation
            employeeId={employee.id}
            education={education}
            onSubmit={createEducation.mutateAsync}
            onDelete={deleteEducation.mutateAsync}
            loading={educationLoading || createEducation.isPending || deleteEducation.isPending}
          />
        </TabsContent>

        <TabsContent value="dependents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Dependentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Módulo de dependentes em desenvolvimento</p>
                <p className="text-sm">Em breve você poderá gerenciar dependentes do funcionário</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benefits" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Benefícios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Módulo de benefícios em desenvolvimento</p>
                <p className="text-sm">Em breve você poderá gerenciar benefícios do funcionário</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                Contratos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileSignature className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Módulo de contratos em desenvolvimento</p>
                <p className="text-sm">Em breve você poderá gerenciar contratos do funcionário</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Informações Fiscais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Módulo de informações fiscais em desenvolvimento</p>
                <p className="text-sm">Em breve você poderá gerenciar cálculos de IR, INSS, FGTS e outros impostos</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

