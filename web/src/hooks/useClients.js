import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clientService from '../services/client.service';
import { queryKeys } from './queryKeys';

export function useClients() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: queryKeys.clients,
    queryFn: clientService.list,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: queryKeys.clients });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  }

  const create = useMutation({
    mutationFn: clientService.create,
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, payload }) => clientService.update(id, payload),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: clientService.remove,
    onSuccess: invalidate,
  });

  return { list, create, update, remove };
}
