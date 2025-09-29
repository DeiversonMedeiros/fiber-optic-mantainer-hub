import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, LogOut, Info } from 'lucide-react';
import CompaniesManagement from '@/pages/CompaniesManagement';
import ProfilesManagement from '@/pages/ProfilesManagement';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { useAuthorization } from '@/hooks/useAuthorization';
import { useQuery } from '@tanstack/react-query';

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
                <p className="text-sm text-gray-600">Configurações administrativas do ERP</p>
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

      <main>
        <SettingsTabs />
      </main>
    </div>
  );
};

export default Settings;

const SettingsTabs: React.FC = () => {
  const [tab, setTab] = useState<'companies' | 'profiles'>('companies');
  const { checkModule } = useAuthorization();

  const { data: canReadCore } = useQuery({
    queryKey: ['auth', 'perm', 'core', 'read'],
    queryFn: () => checkModule('core', 'read'),
  });

  if (canReadCore === false) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="w-5 h-5" />
              <span>Sem permissão</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            Você não tem permissão para acessar Configurações. Solicite acesso ao módulo "core" (leitura).
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SettingsLayout active={tab} onChange={(v) => setTab(v as any)}>
      {tab === 'companies' ? <CompaniesManagement /> : <ProfilesManagement />}
    </SettingsLayout>
  );
};