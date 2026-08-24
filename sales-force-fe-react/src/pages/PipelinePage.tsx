import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KanbanBoard, type Lead, type PipelineStage } from '@/components/dashboard/KanbanBoard';
import { Search, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { usePipeline, usePipelineMutations } from '@/hooks/usePipeline';
import type { PipelineLeadItem } from '@/lib/types';
import './PipelinePage.css';

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
  const navigate = useNavigate();
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
    navigate(`/leads/${lead.id}`, { state: { from: '/pipeline' } });
  }, [navigate]);

  const handleStageChange = useCallback(async (leadId: string, newStage: PipelineStage) => {
    await updateLeadStatus({
      leadId,
      statusData: { status: newStage },
    });
  }, [updateLeadStatus]);

  if (isLoading) {
    return (
      <DashboardLayout title="Pipeline" subtitle="Manage your leads through the sales pipeline">
        <div className="pipeline-page__loading">
          <div className="pipeline-page__loading-text">Loading pipeline...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Pipeline" subtitle="Manage your leads through the sales pipeline">
        <div className="pipeline-page__loading">
          <div className="pipeline-page__error">
            Failed to load pipeline: {(error as Error).message}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout title="Pipeline" subtitle="Manage your leads through the sales pipeline">
        {/* Search Bar */}
        <div className="pipeline-page__search">
          <div className="pipeline-page__search-inner">
            <Search className="pipeline-page__search-icon" />
            <input
              type="text"
              placeholder="Search leads by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pipeline-page__search-input"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="pipeline-page__clear"
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
          <div className="pipeline-page__pagination">
            <button
              onClick={handlePrevPage}
              disabled={!hasPrevPage || isFetching}
              className="pipeline-page__page-button"
            >
              Previous
            </button>

            <span className="pipeline-page__page-info">
              Page {page} of {totalPages} ({leads.length} of {totalLeads} leads)
            </span>

            <button
              onClick={handleNextPage}
              disabled={!hasNextPage || isFetching}
              className="pipeline-page__page-button pipeline-page__page-button--primary"
            >
              {isFetching && <Loader2 className="pipeline-page__spinner" />}
              Next
            </button>
          </div>
        )}
      </DashboardLayout>

      {/* Loading overlay for refetching pipeline data */}
      {isFetching && !isLoading && (
        <div className="pipeline-page__sync">
          <Loader2 className="pipeline-page__sync-icon" />
          <span className="pipeline-page__sync-text">Syncing...</span>
        </div>
      )}
    </>
  );
}
