import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Clock, Users, Filter, Download, Plus, Calendar, Settings } from 'lucide-react';
import { TimeRecordManagement as TimeRecordManagementComponent } from '@/components/rh';
import { TimeRecordCorrectionControl } from '@/components/rh/TimeRecordCorrectionControl';
import { useCompany } from '@/hooks/useCompany';

export default function TimeRecordManagementPage() {
  const navigate = useNavigate();
  const { data: company, isLoading: companyLoading } = useCompany();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
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
                  Gestão de Ponto Eletrônico
                </h1>
                <p className="text-muted-foreground mt-2">
                  Gerencie registros de ponto da empresa
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
                Novo Registro
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
            <span className="text-foreground font-medium">Ponto Eletrônico</span>
          </nav>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Registros hoje</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funcionários Presentes</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">0</div>
              <p className="text-xs text-muted-foreground">No trabalho</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horas Trabalhadas</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">0h</div>
              <p className="text-xs text-muted-foreground">Média diária</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atrasos</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">0</div>
              <p className="text-xs text-muted-foreground">Registros atrasados</p>
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
          <Tabs defaultValue="records" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="records" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Registros de Ponto</span>
              </TabsTrigger>
              <TabsTrigger value="correction-control" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Controle de Correção</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="records" className="space-y-6">
              <TimeRecordManagementComponent companyId={company.id} />
            </TabsContent>
            
            <TabsContent value="correction-control" className="space-y-6">
              <TimeRecordCorrectionControl companyId={company.id} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Erro ao carregar dados da empresa</p>
          </div>
        )}
      </div>
    </div>
  );
}
