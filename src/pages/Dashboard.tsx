
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '@/components/dashboard/StatCard';
import MaintenanceChart from '@/components/dashboard/MaintenanceChart';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import QuickActions from '@/components/dashboard/QuickActions';
import { 
  ClipboardList, 
  Users, 
  AlertTriangle, 
  FileText,
  LogOut,
  Settings,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create-os':
        toast({
          title: "Criar OS",
          description: "Funcionalidade em desenvolvimento",
        });
        break;
      case 'validate-reports':
        toast({
          title: "Validar Relatórios",
          description: "Funcionalidade em desenvolvimento",
        });
        break;
      case 'new-user':
        toast({
          title: "Novo Usuário",
          description: "Funcionalidade em desenvolvimento",
        });
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-full"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SGM</h1>
                <p className="text-sm text-gray-600">Sistema de Gestão de Manutenção</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Bem-vindo, {user?.email}
              </span>
              <Button variant="outline" size="sm">
                <User className="w-4 h-4 mr-2" />
                Perfil
              </Button>
              <Button variant="outline" size="sm" onClick={handleSettings}>
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Operacional</h2>
          <p className="text-gray-600">Visão geral das operações e indicadores do sistema</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Ordens de Serviço (Semana)"
            value="24"
            subtitle="3 em andamento"
            icon={ClipboardList}
            trend={{ value: 12, label: "vs semana anterior" }}
            color="primary"
          />
          <StatCard
            title="Relatórios Pendentes"
            value="8"
            subtitle="2 aguardando validação"
            icon={FileText}
            trend={{ value: -5, label: "vs ontem" }}
            color="warning"
          />
          <StatCard
            title="Técnicos em Campo"
            value="12"
            subtitle="de 18 disponíveis"
            icon={Users}
            color="secondary"
          />
          <StatCard
            title="Riscos Reportados"
            value="3"
            subtitle="1 crítico"
            icon={AlertTriangle}
            trend={{ value: 2, label: "novos hoje" }}
            color="danger"
          />
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Manutenções por Tipo (últimos 7 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <MaintenanceChart />
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityFeed />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActions onAction={handleQuickAction} />
      </main>
    </div>
  );
};

export default Dashboard;
