// Configuração de permissões do sistema
export const PERMISSION_CONFIG = {
  // Mapeamento de módulos para IDs do menu
  MODULE_TO_MENU: {
    'rh': ['rh'],
    'users': ['users'],
    'settings': ['settings'],
    'financeiro': ['financeiro'],
    'frota': ['frota'],
    'producao': ['producao'],
    'compras': ['compras'],
    'vendas': ['vendas'],
    'inventory': ['inventory'],
    'logistics': ['logistics'],
    'audit': ['audit'],
    'obras': ['obras'],
    'comercial': ['comercial'],
    'integracao': ['integracao'],
    'combustivel': ['combustivel'],
    'almoxarifado': ['almoxarifado'],
  },

  // Mapeamento de entidades para ações
  ENTITY_ACTIONS: {
    'users': ['read', 'create', 'edit', 'delete'],
    'employees': ['read', 'create', 'edit', 'delete'],
    'payroll': ['read', 'create', 'edit', 'delete'],
    'time_records': ['read', 'create', 'edit'],
    'vacations': ['read', 'create', 'edit', 'delete'],
    'benefits': ['read', 'create', 'edit', 'delete'],
    'positions': ['read', 'create', 'edit', 'delete'],
    'work_schedules': ['read', 'create', 'edit', 'delete'],
    'work_shifts': ['read', 'create', 'edit', 'delete'],
    'time_bank': ['read', 'create', 'edit'],
    'compensation_requests': ['read', 'create', 'edit'],
    'medical_certificates': ['read', 'create', 'edit', 'delete'],
    'periodic_exams': ['read', 'create', 'edit', 'delete'],
    'esocial_events': ['read', 'create', 'edit', 'delete'],
    'unions': ['read', 'create', 'edit', 'delete'],
    'employment_contracts': ['read', 'create', 'edit', 'delete'],
    'payroll_config': ['read', 'create', 'edit', 'delete'],
    'payroll_items': ['read', 'create', 'edit', 'delete'],
    'employee_benefits': ['read', 'create', 'edit', 'delete'],
    'employee_shifts': ['read', 'create', 'edit', 'delete'],
    'recruitment': ['read', 'create', 'edit', 'delete'],
    'training': ['read', 'create', 'edit', 'delete'],
  },

  // Perfis especiais
  SPECIAL_PROFILES: {
    'Super Admin': {
      description: 'Acesso total ao sistema',
      hasAllPermissions: true,
    },
    'Administrador': {
      description: 'Administrador da empresa',
      modules: ['dashboard', 'users', 'settings', 'reports', 'materials', 'preventive', 'vistoria'],
      entities: ['users', 'reports', 'materials', 'employees', 'payroll'],
    },
    'Gestor RH': {
      description: 'Gestor de Recursos Humanos',
      modules: ['dashboard', 'rh', 'reports'],
      entities: ['employees', 'payroll', 'time_records', 'vacations', 'benefits', 'positions'],
    },
    'Gestor Financeiro': {
      description: 'Gestor Financeiro',
      modules: ['dashboard', 'financeiro', 'reports'],
      entities: ['payroll', 'payroll_config', 'payroll_items'],
    },
    'Técnico': {
      description: 'Técnico de campo',
      modules: ['dashboard', 'reports'],
      entities: ['reports'],
    },
  },
};

// Função para verificar se um perfil tem acesso a um módulo
export const hasModuleAccess = (
  profile: any, 
  moduleName: string, 
  action: 'read' | 'create' | 'edit' | 'delete' = 'read'
): boolean => {
  if (!profile) return false;
  
  // Super Admin tem acesso total
  if (profile.nome === 'Super Admin') return true;
  
  // Verificar permissões específicas do módulo
  if (profile.module_permissions) {
    const modulePerm = profile.module_permissions.find((mp: any) => mp.module_name === moduleName);
    if (modulePerm) {
      switch (action) {
        case 'read': return modulePerm.can_read || false;
        case 'create': return modulePerm.can_create || false;
        case 'edit': return modulePerm.can_edit || false;
        case 'delete': return modulePerm.can_delete || false;
        default: return false;
      }
    }
  }
  
  // Verificar permissões gerais
  const generalPerms = profile.permissoes_gerais as any;
  if (generalPerms) {
    if (generalPerms.all) return true;
    if (generalPerms[moduleName]) return true;
  }
  
  return false;
};

// Função para verificar se um perfil tem acesso a uma entidade
export const hasEntityAccess = (
  profile: any, 
  entityName: string, 
  action: 'read' | 'create' | 'edit' | 'delete' = 'read'
): boolean => {
  if (!profile) return false;
  
  // Super Admin tem acesso total
  if (profile.nome === 'Super Admin') return true;
  
  // Verificar permissões específicas da entidade
  if (profile.entity_permissions) {
    const entityPerm = profile.entity_permissions.find((ep: any) => ep.entity_name === entityName);
    if (entityPerm) {
      switch (action) {
        case 'read': return entityPerm.can_read || false;
        case 'create': return entityPerm.can_create || false;
        case 'edit': return entityPerm.can_edit || false;
        case 'delete': return entityPerm.can_delete || false;
        default: return false;
      }
    }
  }
  
  // Verificar permissões gerais
  const generalPerms = profile.permissoes_gerais as any;
  if (generalPerms) {
    if (generalPerms.all) return true;
    if (generalPerms[entityName]) return true;
  }
  
  return false;
};

// Função para obter IDs do menu baseado no perfil
export const getMenuIdsForProfile = (profile: any): string[] => {
  if (!profile) return [];
  
  const menuIds: string[] = [];
  
  // Super Admin tem acesso total
  if (profile.nome === 'Super Admin') {
    return Object.values(PERMISSION_CONFIG.MODULE_TO_MENU).flat();
  }
  
  // Verificar permissões de módulos
  if (profile.module_permissions) {
    profile.module_permissions.forEach((mp: any) => {
      if (mp.can_read) {
        const menuIdsForModule = PERMISSION_CONFIG.MODULE_TO_MENU[mp.module_name as keyof typeof PERMISSION_CONFIG.MODULE_TO_MENU];
        if (menuIdsForModule) {
          menuIds.push(...menuIdsForModule);
        }
      }
    });
  }
  
  // Verificar permissões gerais
  const generalPerms = profile.permissoes_gerais as any;
  if (generalPerms) {
    if (generalPerms.read) menuIds.push('dashboard');
    if (generalPerms.core) menuIds.push('settings');
    
    // Adicionar módulos específicos baseados em permissoes_gerais
    Object.keys(generalPerms).forEach(key => {
      if (key !== 'read' && key !== 'core' && generalPerms[key]) {
        const menuIdsForModule = PERMISSION_CONFIG.MODULE_TO_MENU[key as keyof typeof PERMISSION_CONFIG.MODULE_TO_MENU];
        if (menuIdsForModule) {
          menuIds.push(...menuIdsForModule);
        }
      }
    });
  }
  
  // Remover duplicatas
  return [...new Set(menuIds)];
};





