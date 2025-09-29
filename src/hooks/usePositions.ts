import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase, rhTable } from '@/integrations/supabase/rh-client';
import { Position, PositionInsert, PositionUpdate } from '@/integrations/supabase/rh-types';

// Chaves de query para cache
const POSITION_KEYS = {
  all: ['rh', 'positions'] as const,
  lists: () => [...POSITION_KEYS.all, 'list'] as const,
  list: (filters: string) => [...POSITION_KEYS.lists(), { filters }] as const,
  details: () => [...POSITION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...POSITION_KEYS.details(), id] as const,
  active: () => [...POSITION_KEYS.all, 'active'] as const,
};

export const usePositions = (companyId?: string) => {
  const queryClient = useQueryClient();

  // Buscar todos os cargos
  const {
    data: positions = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: POSITION_KEYS.list(companyId || 'all'),
    queryFn: async (): Promise<Position[]> => {
      console.log('🔍 Buscando cargos...');
      
      let query = supabase
        .from('positions')
        .select('*')
        .order('nivel_hierarquico', { ascending: true })
        .order('nome');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar cargos:', error);
        throw error;
      }

      console.log('✅ Cargos encontrados:', data?.length || 0);
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 10, // 10 minutos (cargos mudam menos)
    gcTime: 1000 * 60 * 60, // 1 hora
  });

  // Buscar cargos ativos
  const {
    data: activePositions = [],
    isLoading: activeLoading,
    error: activeError
  } = useQuery({
    queryKey: POSITION_KEYS.active(),
    queryFn: async (): Promise<Position[]> => {
      console.log('🔍 Buscando cargos ativos...');
      
      let query = supabase
        .from('positions')
        .select('*')
        .eq('is_active', true)
        .order('nivel_hierarquico', { ascending: true })
        .order('nome');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar cargos ativos:', error);
        throw error;
      }

      console.log('✅ Cargos ativos encontrados:', data?.length || 0);
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  // Buscar cargo por ID
  const usePosition = (id: string) => {
    return useQuery({
      queryKey: POSITION_KEYS.detail(id),
      queryFn: async (): Promise<Position | null> => {
        console.log('🔍 Buscando cargo:', id);
        
        const { data, error } = await supabase
          .from('positions')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('❌ Erro ao buscar cargo:', error);
          throw error;
        }

        console.log('✅ Cargo encontrado:', data?.nome);
        return data;
      },
      enabled: !!id,
      staleTime: 1000 * 60 * 10, // 10 minutos
    });
  };

  // Criar cargo
  const createPosition = useMutation({
    mutationFn: async (position: PositionInsert): Promise<Position> => {
      console.log('➕ Criando cargo:', position.nome);
      
      const { data, error } = await supabase
        .from('positions')
        .insert(position)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar cargo:', error);
        throw error;
      }

      console.log('✅ Cargo criado:', data.nome);
      return data;
    },
    onSuccess: () => {
      // Invalidar cache de cargos
      queryClient.invalidateQueries({ queryKey: POSITION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: POSITION_KEYS.active() });
      console.log('🔄 Cache de cargos invalidado');
    },
    onError: (error) => {
      console.error('❌ Erro na criação do cargo:', error);
    },
  });

  // Atualizar cargo
  const updatePosition = useMutation({
    mutationFn: async ({ id, ...updates }: PositionUpdate & { id: string }): Promise<Position> => {
      console.log('✏️ Atualizando cargo:', id);
      
      const { data, error } = await supabase
        .from('positions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar cargo:', error);
        throw error;
      }

      console.log('✅ Cargo atualizado:', data.nome);
      return data;
    },
    onSuccess: (data) => {
      // Atualizar cache específico e listas
      queryClient.setQueryData(POSITION_KEYS.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: POSITION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: POSITION_KEYS.active() });
      console.log('🔄 Cache de cargos atualizado');
    },
    onError: (error) => {
      console.error('❌ Erro na atualização do cargo:', error);
    },
  });

  // Deletar cargo
  const deletePosition = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      console.log('🗑️ Deletando cargo:', id);
      
      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao deletar cargo:', error);
        throw error;
      }

      console.log('✅ Cargo deletado');
    },
    onSuccess: (_, id) => {
      // Remover do cache e invalidar listas
      queryClient.removeQueries({ queryKey: POSITION_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: POSITION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: POSITION_KEYS.active() });
      console.log('🔄 Cache de cargos limpo');
    },
    onError: (error) => {
      console.error('❌ Erro na exclusão do cargo:', error);
    },
  });

  // Ativar/Desativar cargo
  const togglePositionStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }): Promise<Position> => {
      console.log(`${isActive ? '✅' : '❌'} ${isActive ? 'Ativando' : 'Desativando'} cargo:`, id);
      
      const { data, error } = await supabase
        .from('positions')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao alterar status do cargo:', error);
        throw error;
      }

      console.log(`✅ Cargo ${isActive ? 'ativado' : 'desativado'}:`, data.nome);
      return data;
    },
    onSuccess: (data) => {
      // Atualizar cache específico e listas
      queryClient.setQueryData(POSITION_KEYS.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: POSITION_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: POSITION_KEYS.active() });
      console.log('🔄 Cache de cargos atualizado');
    },
    onError: (error) => {
      console.error('❌ Erro na alteração do status do cargo:', error);
    },
  });

  // Buscar cargos por nível hierárquico
  const usePositionsByLevel = (level: number) => {
    return useQuery({
      queryKey: [...POSITION_KEYS.list(companyId || 'all'), 'level', level],
      queryFn: async (): Promise<Position[]> => {
        console.log('🔍 Buscando cargos por nível:', level);
        
        let query = supabase
          .from('positions')
          .select('*')
          .eq('nivel_hierarquico', level)
          .eq('is_active', true)
          .order('nome');

        if (companyId) {
          query = query.eq('company_id', companyId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('❌ Erro ao buscar cargos por nível:', error);
          throw error;
        }

        console.log('✅ Cargos encontrados por nível:', data?.length || 0);
        return data || [];
      },
      enabled: !!companyId && level !== undefined,
      staleTime: 1000 * 60 * 10, // 10 minutos
    });
  };

  return {
    // Dados
    positions,
    activePositions,
    isLoading: isLoading || activeLoading,
    error: error || activeError,
    
    // Ações
    createPosition,
    updatePosition,
    deletePosition,
    togglePositionStatus,
    refetch,
    
    // Hooks específicos
    usePosition,
    usePositionsByLevel,
  };
};


