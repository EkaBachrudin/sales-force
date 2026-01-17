'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Phone, MoreVertical, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { LeadDetailPanel } from '@/components/dashboard/LeadDetailPanel';
import { NewLeadModal } from '@/components/dashboard/NewLeadModal';
import { EditLeadModal } from '@/components/dashboard/EditLeadModal';
import { stageLabels, stageColors } from '@/lib/mockData';
import { Lead, PipelineStage, PaginatedResponse } from '@/lib/types';
import { cn, formatCurrency, formatPhone, formatRelativeTime } from '@/lib/utils';

const stageVariantMap: Record<string, 'gray' | 'blue' | 'purple' | 'orange' | 'green' | 'red'> = {
  new: 'gray',
  contacted: 'blue',
  surveyed: 'purple',
  negotiating: 'orange',
  closed: 'green',
  cancelled: 'red',
};

// Get unique property types and sources from mock data
const propertyTypes = ['Cluster A', 'Cluster B', 'Cluster C', 'Cluster D'];
const sources = ['Website', 'Instagram', 'Facebook', 'WhatsApp', 'Referral', 'Other'];

interface LeadsFilters {
  stage: string;
  search: string;
  propertyType: string;
  source: string;
  dateFrom: string;
  dateTo: string;
}

const defaultFilters: LeadsFilters = {
  stage: 'all',
  search: '',
  propertyType: 'all',
  source: 'all',
  dateFrom: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
  dateTo: new Date().toISOString().split('T')[0], // today
};

