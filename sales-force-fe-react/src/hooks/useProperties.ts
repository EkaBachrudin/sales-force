import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Property } from '@/lib/types';
import { api } from '@/lib/api';

export function useProperties(search?: string) {
  return useQuery<Property[]>({
    queryKey: ['properties', search],
    queryFn: async () => {
      const response = await api.getProperties(search || '');
      return response.data.properties;
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function usePropertyMutations(options?: {
  onCreateSuccess?: () => void;
  onUpdateSuccess?: () => void;
  onDeleteSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => api.createProperty(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      options?.onCreateSuccess?.();
    },
    onError: (err: any) => {
      options?.onError?.(err);
      throw err;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData, deleteSiteplan }: { id: string; formData: FormData; deleteSiteplan?: boolean }) =>
      api.updateProperty(id, formData, deleteSiteplan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      options?.onUpdateSuccess?.();
    },
    onError: (err: any) => {
      options?.onError?.(err);
      throw err;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      options?.onDeleteSuccess?.();
    },
    onError: (err: any) => {
      options?.onError?.(err);
      throw err;
    },
  });

  return {
    createProperty: createMutation.mutateAsync,
    updateProperty: updateMutation.mutateAsync,
    deleteProperty: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
