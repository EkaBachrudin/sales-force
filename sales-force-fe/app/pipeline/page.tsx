'use client';

import { useState, useCallback, useMemo } from 'react';
import { KanbanBoard, Lead, PipelineStage } from '@/components/dashboard/KanbanBoard';
import { LeadDetailPanel } from '@/components/dashboard/LeadDetailPanel';
import { EditLeadModal } from '@/components/dashboard/EditLeadModal';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { usePipeline, usePipelineMutations } from '@/hooks/usePipeline';
import { useLeadDetail, useLeadMutations } from '@/hooks/useLeads';
import { PipelineLeadItem } from '@/lib/types';
import { Loader2 } from 'lucide-react';

// Transform backend PipelineLeadItem to frontend Lead format
function transformPipelineLeadToLead(pipelineLead: PipelineLeadItem, status: string): Lead {
  return {
    id: pipelineLead.id,
    name: pipelineLead.name,
    phone: '', // Not provided in pipeline response
    property: {
      name: pipelineLead.property_name || 'No Property',
      property_type: '',
    },
    budget_range: {
      min: 0,
      max: 0,
    },
    status,
    created_at: pipelineLead.updated_at,
    followUpDate: pipelineLead.next_follow_up_at,
    property_id: '',
  };
}

export default function PipelinePage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch lead detail when selectedLeadId changes
  const { data: selectedLead, isLoading: isLoadingLeadDetail } = useLeadDetail(selectedLeadId, isPanelOpen);

  // Mutations
  const { updateLead, isUpdating: isUpdatingLead } = useLeadMutations({
    onUpdateSuccess: () => {
      setIsEditModalOpen(false);
    },
  });

  // Fetch pipeline data with TanStack Query
  const { data: pipelineData, isLoading, isFetching, error } = usePipeline(1, 50);
  const { updateLeadStatus, isUpdating: isUpdatingStatus } = usePipelineMutations({
    onUpdateSuccess: () => {
      // Query will be automatically invalidated and refetched
    },
    onError: (err) => {
      console.error('Failed to update lead status:', err);
      // Could add toast notification here
    },
  });

  // Transform pipeline data to leads array
  const leads = useMemo(() => {
    if (!pipelineData) return [];

    const allLeads: Lead[] = [];
    for (const stage of pipelineData.stages) {
      for (const lead of stage.leads) {
        allLeads.push(transformPipelineLeadToLead(lead, stage.id));
      }
    }
    return allLeads;
  }, [pipelineData]);

  const handleLeadClick = useCallback((lead: Lead) => {
    setSelectedLeadId(lead.id);
    setIsPanelOpen(true);
  }, []);

  const handleEditClick = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  const handleEditLead = useCallback(async (data: Partial<Lead>) => {
    if (!selectedLead) return;
    await updateLead({ id: selectedLead.id, data });
  }, [updateLead, selectedLead]);

  const handleStageChange = useCallback(async (leadId: string, newStage: PipelineStage) => {
    // Call the API
    await updateLeadStatus({
      leadId,
      statusData: { status: newStage },
    });
  }, [updateLeadStatus]);

  if (isLoading) {
    return (
      <DashboardLayout
        title="Pipeline"
        subtitle="Manage your leads through the sales pipeline"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-text-secondary">Loading pipeline...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        title="Pipeline"
        subtitle="Manage your leads through the sales pipeline"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Failed to load pipeline: {(error as Error).message}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout
        title="Pipeline"
        subtitle="Manage your leads through the sales pipeline"
      >
        <KanbanBoard
          leads={leads}
          onLeadClick={handleLeadClick}
          onStageChange={handleStageChange}
          isUpdating={isUpdatingStatus}
        />
      </DashboardLayout>

      {/* Loading overlay for refetching pipeline data */}
      {isFetching && !isLoading && (
        <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2 border border-gray-200">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-sm font-medium">Syncing...</span>
        </div>
      )}

      <LeadDetailPanel
        lead={selectedLead}
        isOpen={isPanelOpen}
        onEdit={handleEditClick}
        onClose={() => {
          setIsPanelOpen(false);
          setSelectedLeadId(null);
        }}
      />

      <EditLeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditLead}
        lead={selectedLead}
        isLoading={isUpdatingLead}
      />
    </>
  );
}
