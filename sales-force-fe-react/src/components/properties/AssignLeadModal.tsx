import { useState } from 'react';
import { X, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useLeads, type LeadsFilters } from '@/hooks/useLeads';
import { useAssignLeadToUnit } from '@/hooks/useUnits';

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
      <div
        className="fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Assign lead for {unitName}
              </h2>
              <p className="text-sm text-text-secondary mt-0.5">
                <span className='font-bold'>{propertyName ? `${propertyName} ` : ''} </span>Choose lead for {unitName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search leads..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                leftIcon={<Search className="w-4 h-4" />}
              />
              <Button
                onClick={handleSearch}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Go
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : availableLeads.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-6">
                No available leads to assign
              </p>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {availableLeads.map((lead) => {
                  const isActive = selectedLeadId === lead.id;
                  return (
                    <button
                      key={lead.id}
                      type="button"
                      onClick={() => setSelectedLeadId(isActive ? '' : lead.id)}
                      className={cn(
                        'w-full text-left rounded-[12px] border bg-white p-4 transition-all duration-200',
                        isActive
                          ? 'border-primary ring-primary shadow-md bg-primary-light'
                          : 'border-border hover:border-gray-300'
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">
                            {lead.name}
                          </p>
                          <p className="text-xs text-text-secondary truncate mt-0.5">
                            {lead.email || lead.phone}
                          </p>
                        </div>
                        <Badge
                          variant={leadStatusVariantMap[lead.status] || 'gray'}
                          size="sm"
                        >
                          {lead.status}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-5 border-t border-border">
            {error && (
              <p className="text-sm text-danger mb-3">{error}</p>
            )}
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
