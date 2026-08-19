import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { useProperties } from '@/hooks/useProperties';
import { usePropertyDetail } from '@/hooks/usePropertyDetail';
import { useUnits, useAssignLeadToUnit } from '@/hooks/useUnits';

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

const unavailableStatuses = ['sold', 'booked'];

export function UnitPickerModal({
  isOpen,
  onClose,
  leadId,
  currentUnit,
  onAssigned,
}: UnitPickerModalProps) {
  const [propertyId, setPropertyId] = useState('');
  const [blockId, setBlockId] = useState('');
  const [unitId, setUnitId] = useState('');

  const { data: properties, isLoading: isLoadingProperties } = useProperties();
  const { data: propertyDetail, isLoading: isLoadingBlocks } = usePropertyDetail(propertyId);
  const { data: unitsData, isLoading: isLoadingUnits } = useUnits(blockId, { limit: 500 });
  const { assignLead, isAssigning } = useAssignLeadToUnit();

  useEffect(() => {
    if (isOpen) {
      setPropertyId(currentUnit?.property.id || '');
      setBlockId(currentUnit?.block.id || '');
      setUnitId(currentUnit?.id || '');
    }
  }, [isOpen, currentUnit]);

  if (!isOpen) return null;

  const propertyOptions = (properties ?? []).map((p) => ({ value: p.id, label: p.name }));

  const blocks = propertyDetail?.blocks ?? [];
  const blockOptions = blocks.map((b) => ({ value: b.id, label: b.name }));

  const units = unitsData?.data?.units ?? [];
  const unitOptions = units.map((u) => ({
    value: u.id,
    label: `${u.name} · ${u.status}`,
    disabled: unavailableStatuses.includes(u.status.toLowerCase()),
  }));

  if (
    currentUnit &&
    unitId === currentUnit.id &&
    !units.some((u) => u.id === currentUnit.id)
  ) {
    unitOptions.splice(0, 0, {
      value: currentUnit.id,
      label: `${currentUnit.name} · ${currentUnit.status}`,
      disabled: unavailableStatuses.includes(currentUnit.status.toLowerCase()),
    });
  }

  const handleAssign = async () => {
    if (!unitId) return;

    try {
      await assignLead({ unitId, leadId });
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
            <Combobox
              label="Property"
              options={propertyOptions}
              value={propertyId}
              onChange={(value) => {
                setPropertyId(Array.isArray(value) ? value[0] ?? '' : value);
                setBlockId('');
                setUnitId('');
              }}
              placeholder="Select Property"
              searchPlaceholder="Search property..."
              disabled={isLoadingProperties}
              isLoading={isLoadingProperties}
            />

            <Combobox
              label="Block"
              options={blockOptions}
              value={blockId}
              onChange={(value) => {
                setBlockId(Array.isArray(value) ? value[0] ?? '' : value);
                setUnitId('');
              }}
              placeholder="Select Block"
              searchPlaceholder="Search block..."
              disabled={!propertyId || isLoadingBlocks}
              isLoading={isLoadingBlocks}
              helperText={
                !propertyId
                  ? 'Select a property first'
                  : isLoadingBlocks
                  ? 'Loading blocks...'
                  : undefined
              }
            />

            <Combobox
              label="Unit"
              options={unitOptions}
              value={unitId}
              onChange={(value) => setUnitId(Array.isArray(value) ? value[0] ?? '' : value)}
              placeholder="Select Unit"
              searchPlaceholder="Search unit..."
              disabled={!blockId || isLoadingUnits}
              isLoading={isLoadingUnits}
              helperText={
                !blockId
                  ? 'Select a block first'
                  : isLoadingUnits
                  ? 'Loading units...'
                  : 'Units marked sold/booked cannot be selected'
              }
            />
          </div>

          <div className="p-5 border-t border-border">
            <Button
              fullWidth
              onClick={handleAssign}
              isLoading={isAssigning}
              disabled={!unitId}
            >
              {currentUnit ? 'Change Unit' : 'Assign to Unit'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
