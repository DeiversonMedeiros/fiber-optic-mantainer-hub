import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Users, Filter, Download, Plus, Calendar } from 'lucide-react';
import { WorkScheduleManagement as WorkScheduleManagementComponent } from '@/components/rh';
import { useCompany } from '@/hooks/useCompany';

export default function WorkScheduleManagementPage() {
  const navigate = useNavigate();
  const { data: company, isLoading: companyLoading } = useCompany();

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
                  Gestão de Escalas de Trabalho
                </h1>
                <p className="text-muted-foreground mt-2">
                  Gerencie escalas de trabalho da empresa
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
                Nova Escala
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
            <span className="text-foreground font-medium">Escalas de Trabalho</span>
          </nav>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Escalas</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Escalas ativas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">0</div>
              <p className="text-xs text-muted-foreground">Com escala definida</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horas Semanais</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">0h</div>
              <p className="text-xs text-muted-foreground">Média por funcionário</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Turnos</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">0</div>
              <p className="text-xs text-muted-foreground">Tipos de turno</p>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo principal */}
        {companyLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando dados da empresa...</p>
            </div>
          </div>
        ) : company ? (
          <WorkScheduleManagementComponent companyId={company.id} />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Erro ao carregar dados da empresa</p>
          </div>
        )}
    </div>
  );
}
