
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
  Settings as SettingsIcon
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Meus Relatórios",
    url: "/my-reports",
    icon: FileText,
  },
  {
    title: "Validação de Relatórios",
    url: "/report-validation",
    icon: CheckSquare,
  },
  {
    title: "Controle de Material",
    url: "/material-control",
    icon: Package,
  },
  {
    title: "Meus Ajustes",
    url: "/my-adjustments",
    icon: Settings,
  },
  {
    title: "Gerenciar Usuários",
    url: "/users",
    icon: Users,
    adminOnly: true,
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: SettingsIcon,
    adminOnly: true,
  },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  const handleLogout = async () => {
    await signOut();
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly) {
      // Mostrar apenas para admins e gestores
      return user?.role === 'admin' || user?.role === 'gestor';
    }
    return true;
  });

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
              {filteredMenuItems.map((item) => {
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
              })}
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
