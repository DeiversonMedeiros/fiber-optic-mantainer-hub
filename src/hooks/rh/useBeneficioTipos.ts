import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/rh-client';
import { BeneficioTipo, BeneficioTipoInsert, BeneficioTipoUpdate } from '@/integrations/supabase/rh-types';
import { useToast } from '@/hooks/use-toast';

export function useBeneficioTipos(companyId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar tipos de benefícios
  const {
    data: beneficioTipos = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['beneficioTipos', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('beneficio_tipos')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BeneficioTipo[];
    },
  });

  // Criar tipo de benefício
  const createBeneficioTipo = useMutation({
    mutationFn: async (data: BeneficioTipoInsert) => {
      const { data: result, error } = await rhSupabase
        .from('beneficio_tipos')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result as BeneficioTipo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficioTipos', companyId] });
      toast({
        title: 'Sucesso!',
        description: 'Tipo de benefício criado com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Erro ao criar tipo de benefício:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível criar o tipo de benefício.',
        variant: 'destructive',
      });
    },
  });

  // Atualizar tipo de benefício
  const updateBeneficioTipo = useMutation({
    mutationFn: async ({ id, ...data }: BeneficioTipoUpdate & { id: string }) => {
      const { data: result, error } = await rhSupabase
        .from('beneficio_tipos')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as BeneficioTipo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficioTipos', companyId] });
      toast({
        title: 'Sucesso!',
        description: 'Tipo de benefício atualizado com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar tipo de benefício:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível atualizar o tipo de benefício.',
        variant: 'destructive',
      });
    },
  });

  // Excluir tipo de benefício
  const deleteBeneficioTipo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('beneficio_tipos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficioTipos', companyId] });
      toast({
        title: 'Sucesso!',
        description: 'Tipo de benefício excluído com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Erro ao excluir tipo de benefício:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível excluir o tipo de benefício.',
        variant: 'destructive',
      });
    },
  });

  return {
    beneficioTipos,
    isLoading,
    error,
    createBeneficioTipo,
    updateBeneficioTipo,
    deleteBeneficioTipo,
  };
}
