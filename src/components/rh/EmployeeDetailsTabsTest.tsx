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
  Bus
} from 'lucide-react';
import { Employee } from '@/integrations/supabase/rh-types';

interface EmployeeDetailsTabsProps {
  employee: Employee;
  companyId?: string;
  onUpdateEmployee?: (employee: Employee) => void;
  onDeleteEmployee?: (employeeId: string) => void;
  loading?: boolean;
  className?: string;
}

export function EmployeeDetailsTabsTest({
  employee,
  companyId,
  onUpdateEmployee,
  onDeleteEmployee,
  loading = false,
  className = '',
}: EmployeeDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdateEmployee = (updatedEmployee: Employee) => {
    if (onUpdateEmployee) {
      onUpdateEmployee(updatedEmployee);
    }
    setIsEditing(false);
  };

  const handleDeleteEmployee = () => {
    if (onDeleteEmployee && window.confirm('Tem certeza que deseja excluir este funcionário?')) {
      onDeleteEmployee(employee.id);
    }
  };

  return (
    <div className={className}>
      {/* Cabeçalho do Funcionário */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{employee.nome}</h2>
                <p className="text-muted-foreground">
                  {employee.matricula && `Matrícula: ${employee.matricula}`}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant={employee.status === 'ativo' ? 'default' : 'secondary'}>
                    {employee.status || 'N/A'}
                  </Badge>
                  {employee.is_pcd && (
                    <Badge variant="outline" className="text-blue-600">
                      PCD
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                disabled={loading}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditing ? 'Cancelar' : 'Editar'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteEmployee}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Abas de Detalhes */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-13 gap-1">
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
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Informações Básicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                    <p className="text-sm">{employee.nome}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">CPF</label>
                    <p className="text-sm">{employee.cpf || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">RG</label>
                    <p className="text-sm">{employee.rg || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Nascimento</label>
                    <p className="text-sm">{employee.data_nascimento || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Informações de PCD */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Informações de PCD</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_pcd"
                      checked={employee.is_pcd || false}
                      disabled={!isEditing}
                      onChange={(e) => {
                        if (isEditing) {
                          console.log('É PCD:', e.target.checked);
                        }
                      }}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="is_pcd" className="text-sm font-medium text-muted-foreground">
                      Pessoa com Deficiência (PCD)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {employee.is_pcd ? 'Sim' : 'Não'}
                    </span>
                  </div>
                </div>
                
                {employee.is_pcd && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="deficiency_type" className="text-sm font-medium text-muted-foreground">
                        Tipo de Deficiência
                      </label>
                      <select
                        id="deficiency_type"
                        disabled={!isEditing}
                        value={employee.deficiency_type || ''}
                        onChange={(e) => {
                          if (isEditing) {
                            console.log('Tipo de deficiência:', e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                      >
                        <option value="">Selecione o tipo</option>
                        <option value="fisica">Física</option>
                        <option value="visual">Visual</option>
                        <option value="auditiva">Auditiva</option>
                        <option value="intelectual">Intelectual</option>
                        <option value="mental">Mental</option>
                        <option value="multipla">Múltipla</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="deficiency_degree" className="text-sm font-medium text-muted-foreground">
                        Grau de Deficiência
                      </label>
                      <select
                        id="deficiency_degree"
                        disabled={!isEditing}
                        value={employee.deficiency_degree || ''}
                        onChange={(e) => {
                          if (isEditing) {
                            console.log('Grau de deficiência:', e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                      >
                        <option value="">Selecione o grau</option>
                        <option value="leve">Leve</option>
                        <option value="moderada">Moderada</option>
                        <option value="severa">Severa</option>
                        <option value="profunda">Profunda</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Configurações de Trabalho */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Configurações de Trabalho</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="precisa_registrar_ponto"
                      checked={employee.precisa_registrar_ponto || true}
                      disabled={!isEditing}
                      onChange={(e) => {
                        if (isEditing) {
                          console.log('Precisa registrar ponto:', e.target.checked);
                        }
                      }}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="precisa_registrar_ponto" className="text-sm font-medium text-muted-foreground">
                      Precisa registrar ponto
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {employee.precisa_registrar_ponto ? 'Sim' : 'Não'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="tipo_banco_horas" className="text-sm font-medium text-muted-foreground">
                      Tipo de Banco de Horas
                    </label>
                    <select
                      id="tipo_banco_horas"
                      disabled={!isEditing}
                      value={employee.tipo_banco_horas || 'compensatorio'}
                      onChange={(e) => {
                        if (isEditing) {
                          console.log('Tipo de banco de horas:', e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                    >
                      <option value="compensatorio">Compensatório</option>
                      <option value="banco_horas">Banco de Horas</option>
                      <option value="horas_extras">Horas Extras</option>
                      <option value="nao_aplicavel">Não Aplicável</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {employee.tipo_banco_horas === 'compensatorio' && 'Compensatório'}
                      {employee.tipo_banco_horas === 'banco_horas' && 'Banco de Horas'}
                      {employee.tipo_banco_horas === 'horas_extras' && 'Horas Extras'}
                      {employee.tipo_banco_horas === 'nao_aplicavel' && 'Não Aplicável'}
                      {!employee.tipo_banco_horas && 'Compensatório'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Adicionais e Complementos */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Adicionais e Complementos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Adicionais Aplicáveis
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="periculosidade"
                          checked={employee.periculosidade || false}
                          disabled={!isEditing}
                          onChange={(e) => {
                            if (isEditing) {
                              console.log('Periculosidade:', e.target.checked);
                            }
                          }}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="periculosidade" className="text-sm text-muted-foreground">
                          Periculosidade
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="insalubridade"
                          checked={employee.insalubridade || false}
                          disabled={!isEditing}
                          onChange={(e) => {
                            if (isEditing) {
                              console.log('Insalubridade:', e.target.checked);
                            }
                          }}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="insalubridade" className="text-sm text-muted-foreground">
                          Insalubridade
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Status dos Adicionais
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Periculosidade:</span>
                        <span className="text-sm font-medium">
                          {employee.periculosidade ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Insalubridade:</span>
                        <span className="text-sm font-medium">
                          {employee.insalubridade ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Adicional Noturno:</span>
                        <span className="text-sm font-medium text-blue-600">
                          Calculado automaticamente
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Adicional FDS:</span>
                        <span className="text-sm font-medium text-blue-600">
                          Calculado automaticamente
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Documentos do funcionário serão exibidos aqui.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Endereços</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Endereços do funcionário serão exibidos aqui.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spouse" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cônjuge</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Informações do cônjuge serão exibidas aqui.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Contas Bancárias</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Contas bancárias do funcionário serão exibidas aqui.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Educação</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Informações educacionais serão exibidas aqui.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


























