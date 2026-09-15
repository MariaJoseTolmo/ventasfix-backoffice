import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import productService from '../services/product.service';
import { queryKeys } from './queryKeys';

export function useProducts() {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: queryKeys.products,
    queryFn: productService.list,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: queryKeys.products });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  }

  const create = useMutation({
    mutationFn: productService.create,
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, payload }) => productService.update(id, payload),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: productService.remove,
    onSuccess: invalidate,
  });

  return { list, create, update, remove };
}
