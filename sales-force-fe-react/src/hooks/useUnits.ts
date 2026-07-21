import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UnitListItem } from '@/lib/types';
import { api } from '@/lib/api';

export function useUnits(blockId: string) {
  return useQuery<{
    success: boolean;
    data: {
      block: {
        id: string;
        name: string;
        property_id: string;
        property_name: string;
      };
      units: UnitListItem[];
      pagination: {
        page: number;
        limit: number;
        total_items: number;
        total_pages: number;
      };
    };
  }>({
    queryKey: ['units', blockId],
    queryFn: async () => {
      const response = await api.getUnits(blockId);
      return response;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!blockId,
  });
}

export function useUnitMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: ({ blockId, name, land_area }: { blockId: string; name: string; land_area?: number }) =>
      api.createUnit(blockId, { name, land_area }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['units', variables.blockId] });
      queryClient.invalidateQueries({ queryKey: ['propertyDetail'] });
    },
  });

  return {
    createUnit: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}