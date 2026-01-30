'use client';

import { useState, useCallback, useMemo } from 'react';
import { KanbanBoard, Lead, PipelineStage } from '@/components/dashboard/KanbanBoard';
import { LeadDetailPanel } from '@/components/dashboard/LeadDetailPanel';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { usePipeline, usePipelineMutations } from '@/hooks/usePipeline';
import { PipelineLeadItem } from '@/lib/types';

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

  // Fetch pipeline data with TanStack Query
  const { data: pipelineData, isLoading, error } = usePipeline(1, 50);
  const { updateLeadStatus } = usePipelineMutations({
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
        />
      </DashboardLayout>

      <LeadDetailPanel
        lead={selectedLead}
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false);
          setSelectedLead(null);
        }}
      />
    </>
  );
}
