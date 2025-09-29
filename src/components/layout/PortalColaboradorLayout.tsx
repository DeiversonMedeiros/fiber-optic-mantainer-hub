import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  FileText, 
  Calendar, 
  Clock, 
  CreditCard, 
  Stethoscope,
  Upload,
  Edit,
  DollarSign,
  User,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PortalMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
}

const PortalColaboradorLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const menuItems: PortalMenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="h-4 w-4" />,
      href: '/portal-colaborador/dashboard'
    },
    {
      id: 'holerite',
      label: 'Holerite',
      icon: <FileText className="h-4 w-4" />,
      href: '/portal-colaborador/holerite'
    },
    {
      id: 'ferias',
      label: 'Férias',
      icon: <Calendar className="h-4 w-4" />,
      href: '/portal-colaborador/ferias'
    },
    {
      id: 'comprovantes',
      label: 'Comprovantes',
      icon: <FileText className="h-4 w-4" />,
      href: '/portal-colaborador/comprovantes'
    },
    {
      id: 'banco-horas',
      label: 'Banco de Horas',
      icon: <Clock className="h-4 w-4" />,
      href: '/portal-colaborador/banco-horas'
    },
    {
      id: 'atestados',
      label: 'Atestados',
      icon: <Upload className="h-4 w-4" />,
      href: '/portal-colaborador/atestados'
    },
    {
      id: 'registro-ponto',
      label: 'Registro de Ponto',
      icon: <Clock className="h-4 w-4" />,
      href: '/portal-colaborador/registro-ponto'
    },
    {
      id: 'correcao-ponto',
      label: 'Correção de Ponto',
      icon: <Edit className="h-4 w-4" />,
      href: '/portal-colaborador/correcao-ponto'
    },
    {
      id: 'exames',
      label: 'Exames',
      icon: <Stethoscope className="h-4 w-4" />,
      href: '/portal-colaborador/exames'
    },
    {
      id: 'reembolsos',
      label: 'Reembolsos',
      icon: <DollarSign className="h-4 w-4" />,
      href: '/portal-colaborador/reembolsos'
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
                Portal do Colaborador
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

export default PortalColaboradorLayout;
