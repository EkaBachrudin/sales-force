import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  UnitAssignmentFields,
  type UnitAssignmentValue,
} from '@/components/leads/UnitAssignmentFields';
import { useAssignLeadToUnit } from '@/hooks/useUnits';
import './UnitPickerModal.css';

interface UnitPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  currentUnit?: {
    id: string;
    name: string;
    status: string;
    block: { id: string; name: string };
    property: { id: string; name: string };
  };
  onAssigned?: () => void;
}

export function UnitPickerModal({
  isOpen,
  onClose,
  leadId,
  currentUnit,
  onAssigned,
}: UnitPickerModalProps) {
  const [value, setValue] = useState<UnitAssignmentValue>({
    propertyId: '',
    blockId: '',
    unitId: '',
  });
  const [error, setError] = useState('');

  const { assignLead, isAssigning } = useAssignLeadToUnit();

  useEffect(() => {
    if (isOpen) {
      setValue({
        propertyId: currentUnit?.property.id || '',
        blockId: currentUnit?.block.id || '',
        unitId: currentUnit?.id || '',
      });
    }
  }, [isOpen, currentUnit]);

  if (!isOpen) return null;

  const handleAssign = async () => {
    if (!value.unitId) return;

    try {
      await assignLead({ unitId: value.unitId, leadId });
      setError('');
      onAssigned?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign lead to unit');
    }
  };

  return (
    <>
      <div aria-hidden="true" className="unit-picker-modal__backdrop" onClick={onClose} />

      <div className="unit-picker-modal__overlay">
        <div className="unit-picker-modal__panel">
          <div className="unit-picker-modal__header">
            <div>
              <h2 className="unit-picker-modal__title">
                {currentUnit ? 'Change Unit' : 'Assign to Unit'}
              </h2>
              <p className="unit-picker-modal__subtitle">
                Select the property, block and unit for this lead
              </p>
            </div>
            <button onClick={onClose} className="unit-picker-modal__close">
              <X className="unit-picker-modal__close-icon" />
            </button>
          </div>

          <div className="unit-picker-modal__content">
            <UnitAssignmentFields value={value} onChange={setValue} currentUnit={currentUnit} />
          </div>

          <div className="unit-picker-modal__footer">
            {error && <p className="unit-picker-modal__error">{error}</p>}
            <Button
              fullWidth
              onClick={handleAssign}
              isLoading={isAssigning}
              disabled={!value.unitId}
            >
              {currentUnit ? 'Change Unit' : 'Assign to Unit'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
