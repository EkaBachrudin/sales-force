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

  const updateMutation = useMutation({
    mutationFn: ({ blockId, name }: { blockId: string; name: string }) =>
      api.updateBlock(blockId, { name }),
    onSuccess: (_data, _variables) => {
      queryClient.invalidateQueries({ queryKey: ['propertyDetail'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });

  return {
    createBlock: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateBlock: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}