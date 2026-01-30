'use client';

import { useState, useCallback } from 'react';
import { KanbanBoard } from '@/components/dashboard/KanbanBoard';
import { LeadDetailPanel } from '@/components/dashboard/LeadDetailPanel';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Lead, PipelineStage } from '@/lib/types';
import { mockPipelineLeads } from '@/lib/mockData';

export default function PipelinePage() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>(mockPipelineLeads);

  const handleLeadClick = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setIsPanelOpen(true);
  }, []);

  const handleStageChange = useCallback((leadId: string, newStage: PipelineStage) => {
    setLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead.id === leadId ? { ...lead, status: newStage } : lead
      )
    );

    // Also update the selected lead if it's the one being changed
    if (selectedLead?.id === leadId) {
      setSelectedLead((prev) => prev ? { ...prev, status: newStage } : null);
    }
  }, [selectedLead]);

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
