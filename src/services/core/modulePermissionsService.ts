import { coreSupabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type ModulePermission = Database['core']['Tables']['module_permissions']['Row'];
export type InsertModulePermission = Database['core']['Tables']['module_permissions']['Insert'];
export type UpdateModulePermission = Database['core']['Tables']['module_permissions']['Update'];

export const ModulePermissionsService = {
  list: async ({ profileId, search }: { profileId?: string; search?: string } = {}): Promise<ModulePermission[]> => {
    let query = coreSupabase.from('core.module_permissions').select('*');
    
    if (profileId) {
      query = query.eq('profile_id', profileId);
    }
    
    if (search) {
      query = query.ilike('module_name', `%${search}%`);
    }
    
    const { data, error } = await query.order('module_name');
    if (error) throw error;
    return data;
  },

  create: async (permission: InsertModulePermission): Promise<ModulePermission> => {
    const { data, error } = await coreSupabase
      .from('core.module_permissions')
      .insert(permission)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, permission: UpdateModulePermission): Promise<ModulePermission> => {
    const { data, error } = await coreSupabase
      .from('core.module_permissions')
      .update(permission)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await coreSupabase
      .from('core.module_permissions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  upsert: async (permission: InsertModulePermission): Promise<ModulePermission> => {
    const { data, error } = await coreSupabase
      .from('core.module_permissions')
      .upsert(permission, { 
        onConflict: 'profile_id,module_name',
        ignoreDuplicates: false 
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Obter permissões de um perfil específico
  getByProfile: async (profileId: string): Promise<ModulePermission[]> => {
    const { data, error } = await coreSupabase
      .from('core.module_permissions')
      .select('*')
      .eq('profile_id', profileId)
      .order('module_name');
    if (error) throw error;
    return data;
  },

  // Obter todos os módulos disponíveis (baseado no banco de dados)
  getAvailableModules: (): string[] => {
    return [
      'almoxarifado',
      'auditoria',
      'combustivel',
      'comercial',
      'compras',
      'core',
      'financeiro',
      'frota',
      'integracao',
      'logistica',
      'obras',
      'producao',
      'projects',
      'rh'
    ];
  }
};
