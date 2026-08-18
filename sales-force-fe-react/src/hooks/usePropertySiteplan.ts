import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface SiteplanData {
  property: {
    id: string;
    name: string;
    siteplan_assets?: string;
  };
  units: Array<{
    id: string;
    block_id: string;
    block_name: string;
    name: string;
    land_area?: number;
    status: string;
  }>;
}

export function usePropertySiteplan(propertyId: string) {
  return useQuery<SiteplanData>({
    queryKey: ['propertySiteplan', propertyId],
    queryFn: async () => {
      const response = await api.getPropertySiteplan(propertyId);
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!propertyId,
  });
}