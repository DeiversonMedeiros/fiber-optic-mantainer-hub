import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Tipos para Recruitment
export interface Recruitment {
  id: string;
  company_id: string;
  position_id: string;
  titulo: string;
  descricao: string;
  requisitos: string;
  salario_min: number;
  salario_max: number;
  status: string;
  data_inicio: string;
  data_fim: string;
  created_at: string;
  updated_at: string;
}

export type RecruitmentInsert = Omit<Recruitment, 'id' | 'created_at' | 'updated_at'>;
export type RecruitmentUpdate = Partial<RecruitmentInsert>;

const RECRUITMENT_KEYS = {
  all: ['recruitment'] as const,
  lists: () => [...RECRUITMENT_KEYS.all, 'list'] as const,
  list: (filters: string) => [...RECRUITMENT_KEYS.lists(), { filters }] as const,
  details: () => [...RECRUITMENT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...RECRUITMENT_KEYS.details(), id] as const,
  byStatus: (status: string) => [...RECRUITMENT_KEYS.all, 'status', status] as const,
  byPosition: (positionId: string) => [...RECRUITMENT_KEYS.all, 'position', positionId] as const,
  active: () => [...RECRUITMENT_KEYS.all, 'active'] as const,
  byCompany: (companyId: string) => [...RECRUITMENT_KEYS.all, 'company', companyId] as const,
};

export const useRecruitment = (companyId?: string) => {
  const queryClient = useQueryClient();
  
  const { data: recruitments, isLoading, error } = useQuery({
    queryKey: RECRUITMENT_KEYS.lists(),
    queryFn: async (): Promise<Recruitment[]> => {
      // Gerar dados mock para demonstração
      const mockData: Recruitment[] = [
        {
          id: '1',
          company_id: companyId || 'mock-company-id',
          position_id: '1',
          titulo: 'Desenvolvedor Frontend',
          descricao: 'Desenvolvedor frontend com experiência em React',
          requisitos: 'React, TypeScript, CSS',
          salario_min: 5000,
          salario_max: 8000,
          status: 'ativo',
          data_inicio: '2024-01-01',
          data_fim: '2024-12-31',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          company_id: companyId || 'mock-company-id',
          position_id: '2',
          titulo: 'Analista de RH',
          descricao: 'Analista de recursos humanos',
          requisitos: 'Experiência em RH, conhecimento em legislação trabalhista',
          salario_min: 4000,
          salario_max: 6000,
          status: 'ativo',
          data_inicio: '2024-01-01',
          data_fim: '2024-12-31',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      
      return mockData;
    },
    enabled: !!companyId,
  });

  const { data: recruitment, isLoading: isLoadingSingle, error: singleError } = useQuery({
    queryKey: RECRUITMENT_KEYS.detail(''),
    queryFn: async (): Promise<Recruitment | null> => {
      return null;
    },
    enabled: false,
  });

  const createRecruitment = useMutation({
    mutationFn: async (newRecruitment: Omit<Recruitment, 'id' | 'created_at' | 'updated_at'>) => {
      // Mock implementation
      const mockRecruitment: Recruitment = {
        ...newRecruitment,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return mockRecruitment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECRUITMENT_KEYS.lists() });
    },
  });

  const updateRecruitment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Recruitment> & { id: string }) => {
      // Mock implementation
      return { id, ...updates } as Recruitment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECRUITMENT_KEYS.lists() });
    },
  });

  const deleteRecruitment = useMutation({
    mutationFn: async (id: string) => {
      // Mock implementation
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECRUITMENT_KEYS.lists() });
    },
  });

  const getRecruitmentById = useMutation({
    mutationFn: async (id: string) => {
      // Mock implementation
      return recruitments?.find(r => r.id === id) || null;
    },
  });

  const getRecruitmentsByStatus = useMutation({
    mutationFn: async (status: string) => {
      // Mock implementation
      return recruitments?.filter(r => r.status === status) || [];
    },
  });

  const getRecruitmentsByPosition = useMutation({
    mutationFn: async (positionId: string) => {
      // Mock implementation
      return recruitments?.filter(r => r.position_id === positionId) || [];
    },
  });

  const getActiveRecruitments = useMutation({
    mutationFn: async () => {
      // Mock implementation
      return recruitments?.filter(r => r.status === 'ativo') || [];
    },
  });

  return {
    recruitments,
    recruitment,
    isLoading,
    isLoadingSingle,
    error,
    singleError,
    createRecruitment,
    updateRecruitment,
    deleteRecruitment,
    getRecruitmentById,
    getRecruitmentsByStatus,
    getRecruitmentsByPosition,
    getActiveRecruitments,
  };
};