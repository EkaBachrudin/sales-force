import { useState, useCallback, useMemo, useEffect } from 'react';
import { KanbanBoard, type Lead, type PipelineStage } from '@/components/dashboard/KanbanBoard';
import { Search, Loader2 } from 'lucide-react';
import { LeadDetailPanel } from '@/components/dashboard/LeadDetailPanel';
import { EditLeadModal } from '@/components/dashboard/EditLeadModal';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { usePipeline, usePipelineMutations } from '@/hooks/usePipeline';
import { useLeadDetail, useLeadMutations } from '@/hooks/useLeads';
import type { PipelineLeadItem } from '@/lib/types';

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
    updated_at: pipelineLead.updated_at,
    followUpDate: pipelineLead.next_follow_up_at,
    property_id: '',
  };
}

export default function PipelinePage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page when search changes
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch lead detail when selectedLeadId changes
  const { data: selectedLead, isLoading: isLoadingLeadDetail } = useLeadDetail(selectedLeadId, isPanelOpen);

  // Mutations
  const { updateLead, isUpdating: isUpdatingLead } = useLeadMutations({
    onUpdateSuccess: () => {
      setIsEditModalOpen(false);
    },
  });

  // Fetch pipeline data with TanStack Query
  const { data: pipelineData, isLoading, isFetching, error } = usePipeline(page, 10, debouncedSearch);
  const { updateLeadStatus, isUpdating: isUpdatingStatus } = usePipelineMutations({
    onUpdateSuccess: () => {
      // Query will be automatically invalidated and refetched
    },
    onError: (err) => {
      console.error('Failed to update lead status:', err);
    },
  });

  // Transform current page pipeline data to leads array
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

  // Calculate total leads and pages from meta
  const totalLeads = pipelineData?.meta.total_leads ?? 0;
  const limit = 10;
  const totalPages = Math.ceil(totalLeads / limit);

  // Check if there are more pages
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // Handle page navigation
  const handleNextPage = useCallback(() => {
    if (hasNextPage && !isFetching) {
      setPage(p => p + 1);
    }
  }, [hasNextPage, isFetching]);

  const handlePrevPage = useCallback(() => {
    if (hasPrevPage && !isFetching) {
      setPage(p => p - 1);
    }
  }, [hasPrevPage, isFetching]);

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
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search leads by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <KanbanBoard
          leads={leads}
          onLeadClick={handleLeadClick}
          onStageChange={handleStageChange}
          isUpdating={isUpdatingStatus}
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={handlePrevPage}
              disabled={!hasPrevPage || isFetching}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              Previous
            </button>

            <span className="text-text-secondary text-sm">
              Page {page} of {totalPages} ({leads.length} of {totalLeads} leads)
            </span>

            <button
              onClick={handleNextPage}
              disabled={!hasNextPage || isFetching}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isFetching && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Next
            </button>
          </div>
        )}
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
        isLoading={isUpdatingLead || isLoadingLeadDetail}
      />
    </>
  );
}
