import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/rh-client';
import { TransporteConfig, TransporteConfigInsert, TransporteConfigUpdate } from '@/integrations/supabase/rh-types';
import { useToast } from '@/hooks/use-toast';

export function useTransporteConfigs(companyId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar configurações de transporte
  const {
    data: transporteConfigs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['transporteConfigs', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('transporte_configs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TransporteConfig[];
    },
  });

  // Criar configuração de transporte
  const createTransporteConfig = useMutation({
    mutationFn: async (data: TransporteConfigInsert) => {
      const { data: result, error } = await rhSupabase
        .from('transporte_configs')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result as TransporteConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transporteConfigs', companyId] });
      toast({
        title: 'Sucesso!',
        description: 'Configuração de transporte criada com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Erro ao criar configuração de transporte:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível criar a configuração de transporte.',
        variant: 'destructive',
      });
    },
  });

  // Atualizar configuração de transporte
  const updateTransporteConfig = useMutation({
    mutationFn: async ({ id, ...data }: TransporteConfigUpdate & { id: string }) => {
      const { data: result, error } = await rhSupabase
        .from('transporte_configs')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as TransporteConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transporteConfigs', companyId] });
      toast({
        title: 'Sucesso!',
        description: 'Configuração de transporte atualizada com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar configuração de transporte:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível atualizar a configuração de transporte.',
        variant: 'destructive',
      });
    },
  });

  // Excluir configuração de transporte
  const deleteTransporteConfig = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('transporte_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transporteConfigs', companyId] });
      toast({
        title: 'Sucesso!',
        description: 'Configuração de transporte excluída com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Erro ao excluir configuração de transporte:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível excluir a configuração de transporte.',
        variant: 'destructive',
      });
    },
  });

  return {
    transporteConfigs,
    isLoading,
    error,
    createTransporteConfig,
    updateTransporteConfig,
    deleteTransporteConfig,
  };
}
