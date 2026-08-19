import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UnitListItem } from '@/lib/types';
import { api } from '@/lib/api';

export function useUnits(
  blockId: string,
  params?: { limit?: number; status?: string; search?: string }
) {
  return useQuery<{
    success: boolean;
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
    queryKey: ['units', blockId, params],
    queryFn: async () => {
      const response = await api.getUnits(blockId, params);
      return response;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!blockId,
  });
}

export function useUnitDetail(unitId: string) {
  return useQuery<{
    success: boolean;
    data: {
      unit: UnitListItem & {
        block_name?: string;
        property_name?: string;
        land_area?: number;
      };
      leads: {
        id: string;
        name: string;
        phone: string;
        email?: string;
        status: string;
        assigned_to: string | null;
        assigned_to_name: string | null;
        created_at: string;
      }[];
    };
  }>({
    queryKey: ['unitDetail', unitId],
    queryFn: async () => {
      const response = await api.getUnitDetail(unitId);
      return response;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!unitId,
  });
}

export function useUnitMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: ({ blockId, name, land_area }: { blockId: string; name: string; land_area?: number }) =>
      api.createUnit(blockId, { name, land_area }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['units', variables.blockId] });
      queryClient.invalidateQueries({ queryKey: ['propertyDetail'] });
      queryClient.invalidateQueries({ queryKey: ['propertySiteplan'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ unitId, name, land_area, blockId: _blockId }: { unitId: string; name: string; land_area?: number; blockId: string }) =>
      api.updateUnit(unitId, { name, land_area }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['units', variables.blockId] });
      queryClient.invalidateQueries({ queryKey: ['propertyDetail'] });
      queryClient.invalidateQueries({ queryKey: ['propertySiteplan'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ unitId, blockId: _blockId }: { unitId: string; blockId: string }) =>
      api.deleteUnit(unitId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['units', variables.blockId] });
      queryClient.invalidateQueries({ queryKey: ['propertyDetail'] });
      queryClient.invalidateQueries({ queryKey: ['propertySiteplan'] });
    },
  });

  return {
    createUnit: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateUnit: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteUnit: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

export function useAssignLeadToUnit() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ unitId, leadId }: { unitId: string; leadId: string }) =>
      api.assignLeadToUnit(unitId, leadId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['unitDetail', variables.unitId] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['propertySiteplan'] });
    },
  });

  return {
    assignLead: mutation.mutateAsync,
    isAssigning: mutation.isPending,
  };
}

export function useUnassignLeadFromUnit() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ unitId, leadId }: { unitId: string; leadId: string }) =>
      api.unassignLeadFromUnit(unitId, leadId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['unitDetail', variables.unitId] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['propertySiteplan'] });
    },
  });

  return {
    unassignLead: mutation.mutateAsync,
    isUnassigning: mutation.isPending,
  };
}