
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Users, CheckSquare, FileText, Shield, LogOut } from 'lucide-react';
import AccessProfilesSection from '@/components/settings/AccessProfilesSection';
import UserClassesSection from '@/components/settings/UserClassesSection';
import ChecklistItemsSection from '@/components/settings/ChecklistItemsSection';
import ReportTemplatesSection from '@/components/settings/ReportTemplatesSection';

const Settings = () => {
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <SettingsIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
                <p className="text-sm text-gray-600">Controle de acesso e configurações administrativas</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Bem-vindo, {user?.email}
              </span>
              <Button variant="outline" size="sm" className="min-w-[44px] min-h-[44px]" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <Tabs defaultValue="access-profiles" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 text-xs md:text-sm">
                <TabsTrigger value="access-profiles" className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Perfis de Acesso</span>
                </TabsTrigger>
                <TabsTrigger value="user-classes" className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Classes de Usuário</span>
                </TabsTrigger>
                <TabsTrigger value="checklist" className="flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4" />
                  <span>Checklist de Itens</span>
                </TabsTrigger>
                <TabsTrigger value="report-templates" className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Templates de Relatório</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="access-profiles">
                <AccessProfilesSection />
              </TabsContent>

              <TabsContent value="user-classes">
                <UserClassesSection />
              </TabsContent>

              <TabsContent value="checklist">
                <ChecklistItemsSection />
              </TabsContent>

              <TabsContent value="report-templates">
                <ReportTemplatesSection />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
