import { coreSupabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type EntityPermission = Database['core']['Tables']['entity_permissions']['Row'];
export type InsertEntityPermission = Database['core']['Tables']['entity_permissions']['Insert'];
export type UpdateEntityPermission = Database['core']['Tables']['entity_permissions']['Update'];

export const EntityPermissionsService = {
  list: async ({ profileId, search }: { profileId?: string; search?: string } = {}): Promise<EntityPermission[]> => {
    let query = coreSupabase.from('core.entity_permissions').select('*');
    
    if (profileId) {
      query = query.eq('profile_id', profileId);
    }
    
    if (search) {
      query = query.ilike('entity_name', `%${search}%`);
    }
    
    const { data, error } = await query.order('entity_name');
    if (error) throw error;
    return data;
  },

  create: async (permission: InsertEntityPermission): Promise<EntityPermission> => {
    const { data, error } = await coreSupabase
      .from('core.entity_permissions')
      .insert(permission)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, permission: UpdateEntityPermission): Promise<EntityPermission> => {
    const { data, error } = await coreSupabase
      .from('core.entity_permissions')
      .update(permission)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await coreSupabase
      .from('core.entity_permissions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  upsert: async (permission: InsertEntityPermission): Promise<EntityPermission> => {
    const { data, error } = await coreSupabase
      .from('core.entity_permissions')
      .upsert(permission, { 
        onConflict: 'profile_id,entity_name',
        ignoreDuplicates: false 
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Obter permissões de um perfil específico
  getByProfile: async (profileId: string): Promise<EntityPermission[]> => {
    const { data, error } = await coreSupabase
      .from('core.entity_permissions')
      .select('*')
      .eq('profile_id', profileId)
      .order('entity_name');
    if (error) throw error;
    return data;
  },

  // Obter todas as entidades disponíveis (baseado no banco de dados)
  getAvailableEntities: (): string[] => {
    return [
      'audit',
      'companies',
      'construction',
      'cost_centers',
      'customers',
      'employees',
      'fleet',
      'fuel',
      'inventory',
      'logistics',
      'materials',
      'payroll',
      'production',
      'profiles',
      'projects',
      'purchases',
      'sales',
      'suppliers',
      'users'
    ];
  }
};
