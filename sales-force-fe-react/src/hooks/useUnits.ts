import { useQuery } from '@tanstack/react-query';
import type { UnitListItem } from '@/lib/types';
import { api } from '@/lib/api';

export function useUnits(blockId: string) {
  return useQuery<{
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
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!blockId,
  });
}