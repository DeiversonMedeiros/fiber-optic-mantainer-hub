import { useQuery } from '@tanstack/react-query';
import { OrganogramService, OrganogramView } from '@/services/rh/organogramService';

export function useOrganogram(companyId: string, view: OrganogramView) {
  return useQuery({
    queryKey: ['organogram', companyId, view],
    queryFn: () => OrganogramService.getOrganogram(companyId, view),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useOrganogramStats(companyId: string) {
  return useQuery({
    queryKey: ['organogram-stats', companyId],
    queryFn: () => OrganogramService.getOrganogramStats(companyId),
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}
