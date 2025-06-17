
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Users, 
  FileText, 
  AlertTriangle, 
  CheckSquare, 
  TrendingUp,
  LogOut,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatCard from '@/components/dashboard/StatCard';
import QuickActions from '@/components/dashboard/QuickActions';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import MaintenanceChart from '@/components/dashboard/MaintenanceChart';

const Dashboard = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
  };

  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'create-os':
        console.log('Criar OS');
        break;
      case 'validate-reports':
        navigate('/report-validation');
        break;
      case 'new-user':
        navigate('/users');
        break;
      default:
        console.log('Ação não encontrada:', actionId);
    }
  };

  return (
    <div className="p-8">
      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/users')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gerenciar Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Administrar usuários do sistema
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/settings')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configurações</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Configurar sistema e permissões
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/my-reports')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relatórios</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Visualizar e gerar relatórios
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/report-validation')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validação</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Validação de Relatórios Técnicos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Ordens Pendentes"
          value="24"
          description="+12% em relação ao mês anterior"
          icon={CheckSquare}
        />
        <StatCard
          title="Ordens Concluídas"
          value="156"
          description="+8% em relação ao mês anterior"
          icon={FileText}
        />
        <StatCard
          title="Alertas Ativos"
          value="7"
          description="3 críticos, 4 moderados"
          icon={AlertTriangle}
        />
        <StatCard
          title="Eficiência"
          value="94.2%"
          description="+2.1% em relação ao mês anterior"
          icon={TrendingUp}
        />
      </div>

      {/* Charts and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <MaintenanceChart />
        <ActivityFeed />
      </div>

      {/* Quick Actions */}
      <QuickActions onAction={handleQuickAction} />
    </div>
  );
};

export default Dashboard;
