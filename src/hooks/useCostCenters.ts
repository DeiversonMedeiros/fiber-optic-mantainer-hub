import { useQuery } from '@tanstack/react-query';
import { CostCentersService } from '@/services/core/costCentersService';

export function useCostCenters(companyId?: string | null) {
  return useQuery({
    queryKey: ['cost-centers', companyId],
    queryFn: () => CostCentersService.list({ companyId }),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
