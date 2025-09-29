// @ts-nocheck
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2
} from 'lucide-react';

const AppSidebar = () => {
  const { user, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Funcionários', path: '/employees' },
    { icon: Clock, label: 'Ponto', path: '/time-tracking' },
    { icon: FileText, label: 'Relatórios', path: '/reports' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className={`bg-white border-r border-gray-200 h-full transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="text-lg font-semibold text-gray-900">SGM</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="p-4">
        {user && !isCollapsed && (
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900">Bem-vindo!</p>
            <p className="text-xs text-gray-600">{user.email}</p>
          </div>
        )}

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <item.icon className="h-5 w-5" />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </a>
          ))}
        </nav>

        <div className="mt-8 pt-4 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`w-full justify-start text-gray-700 hover:bg-red-50 hover:text-red-600 ${
              isCollapsed ? 'px-3' : ''
            }`}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3">Sair</span>}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppSidebar;