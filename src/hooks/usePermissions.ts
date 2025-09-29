import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { coreSupabase } from '@/integrations/supabase/client';

export const usePermissions = () => {
  const { user } = useAuth();

  // Verificar permissão de módulo
  const checkModulePermission = useCallback(async (
    moduleName: string, 
    action: 'read' | 'create' | 'edit' | 'delete'
  ): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      const { data, error } = await coreSupabase
        .from('module_permissions')
        .select('can_read, can_create, can_edit, can_delete')
        .eq('profile_id', user.profile_id)
        .eq('module_name', moduleName)
        .single();

      if (error || !data) return false;

      switch (action) {
        case 'read': return data.can_read || false;
        case 'create': return data.can_create || false;
        case 'edit': return data.can_edit || false;
        case 'delete': return data.can_delete || false;
        default: return false;
      }
    } catch (error) {
      console.error('Erro ao verificar permissão de módulo:', error);
      return false;
    }
  }, [user]);

  // Verificar permissão de entidade
  const checkEntityPermission = useCallback(async (
    entityName: string, 
    action: 'read' | 'create' | 'edit' | 'delete'
  ): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      const { data, error } = await coreSupabase
        .from('entity_permissions')
        .select('can_read, can_create, can_edit, can_delete')
        .eq('profile_id', user.profile_id)
        .eq('entity_name', entityName)
        .single();

      if (error || !data) return false;

      switch (action) {
        case 'read': return data.can_read || false;
        case 'create': return data.can_create || false;
        case 'edit': return data.can_edit || false;
        case 'delete': return data.can_delete || false;
        default: return false;
      }
    } catch (error) {
      console.error('Erro ao verificar permissão de entidade:', error);
      return false;
    }
  }, [user]);

  // Verificar se usuário é super admin
  const isSuperAdmin = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      const { data, error } = await coreSupabase
        .from('profiles')
        .select('nome, permissoes_gerais')
        .eq('id', user.profile_id)
        .single();

      if (error || !data) return false;

      return data.nome === 'Super Admin' || 
             (data.permissoes_gerais as any)?.all === true;
    } catch (error) {
      console.error('Erro ao verificar se é super admin:', error);
      return false;
    }
  }, [user]);

  // Verificar se usuário tem perfil específico
  const hasProfile = useCallback(async (profileName: string): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      const { data, error } = await coreSupabase
        .from('profiles')
        .select('nome')
        .eq('id', user.profile_id)
        .eq('nome', profileName)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('Erro ao verificar perfil:', error);
      return false;
    }
  }, [user]);

  return {
    checkModulePermission,
    checkEntityPermission,
    isSuperAdmin,
    hasProfile,
  };
};










