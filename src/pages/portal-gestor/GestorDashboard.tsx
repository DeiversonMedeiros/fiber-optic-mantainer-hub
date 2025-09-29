import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Clock, 
  Calendar, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  DollarSign,
  Car,
  Stethoscope,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GestorDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Dados mockados - serão substituídos por dados reais
  const dashboardData = {
    teamStats: {
      totalEmployees: 15,
      activeEmployees: 14,
      onVacation: 2,
      onLeave: 1
    },
    pendingApprovals: {
      vacations: 3,
      compensations: 2,
      reimbursements: 4,
      equipment: 1,
      medicalCertificates: 2,
      attendanceCorrections: 1
    },
    recentActivity: [
      { type: 'vacation', employee: 'João Silva', date: '2024-03-15', status: 'pending' },
      { type: 'reimbursement', employee: 'Maria Santos', date: '2024-03-14', status: 'pending' },
      { type: 'compensation', employee: 'Pedro Costa', date: '2024-03-13', status: 'approved' },
      { type: 'medical', employee: 'Ana Oliveira', date: '2024-03-12', status: 'pending' }
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      default: return 'Desconhecido';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'vacation': return <Calendar className="h-4 w-4" />;
      case 'reimbursement': return <DollarSign className="h-4 w-4" />;
      case 'compensation': return <Clock className="h-4 w-4" />;
      case 'medical': return <Stethoscope className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'vacation': return 'Férias';
      case 'reimbursement': return 'Reembolso';
      case 'compensation': return 'Compensação';
      case 'medical': return 'Atestado';
      default: return 'Outros';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard do Gestor</h1>
          <p className="text-muted-foreground">
            Gerencie sua equipe e aprove solicitações
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => navigate('/portal-gestor/aprovacoes')}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Central de Aprovações
          </Button>
          <Button variant="outline" onClick={() => navigate('/portal-gestor/escalas')}>
            <Calendar className="h-4 w-4 mr-2" />
            Escalas
          </Button>
        </div>
      </div>

      {/* Estatísticas da Equipe */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.teamStats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.teamStats.activeEmployees} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Férias</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.teamStats.onVacation}</div>
            <p className="text-xs text-muted-foreground">
              Funcionários em férias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Afastados</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.teamStats.onLeave}</div>
            <p className="text-xs text-muted-foreground">
              Por motivos médicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitações Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(dashboardData.pendingApprovals).reduce((a, b) => a + b, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Solicitações Pendentes por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Solicitações Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Férias</span>
              </div>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                {dashboardData.pendingApprovals.vacations}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Compensações</span>
              </div>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                {dashboardData.pendingApprovals.compensations}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>Reembolsos</span>
              </div>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                {dashboardData.pendingApprovals.reimbursements}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                <span>Equipamentos</span>
              </div>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                {dashboardData.pendingApprovals.equipment}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                <span>Atestados</span>
              </div>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                {dashboardData.pendingApprovals.medicalCertificates}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Correções de Ponto</span>
              </div>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                {dashboardData.pendingApprovals.attendanceCorrections}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getActivityIcon(activity.type)}
                  <div>
                    <p className="text-sm font-medium">{activity.employee}</p>
                    <p className="text-xs text-muted-foreground">
                      {getActivityLabel(activity.type)} • {activity.date}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusColor(activity.status)}>
                  {getStatusLabel(activity.status)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => navigate('/portal-gestor/aprovacoes/ferias')}
            >
              <Calendar className="h-6 w-6 mb-2" />
              Aprovar Férias
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => navigate('/portal-gestor/aprovacoes/reembolsos')}
            >
              <DollarSign className="h-6 w-6 mb-2" />
              Aprovar Reembolsos
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => navigate('/portal-gestor/aprovacoes/correcoes-ponto')}
            >
              <FileText className="h-6 w-6 mb-2" />
              Aprovar Correções
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => navigate('/portal-gestor/acompanhamento/ponto')}
            >
              <Clock className="h-6 w-6 mb-2" />
              Ver Registros de Ponto
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => navigate('/portal-gestor/escalas')}
            >
              <Calendar className="h-6 w-6 mb-2" />
              Gerenciar Escalas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GestorDashboard;
