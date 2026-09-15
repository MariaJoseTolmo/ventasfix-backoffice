import { useQuery } from '@tanstack/react-query';
import dashboardService from '../services/dashboard.service';
import { queryKeys } from './queryKeys';

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: dashboardService.summary,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
