import { useQuery } from '@tanstack/react-query';
import { ProjectsService } from '@/services/core/projectsService';

export function useProjects(companyId?: string | null, costCenterId?: string | null) {
  return useQuery({
    queryKey: ['projects', companyId, costCenterId],
    queryFn: () => ProjectsService.list({ companyId, costCenterId }),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    select: (data) => data.data, // Extrair apenas os dados, não o count
  });
}
