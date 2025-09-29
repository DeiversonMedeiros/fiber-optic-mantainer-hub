import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/rh-client';
import { VrVaConfig, VrVaConfigInsert, VrVaConfigUpdate } from '@/integrations/supabase/rh-types';
import { useToast } from '@/hooks/use-toast';

export function useVrVaConfigs(companyId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar configurações VR/VA
  const {
    data: vrVaConfigs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['vrVaConfigs', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('vr_va_configs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VrVaConfig[];
    },
  });

  // Criar configuração VR/VA
  const createVrVaConfig = useMutation({
    mutationFn: async (data: VrVaConfigInsert) => {
      const { data: result, error } = await rhSupabase
        .from('vr_va_configs')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result as VrVaConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vrVaConfigs', companyId] });
      toast({
        title: 'Sucesso!',
        description: 'Configuração VR/VA criada com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Erro ao criar configuração VR/VA:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível criar a configuração VR/VA.',
        variant: 'destructive',
      });
    },
  });

  // Atualizar configuração VR/VA
  const updateVrVaConfig = useMutation({
    mutationFn: async ({ id, ...data }: VrVaConfigUpdate & { id: string }) => {
      const { data: result, error } = await rhSupabase
        .from('vr_va_configs')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as VrVaConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vrVaConfigs', companyId] });
      toast({
        title: 'Sucesso!',
        description: 'Configuração VR/VA atualizada com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar configuração VR/VA:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível atualizar a configuração VR/VA.',
        variant: 'destructive',
      });
    },
  });

  // Excluir configuração VR/VA
  const deleteVrVaConfig = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('vr_va_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vrVaConfigs', companyId] });
      toast({
        title: 'Sucesso!',
        description: 'Configuração VR/VA excluída com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Erro ao excluir configuração VR/VA:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível excluir a configuração VR/VA.',
        variant: 'destructive',
      });
    },
  });

  return {
    vrVaConfigs,
    isLoading,
    error,
    createVrVaConfig,
    updateVrVaConfig,
    deleteVrVaConfig,
  };
}
