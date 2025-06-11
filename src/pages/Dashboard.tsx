
import React from 'react';
import StatCard from '@/components/dashboard/StatCard';
import MaintenanceChart from '@/components/dashboard/MaintenanceChart';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import QuickActions from '@/components/dashboard/QuickActions';
import { ClipboardList, Users, AlertTriangle, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const { toast } = useToast();

  const handleQuickAction = (action: string) => {
    const actionLabels = {
      'create-os': 'Criar Ordem de Serviço',
      'validate-reports': 'Validar Relatórios',
      'new-user': 'Novo Usuário'
    };

    toast({
      title: "Ação em desenvolvimento",
      description: `${actionLabels[action as keyof typeof actionLabels]} será implementado em breve`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <div className="w-5 h-5 bg-secondary rounded-full animate-pulse-glow"></div>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-primary">SGM</h1>
                  <p className="text-xs text-muted-foreground">Sistema de Gestão de Manutenção</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">Administrador</p>
                <p className="text-xs text-muted-foreground">admin@sgm.com</p>
              </div>
              <button
                onClick={onLogout}
                className="text-sm text-primary hover:text-primary-dark transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Dashboard Operacional
          </h1>
          <p className="text-muted-foreground">
            Visão geral das operações e manutenções em tempo real
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Ordens de Serviço da Semana"
            value="127"
            subtitle="23 concluídas hoje"
            icon={ClipboardList}
            trend={{ value: 12, label: "vs semana anterior" }}
            color="primary"
          />
          <StatCard
            title="Relatórios Pendentes"
            value="8"
            subtitle="Aguardando validação"
            icon={AlertTriangle}
            trend={{ value: -15, label: "vs ontem" }}
            color="warning"
          />
          <StatCard
            title="Técnicos em Campo Hoje"
            value="34"
            subtitle="6 equipes ativas"
            icon={Users}
            trend={{ value: 5, label: "vs ontem" }}
            color="secondary"
          />
          <StatCard
            title="Riscos Reportados Recentemente"
            value="3"
            subtitle="Últimas 24h"
            icon={AlertTriangle}
            trend={{ value: 0, label: "sem alteração" }}
            color="danger"
          />
        </div>

        {/* Charts and Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <MaintenanceChart />
          <ActivityFeed />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <QuickActions onAction={handleQuickAction} />
          
          {/* Additional Info Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-6 border border-primary/20">
              <h3 className="text-lg font-semibold text-primary mb-2">
                Status da Rede
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Monitoramento em tempo real da infraestrutura
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Fibra Óptica</span>
                  <span className="text-sm text-green-600 font-medium">98.7% OK</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Equipamentos</span>
                  <span className="text-sm text-green-600 font-medium">95.2% OK</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Conectividade</span>
                  <span className="text-sm text-yellow-600 font-medium">89.1% OK</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-secondary/10 to-primary/10 rounded-lg p-6 border border-secondary/20">
              <h3 className="text-lg font-semibold text-primary mb-2">
                Próximas Manutenções
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Agendamentos para os próximos dias
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Preventiva - Zona Norte</p>
                    <p className="text-xs text-muted-foreground">Amanhã, 08:00</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Inspeção - Centro</p>
                    <p className="text-xs text-muted-foreground">Quinta, 14:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
