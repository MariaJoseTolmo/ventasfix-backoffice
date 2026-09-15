import { useMutation, useQueryClient } from '@tanstack/react-query';
import softlandService from '../services/softland.service';
import { queryKeys } from './queryKeys';

export function useSoftlandSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: softlandService.sync,
    onSuccess: () => {
      // The sync reflects the current catalog; refresh anything derived
      // from it so the UI stays consistent with what was just sent.
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}
