import React from 'react';
import { useUserCompany } from '@/hooks/useUserCompany';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Users, Calendar, AlertTriangle, Filter, Download, Plus, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MedicalCertificatesManagement } from '@/components/rh/MedicalCertificatesManagement';

export default function MedicalCertificateManagementPage() {
  const navigate = useNavigate();
  const { data: userCompany, isLoading: loadingCompany } = useUserCompany();

  if (loadingCompany) {
    return (
      <div className="w-full flex items-center justify-center">
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
      <div className="w-full flex items-center justify-center">
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
      <div className="w-full flex items-center justify-center">
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
                  Gestão de Atestados Médicos
                </h1>
                <p className="text-muted-foreground mt-2">
                  Gerencie atestados médicos e licenças da empresa <strong>{userCompany.nome_fantasia || userCompany.razao_social}</strong>
                </p>
              </div>
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
            <span className="text-foreground font-medium">Atestados Médicos</span>
          </nav>
        </div>

        {/* Componente funcional de gerenciamento */}
        <MedicalCertificatesManagement companyId={userCompany.id} />

        {/* Informações adicionais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Tipos de Atestado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Tipos de Atestado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <div className="font-medium mb-2">Categorias:</div>
                  <ul className="space-y-1 text-xs">
                    <li>• Atestado Médico</li>
                    <li>• Atestado Odontológico</li>
                    <li>• Atestado de Saúde Ocupacional</li>
                    <li>• Atestado de Capacidade</li>
                    <li>• Atestado de Comparecimento</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CID - Classificação Internacional de Doenças */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Classificação Internacional de Doenças (CID)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <h4 className="font-medium">Principais Categorias CID-10</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• A00-B99: Doenças infecciosas</li>
                  <li>• C00-D48: Neoplasias</li>
                  <li>• E00-E90: Doenças endócrinas</li>
                  <li>• F00-F99: Transtornos mentais</li>
                  <li>• I00-I99: Doenças circulatórias</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}