export default function LeadsPage() {
  const [leadsData, setLeadsData] = useState<PaginatedResponse<Lead> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);

  // Filter state
  const [filters, setFilters] = useState<LeadsFilters>(defaultFilters);
  const [showDateRange, setShowDateRange] = useState(false);

  // Fetch leads with filters and pagination


  // Reset to first page when filters change
  const updateFilter = (key: keyof LeadsFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsPanelOpen(true);
  };

  const handleNewLead = (data: any) => {
    // After creating a new lead, refetch the current page
    setIsNewLeadModalOpen(false);
  };

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleEditLead = async (data: Partial<Lead>) => {
    if (!selectedLead) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/leads/${selectedLead.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update lead');

      // Update the selected lead with new data
      setSelectedLead({ ...selectedLead, ...data });

      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating lead:', error);
    } finally {
      setIsSaving(false);
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
        subtitle={leadsData ? `Total ${leadsData.total} leads` : 'Loading...'}
        action={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsNewLeadModalOpen(true)}>
            Add Lead
          </Button>
        }
      >
        {/* Filters */}
        <div className="flex flex-col gap-3 mb-6">
          {/* Search and Stage - Mobile: stacked, Tablet+: side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <div className="w-full">
              <Input
                placeholder="Search by name, phone, or email..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <select
              value={filters.stage}
              onChange={(e) => updateFilter('stage', e.target.value)}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg border border-[var(--border)] bg-white text-sm focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="all">All Stages</option>
              <option value="new">Baru Masuk</option>
              <option value="contacted">Dikontak</option>
              <option value="surveyed">Survey</option>
              <option value="negotiating">Negosiasi</option>
              <option value="closed">Closing</option>
              <option value="cancelled">Batal</option>
            </select>
          </div>

          {/* Property, Source, and Date Range - Mobile: stacked, Tablet+: grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={filters.propertyType}
              onChange={(e) => updateFilter('propertyType', e.target.value)}
              className="w-full px-3 sm:px-4 py-2 rounded-lg border border-[var(--border)] bg-white text-sm focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="all">All Properties</option>
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={filters.source}
              onChange={(e) => updateFilter('source', e.target.value)}
              className="w-full px-3 sm:px-4 py-2 rounded-lg border border-[var(--border)] bg-white text-sm focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="all">All Sources</option>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowDateRange(!showDateRange)}
              className="w-full px-3 sm:px-4 py-2 rounded-lg border border-[var(--border)] bg-white text-sm focus:outline-none focus:border-[var(--primary)] flex items-center justify-center sm:justify-start gap-2 hover:bg-gray-50"
            >
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{showDateRange ? 'Hide' : 'Show'} Date Range</span>
            </button>
          </div>

          {/* Date Range Inputs */}
          {showDateRange && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start sm:items-end">
              <div className="w-full">
                <label className="block text-xs text-[var(--text-secondary)] mb-1">From Date</label>
                <input
                  type="date"
                  value={formatDateForInput(filters.dateFrom)}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 rounded-lg border border-[var(--border)] bg-white text-sm focus:outline-none focus:border-[var(--primary)]"
                />
              </div>
              <div className="w-full">
                <label className="block text-xs text-[var(--text-secondary)] mb-1">To Date</label>
                <input
                  type="date"
                  value={formatDateForInput(filters.dateTo)}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 rounded-lg border border-[var(--border)] bg-white text-sm focus:outline-none focus:border-[var(--primary)]"
                />
              </div>
              <button
                onClick={() => setFilters({ ...defaultFilters })}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg border border-[var(--border)] bg-white text-sm focus:outline-none focus:border-[var(--primary)] hover:bg-gray-50"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
              Loading leads...
            </div>
          ) : (
            <>
              {/* Card Layout for Mobile/Tablet, Table for Desktop */}
              <div className="block lg:hidden">
                {/* Mobile/Tablet Card View */}
                <div className="divide-y divide-[var(--border)]">
                  {!leadsData || leadsData.data.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
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
                              <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">{lead.name}</h3>
                              <Badge variant={stageVariantMap[lead.stage]} size="sm">
                                {stageLabels[lead.stage as PipelineStage]}
                              </Badge>
                            </div>
                            <a
                              href={`tel:${lead.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--primary)] mb-2"
                            >
                              <Phone className="w-3 h-3" />
                              {formatPhone(lead.phone)}
                            </a>
                            <div className="space-y-1">
                              <p className="text-sm text-[var(--text-primary)]">
                                <span className="text-[var(--text-secondary)]">Property:</span> {lead.propertyType}
                              </p>
                              {lead.source && (
                                <p className="text-xs text-[var(--text-secondary)]">via {lead.source}</p>
                              )}
                              <p className="text-xs text-[var(--text-secondary)]">{formatRelativeTime(lead.createdAt)}</p>
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
                    <tr className="border-b border-[var(--border)] bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Lead
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Property
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Stage
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {!leadsData || leadsData.data.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
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
                              <p className="text-sm font-medium text-[var(--text-primary)]">{lead.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <a
                                  href={`tel:${lead.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--primary)]"
                                >
                                  <Phone className="w-3 h-3" />
                                  {formatPhone(lead.phone)}
                                </a>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-[var(--text-primary)]">{lead.propertyType}</p>
                            {lead.source && (
                              <p className="text-xs text-[var(--text-secondary)] mt-0.5">via {lead.source}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={stageVariantMap[lead.stage]} size="sm">
                              {stageLabels[lead.stage as PipelineStage]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-[var(--text-secondary)]">{formatRelativeTime(lead.createdAt)}</p>
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
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                title="More"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="w-4 h-4" />
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
              {leadsData && leadsData.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[var(--border)]">
                  <div className="text-xs sm:text-sm text-[var(--text-secondary)] text-center sm:text-left">
                    Showing {Math.min((currentPage - 1) * pageSize + 1, leadsData.total)} to{' '}
                    {Math.min(currentPage * pageSize, leadsData.total)} of {leadsData.total} leads
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-[var(--border)] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs sm:text-sm text-[var(--text-secondary)] whitespace-nowrap">
                      {currentPage} / {leadsData.totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(leadsData.totalPages, prev + 1))}
                      disabled={currentPage === leadsData.totalPages}
                      className="p-2 rounded-lg border border-[var(--border)] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Lead Detail Panel */}
      <LeadDetailPanel
        lead={selectedLead}
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false);
          setSelectedLead(null);
        }}
        onEdit={handleEditClick}
      />

      {/* New Lead Modal */}
      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        onSubmit={handleNewLead}
      />

      {/* Edit Lead Modal */}
      <EditLeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditLead}
        lead={selectedLead}
        isLoading={isSaving}
      />
    </>
  );
}
