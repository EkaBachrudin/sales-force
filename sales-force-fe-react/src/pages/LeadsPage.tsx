import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { api } from '@/lib/api';
import { Search, Plus, Phone, ChevronLeft, ChevronRight, Calendar, Download, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox';
import { NewLeadModal } from '@/components/dashboard/NewLeadModal';
import { stageLabels } from '@/lib/mockData';
import type { Lead, PipelineStage } from '@/lib/types';
import { formatPhone, formatRelativeTime } from '@/lib/utils';
import { useProperties } from '@/hooks/useProperties';
import { useLeads, useLeadMutations, type LeadsFilters as UseLeadsFilters } from '@/hooks/useLeads';
import { useDebounce } from '@/hooks/useDebounce';
import './LeadsPage.css';

const stageVariantMap: Record<string, 'gray' | 'blue' | 'purple' | 'orange' | 'green' | 'red'> = {
  new: 'gray',
  contacted: 'blue',
  surveyed: 'purple',
  negotiating: 'orange',
  closed: 'green',
  cancelled: 'red',
};

// Get unique property types and sources from mock data
const sourceOptions = [
  { value: 'visit', label: 'Visit' },
  { value: 'referral', label: 'Referral' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'other', label: 'Other' },
];

const stageOptions: ComboboxOption[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'surveyed', label: 'Surveyed' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'booked', label: 'Booked' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
];

// Helper function to format date as YYYY-MM-DD in local timezone
const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const defaultFilters: UseLeadsFilters = {
  stage: 'all',
  search: '',
  propertyType: 'all',
  source: 'all',
  dateFrom: formatDateLocal(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)), // 1 year ago
  dateTo: formatDateLocal(new Date()), // today
};

