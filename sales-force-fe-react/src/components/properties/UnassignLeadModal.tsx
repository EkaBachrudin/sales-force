import { UserMinus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useUnassignLeadFromUnit } from '@/hooks/useUnits';
import './UnassignLeadModal.css';

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
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!lead || !unitId) return;

    try {
      await unassignLead({ unitId, leadId: lead.id });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unassign lead');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="unassign-lead-modal__backdrop" onClick={onClose} />
      <div className="unassign-lead-modal__overlay">
        <div className="unassign-lead-modal__panel">
          <div className="unassign-lead-modal__body">
            <div className="unassign-lead-modal__heading">
              <div className="unassign-lead-modal__icon">
                <UserMinus className="unassign-lead-modal__icon-svg" />
              </div>
              <h2 className="unassign-lead-modal__title">Unassign Lead</h2>
            </div>

            <div className="unassign-lead-modal__text">
              <p className="unassign-lead-modal__paragraph">
                Are you sure you want to unassign{' '}
                <span className="unassign-lead-modal__highlight">{lead?.name}</span> from{' '}
                <span className="unassign-lead-modal__highlight">{unitName}</span>?
              </p>
              <p className="unassign-lead-modal__paragraph">
                The lead will no longer be linked to this unit. This action cannot be undone.
              </p>
              {error && <p className="unassign-lead-modal__error">{error}</p>}
            </div>
          </div>

          <div className="unassign-lead-modal__footer">
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
