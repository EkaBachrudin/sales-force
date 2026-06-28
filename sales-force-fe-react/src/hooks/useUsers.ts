import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User, PaginatedResponse, UsersFilters, CreateUserDto, UpdateUserDto } from '@/lib/types';

export interface UseUsersParams {
  page: number;
  pageSize: number;
  filters: UsersFilters;
}

export function useUsers(
  page: number,
  pageSize: number,
  filters: UsersFilters,
  enabled = true
): ReturnType<typeof useQuery<PaginatedResponse<User>>> {
  return useQuery<PaginatedResponse<User>>({
    queryKey: ['users', page, pageSize, filters],
    queryFn: async (): Promise<PaginatedResponse<User>> => {
      const response = await api.getUsers({
        page,
        pageSize,
        search: filters.search || undefined,
        role: filters.role,
        is_active: filters.status,
      });
      const backendData = response.data as { users: User[]; pagination: { total: number; pages: number } };
      return {
        data: backendData.users,
        total: backendData.pagination.total,
        totalPages: backendData.pagination.pages,
        page,
        limit: pageSize,
      };
    },
    staleTime: 1000 * 60 * 2,
    enabled,
  });
}

export function useUserDetail(id: string | null, enabled = true) {
  return useQuery<User>({
    queryKey: ['user', id],
    queryFn: async () => {
      if (!id) throw new Error('User ID is required');
      const response = await api.getUserDetail(id);
      return response.data as User;
    },
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 2,
  });
}

export function useUserMutations(options?: {
  onCreateSuccess?: () => void;
  onUpdateSuccess?: () => void;
  onDeleteSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (userData: CreateUserDto) => api.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      options?.onCreateSuccess?.();
    },
    onError: (err: any) => {
      options?.onError?.(err);
      throw err;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      api.updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
      options?.onUpdateSuccess?.();
    },
    onError: (err: any) => {
      options?.onError?.(err);
      throw err;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      options?.onDeleteSuccess?.();
    },
    onError: (err: any) => {
      options?.onError?.(err);
      throw err;
    },
  });

  return {
    createUser: createMutation.mutateAsync,
    updateUser: updateMutation.mutateAsync,
    deleteUser: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
