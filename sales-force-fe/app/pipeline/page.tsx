'use client';

import { useState } from 'react';
import { redirect } from 'next/navigation';
// import { KanbanBoard } from '@/components/dashboard/KanbanBoard';
// import { LeadDetailPanel } from '@/components/dashboard/LeadDetailPanel';
// import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Lead } from '@/lib/types';

export default function PipelinePage() {
  redirect('/leads');
  // const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  // const [isPanelOpen, setIsPanelOpen] = useState(false);
  // const [leads, setLeads] = useState(mockLeads);

  // const handleLeadClick = (lead: Lead) => {
  //   setSelectedLead(lead);
  //   setIsPanelOpen(true);
  // };

  // const handleStageChange = (leadId: string, newStage: string) => {
  //   setLeads(leads.map(lead =>
  //     lead.id === leadId ? { ...lead, stage: newStage as any } : lead
  //   ));
  //   if (selectedLead?.id === leadId) {
  //     setSelectedLead({ ...selectedLead, stage: newStage as any });
  //   }
  // };

  return (
    <>
      {/* <DashboardLayout
        title="Pipeline"
        subtitle="Manage your leads through the sales pipeline"
      >
        <KanbanBoard leads={leads} onLeadClick={handleLeadClick} />
      </DashboardLayout>

      <LeadDetailPanel
        lead={selectedLead}
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false);
          setSelectedLead(null);
        }}
      /> */}
    </>
  );
}
