import React from 'react';
import { useUserCompany } from '@/hooks/useUserCompany';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Stethoscope, Users, MapPin, Phone, Filter, Download, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PeriodicExamManagement } from '@/components/rh';

export default function PeriodicExamManagementPage() {
  const navigate = useNavigate();
  const { data: userCompany, isLoading: loadingCompany } = useUserCompany();

  if (loadingCompany) {
    return (
      <div className="w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Stethoscope className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Carregando...</h2>
          <p className="text-muted-foreground">Buscando informações da empresa</p>
        </div>
      </div>
    );
  }

  if (!userCompany) {
    return (
      <div className="w-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="w-8 h-8 text-destructive-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Empresa não encontrada</h2>
          <p className="text-muted-foreground mb-4">
            Não foi possível encontrar a empresa associada ao seu usuário.
          </p>
          <Button onClick={() => navigate('/rh')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate('/rh')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Exames Periódicos</h1>
              <p className="text-muted-foreground">
                Gerencie os exames periódicos dos funcionários da {userCompany.nome_fantasia || userCompany.razao_social}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Company Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Informações da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Empresa</p>
                  <p className="font-medium">{userCompany.nome_fantasia || userCompany.razao_social}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">CNPJ</p>
                  <p className="font-medium">{userCompany.cnpj}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{userCompany.is_active ? 'Ativa' : 'Inativa'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Management Component */}
        <PeriodicExamManagement />
      </div>
    </div>
  );
}
