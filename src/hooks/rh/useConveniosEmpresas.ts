import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/rh-client';
import { ConvenioEmpresa, ConvenioEmpresaInsert, ConvenioEmpresaUpdate } from '@/integrations/supabase/rh-types';
import { useToast } from '@/hooks/use-toast';

export function useConveniosEmpresas(companyId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar convênios empresas
  const {
    data: conveniosEmpresas = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['conveniosEmpresas', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('convenios_empresas')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ConvenioEmpresa[];
    },
  });

  // Criar convênio empresa
  const createConvenioEmpresa = useMutation({
    mutationFn: async (data: ConvenioEmpresaInsert) => {
      const { data: result, error } = await rhSupabase
        .from('convenios_empresas')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result as ConvenioEmpresa;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conveniosEmpresas', companyId] });
      toast({
        title: 'Sucesso!',
        description: 'Convênio empresa criado com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Erro ao criar convênio empresa:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível criar o convênio empresa.',
        variant: 'destructive',
      });
    },
  });

  // Atualizar convênio empresa
  const updateConvenioEmpresa = useMutation({
    mutationFn: async ({ id, ...data }: ConvenioEmpresaUpdate & { id: string }) => {
      const { data: result, error } = await rhSupabase
        .from('convenios_empresas')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as ConvenioEmpresa;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conveniosEmpresas', companyId] });
      toast({
        title: 'Sucesso!',
        description: 'Convênio empresa atualizado com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar convênio empresa:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível atualizar o convênio empresa.',
        variant: 'destructive',
      });
    },
  });

  // Excluir convênio empresa
  const deleteConvenioEmpresa = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('convenios_empresas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conveniosEmpresas', companyId] });
      toast({
        title: 'Sucesso!',
        description: 'Convênio empresa excluído com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Erro ao excluir convênio empresa:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível excluir o convênio empresa.',
        variant: 'destructive',
      });
    },
  });

  return {
    conveniosEmpresas,
    isLoading,
    error,
    createConvenioEmpresa,
    updateConvenioEmpresa,
    deleteConvenioEmpresa,
  };
}

