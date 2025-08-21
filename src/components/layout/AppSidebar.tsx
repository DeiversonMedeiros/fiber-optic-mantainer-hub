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
  useSidebar,
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
  Wrench,
  Lock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePendingCounts } from '@/hooks/usePendingCounts';
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
    showBadge: true,
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
    showBadge: true,
  },
  {
    id: 'vistoria',
    title: 'Vistoria',
    url: '/vistoria',
    icon: Eye,
    showBadge: true,
  },
  {
    id: 'change-password',
    title: 'Alterar Senha',
    url: '/change-password',
    icon: Lock,
  },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();
  const { data: pendingCounts } = usePendingCounts();
  
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

  // Função para obter a contagem pendente para um item específico
  const getPendingCount = (itemId: string) => {
    if (!pendingCounts) return 0;
    
    switch (itemId) {
      case 'my-adjustments':
        return pendingCounts.adjustments;
      case 'preventivas':
        return pendingCounts.preventivas;
      case 'vistoria':
        return pendingCounts.vistoria;
      default:
        return 0;
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center">
          <img
            src="/sgm-logo.png"
            alt="SGM Logo"
            className="w-[180px] h-[80px] object-contain"
          />
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
                  const pendingCount = getPendingCount(item.id);
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive}
                        onClick={() => {
                          if (isMobile) setOpenMobile(false);
                          navigate(item.url);
                        }}
                      >
                        <button className="w-full flex items-center justify-between">
                          <div className="flex items-center">
                            <Icon className="w-4 h-4" />
                            <span>{item.title}</span>
                          </div>
                          {item.showBadge && pendingCount > 0 && (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs font-medium">
                              {pendingCount}
                            </div>
                          )}
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
          {/* Remover o botão Meu Perfil */}
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
