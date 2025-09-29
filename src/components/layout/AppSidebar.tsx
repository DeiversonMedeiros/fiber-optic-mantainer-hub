import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { coreSupabase } from '../../integrations/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarMenuSub, 
  SidebarMenuSubButton, 
  SidebarMenuSubItem,
  useSidebar 
} from '@/components/ui/sidebar';

import { 
  Users,
  Settings,
  LogOut,
  ChevronDown,
  User,
  Shield,
  Building2,
  Car,
  Truck,
  ShoppingCart,
  DollarSign,
  ClipboardList,
  Calendar,
  BarChart3,
  Database,
  Zap,
  HardHat,
  Fuel,
  Warehouse,
  Route,
  Factory,
  Briefcase,
  Cog,
  Bell,
  Clock,
  Stethoscope,
  FileText,
  UserPlus,
  GraduationCap,
  Gift,
  Target,
  Timer,
  Tag,
  Accessibility,
  Calculator,
  CreditCard,
  Bus,
  Percent,
  Package,
  RefreshCw,
  Upload
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
  children?: MenuItem[];
}

interface UserProfile {
  profile_id: string | null;
  profile_name: string | null;
  name?: string | null;
  permissoes_gerais?: Record<string, any> | null;
}

interface ModulePermission {
  module_name: string;
  can_read: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface UserPermissions {
  modules: ModulePermission[];
  entities: any[];
}

export default function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { state, isMobile } = useSidebar();

