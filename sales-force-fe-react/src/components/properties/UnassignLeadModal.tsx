import { UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useUnassignLeadFromUnit } from '@/hooks/useUnits';

interface UnassignLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitId?: string;
  unitName?: string;
  lead?: {
    id: string;
    name: string;
  } | null;
}

export function UnassignLeadModal({ isOpen, onClose, unitId, unitName, lead }: UnassignLeadModalProps) {
  const { unassignLead, isUnassigning } = useUnassignLeadFromUnit();

  const handleConfirm = async () => {
    if (!lead || !unitId) return;

    try {
      await unassignLead({ unitId, leadId: lead.id });
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to unassign lead');
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
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <UserMinus className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-text-primary">Unassign Lead</h2>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-text-secondary">
                Are you sure you want to unassign{' '}
                <span className="font-semibold text-text-primary">{lead?.name}</span> from{' '}
                <span className="font-semibold text-text-primary">{unitName}</span>?
              </p>
              <p className="text-sm text-text-secondary">
                The lead will no longer be linked to this unit. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-gray-50">
            <Button variant="secondary" onClick={onClose} disabled={isUnassigning}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirm} isLoading={isUnassigning}>
              Unassign Lead
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
