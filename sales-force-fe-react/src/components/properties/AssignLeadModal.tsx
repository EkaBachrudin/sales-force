import { useState } from 'react';
import { X, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useLeads, type LeadsFilters } from '@/hooks/useLeads';
import { useAssignLeadToUnit } from '@/hooks/useUnits';
import './AssignLeadModal.css';

interface AssignLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitId?: string;
  unitName?: string;
  propertyName?: string;
  onAssigned?: () => void;
}

const leadStatusVariantMap: Record<string, 'gray' | 'blue' | 'purple' | 'orange' | 'green' | 'red'> = {
  new: 'gray',
  contacted: 'blue',
  surveyed: 'purple',
  negotiating: 'orange',
  booked: 'orange',
  closed: 'green',
  cancelled: 'red',
};

const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function AssignLeadModal({ isOpen, onClose, unitId, unitName, propertyName, onAssigned }: AssignLeadModalProps) {
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [error, setError] = useState('');
  const { assignLead, isAssigning } = useAssignLeadToUnit();

  const filters: LeadsFilters = {
    stage: 'all',
    search: appliedSearch,
    propertyType: 'all',
    source: 'all',
    dateFrom: '2000-01-01',
    dateTo: formatDateLocal(new Date()),
    statuses: 'new,contacted,surveyed,negotiating',
  };

  const { data: leadsData, isLoading } = useLeads(1, 200, filters, isOpen);

  const availableLeads = (leadsData?.data ?? []).filter((lead) => !lead.unit);

  const handleSearch = () => {
    setAppliedSearch(searchInput.trim());
  };

  const handleAssign = async () => {
    if (!selectedLeadId) {
      setError('Please select a lead');
      return;
    }

    try {
      await assignLead({ unitId: unitId || '', leadId: selectedLeadId });
      setSelectedLeadId('');
      setSearchInput('');
      setAppliedSearch('');
      setError('');
      onAssigned?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign lead');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="assign-lead-modal__backdrop" onClick={onClose} />

      <div className="assign-lead-modal__overlay">
        <div className="assign-lead-modal__panel">
          <div className="assign-lead-modal__header">
            <div>
              <h2 className="assign-lead-modal__title">Assign lead for {unitName}</h2>
              <p className="assign-lead-modal__subtitle">
                <span className="assign-lead-modal__subtitle-bold">{propertyName ? `${propertyName} ` : ''}</span>
                Choose lead for {unitName}
              </p>
            </div>
            <button onClick={onClose} className="assign-lead-modal__close">
              <X className="assign-lead-modal__close-icon" />
            </button>
          </div>

          <div className="assign-lead-modal__content">
            <div className="assign-lead-modal__search-row">
              <Input
                placeholder="Search leads..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                leftIcon={<Search className="assign-lead-modal__search-icon" />}
              />
              <Button onClick={handleSearch} rightIcon={<ArrowRight className="assign-lead-modal__go-icon" />}>
                Go
              </Button>
            </div>

            {isLoading ? (
              <div className="assign-lead-modal__loading">
                <div className="assign-lead-modal__spinner"></div>
              </div>
            ) : availableLeads.length === 0 ? (
              <p className="assign-lead-modal__empty">No available leads to assign</p>
            ) : (
              <div className="assign-lead-modal__list">
                {availableLeads.map((lead) => {
                  const isActive = selectedLeadId === lead.id;
                  return (
                    <button
                      key={lead.id}
                      type="button"
                      onClick={() => setSelectedLeadId(isActive ? '' : lead.id)}
                      className={cn('assign-lead-modal__lead', isActive && 'assign-lead-modal__lead--active')}
                    >
                      <div className="assign-lead-modal__lead-row">
                        <div className="assign-lead-modal__lead-info">
                          <p className="assign-lead-modal__lead-name">{lead.name}</p>
                          <p className="assign-lead-modal__lead-contact">{lead.email || lead.phone}</p>
                        </div>
                        <Badge variant={leadStatusVariantMap[lead.status] || 'gray'} size="sm">
                          {lead.status}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="assign-lead-modal__footer">
            {error && <p className="assign-lead-modal__error">{error}</p>}
            <Button
              fullWidth
              onClick={handleAssign}
              isLoading={isAssigning}
              disabled={!selectedLeadId || availableLeads.length === 0}
            >
              Assign lead
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
