import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  PipelineData,
  PipelineMetrics,
  UpdateLeadStatusDto,
} from '@/lib/types';

/**
 * Hook to fetch pipeline data with TanStack Query
 */
export function usePipeline(page = 1, limit = 20, search?: string): UseQueryResult<PipelineData, Error> {
  return useQuery<PipelineData>({
    queryKey: ['pipeline', page, limit, search],
    queryFn: async (): Promise<PipelineData> => {
      const response = await api.getPipeline({ page, limit, search });
      return response.data as PipelineData;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
}

/**
 * Hook to fetch pipeline metrics with TanStack Query
 */
export function usePipelineMetrics(): UseQueryResult<PipelineMetrics, Error> {
  return useQuery<PipelineMetrics>({
    queryKey: ['pipeline-metrics'],
    queryFn: async (): Promise<PipelineMetrics> => {
      const response = await api.getPipelineMetrics();
      return response.data as PipelineMetrics;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for pipeline mutations (update lead status)
 */
export function usePipelineMutations(options?: {
  onUpdateSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({ leadId, statusData }: { leadId: string; statusData: UpdateLeadStatusDto }) =>
      api.updateLeadStatus(leadId, statusData),
    onSuccess: (_, variables) => {
      // Invalidate pipeline queries to refetch with updated data
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      // Invalidate leads queries to sync with pipeline changes
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      // Invalidate specific lead detail cache
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
      // Invalidate dashboard as it also shows lead stats
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      options?.onUpdateSuccess?.();
    },
    onError: (err: Error) => {
      options?.onError?.(err);
      throw err;
    },
  });

  return {
    updateLeadStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
  };
}
