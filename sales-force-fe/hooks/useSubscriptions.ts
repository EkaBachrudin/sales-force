import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Subscription, PaginatedResponse, SubscriptionFilters, CreateSubscriptionDto, UpdateSubscriptionDto } from '@/lib/types';

export interface UseSubscriptionsParams {
  page: number;
  pageSize: number;
  filters: SubscriptionFilters;
}

export function useSubscriptions(
  page: number,
  pageSize: number,
  filters: SubscriptionFilters,
  enabled = true
): ReturnType<typeof useQuery<PaginatedResponse<Subscription>>> {
  return useQuery<PaginatedResponse<Subscription>>({
    queryKey: ['subscriptions', page, pageSize, filters],
    queryFn: async (): Promise<PaginatedResponse<Subscription>> => {
      const response = await api.getSubscriptions({
        page,
        pageSize,
        status: filters.status,
        subscription_type: filters.subscriptionType,
      });
      // Transform backend response to frontend format
      const backendData = response.data as { subscriptions: Subscription[]; pagination: { total: number; pages: number } };
      return {
        data: backendData.subscriptions,
        total: backendData.pagination.total,
        totalPages: backendData.pagination.pages,
        page,
        limit: pageSize,
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled,
  });
}

export function useSubscriptionMutations(options?: {
  onCreateSuccess?: () => void;
  onUpdateSuccess?: () => void;
  onDeleteSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (subscriptionData: CreateSubscriptionDto) => api.createSubscription(subscriptionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      options?.onCreateSuccess?.();
    },
    onError: (err: any) => {
      options?.onError?.(err);
      throw err;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubscriptionDto }) =>
      api.updateSubscription(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', variables.id] });
      options?.onUpdateSuccess?.();
    },
    onError: (err: any) => {
      options?.onError?.(err);
      throw err;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      options?.onDeleteSuccess?.();
    },
    onError: (err: any) => {
      options?.onError?.(err);
      throw err;
    },
  });

  return {
    createSubscription: createMutation.mutateAsync,
    updateSubscription: updateMutation.mutateAsync,
    deleteSubscription: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
