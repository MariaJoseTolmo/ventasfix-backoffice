import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import userService from '../services/user.service';
import { queryKeys } from './queryKeys';

export function useUsers() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: queryKeys.users,
    queryFn: userService.list,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: queryKeys.users });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  }

  const create = useMutation({
    mutationFn: userService.create,
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, payload }) => userService.update(id, payload),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: userService.remove,
    onSuccess: invalidate,
  });

  return { list, create, update, remove };
}
