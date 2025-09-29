import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  CheckCircle, 
  Calendar, 
  Clock, 
  DollarSign, 
  Car,
  Stethoscope,
  FileText,
  Users,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface PortalMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
}

const PortalGestorLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const menuItems: PortalMenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="h-4 w-4" />,
      href: '/portal-gestor/dashboard'
    },
    {
      id: 'aprovacoes',
      label: 'Central de Aprovações',
      icon: <CheckCircle className="h-4 w-4" />,
      href: '/portal-gestor/aprovacoes',
      badge: '13'
    },
    {
      id: 'ferias',
      label: 'Aprovar Férias',
      icon: <Calendar className="h-4 w-4" />,
      href: '/portal-gestor/aprovacoes/ferias'
    },
    {
      id: 'compensacoes',
      label: 'Compensações',
      icon: <Clock className="h-4 w-4" />,
      href: '/portal-gestor/aprovacoes/compensacoes'
    },
    {
      id: 'reembolsos',
      label: 'Reembolsos',
      icon: <DollarSign className="h-4 w-4" />,
      href: '/portal-gestor/aprovacoes/reembolsos'
    },
    {
      id: 'equipamentos',
      label: 'Equipamentos',
      icon: <Car className="h-4 w-4" />,
      href: '/portal-gestor/aprovacoes/equipamentos'
    },
    {
      id: 'atestados',
      label: 'Atestados',
      icon: <Stethoscope className="h-4 w-4" />,
      href: '/portal-gestor/aprovacoes/atestados'
    },
    {
      id: 'correcoes-ponto',
      label: 'Correções de Ponto',
      icon: <FileText className="h-4 w-4" />,
      href: '/portal-gestor/aprovacoes/correcoes-ponto'
    },
    {
      id: 'ponto',
      label: 'Registros de Ponto',
      icon: <Clock className="h-4 w-4" />,
      href: '/portal-gestor/acompanhamento/ponto'
    },
    {
      id: 'exames',
      label: 'Exames',
      icon: <Stethoscope className="h-4 w-4" />,
      href: '/portal-gestor/acompanhamento/exames'
    },
    {
      id: 'escalas',
      label: 'Escalas',
      icon: <Calendar className="h-4 w-4" />,
      href: '/portal-gestor/escalas'
    }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Portal do Gestor
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {user?.email}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? "secondary" : "ghost"}
                        className="w-full justify-start space-x-3 h-12 px-4"
                        onClick={() => navigate(item.href)}
                      >
                        {item.icon}
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <Badge variant="destructive" className="ml-2">
                            {item.badge}
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalGestorLayout;
