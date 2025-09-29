
import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { coreSupabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActiveCompany } from '@/hooks/useActiveCompany';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { companies, activeCompanyId, setActiveCompanyId, loading } = useActiveCompany();

  // Buscar dados da empresa ativa
  const activeCompany = companies.find(c => c.id === activeCompanyId);

  // Buscar perfil do usuário logado usando o novo sistema
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await coreSupabase
        .rpc('get_user_profile', { user_id: user.id });
      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
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
        <SidebarInset className="flex-1 transition-all duration-300 ease-in-out">
          <div className="flex h-full flex-col">
            <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 bg-white">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                {/* Logo da Empresa Ativa */}
                {activeCompany && (
                  <div className="flex items-center gap-2 ml-4">
                    {activeCompany.logo_url ? (
                      <img
                        src={activeCompany.logo_url}
                        alt={`Logo ${activeCompany.nome_fantasia || activeCompany.razao_social}`}
                        className="h-8 w-auto max-w-32 object-contain"
                        onError={(e) => {
                          // Se a imagem falhar ao carregar, ocultar o elemento
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {(activeCompany.nome_fantasia || activeCompany.razao_social)
                            .split(' ')
                            .map(word => word.charAt(0))
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 hidden sm:block">
                      {activeCompany.nome_fantasia || activeCompany.razao_social}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Informações do usuário */}
              {user && (
                <div className="flex items-center gap-3">
                  {/* Seletor de Empresa Ativa */}
                  <div className="w-64">
                    <Select value={activeCompanyId ?? undefined} onValueChange={(v) => setActiveCompanyId(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder={loading ? 'Carregando empresas...' : 'Selecionar empresa'} />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center gap-2">
                              {c.logo_url ? (
                                <img
                                  src={c.logo_url}
                                  alt={`Logo ${c.nome_fantasia || c.razao_social}`}
                                  className="h-4 w-4 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="h-4 w-4 bg-gray-200 rounded flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-600">
                                    {(c.nome_fantasia || c.razao_social)
                                      .split(' ')
                                      .map(word => word.charAt(0))
                                      .join('')
                                      .toUpperCase()
                                      .slice(0, 2)}
                                  </span>
                                </div>
                              )}
                              <span>{c.nome_fantasia || c.razao_social}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-gray-900">
                      {userProfile?.name || user.email}
                    </span>
                    {userProfile?.profile_name && (
                      <Badge variant="secondary" className="text-xs">
                        {userProfile.profile_name}
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
                      {getInitials(userProfile?.name || user.email || '')}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </header>
            <main className="flex-1 transition-all duration-300 ease-in-out">
              {children}
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
