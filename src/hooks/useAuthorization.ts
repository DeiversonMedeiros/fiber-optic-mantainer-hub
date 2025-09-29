import { useQuery } from '@tanstack/react-query';
import { coreSupabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type PermissionAction = 'read' | 'create' | 'edit' | 'delete';

export const useAuthorization = () => {
  const { user } = useAuth();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['auth', 'user-profile-min', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await coreSupabase.rpc('get_user_profile', { user_id: user.id });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const checkModule = async (moduleName: string, action: PermissionAction) => {
    const { data, error } = await coreSupabase.rpc('check_user_permission', {
      p_module_name: moduleName,
      p_permission: action,
    });
    if (error) throw error;
    return Boolean(data);
  };

  const checkEntity = async (entityName: string, action: PermissionAction) => {
    if (!user?.id) return false;

    const { data, error } = await coreSupabase.rpc('check_entity_permission', {
      user_id: user.id,
      entity_name: entityName,
      action,
    });
    if (error) throw error;
    return Boolean(data);
  };

  return {
    loading: loadingProfile,
    profile,
    checkModule,
    checkEntity,
  };
};


