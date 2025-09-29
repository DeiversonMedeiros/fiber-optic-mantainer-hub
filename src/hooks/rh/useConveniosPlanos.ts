import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/rh-client';
import { ConvenioPlano, ConvenioPlanoInsert, ConvenioPlanoUpdate } from '@/integrations/supabase/rh-types';
import { useToast } from '@/hooks/use-toast';

export function useConveniosPlanos(convenioEmpresaId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar planos do convênio
  const {
    data: conveniosPlanos = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['conveniosPlanos', convenioEmpresaId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('convenios_planos')
        .select('*')
        .eq('convenio_empresa_id', convenioEmpresaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ConvenioPlano[];
    },
    enabled: !!convenioEmpresaId,
  });

  // Criar plano do convênio
  const createConvenioPlano = useMutation({
    mutationFn: async (data: ConvenioPlanoInsert) => {
      const { data: result, error } = await rhSupabase
        .from('convenios_planos')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result as ConvenioPlano;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conveniosPlanos', convenioEmpresaId] });
      toast({
        title: 'Sucesso!',
        description: 'Plano do convênio criado com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Erro ao criar plano do convênio:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível criar o plano do convênio.',
        variant: 'destructive',
      });
    },
  });

  // Atualizar plano do convênio
  const updateConvenioPlano = useMutation({
    mutationFn: async ({ id, ...data }: ConvenioPlanoUpdate & { id: string }) => {
      const { data: result, error } = await rhSupabase
        .from('convenios_planos')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as ConvenioPlano;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conveniosPlanos', convenioEmpresaId] });
      toast({
        title: 'Sucesso!',
        description: 'Plano do convênio atualizado com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar plano do convênio:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível atualizar o plano do convênio.',
        variant: 'destructive',
      });
    },
  });

  // Excluir plano do convênio
  const deleteConvenioPlano = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('convenios_planos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conveniosPlanos', convenioEmpresaId] });
      toast({
        title: 'Sucesso!',
        description: 'Plano do convênio excluído com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Erro ao excluir plano do convênio:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível excluir o plano do convênio.',
        variant: 'destructive',
      });
    },
  });

  return {
    conveniosPlanos,
    isLoading,
    error,
    createConvenioPlano,
    updateConvenioPlano,
    deleteConvenioPlano,
  };
}

