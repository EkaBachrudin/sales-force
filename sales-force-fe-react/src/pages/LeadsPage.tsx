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
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleExport}
              isLoading={isExporting}
            >
              Export
            </Button>
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsNewLeadModalOpen(true)}>
              Add Lead
            </Button>
          </div>
        }
      >
        {/* Filters */}
        <div className="flex flex-col gap-3 mb-6 p-4 bg-white rounded-xl border border-border">
          {/* Search and Stage - Mobile: stacked, Tablet+: side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <div className="w-full">
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <Combobox
              className="sm:w-auto sm:min-w-[180px]"
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Combobox
              options={properties?.map((property) => ({ value: property.id, label: property.name })) ?? []}
              value={filters.propertyType}
              onChange={(value) => updateFilter('propertyType', Array.isArray(value) ? value[0] ?? '' : value)}
              placeholder="All Properties"
              searchPlaceholder="Search property..."
              disabled={isLoadingProperties}
              isLoading={isLoadingProperties}
            />

            <Combobox
              options={sourceOptions}
              value={filters.source}
              onChange={(value) => updateFilter('source', Array.isArray(value) ? value[0] ?? '' : value)}
              placeholder="All Sources"
              searchPlaceholder="Search source..."
            />

            <button
              onClick={() => setShowDateRange(!showDateRange)}
              className="w-full px-3 sm:px-4 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:border-primary flex items-center justify-center sm:justify-start gap-2 hover:bg-gray-50"
            >
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{showDateRange ? 'Hide' : 'Show'} Date Range</span>
            </button>
          </div>

          {/* Date Range Inputs */}
          {showDateRange && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start sm:items-end">
              <div className="w-full">
                <label className="block text-xs text-text-secondary mb-1">From Date</label>
                <input
                  type="date"
                  value={formatDateForInput(filters.dateFrom)}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="w-full">
                <label className="block text-xs text-text-secondary mb-1">To Date</label>
                <input
                  type="date"
                  value={formatDateForInput(filters.dateTo)}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={() => {
                  setSearchInput('');
                  setShowDateRange(false);
                  setSearchParams(new URLSearchParams(), { replace: true });
                }}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:border-primary hover:bg-gray-50"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          {isLoadingLeads ? (
            <div className="px-4 py-8 text-center text-sm text-text-secondary">
              Loading leads...
            </div>
          ) : (
            <>
              {/* Card Layout for Mobile/Tablet, Table for Desktop */}
              <div className="block lg:hidden">
                {/* Mobile/Tablet Card View */}
                <div className="divide-y divide-[var(--border)]">
                  {!leadsData?.data || leadsData.data.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-text-secondary">
                      No leads found
                    </div>
                  ) : (
                    leadsData.data.map((lead) => (
                      <div
                        key={lead.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleLeadClick(lead)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-text-primary truncate">{lead.name}</h3>
                              <Badge variant={stageVariantMap[lead.status]} size="sm">
                                {stageLabels[lead.status as PipelineStage]}
                              </Badge>
                            </div>
                            <a
                              href={`tel:${lead.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary mb-2"
                            >
                              <Phone className="w-3 h-3" />
                              {formatPhone(lead.phone)}
                            </a>
                            <div className="space-y-1">
                              <p className="text-sm text-text-primary">
                                <span className="text-text-secondary">Property:</span> {lead.property ? lead.property.name : '-'}
                              </p>
                              {lead.source && (
                                <p className="text-xs text-text-secondary">via {lead.source}</p>
                              )}
                              <p className="text-xs text-text-secondary">{formatRelativeTime(lead.created_at)}</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank');
                              }}
                              className="p-2 rounded hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                              title="WhatsApp"
                            >
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `tel:${lead.phone}`;
                              }}
                              className="p-2 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Call"
                            >
                              <Phone className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(lead);
                              }}
                              className="p-2 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Lead
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Property
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Stage
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {!leadsData?.data || leadsData.data.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-text-secondary">
                          No leads found
                        </td>
                      </tr>
                    ) : (
                      leadsData.data.map((lead) => (
                        <tr
                          key={lead.id}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleLeadClick(lead)}
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-text-primary">{lead.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <a
                                  href={`tel:${lead.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary"
                                >
                                  <Phone className="w-3 h-3" />
                                  {formatPhone(lead.phone)}
                                </a>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-text-primary">{lead.unit ? lead.unit.name : '-'}</p>
                            {lead.source && (
                              <p className="text-xs text-text-secondary mt-0.5">via {lead.source}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={stageVariantMap[lead.status]} size="lg">
                              {stageLabels[lead.status as PipelineStage]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-text-secondary">{formatRelativeTime(lead.created_at)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank');
                                }}
                                className="p-1.5 rounded hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                                title="WhatsApp"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `tel:${lead.phone}`;
                                }}
                                className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Call"
                              >
                                <Phone className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(lead);
                                }}
                                className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border">
                  <div className="text-xs sm:text-sm text-text-secondary text-center sm:text-left">
                    Showing {Math.min((currentPage - 1) * pageSize + 1, leadsData.total ?? 0)} to{' '}
                    {Math.min(currentPage * pageSize, leadsData.total ?? 0)} of {leadsData.total ?? 0} leads
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs sm:text-sm text-text-secondary whitespace-nowrap">
                      {currentPage} / {leadsData.totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(leadsData.totalPages || 1, currentPage + 1))}
                      disabled={currentPage === leadsData.totalPages}
                      className="p-2 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirmLead(null)} />
          <div className="relative bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-red-100">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Delete Lead</h3>
                <p className="text-sm text-text-secondary">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-6">
              Are you sure you want to delete <span className="font-semibold text-text-primary">{deleteConfirmLead.name}</span>?
              This will permanently remove this lead and all associated activities and reminders.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setDeleteConfirmLead(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                isLoading={isDeleting}
              >
                Delete Lead
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
