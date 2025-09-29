import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  EmployeeManagement, 
  TimeRecordManagement 
} from './index';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Briefcase, 
  Clock, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  UserPlus,
  FileText,
  BarChart3,
  Gift,
  Umbrella,
  Shield,
  BookOpen,
  Package
} from 'lucide-react';

export interface HRDashboardProps {
  companyId: string;
  className?: string;
}

export function HRDashboard({ companyId, className = '' }: HRDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  // Dashboard cards principais
  const DashboardCard = ({ title, value, icon, color, description }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    description?: string;
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
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  // Estatísticas rápidas
  const QuickStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <DashboardCard
        title="Total de Funcionários"
        value="0"
        icon={<Users className="h-4 w-4" />}
        color="text-blue-600"
        description="Ativos e inativos"
      />
      <DashboardCard
        title="Cargos Ativos"
        value="0"
        icon={<Briefcase className="h-4 w-4" />}
        color="text-green-600"
        description="Posições disponíveis"
      />
      <DashboardCard
        title="Registros Hoje"
        value="0"
        icon={<Clock className="h-4 w-4" />}
        color="text-orange-600"
        description="Ponto eletrônico"
      />
      <DashboardCard
        title="Férias Pendentes"
        value="0"
        icon={<Calendar className="h-4 w-4" />}
        color="text-purple-600"
        description="Solicitações"
      />
    </div>
  );

  // Ações rápidas
  const QuickActions = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate('/rh/employees')}
          >
            <Users className="h-4 w-4 mr-2" />
            Novo Funcionário
          </Button>

          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate('/rh/time-records')}
          >
            <Clock className="h-4 w-4 mr-2" />
            Registrar Ponto
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate('/rh/work-shifts')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Escalas de Trabalho
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate('/rh/payroll')}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Folha de Pagamento
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate('/rh/vacations')}
          >
            <Umbrella className="h-4 w-4 mr-2" />
            Férias e Licenças
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate('/rh/medical-certificates')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Atestados Médicos
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate('/rh/esocial')}
          >
            <Shield className="h-4 w-4 mr-2" />
            eSocial
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate('/rh/recruitment')}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Recrutamento
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => navigate('/rh/training')}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Treinamentos
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <BarChart3 className="h-4 w-4 mr-2" />
            Relatório de Ponto
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Users className="h-4 w-4 mr-2" />
            Folha de Pagamento
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Calendar className="h-4 w-4 mr-2" />
            Férias e Ausências
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Indicadores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <div className="flex justify-between">
              <span>Taxa de Rotatividade:</span>
              <span className="font-medium">0%</span>
            </div>
            <div className="flex justify-between">
              <span>Absenteísmo:</span>
              <span className="font-medium">0%</span>
            </div>
            <div className="flex justify-between">
              <span>Horas Extras:</span>
              <span className="font-medium">0h</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard de Recursos Humanos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os aspectos do RH da empresa
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Relatórios
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Contratar
          </Button>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <QuickStats />

      {/* Ações rápidas */}
      <QuickActions />

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="employees" onClick={() => navigate('/rh/employees')}>Funcionários</TabsTrigger>
          <TabsTrigger value="time-records" onClick={() => navigate('/rh/time-records')}>Ponto</TabsTrigger>
          <TabsTrigger value="more" onClick={() => navigate('/rh')}>Mais...</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Funcionários por Departamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Gráfico de funcionários por departamento
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Horas Trabalhadas (Mês)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Gráfico de horas trabalhadas
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Novo funcionário contratado</p>
                    <p className="text-xs text-muted-foreground">João Silva - Desenvolvedor</p>
                  </div>
                  <span className="text-xs text-muted-foreground">2h atrás</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Registro de ponto aprovado</p>
                    <p className="text-xs text-muted-foreground">Maria Santos - 08:00-17:00</p>
                  </div>
                  <span className="text-xs text-muted-foreground">4h atrás</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Solicitação de férias</p>
                    <p className="text-xs text-muted-foreground">Pedro Costa - 15/01 a 30/01</p>
                  </div>
                  <span className="text-xs text-muted-foreground">1 dia atrás</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <EmployeeManagement companyId={companyId} />
        </TabsContent>



        <TabsContent value="time-records" className="space-y-4">
          <TimeRecordManagement companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente de exemplo para uso em outras páginas
export function HRDashboardPage({ companyId }: { companyId: string }) {
  return (
    <div className="container mx-auto py-6 px-4">
      <HRDashboard companyId={companyId} />
    </div>
  );
}
