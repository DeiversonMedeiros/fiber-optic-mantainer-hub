
import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Buscar perfil do usuário logado
  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Buscar perfil de acesso
  const { data: accessProfile } = useQuery({
    queryKey: ['access-profile', profile?.access_profile_id],
    queryFn: async () => {
      if (!profile?.access_profile_id) return null;
      const { data, error } = await supabase
        .from('access_profiles')
        .select('id, name')
        .eq('id', profile.access_profile_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.access_profile_id,
  });

  // Função para obter as iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <div className="flex h-full flex-col">
            <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 bg-white">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
              </div>
              
              {/* Informações do usuário */}
              {user && (
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-gray-900">
                      {profile?.name || user.email}
                    </span>
                    {accessProfile && (
                      <Badge variant="secondary" className="text-xs">
                        {accessProfile.name}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={() => navigate('/change-password')}
                  >
                    Alterar Senha
                  </Button>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {getInitials(profile?.name || user.email || '')}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </header>
            <main className="flex-1">
              {children}
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
