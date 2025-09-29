import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type SettingsLayoutProps = {
  active: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
};

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({ active, onChange, children }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Card className="p-4">
        <Tabs value={active} onValueChange={onChange} className="w-full">
          <TabsList>
            <TabsTrigger value="companies">Empresas</TabsTrigger>
            <TabsTrigger value="profiles">Perfis</TabsTrigger>
          </TabsList>
          <TabsContent value="companies" className="mt-4">
            {active === 'companies' && children}
          </TabsContent>
          <TabsContent value="profiles" className="mt-4">
            {active === 'profiles' && children}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};


