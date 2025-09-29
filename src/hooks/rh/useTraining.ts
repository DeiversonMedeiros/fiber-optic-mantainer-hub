import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhSupabase } from '@/integrations/supabase/client';

// Definindo tipos de Training baseados no schema principal
export interface Training {
  id: string;
  title: string;
  description: string;
  type: string;
  duration_hours: number | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingInsert {
  title: string;
  description: string;
  type: string;
  duration_hours?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
}

export interface TrainingUpdate {
  title?: string;
  description?: string;
  type?: string;
  duration_hours?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
}

const TRAINING_KEYS = {
  all: ['training'] as const,
  lists: () => [...TRAINING_KEYS.all, 'list'] as const,
  list: (filters: string) => [...TRAINING_KEYS.lists(), { filters }] as const,
  details: () => [...TRAINING_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TRAINING_KEYS.details(), id] as const,
};

export const useTraining = () => {
  const queryClient = useQueryClient();
  
  const { data: trainings, isLoading, error } = useQuery({
    queryKey: TRAINING_KEYS.lists(),
    queryFn: async (): Promise<Training[]> => {
      try {
        const { data, error } = await rhSupabase.from('training')
          .select('*')
          .order('title');
        
        if (error) {
          throw error;
        }
        
        console.log(`✅ useTraining: ${data?.length || 0} treinamentos encontrados`);
        return data || [];
      } catch (error) {
        throw error;
      }
    },
    enabled: true,
  });

  // Query para buscar training por ID
  const getTrainingById = async (id: string): Promise<Training | null> => {
    const { data, error } = await rhSupabase.from('training')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  };

  // Mutation para criar training
  const createTrainingMutation = useMutation({
    mutationFn: async (newTraining: TrainingInsert): Promise<Training> => {
      const { data, error } = await rhSupabase.from('training')
        .insert(newTraining)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.all });
    },
  });

  // Mutation para atualizar training
  const updateTrainingMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TrainingUpdate }): Promise<Training> => {
      const { data, error } = await rhSupabase.from('training')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.all });
    },
  });

  // Mutation para deletar training
  const deleteTrainingMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await rhSupabase.from('training')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRAINING_KEYS.all });
    },
  });

  return {
    trainings,
    isLoading,
    error,
    getTrainingById,
    createTraining: createTrainingMutation.mutate,
    createTrainingAsync: createTrainingMutation.mutateAsync,
    updateTraining: updateTrainingMutation.mutate,
    updateTrainingAsync: updateTrainingMutation.mutateAsync,
    deleteTraining: deleteTrainingMutation.mutate,
    deleteTrainingAsync: deleteTrainingMutation.mutateAsync,
    isCreating: createTrainingMutation.isPending,
    isUpdating: updateTrainingMutation.isPending,
    isDeleting: deleteTrainingMutation.isPending,
  };
};