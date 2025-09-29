import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, Users, Filter, Download, Plus, Clock, Bell, AlertTriangle } from 'lucide-react';
import { VacationsManagement as VacationsManagementComponent } from '@/components/rh';
import { useCompany } from '@/hooks/useCompany';
import { VacationAlertsDashboard } from '@/components/vacation/VacationAlertsDashboard';
import { useVacationAlerts } from '@/hooks/useVacationDashboard';

export default function VacationsManagementPage() {
  const navigate = useNavigate();
  const { data: company, isLoading: companyLoading } = useCompany();
  const [activeTab, setActiveTab] = useState('vacations');
  
  // Buscar alertas críticos para mostrar badge na aba
  const { data: alerts = [] } = useVacationAlerts(company?.id);
  const criticalAlertsCount = alerts.filter(alert => alert.priority === 'critical').length;

  return (
    <div className="w-full">
      
        {/* Header da página */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/rh')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar ao RH</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Gestão de Férias e Abonos
                </h1>
                <p className="text-muted-foreground mt-2">
                  Gerencie férias e abonos dos funcionários
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Solicitação
              </Button>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <button 
              onClick={() => navigate('/rh')}
              className="hover:text-foreground transition-colors"
            >
              RH
            </button>
            <span>/</span>
            <span className="text-foreground font-medium">Férias e Abonos</span>
          </nav>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Solicitações</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Solicitações este ano</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">0</div>
              <p className="text-xs text-muted-foreground">Com férias pendentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dias Disponíveis</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">0</div>
              <p className="text-xs text-muted-foreground">Total de dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">0</div>
              <p className="text-xs text-muted-foreground">Solicitações aprovadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Sistema de Abas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vacations" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Gestão de Férias</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Notificações e Alertas</span>
              {criticalAlertsCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {criticalAlertsCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Aba: Gestão de Férias */}
          <TabsContent value="vacations" className="space-y-6">
            {/* Alerta rápido se houver alertas críticos */}
            {criticalAlertsCount > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">
                        {criticalAlertsCount} funcionário{criticalAlertsCount > 1 ? 's' : ''} com férias vencidas
                      </p>
                      <p className="text-xs text-red-600">
                        Verifique a aba "Notificações e Alertas" para mais detalhes
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('notifications')}
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      Ver Alertas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {companyLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando dados da empresa...</p>
                </div>
              </div>
            ) : company ? (
              <VacationsManagementComponent companyId={company.id} />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Erro ao carregar dados da empresa</p>
              </div>
            )}
          </TabsContent>

          {/* Aba: Notificações e Alertas */}
          <TabsContent value="notifications" className="space-y-6">
            {company && (
              <VacationAlertsDashboard 
                companyId={company.id}
                showActions={true}
                onGenerateNotifications={() => {
                  // Callback para quando notificações forem geradas
                  console.log('Notificações geradas para a empresa:', company.id);
                }}
                onExportReport={() => {
                  // Callback para exportar relatório
                  console.log('Exportando relatório para a empresa:', company.id);
                }}
              />
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
}