  // Estados para expansão de submenus
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  // Definir menuItems ANTES de qualquer uso
  const menuItems: MenuItem[] = [
    {
      id: 'rh',
      label: 'Recursos Humanos',
      icon: <Users className="h-4 w-4" />,
      href: '/rh',
      children: [
        {
          id: 'rh-dashboard',
          label: 'Dashboard RH',
          icon: <BarChart3 className="h-4 w-4" />,
          href: '/rh'
        },
        {
          id: 'rh-employees',
          label: 'Funcionários',
          icon: <User className="h-4 w-4" />,
          href: '/rh/employees'
        },
        {
          id: 'rh-positions',
          label: 'Cargos',
          icon: <Briefcase className="h-4 w-4" />,
          href: '/rh/positions'
        },
        {
          id: 'rh-time-records',
          label: 'Registro de Ponto',
          icon: <Clock className="h-4 w-4" />,
          href: '/rh/time-records'
        },
        {
          id: 'rh-work-schedules',
          label: 'Escalas de Trabalho',
          icon: <Calendar className="h-4 w-4" />,
          href: '/rh/work-schedules'
        },
        {
          id: 'rh-benefits',
          label: 'Benefícios',
          icon: <Gift className="h-4 w-4" />,
          href: '/rh/benefits'
        },
        {
          id: 'rh-equipment-rental',
          label: 'Locação de Equipamentos',
          icon: <Package className="h-4 w-4" />,
          href: '/rh/equipment-rental'
        },
        {
          id: 'rh-convenios',
          label: 'Convênios Médicos',
          icon: <Stethoscope className="h-4 w-4" />,
          href: '/rh/convenios'
        },
        {
          id: 'rh-vr-va',
          label: 'VR/VA',
          icon: <CreditCard className="h-4 w-4" />,
          href: '/rh/vr-va'
        },
        {
          id: 'rh-transporte',
          label: 'Transporte',
          icon: <Bus className="h-4 w-4" />,
          href: '/rh/transporte'
        },
        {
          id: 'rh-elegibilidade',
          label: 'Elegibilidade',
          icon: <Target className="h-4 w-4" />,
          href: '/rh/elegibilidade'
        },
        {
          id: 'rh-rateios',
          label: 'Rateios',
          icon: <Percent className="h-4 w-4" />,
          href: '/rh/rateios'
        },
        {
          id: 'rh-payroll',
          label: 'Folha de Pagamento',
          icon: <Calculator className="h-4 w-4" />,
          href: '/rh/payroll'
        },
        {
          id: 'rh-event-consolidation',
          label: 'Consolidação de Eventos',
          icon: <RefreshCw className="h-4 w-4" />,
          href: '/rh/event-consolidation'
        },
        {
          id: 'rh-payroll-calculation',
          label: 'Motor de Cálculo',
          icon: <Calculator className="h-4 w-4" />,
          href: '/rh/payroll-calculation'
        },
        {
          id: 'rh-esocial-integration',
          label: 'Integração eSocial',
          icon: <Upload className="h-4 w-4" />,
          href: '/rh/esocial-integration'
        },
        {
          id: 'rh-financial-integration',
          label: 'Integração Financeira',
          icon: <CreditCard className="h-4 w-4" />,
          href: '/rh/financial-integration'
        },
        {
          id: 'rh-analytics',
          label: 'Analytics & Relatórios',
          icon: <BarChart3 className="h-4 w-4" />,
          href: '/rh/analytics'
        },
        {
          id: 'rh-vacations',
          label: 'Férias',
          icon: <Calendar className="h-4 w-4" />,
          href: '/rh/vacations'
        },
        {
          id: 'rh-medical-certificates',
          label: 'Atestados Médicos',
          icon: <Stethoscope className="h-4 w-4" />,
          href: '/rh/medical-certificates'
        },
        {
          id: 'rh-esocial',
          label: 'eSocial',
          icon: <Target className="h-4 w-4" />,
          href: '/rh/esocial'
        },
        {
          id: 'rh-recruitment',
          label: 'Recrutamento',
          icon: <UserPlus className="h-4 w-4" />,
          href: '/rh/recruitment'
        },
        {
          id: 'rh-training',
          label: 'Treinamentos',
          icon: <GraduationCap className="h-4 w-4" />,
          href: '/rh/training'
        },
        {
          id: 'rh-time-bank',
          label: 'Banco de Horas',
          icon: <Timer className="h-4 w-4" />,
          href: '/rh/time-bank'
        },
        {
          id: 'rh-compensation-requests',
          label: 'Solicitações de Compensação',
          icon: <FileText className="h-4 w-4" />,
          href: '/rh/compensation-requests'
        },
        {
          id: 'rh-periodic-exams',
          label: 'Exames Periódicos',
          icon: <Stethoscope className="h-4 w-4" />,
          href: '/rh/periodic-exams'
        },
        {
          id: 'rh-unions',
          label: 'Sindicatos',
          icon: <Building2 className="h-4 w-4" />,
          href: '/rh/unions'
        },
        {
          id: 'rh-work-shifts',
          label: 'Turnos de Trabalho',
          icon: <Clock className="h-4 w-4" />,
          href: '/rh/work-shifts'
        },
        {
          id: 'rh-employment-contracts',
          label: 'Contratos de Trabalho',
          icon: <FileText className="h-4 w-4" />,
          href: '/rh/employment-contracts'
        },
        {
          id: 'rh-employee-shifts',
          label: 'Turnos de Funcionários',
          icon: <Users className="h-4 w-4" />,
          href: '/rh/employee-shifts'
        },
        {
          id: 'rh-payroll-config',
          label: 'Configurações de Folha',
          icon: <Cog className="h-4 w-4" />,
          href: '/rh/payroll-config'
        },
        {
          id: 'rh-rubricas',
          label: 'Rubricas',
          icon: <Tag className="h-4 w-4" />,
          href: '/rh/rubricas'
        },
        {
          id: 'rh-units',
          label: 'Organograma',
          icon: <Building2 className="h-4 w-4" />,
          href: '/rh/units'
        },
        {
          id: 'rh-deficiency-types',
          label: 'Tipos de Deficiência',
          icon: <Accessibility className="h-4 w-4" />,
          href: '/rh/deficiency-types'
        },
        {
          id: 'rh-delay-reasons',
          label: 'Motivos de Atraso',
          icon: <Clock className="h-4 w-4" />,
          href: '/rh/delay-reasons'
        },
        {
          id: 'rh-cid-codes',
          label: 'Códigos CID',
          icon: <FileText className="h-4 w-4" />,
          href: '/rh/cid-codes'
        },
        {
          id: 'rh-absence-types',
          label: 'Tipos de Afastamento',
          icon: <Calendar className="h-4 w-4" />,
          href: '/rh/absence-types'
        },
        {
          id: 'rh-allowance-types',
          label: 'Tipos de Adicionais',
          icon: <DollarSign className="h-4 w-4" />,
          href: '/rh/allowance-types'
        },
        {
          id: 'rh-inss-brackets',
          label: 'Faixas INSS',
          icon: <Calculator className="h-4 w-4" />,
          href: '/rh/inss-brackets'
        },
        {
          id: 'rh-irrf-brackets',
          label: 'Faixas IRRF',
          icon: <Calculator className="h-4 w-4" />,
          href: '/rh/irrf-brackets'
        },
        {
          id: 'rh-fgts-config',
          label: 'Configurações FGTS',
          icon: <Settings className="h-4 w-4" />,
          href: '/rh/fgts-config'
        }
      ]
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      icon: <DollarSign className="h-4 w-4" />,
      href: '/financeiro',
      children: [
        {
          id: 'financeiro-dashboard',
          label: 'Dashboard Financeiro',
          icon: <BarChart3 className="h-4 w-4" />,
          href: '/financeiro'
        },
        {
          id: 'financeiro-contas-pagar',
          label: 'Contas a Pagar',
          icon: <CreditCard className="h-4 w-4" />,
          href: '/financeiro/contas-pagar'
        },
        {
          id: 'financeiro-contas-receber',
          label: 'Contas a Receber',
          icon: <DollarSign className="h-4 w-4" />,
          href: '/financeiro/contas-receber'
        },
        {
          id: 'financeiro-tesouraria',
          label: 'Tesouraria',
          icon: <Calculator className="h-4 w-4" />,
          href: '/financeiro/tesouraria'
        },
        {
          id: 'financeiro-integracao-fiscal',
          label: 'Integração Fiscal',
          icon: <FileText className="h-4 w-4" />,
          href: '/financeiro/integracao-fiscal'
        },
        {
          id: 'financeiro-contabilidade',
          label: 'Contabilidade',
          icon: <ClipboardList className="h-4 w-4" />,
          href: '/financeiro/contabilidade'
        },
        {
          id: 'financeiro-bradesco-integration',
          label: 'Integração Bradesco',
          icon: <Building2 className="h-4 w-4" />,
          href: '/financeiro/bradesco-integration'
        }
      ]
    },
    {
      id: 'frota',
      label: 'Frota',
      icon: <Car className="h-4 w-4" />,
      href: '/frota'
    },
    {
      id: 'producao',
      label: 'Produção',
      icon: <Factory className="h-4 w-4" />,
      href: '/producao'
    },
    {
      id: 'compras',
      label: 'Compras',
      icon: <ShoppingCart className="h-4 w-4" />,
      href: '/compras'
    },
    {
      id: 'vendas',
      label: 'Vendas',
      icon: <Briefcase className="h-4 w-4" />,
      href: '/vendas'
    },
    {
      id: 'inventory',
      label: 'Inventário',
      icon: <Database className="h-4 w-4" />,
      href: '/inventory'
    },
    {
      id: 'logistics',
      label: 'Logística',
      icon: <Route className="h-4 w-4" />,
      href: '/logistics'
    },
    {
      id: 'audit',
      label: 'Auditoria',
      icon: <Shield className="h-4 w-4" />,
      href: '/audit'
    },
    {
      id: 'obras',
      label: 'Obras',
      icon: <HardHat className="h-4 w-4" />,
      href: '/obras'
    },
    {
      id: 'comercial',
      label: 'Comercial',
      icon: <Building2 className="h-4 w-4" />,
      href: '/comercial'
    },
    {
      id: 'integracao',
      label: 'Integração',
      icon: <Zap className="h-4 w-4" />,
      href: '/integracao'
    },
    {
      id: 'combustivel',
      label: 'Combustível',
      icon: <Fuel className="h-4 w-4" />,
      href: '/combustivel'
    },
    {
      id: 'almoxarifado',
      label: 'Almoxarifado',
      icon: <Warehouse className="h-4 w-4" />,
      href: '/almoxarifado'
    },
    {
      id: 'users',
      label: 'Usuários',
      icon: <Users className="h-4 w-4" />,
      href: '/users'
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: <Settings className="h-4 w-4" />,
      href: '/settings',
      children: [
        {
          id: 'settings-companies',
          label: 'Empresas',
          icon: <Building2 className="h-4 w-4" />,
          href: '/settings/companies'
        },
        {
          id: 'settings-cost-centers',
          label: 'Centros de Custo',
          icon: <Database className="h-4 w-4" />,
          href: '/settings/cost-centers'
        },
        {
          id: 'settings-departments',
          label: 'Departamentos',
          icon: <Briefcase className="h-4 w-4" />,
          href: '/settings/departments'
        },
        {
          id: 'settings-projects',
          label: 'Projetos',
          icon: <ClipboardList className="h-4 w-4" />,
          href: '/settings/projects'
        },
        {
          id: 'settings-profiles',
          label: 'Perfis',
          icon: <Shield className="h-4 w-4" />,
          href: '/settings/profiles'
        },
        {
          id: 'settings-module-permissions',
          label: 'Permissões por Módulo',
          icon: <Shield className="h-4 w-4" />,
          href: '/settings/module-permissions'
        },
        {
          id: 'settings-entity-permissions',
          label: 'Permissões por Entidade',
          icon: <Shield className="h-4 w-4" />,
          href: '/settings/entity-permissions'
        },
        {
          id: 'settings-access',
          label: 'Acessos',
          icon: <Users className="h-4 w-4" />,
          href: '/settings/access'
        }
      ]
    }
  ];
  
