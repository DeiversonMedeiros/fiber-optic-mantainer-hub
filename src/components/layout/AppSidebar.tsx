import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  FileText, 
  User,
  CheckSquare,
  Package,
  Settings as SettingsIcon,
  Shield,
  ClipboardList,
  Eye,
  Wrench
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const menuItems = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'my-reports',
    title: 'Meus Relatórios',
    url: '/my-reports',
    icon: FileText,
  },
  {
    id: 'report-validation',
    title: 'Validação de Relatórios',
    url: '/report-validation',
    icon: CheckSquare,
  },
  {
    id: 'material-control',
    title: 'Controle de Material',
    url: '/material-control',
    icon: Package,
  },
  {
    id: 'my-adjustments',
    title: 'Minhas Adequações',
    url: '/my-adjustments',
    icon: Settings,
  },
  {
    id: 'users',
    title: 'Gerenciar Usuários',
    url: '/users',
    icon: Users,
  },
  {
    id: 'settings',
    title: 'Configurações',
    url: '/settings',
    icon: SettingsIcon,
  },
  {
    id: 'preventive-maintenance',
    title: 'Gestão de Preventiva',
    url: '/preventive-maintenance',
    icon: Wrench,
  },
  {
    id: 'preventivas',
    title: 'Preventivas',
    url: '/preventivas',
    icon: ClipboardList,
  },
  {
    id: 'vistoria',
    title: 'Vistoria',
    url: '/vistoria',
    icon: Eye,
  },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  
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

  // Buscar perfil de acesso e permissões
  const { data: accessProfile } = useQuery({
    queryKey: ['access-profile', profile?.access_profile_id],
    queryFn: async () => {
      if (!profile?.access_profile_id) return null;
      const { data, error } = await supabase
        .from('access_profiles')
        .select('id, name, permissions')
        .eq('id', profile.access_profile_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.access_profile_id,
  });

  const handleLogout = async () => {
    await signOut();
  };

  // Filtrar menu conforme permissões do perfil de acesso (array de páginas)
  let permissionsArr = accessProfile?.permissions;
  if (typeof permissionsArr === 'string') {
    try {
      permissionsArr = JSON.parse(permissionsArr);
    } catch {
      permissionsArr = [];
    }
  }
  if (!Array.isArray(permissionsArr)) {
    permissionsArr = [];
  }

  const filteredMenuItems = menuItems.filter(item => permissionsArr.includes(item.id));
  const noAccess = filteredMenuItems.length === 0;

  console.log('Permissões carregadas:', permissionsArr);
  console.log('IDs do menu:', menuItems.map(i => i.id));

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">SGM</h2>
            <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {noAccess ? (
                <SidebarMenuItem>
                  <span className="text-xs text-muted-foreground px-4 py-2 block">
                    Nenhuma página disponível para seu perfil.<br />
                    Contate o administrador.
                  </span>
                </SidebarMenuItem>
              ) : (
                filteredMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive}
                        onClick={() => navigate(item.url)}
                      >
                        <button className="w-full">
                          <Icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => navigate('/profile')}
          >
            <User className="w-4 h-4 mr-2" />
            Meu Perfil
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            Sair
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
