import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useBlockMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: ({ propertyId, name }: { propertyId: string; name: string }) =>
      api.createBlock(propertyId, { name }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['propertyDetail', variables.propertyId] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });

  return {
    createBlock: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}