import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  PipelineData,
  PipelineMetrics,
  UpdateLeadStatusDto,
} from '@/lib/types';

export function usePipeline(page = 1, limit = 20, search?: string): UseQueryResult<PipelineData, Error> {
  return useQuery<PipelineData>({
    queryKey: ['pipeline', page, limit, search],
    queryFn: async (): Promise<PipelineData> => {
      const response = await api.getPipeline({ page, limit, search });
      return response.data as PipelineData;
    },
    staleTime: 1000 * 60 * 2,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function usePipelineMetrics(): UseQueryResult<PipelineMetrics, Error> {
  return useQuery<PipelineMetrics>({
    queryKey: ['pipeline-metrics'],
    queryFn: async (): Promise<PipelineMetrics> => {
      const response = await api.getPipelineMetrics();
      return response.data as PipelineMetrics;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function usePipelineMutations(options?: {
  onUpdateSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({ leadId, statusData }: { leadId: string; statusData: UpdateLeadStatusDto }) =>
      api.updateLeadStatus(leadId, statusData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
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
