import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  UnitAssignmentFields,
  type UnitAssignmentValue,
} from '@/components/leads/UnitAssignmentFields';
import { useAssignLeadToUnit } from '@/hooks/useUnits';

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
      onAssigned?.();
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to assign lead to unit');
    }
  };

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                {currentUnit ? 'Change Unit' : 'Assign to Unit'}
              </h2>
              <p className="text-sm text-text-secondary mt-0.5">
                Select the property, block and unit for this lead
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
            <UnitAssignmentFields
              value={value}
              onChange={setValue}
              currentUnit={currentUnit}
            />
          </div>

          <div className="p-5 border-t border-border">
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
