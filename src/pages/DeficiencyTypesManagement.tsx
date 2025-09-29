import React from 'react';
import { useUserCompany } from '@/hooks/useUserCompany';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Accessibility, Filter, Download, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DeficiencyTypesManagement } from '@/components/rh';

export default function DeficiencyTypesManagementPage() {
  const navigate = useNavigate();
  const { data: userCompany, isLoading: loadingCompany } = useUserCompany();

  if (loadingCompany) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="text-muted-foreground">Carregando módulo RH...</p>
        </div>
      </div>
    );
  }

  if (!userCompany) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Erro de Configuração</h2>
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar as informações da empresa. 
            Verifique se você está associado a uma empresa válida.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!userCompany.is_active) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-warning rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Empresa Inativa</h2>
          <p className="text-muted-foreground">
            A empresa <strong>{userCompany.nome_fantasia || userCompany.razao_social}</strong> está com status inativo. 
            Entre em contato com o administrador para ativar o módulo RH.
          </p>
        </div>
      </div>
    );
  }

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
                  Tipos de Deficiência
                </h1>
                <p className="text-muted-foreground mt-2">
                  Gerencie os tipos de deficiência para PCD da empresa <strong>{userCompany.nome_fantasia || userCompany.razao_social}</strong>
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
            <span className="text-foreground font-medium">Tipos de Deficiência</span>
          </nav>
        </div>

        {/* Conteúdo principal */}
        <DeficiencyTypesManagement companyId={userCompany.id} />
      </div>
    </div>
  );
}





















