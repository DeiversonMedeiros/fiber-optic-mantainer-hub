import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/rh-client';
import { FuncionarioConvenio, FuncionarioConvenioInsert, FuncionarioConvenioUpdate } from '@/integrations/supabase/rh-types';
import { useToast } from '@/hooks/use-toast';

export function useFuncionarioConvenios(employeeId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar convênios do funcionário
  const {
    data: funcionarioConvenios = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['funcionarioConvenios', employeeId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('funcionario_convenios')
        .select(`
          *,
          convenios_planos (
            *,
            convenios_empresas (
              nome,
              prestador,
              tipo
            )
          )
        `)
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!employeeId,
  });

  // Criar adesão do funcionário ao convênio
  const createFuncionarioConvenio = useMutation({
    mutationFn: async (data: FuncionarioConvenioInsert) => {
      const { data: result, error } = await rhSupabase
        .from('funcionario_convenios')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result as FuncionarioConvenio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarioConvenios', employeeId] });
      toast({
        title: 'Sucesso!',
        description: 'Adesão ao convênio criada com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Erro ao criar adesão ao convênio:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível criar a adesão ao convênio.',
        variant: 'destructive',
      });
    },
  });

  // Atualizar adesão do funcionário ao convênio
  const updateFuncionarioConvenio = useMutation({
    mutationFn: async ({ id, ...data }: FuncionarioConvenioUpdate & { id: string }) => {
      const { data: result, error } = await rhSupabase
        .from('funcionario_convenios')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as FuncionarioConvenio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarioConvenios', employeeId] });
      toast({
        title: 'Sucesso!',
        description: 'Adesão ao convênio atualizada com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar adesão ao convênio:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível atualizar a adesão ao convênio.',
        variant: 'destructive',
      });
    },
  });

  // Excluir adesão do funcionário ao convênio
  const deleteFuncionarioConvenio = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('funcionario_convenios')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarioConvenios', employeeId] });
      toast({
        title: 'Sucesso!',
        description: 'Adesão ao convênio excluída com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Erro ao excluir adesão ao convênio:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível excluir a adesão ao convênio.',
        variant: 'destructive',
      });
    },
  });

  return {
    funcionarioConvenios,
    isLoading,
    error,
    createFuncionarioConvenio,
    updateFuncionarioConvenio,
    deleteFuncionarioConvenio,
  };
}

