import { Combobox } from '@/components/ui/Combobox';
import { useProperties } from '@/hooks/useProperties';
import { usePropertyDetail } from '@/hooks/usePropertyDetail';
import { useUnits } from '@/hooks/useUnits';

export interface UnitAssignmentValue {
  propertyId: string;
  blockId: string;
  unitId: string;
}

export interface UnitAssignmentFieldsProps {
  value: UnitAssignmentValue;
  onChange: (value: UnitAssignmentValue) => void;
  currentUnit?: {
    id: string;
    name: string;
    status: string;
    block: { id: string; name: string };
    property: { id: string; name: string };
  };
  unavailableStatuses?: string[];
}

const defaultUnavailableStatuses = ['sold', 'booked'];

export function UnitAssignmentFields({
  value,
  onChange,
  currentUnit,
  unavailableStatuses = defaultUnavailableStatuses,
}: UnitAssignmentFieldsProps) {
  const { propertyId, blockId, unitId } = value;

  const { data: properties, isLoading: isLoadingProperties } = useProperties();
  const { data: propertyDetail, isLoading: isLoadingBlocks } = usePropertyDetail(propertyId);
  const { data: unitsData, isLoading: isLoadingUnits } = useUnits(blockId, { limit: 500 });

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

  return (
    <>
      <Combobox
        label="Property"
        options={propertyOptions}
        value={propertyId}
        onChange={(next) => {
          const nextPropertyId = Array.isArray(next) ? next[0] ?? '' : next;
          onChange({ propertyId: nextPropertyId, blockId: '', unitId: '' });
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
        onChange={(next) => {
          const nextBlockId = Array.isArray(next) ? next[0] ?? '' : next;
          onChange({ ...value, blockId: nextBlockId, unitId: '' });
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
        onChange={(next) => {
          const nextUnitId = Array.isArray(next) ? next[0] ?? '' : next;
          onChange({ ...value, unitId: nextUnitId });
        }}
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
    </>
  );
}
