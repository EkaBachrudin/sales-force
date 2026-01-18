import { useQuery } from '@tanstack/react-query';
import { propertyService } from '@/services/propertyService';

export function useProperties() {
  return useQuery({
    queryKey: ['properties'],
    queryFn: () => propertyService.getProperties(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
