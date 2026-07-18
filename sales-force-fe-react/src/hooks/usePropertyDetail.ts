import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PropertyDetail } from '@/lib/types';
import { api } from '@/lib/api';

export function usePropertyDetail(propertyId: string) {
  return useQuery<PropertyDetail>({
    queryKey: ['propertyDetail', propertyId],
    queryFn: async () => {
      const response = await api.getPropertyDetail(propertyId);
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!propertyId,
  });
}

export function usePropertyUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ propertyId, formData, deleteSiteplan }: { propertyId: string; formData: FormData; deleteSiteplan?: boolean }) =>
      api.updateProperty(propertyId, formData, deleteSiteplan),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['propertyDetail', variables.propertyId] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}