import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';
import { BeneficioElegibilidade, BeneficioElegibilidadeInsert, BeneficioElegibilidadeUpdate } from '@/integrations/supabase/rh-types';
import { useToast } from '@/hooks/use-toast';

export function useBeneficioElegibilidade(companyId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar regras de elegibilidade
  const {
    data: elegibilidadeRules = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['beneficioElegibilidade', companyId],
    queryFn: async () => {
      const { data, error } = await rhSupabase
        .from('beneficio_elegibilidade')
        .select(`
          *,
          beneficio_tipos (
            nome,
            categoria
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar regras de elegibilidade:', error);
        throw error;
      }
      console.log('Dados de elegibilidade carregados:', data);
      return data as any[];
    },
  });

  // Criar regra de elegibilidade
  const createElegibilidadeRule = useMutation({
    mutationFn: async (data: BeneficioElegibilidadeInsert) => {
      const { data: result, error } = await rhSupabase
        .from('beneficio_elegibilidade')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result as BeneficioElegibilidade;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficioElegibilidade', companyId] });
      toast({
        title: 'Sucesso!',
        description: 'Regra de elegibilidade criada com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Erro ao criar regra de elegibilidade:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível criar a regra de elegibilidade.',
        variant: 'destructive',
      });
    },
  });

  // Atualizar regra de elegibilidade
  const updateElegibilidadeRule = useMutation({
    mutationFn: async ({ id, ...data }: BeneficioElegibilidadeUpdate & { id: string }) => {
      const { data: result, error } = await rhSupabase
        .from('beneficio_elegibilidade')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result as BeneficioElegibilidade;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficioElegibilidade', companyId] });
      toast({
        title: 'Sucesso!',
        description: 'Regra de elegibilidade atualizada com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar regra de elegibilidade:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível atualizar a regra de elegibilidade.',
        variant: 'destructive',
      });
    },
  });

  // Excluir regra de elegibilidade
  const deleteElegibilidadeRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await rhSupabase
        .from('beneficio_elegibilidade')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficioElegibilidade', companyId] });
      toast({
        title: 'Sucesso!',
        description: 'Regra de elegibilidade excluída com sucesso.',
        variant: 'default',
      });
    },
    onError: (error) => {
      console.error('Erro ao excluir regra de elegibilidade:', error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível excluir a regra de elegibilidade.',
        variant: 'destructive',
      });
    },
  });

  return {
    elegibilidadeRules,
    isLoading,
    error,
    createElegibilidadeRule,
    updateElegibilidadeRule,
    deleteElegibilidadeRule,
  };
}
