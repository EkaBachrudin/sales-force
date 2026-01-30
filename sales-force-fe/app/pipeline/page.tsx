'use client';

import { useState, useCallback, useMemo } from 'react';
import { KanbanBoard, Lead, PipelineStage } from '@/components/dashboard/KanbanBoard';
import { LeadDetailPanel } from '@/components/dashboard/LeadDetailPanel';
import { ReasonDialogModal } from '@/components/dashboard/ReasonDialogModal';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { usePipeline, usePipelineMutations } from '@/hooks/usePipeline';
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
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [reasonModal, setReasonModal] = useState<{
    isOpen: boolean;
    leadId: string | null;
    newStage: PipelineStage | null;
  }>({ isOpen: false, leadId: null, newStage: null });

  // Fetch pipeline data with TanStack Query
  const { data: pipelineData, isLoading, isFetching, error } = usePipeline(1, 50);
  const { updateLeadStatus, isUpdating } = usePipelineMutations({
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
    setSelectedLead(lead);
    setIsPanelOpen(true);
  }, []);

  const handleStageChange = useCallback(async (leadId: string, newStage: PipelineStage) => {
    // If dropping to cancelled stage, show reason modal first
    if (newStage === 'cancelled') {
      setReasonModal({
        isOpen: true,
        leadId,
        newStage,
      });
      return;
    }

    try {
      // Optimistically update the UI
      setSelectedLead((prev) =>
        prev?.id === leadId ? { ...prev, status: newStage } : prev
      );

      // Call the API
      await updateLeadStatus({
        leadId,
        statusData: { status: newStage },
      });
    } catch (err) {
      // Revert on error
      setSelectedLead((prev) => {
        if (prev?.id === leadId) {
          // Find the original status from pipeline data
          const originalStage = pipelineData?.stages.find((s) =>
            s.leads.some((l) => l.id === leadId)
          );
          if (originalStage) {
            return { ...prev, status: originalStage.id };
          }
        }
        return prev;
      });
    }
  }, [updateLeadStatus, pipelineData]);

  const handleReasonConfirm = useCallback(async (reason: string) => {
    const { leadId, newStage } = reasonModal;
    if (!leadId || !newStage) return;

    try {
      // Optimistically update the UI
      setSelectedLead((prev) =>
        prev?.id === leadId ? { ...prev, status: newStage } : prev
      );

      // Call the API with reason
      await updateLeadStatus({
        leadId,
        statusData: { status: newStage, reason },
      });

      // Close modal
      setReasonModal({ isOpen: false, leadId: null, newStage: null });
    } catch (err) {
      // Revert on error
      setSelectedLead((prev) => {
        if (prev?.id === leadId) {
          // Find the original status from pipeline data
          const originalStage = pipelineData?.stages.find((s) =>
            s.leads.some((l) => l.id === leadId)
          );
          if (originalStage) {
            return { ...prev, status: originalStage.id };
          }
        }
        return prev;
      });
    }
  }, [updateLeadStatus, pipelineData, reasonModal]);

  const handleReasonModalClose = useCallback(() => {
    setReasonModal({ isOpen: false, leadId: null, newStage: null });
  }, []);

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
          isUpdating={isUpdating}
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
        onClose={() => {
          setIsPanelOpen(false);
          setSelectedLead(null);
        }}
      />

      <ReasonDialogModal
        isOpen={reasonModal.isOpen}
        onClose={handleReasonModalClose}
        onConfirm={handleReasonConfirm}
        isLoading={isUpdating}
      />
    </>
  );
}
