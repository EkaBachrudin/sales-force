import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useLeads, type LeadsFilters } from '@/hooks/useLeads';
import { useAssignLeadToUnit } from '@/hooks/useUnits';

interface AssignLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitId?: string;
  unitName?: string;
  onAssigned?: () => void;
}

const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function AssignLeadModal({ isOpen, onClose, unitId, unitName, onAssigned }: AssignLeadModalProps) {
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const { assignLead, isAssigning } = useAssignLeadToUnit();

  const filters: LeadsFilters = {
    stage: 'all',
    search: '',
    propertyType: 'all',
    source: 'all',
    dateFrom: '2000-01-01',
    dateTo: formatDateLocal(new Date()),
  };

  const { data: leadsData, isLoading } = useLeads(1, 200, filters, isOpen);

  const availableLeads = (leadsData?.data ?? []).filter((lead) => !lead.unit);

  const leadOptions = availableLeads.map((lead) => ({
    value: lead.id,
    label: `${lead.name} — ${lead.phone}`,
  }));

  const handleAssign = async () => {
    if (!selectedLeadId) {
      alert('Please select a lead');
      return;
    }

    try {
      await assignLead({ unitId: unitId || '', leadId: selectedLeadId });
      setSelectedLeadId('');
      onAssigned?.();
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to assign lead');
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
              <h2 className="text-lg font-semibold text-text-primary">Assign Lead</h2>
              <p className="text-sm text-text-secondary mt-0.5">
                {unitName ? `Assign a lead to ${unitName}` : 'Assign a lead to this unit'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="p-5">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : availableLeads.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-6">
                No available leads to assign
              </p>
            ) : (
              <Select
                label="Select Lead"
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                options={[
                  { value: '', label: 'Select a lead', disabled: true },
                  ...leadOptions,
                ]}
              />
            )}
          </div>

          <div className="flex justify-end gap-2 p-5 border-t border-border">
            <Button variant="secondary" onClick={onClose} disabled={isAssigning}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              isLoading={isAssigning}
              disabled={availableLeads.length === 0}
            >
              Assign
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