export default function LeadsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: properties, isLoading: isLoadingProperties } = useProperties();

  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deleteConfirmLead, setDeleteConfirmLead] = useState<Lead | null>(null);

  // Pagination state
  const pageSize = 20;

  // Derive filters from URL query params (single source of truth)
  const filters: UseLeadsFilters = {
    stage: searchParams.get('stage') || 'all',
    search: searchParams.get('search') || '',
    propertyType: searchParams.get('propertyType') || 'all',
    source: searchParams.get('source') || 'all',
    dateFrom: searchParams.get('dateFrom') || defaultFilters.dateFrom,
    dateTo: searchParams.get('dateTo') || defaultFilters.dateTo,
  };

  const parsedPage = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  const [searchInput, setSearchInput] = useState(filters.search);
  const [showDateRange, setShowDateRange] = useState(
    () => !!(searchParams.get('dateFrom') || searchParams.get('dateTo'))
  );

  // Debounce search input
  const debouncedSearch = useDebounce(searchInput, 500);

  // Write query params to URL; omit defaults and optionally reset page
  const updateQueryParams = (
    updates: Record<string, string | null | undefined>,
    options?: { resetPage?: boolean; replace?: boolean }
  ) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(updates)) {
          if (value === undefined || value === null || value === '' || value === 'all') {
            next.delete(key);
          } else {
            next.set(key, value);
          }
        }
        if (options?.resetPage) next.delete('page');
        return next;
      },
      { replace: options?.replace ?? false }
    );
  };

  // Update search param from debounced input
  useEffect(() => {
    if (debouncedSearch !== (searchParams.get('search') || '')) {
      updateQueryParams({ search: debouncedSearch }, { resetPage: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Sync search input when URL changes (back/forward navigation)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== searchInput) {
      setSearchInput(urlSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Fetch leads with filters and pagination
  const { data: leadsData, isLoading: isLoadingLeads } = useLeads(currentPage, pageSize, filters);

  // Mutations
  const { createLead, deleteLead, isDeleting } = useLeadMutations({
    onCreateSuccess: () => {
      setIsNewLeadModalOpen(false);
    },
    onDeleteSuccess: () => {
      // Lead deleted, list will refresh automatically
    },
  });

  // Update filter in URL and reset to first page
  const updateFilter = (key: keyof UseLeadsFilters, value: string) => {
    updateQueryParams({ [key]: value }, { resetPage: true });
  };

  const setPage = (page: number) => {
    updateQueryParams({ page: page === 1 ? null : String(page) });
  };

  const handleLeadClick = (lead: Lead) => {
    navigate(`/leads/${lead.id}`, { state: { from: `/leads${location.search}` } });
  };

  const handleNewLead = async (data: any) => {
    await createLead(data);
  };

  const handleDeleteClick = (lead: Lead) => {
    setDeleteConfirmLead(lead);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmLead) return;
    await deleteLead(deleteConfirmLead.id);
    setDeleteConfirmLead(null);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await api.exportLeads({
        stage: filters.stage,
        search: filters.search,
        propertyType: filters.propertyType,
        source: filters.source,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });

      // Create download link
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      globalThis.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    return dateString;
  };

  return (
    <>
      <DashboardLayout
        title="Leads"
        subtitle={leadsData ? `Total ${leadsData.total ?? 0} leads` : 'Loading...'}
        action={
          <div className="leads-page__action">
            <Button
              variant="secondary"
              leftIcon={<Download className="leads-page__action-icon" />}
              onClick={handleExport}
              isLoading={isExporting}
            >
              Export
            </Button>
            <Button leftIcon={<Plus className="leads-page__action-icon" />} onClick={() => setIsNewLeadModalOpen(true)}>
              Add Lead
            </Button>
          </div>
        }
      >
        {/* Filters */}
        <div className="leads-page__filters">
          {/* Search and Stage - Mobile: stacked, Tablet+: side by side */}
          <div className="leads-page__filters-row">
            <div className="leads-page__search">
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                leftIcon={<Search className="leads-page__search-icon" />}
              />
            </div>
            <Combobox
              className="leads-page__stage-combobox"
              multiple
              options={stageOptions}
              value={filters.stage === 'all' ? [] : filters.stage.split(',')}
              onChange={(value) => {
                const next = Array.isArray(value) ? value.join(',') : value;
                updateFilter('stage', next);
              }}
              placeholder="All Stages"
              searchPlaceholder="Search stage..."
            />
          </div>

          {/* Property, Source, and Date Range - Mobile: stacked, Tablet+: grid */}
          <div className="leads-page__filters-grid">
            <Combobox
              options={properties?.map((property) => ({ value: property.id, label: property.name })) ?? []}
              value={filters.propertyType === 'all' ? '' : filters.propertyType}
              onChange={(value) => updateFilter('propertyType', Array.isArray(value) ? value[0] ?? '' : value)}
              placeholder="All Properties"
              searchPlaceholder="Search property..."
              disabled={isLoadingProperties}
              isLoading={isLoadingProperties}
            />

            <Combobox
              options={sourceOptions}
              value={filters.source === 'all' ? '' : filters.source}
              onChange={(value) => updateFilter('source', Array.isArray(value) ? value[0] ?? '' : value)}
              placeholder="All Sources"
              searchPlaceholder="Search source..."
            />

            <button
              onClick={() => setShowDateRange(!showDateRange)}
              className="leads-page__date-toggle"
            >
              <Calendar className="leads-page__date-icon" />
              <span className="leads-page__date-toggle-text">{showDateRange ? 'Hide' : 'Show'} Date Range</span>
            </button>
          </div>

          {/* Date Range Inputs */}
          {showDateRange && (
            <div className="leads-page__date-range">
              <div className="leads-page__date-field">
                <label className="leads-page__date-label">From Date</label>
                <input
                  type="date"
                  value={formatDateForInput(filters.dateFrom)}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                  className="leads-page__date-input"
                />
              </div>
              <div className="leads-page__date-field">
                <label className="leads-page__date-label">To Date</label>
                <input
                  type="date"
                  value={formatDateForInput(filters.dateTo)}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                  className="leads-page__date-input"
                />
              </div>
              <button
                onClick={() => {
                  setSearchInput('');
                  setShowDateRange(false);
                  setSearchParams(new URLSearchParams(), { replace: true });
                }}
                className="leads-page__reset"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Leads Table */}
        <div className="leads-page__table-container">
          {isLoadingLeads ? (
            <div className="leads-page__loading">Loading leads...</div>
          ) : (
            <>
              {/* Card Layout for Mobile/Tablet, Table for Desktop */}
              <div className="leads-page__mobile">
                {/* Mobile/Tablet Card View */}
                <div className="leads-page__list">
                  {!leadsData?.data || leadsData.data.length === 0 ? (
                    <div className="leads-page__empty">No leads found</div>
                  ) : (
                    leadsData.data.map((lead) => (
                      <div
                        key={lead.id}
                        className="leads-page__mobile-card"
                        onClick={() => handleLeadClick(lead)}
                      >
                        <div className="leads-page__mobile-card-row">
                          <div className="leads-page__mobile-card-info">
                            <div className="leads-page__name-row">
                              <h3 className="leads-page__name">{lead.name}</h3>
                              <Badge variant={stageVariantMap[lead.status]} size="sm">
                                {stageLabels[lead.status as PipelineStage]}
                              </Badge>
                            </div>
                            <a
                              href={`tel:${lead.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="leads-page__phone"
                            >
                              <Phone className="leads-page__phone-icon" />
                              {formatPhone(lead.phone)}
                            </a>
                            <div className="leads-page__details">
                              <p className="leads-page__property">
                                <span className="leads-page__property-label">Property:</span> {lead.property ? lead.property.name : '-'}
                              </p>
                              {lead.source && (
                                <p className="leads-page__source">via {lead.source}</p>
                              )}
                              <p className="leads-page__time">{formatRelativeTime(lead.created_at)}</p>
                            </div>
                          </div>
                          <div className="leads-page__mobile-actions">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank');
                              }}
                              className="leads-page__action-btn leads-page__action-btn--whatsapp"
                              title="WhatsApp"
                            >
                              <svg className="leads-page__mobile-action-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `tel:${lead.phone}`;
                              }}
                              className="leads-page__action-btn leads-page__action-btn--call"
                              title="Call"
                            >
                              <Phone className="leads-page__mobile-action-icon" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(lead);
                              }}
                              className="leads-page__action-btn leads-page__action-btn--delete"
                              title="Delete"
                            >
                              <Trash2 className="leads-page__mobile-action-icon" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="leads-page__desktop">
                <table className="leads-page__table">
                  <thead>
                    <tr className="leads-page__table-head">
                      <th className="leads-page__th">Lead</th>
                      <th className="leads-page__th">Property</th>
                      <th className="leads-page__th">Stage</th>
                      <th className="leads-page__th">Created</th>
                      <th className="leads-page__th leads-page__th--right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="leads-page__table-body">
                    {!leadsData?.data || leadsData.data.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="leads-page__empty">
                          No leads found
                        </td>
                      </tr>
                    ) : (
                      leadsData.data.map((lead) => (
                        <tr
                          key={lead.id}
                          className="leads-page__table-row"
                          onClick={() => handleLeadClick(lead)}
                        >
                          <td className="leads-page__td">
                            <div>
                              <p className="leads-page__table-name">{lead.name}</p>
                              <div className="leads-page__table-name-row">
                                <a
                                  href={`tel:${lead.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="leads-page__phone"
                                >
                                  <Phone className="leads-page__phone-icon" />
                                  {formatPhone(lead.phone)}
                                </a>
                              </div>
                            </div>
                          </td>
                          <td className="leads-page__td">
                            <p className="leads-page__table-property">{lead.unit ? lead.unit.name : '-'}</p>
                            {lead.source && (
                              <p className="leads-page__source">via {lead.source}</p>
                            )}
                          </td>
                          <td className="leads-page__td">
                            <Badge variant={stageVariantMap[lead.status]} size="lg">
                              {stageLabels[lead.status as PipelineStage]}
                            </Badge>
                          </td>
                          <td className="leads-page__td">
                            <p className="leads-page__time">{formatRelativeTime(lead.created_at)}</p>
                          </td>
                          <td className="leads-page__td">
                            <div className="leads-page__table-actions">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank');
                                }}
                                className="leads-page__action-btn leads-page__action-btn--whatsapp leads-page__action-btn--table"
                                title="WhatsApp"
                              >
                                <svg className="leads-page__table-action-icon" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `tel:${lead.phone}`;
                                }}
                                className="leads-page__action-btn leads-page__action-btn--call leads-page__action-btn--table"
                                title="Call"
                              >
                                <Phone className="leads-page__table-action-icon" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(lead);
                                }}
                                className="leads-page__action-btn leads-page__action-btn--delete leads-page__action-btn--table"
                                title="Delete"
                              >
                                <Trash2 className="leads-page__table-action-icon" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {leadsData && (leadsData.total ?? 0) > 0 && leadsData.totalPages && leadsData.totalPages > 1 && (
                <div className="leads-page__pagination">
                  <div className="leads-page__pagination-info">
                    Showing {Math.min((currentPage - 1) * pageSize + 1, leadsData.total ?? 0)} to{' '}
                    {Math.min(currentPage * pageSize, leadsData.total ?? 0)} of {leadsData.total ?? 0} leads
                  </div>
                  <div className="leads-page__pagination-buttons">
                    <button
                      onClick={() => setPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="leads-page__page-btn"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="leads-page__page-btn-icon" />
                    </button>
                    <span className="leads-page__page-indicator">
                      {currentPage} / {leadsData.totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(leadsData.totalPages || 1, currentPage + 1))}
                      disabled={currentPage === leadsData.totalPages}
                      className="leads-page__page-btn"
                      aria-label="Next page"
                    >
                      <ChevronRight className="leads-page__page-btn-icon" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DashboardLayout>

      {/* New Lead Modal */}
      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        onSubmit={handleNewLead}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmLead && (
        <div className="leads-page__delete-modal">
          <div className="leads-page__delete-modal-backdrop" onClick={() => setDeleteConfirmLead(null)} />
          <div className="leads-page__delete-modal-panel">
            <div className="leads-page__delete-modal-heading">
              <div className="leads-page__delete-modal-icon">
                <Trash2 className="leads-page__delete-modal-icon-svg" />
              </div>
              <div>
                <h3 className="leads-page__delete-modal-title">Delete Lead</h3>
                <p className="leads-page__delete-modal-subtitle">This action cannot be undone</p>
              </div>
            </div>
            <p className="leads-page__delete-modal-message">
              Are you sure you want to delete{' '}
              <span className="leads-page__delete-modal-highlight">{deleteConfirmLead.name}</span>?
              This will permanently remove this lead and all associated activities and reminders.
            </p>
            <div className="leads-page__delete-modal-actions">
              <Button
                variant="secondary"
                onClick={() => setDeleteConfirmLead(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteConfirm} isLoading={isDeleting}>
                Delete Lead
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
