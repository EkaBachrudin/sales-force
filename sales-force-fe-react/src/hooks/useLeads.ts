import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Lead, PaginatedResponse } from '@/lib/types';

export interface LeadsFilters {
  stage: string;
  search: string;
  propertyType: string;
  source: string;
  dateFrom: string;
  dateTo: string;
  statuses?: string;
}

export function useLeads(
  page: number,
  pageSize: number,
  filters: LeadsFilters,
  enabled = true
): ReturnType<typeof useQuery<PaginatedResponse<Lead>>> {
  return useQuery<PaginatedResponse<Lead>>({
    queryKey: ['leads', page, pageSize, filters],
    queryFn: async (): Promise<PaginatedResponse<Lead>> => {
      const response = await api.getLeads({
        page,
        pageSize,
        stage: filters.stage,
        statuses: filters.statuses,
        search: filters.search || undefined,
        propertyType: filters.propertyType,
        source: filters.source,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });
      const backendData = response.data as { leads: Lead[]; pagination: { total: number; pages: number } };
      return {
        data: backendData.leads,
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

export function useLeadDetail(id: string | null, enabled = true) {
  return useQuery<Lead>({
    queryKey: ['lead', id],
    queryFn: async () => {
      if (!id) throw new Error('Lead ID is required');
      const response = await api.getLeadDetail(id);
      const backendData = response.data as { lead: Lead; activities: any[]; whatsapp_messages: any[]; reminders: any[] };
      return {
        ...backendData.lead,
        reminders: backendData.reminders,
      };
    },
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 2,
  });
}

export function useLeadMutations(options?: {
  onCreateSuccess?: () => void;
  onUpdateSuccess?: () => void;
  onDeleteSuccess?: () => void;
  onAddActivitySuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (leadData: {
      name: string;
      phone: string;
      email?: string;
      nik?: string;
      npwp?: string;
      property_id: string;
      source?: string;
      sourceOther?: string;
      budget_range?: { min: number; max: number };
      kpr_simulation?: {
        property_price: number;
        down_payment_percentage: number;
        interest_rate: number;
        loan_term_years: number;
      };
      note?: string;
      reminder?: {
        scheduledFor: string;
        notes?: string;
      };
    }) => api.createLead(leadData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      options?.onCreateSuccess?.();
    },
    onError: (err: any) => {
      options?.onError?.(err);
      throw err;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) =>
      api.updateLead(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      options?.onUpdateSuccess?.();
    },
    onError: (err: any) => {
      options?.onError?.(err);
      throw err;
    },
  });

  const addActivityMutation = useMutation({
    mutationFn: ({ id, activityData }: { id: string; activityData: { type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'other'; notes: string } }) =>
      api.addLeadActivity(id, activityData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      options?.onAddActivitySuccess?.();
    },
    onError: (err: any) => {
      options?.onError?.(err);
      throw err;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      options?.onDeleteSuccess?.();
    },
    onError: (err: any) => {
      options?.onError?.(err);
      throw err;
    },
  });

  return {
    createLead: createMutation.mutateAsync,
    updateLead: updateMutation.mutateAsync,
    addActivity: addActivityMutation.mutateAsync,
    deleteLead: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isAddingActivity: addActivityMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