  // Buscar perfil do usuário logado - SISTEMA REAL
  const { data: userProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.id) return null;
      // 1) Tentar obter perfil via user_companies (empresa primária)
      const uc = await coreSupabase
        .from('user_companies')
        .select('profile_id, is_primary, profiles:profile_id (nome, permissoes_gerais)')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!uc.error && uc.data) {
        const p: any = (uc.data as any).profiles;
        return {
          profile_id: uc.data.profile_id ?? null,
          profile_name: p?.nome ?? null,
          name: user.email ?? null,
          permissoes_gerais: p?.permissoes_gerais ?? null,
        } as UserProfile;
      }
      // 2) Fallback para RPC get_user_profile
      const { data, error } = await coreSupabase.rpc('get_user_profile', { user_id: user.id });
      if (error) return null;
      const row: any = Array.isArray(data) ? data[0] : data;
      if (!row) return null;
      return {
        profile_id: row.profile_id ?? null,
        profile_name: row.profile_name ?? null,
        name: user.email ?? null,
        permissoes_gerais: row.permissoes_gerais ?? null,
      } as UserProfile;
    },
    enabled: !!user?.id,
  });

  // Buscar permissões do usuário - SISTEMA REAL
  const { data: userPermissions, isLoading: loadingPermissions } = useQuery({
    queryKey: ['user-permissions', user?.id, userProfile?.profile_id],
    queryFn: async (): Promise<UserPermissions | null> => {
      if (!user?.id || !userProfile?.profile_id) return null;
      
      // Buscar permissões de módulos
      const { data: modulePermissions, error: moduleError } = await coreSupabase
        .from('module_permissions')
        .select('module_name, can_read, can_create, can_edit, can_delete')
        .eq('profile_id', userProfile.profile_id);

      if (moduleError) return null;

      // Buscar permissões de entidades
      const { data: entityPermissions, error: entityError } = await coreSupabase
        .from('entity_permissions')
        .select('entity_name, can_read, can_create, can_edit, can_delete')
        .eq('profile_id', userProfile.profile_id);

      if (entityError) return null;

      return {
        modules: modulePermissions || [],
        entities: entityPermissions || []
      };
    },
    enabled: !!user?.id && !!userProfile?.profile_id,
  });

  const handleLogout = async () => {
    await signOut();
  };

  // Filtrar menu conforme permissões - SISTEMA REAL
  const getMenuPermissions = useCallback(() => {
    console.log('🔍 DEBUG PERMISSÕES:');
    console.log('userProfile:', userProfile);
    console.log('userPermissions:', userPermissions);
    
    // Se for super admin, libera tudo imediatamente (evita bloqueio por atraso de dados)
    // Detectar por permissoes_gerais.all = true
    const pgAll = Boolean((userProfile?.permissoes_gerais as any)?.all);
    if (pgAll) {
      return menuItems.map(item => item.id);
    }

    const profileName = userProfile?.profile_name || '';
    console.log('👤 Profile Name:', profileName);
    
    // Super Admin tem acesso total
    if (profileName === 'Super Admin') {
      console.log('✅ Super Admin detectado, dando acesso total');
      return menuItems.map(item => item.id);
    }
    
    // Verificar permissões de módulos
    if (userPermissions?.modules && userPermissions.modules.length > 0) {
      console.log('📋 Verificando permissões de módulos:', userPermissions.modules);
      const permissions: string[] = [];
      
      userPermissions.modules.forEach((mp: ModulePermission) => {
        console.log(`🔍 Verificando módulo: ${mp.module_name}, can_read: ${mp.can_read}`);
        if (mp.can_read) {
          // Mapear módulos para IDs do menu
          switch (mp.module_name) {
            case 'rh':
              permissions.push('rh');
              break;
            case 'financeiro':
              permissions.push('financeiro');
              break;
            case 'frota':
              permissions.push('frota');
              break;
            case 'producao':
              permissions.push('producao');
              break;
            case 'compras':
              permissions.push('compras');
              break;
            case 'vendas':
              permissions.push('vendas');
              break;
            case 'inventory':
              permissions.push('inventory');
              break;
            case 'logistics':
              permissions.push('logistics');
              break;
            case 'audit':
              permissions.push('audit');
              break;
            case 'obras':
              permissions.push('obras');
              break;
            case 'comercial':
              permissions.push('comercial');
              break;
            case 'integracao':
              permissions.push('integracao');
              break;
            case 'combustivel':
              permissions.push('combustivel');
              break;
            case 'almoxarifado':
              permissions.push('almoxarifado');
              break;
            case 'auditoria':
              permissions.push('audit');
              break;
            case 'logistica':
              permissions.push('logistics');
              break;
            case 'core':
              permissions.push('users'); // core mapeia para users
              break;
            default:
              console.log(`⚠️ Módulo não mapeado: ${mp.module_name}`);
              break;
          }
        }
      });
      
      console.log('Permissões mapeadas:', permissions);
      return permissions;
    }
    
    // Fallback por permissoes_gerais se não houver module_permissions
    const pg = (userProfile?.permissoes_gerais || {}) as Record<string, any>;
    const bool = (k: string) => Boolean(pg?.[k]);
    const grants: string[] = [];
    if (bool('core')) grants.push('users', 'settings', 'inventory', 'logistics', 'audit', 'integracao', 'combustivel', 'almoxarifado', 'financeiro', 'frota', 'producao', 'compras', 'vendas', 'obras', 'comercial', 'rh');
    if (bool('rh')) grants.push('rh');
    if (bool('financeiro')) grants.push('financeiro');
    if (bool('frota')) grants.push('frota');
    if (bool('comercial')) grants.push('comercial');
    if (bool('obras')) grants.push('obras');
    if (bool('producao')) grants.push('producao');
    if (bool('compras')) grants.push('compras');
    if (bool('logistica') || bool('logistics')) grants.push('logistics');
    if (bool('auditoria') || bool('audit')) grants.push('audit');
    if (bool('integracao')) grants.push('integracao');
    if (bool('combustivel')) grants.push('combustivel');
    if (bool('almoxarifado')) grants.push('almoxarifado');

    if (grants.length > 0) {
      console.log('✅ Permissões via permissoes_gerais:', grants);
      // Remover duplicatas
      return Array.from(new Set(grants));
    }

    // Fallback final baseado no nome do perfil
    console.log('⚠️ Nenhuma permissão específica encontrada, usando fallback por perfil');
    if (profileName === 'Gestor RH') return ['rh', 'users', 'settings'];
    if (profileName === 'Gestor Financeiro') return ['financeiro', 'users', 'settings'];
    if (profileName === 'Técnico') return ['rh', 'settings'];
    return ['rh', 'settings'];
  }, [userProfile?.profile_name, userProfile?.permissoes_gerais, userPermissions]);

  const filteredMenuItems = useMemo(() => {
    const permissions = getMenuPermissions();
    console.log('🎯 Permissões finais:', permissions);
    console.log('📋 Menu items disponíveis:', menuItems.map(item => item.id));
    
    const filtered = menuItems.filter(item => permissions.includes(item.id));
    console.log('✅ Menu items filtrados:', filtered.map(item => item.id));
    
    // Debug específico para RH
    if (permissions.includes('rh')) {
      const rhItem = filtered.find(item => item.id === 'rh');
      if (rhItem && rhItem.children) {
        console.log('🔍 Children do RH:', rhItem.children.map(child => child.id));
        console.log('🔍 Procurando rh-financial-integration:', rhItem.children.find(child => child.id === 'rh-financial-integration'));
      }
    }
    
    return filtered;
  }, [getMenuPermissions, userProfile?.profile_name, userPermissions]);

  // Loading state
  if (loadingProfile || loadingPermissions) {
    return (
      <div className="flex h-screen w-64 flex-col bg-white border-r">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  // Verificar se há permissões
  const noAccess = filteredMenuItems.length === 0;

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const renderMenuItem = (item: MenuItem) => {
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);

    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          isActive={active}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else {
              navigate(item.href);
            }
          }}
          tooltip={item.label}
        >
          {item.icon}
          <span>{item.label}</span>
          {item.badge && item.badge > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {item.badge}
            </Badge>
          )}
          {hasChildren && (
            <ChevronDown 
              className={cn(
                "ml-auto h-4 w-4 transition-transform",
                isExpanded && "rotate-180"
              )} 
            />
          )}
        </SidebarMenuButton>
        
        {hasChildren && isExpanded && (
          <SidebarMenuSub>
            {item.children.map(child => (
              <SidebarMenuSubItem key={child.id}>
                <SidebarMenuSubButton
                  isActive={isActive(child.href)}
                  onClick={() => navigate(child.href)}
                >
                  {child.icon}
                  <span>{child.label}</span>
                  {child.badge && child.badge > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {child.badge}
                    </Badge>
                  )}
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
    );
  };

  if (noAccess) {
    return (
      <div className="flex h-screen w-64 flex-col bg-white border-r">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900">Acesso Negado</h3>
          <p className="text-sm text-gray-600 mt-2">
            Você não tem permissão para acessar este sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2">
          <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="font-semibold text-gray-900">Estratégic</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {filteredMenuItems.map(renderMenuItem)}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
