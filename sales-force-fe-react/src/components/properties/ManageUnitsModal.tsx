import { Building2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { UnitListItem } from '@/lib/types';

interface ManageUnitsModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onAddUnit?: () => void;
  onDeleteBlock?: () => void;
  onDeleteUnit?: (unitId: string) => void;
  onManageUnit?: (unitId: string) => void;
  isLoading?: boolean;
  units?: UnitListItem[];
  propertyName?: string;
  blockName?: string;
}

export function ManageUnitsModal({
  isOpen = false,
  onClose,
  onAddUnit,
  onDeleteBlock,
  onDeleteUnit,
  onManageUnit,
  isLoading = false,
  units = [],
  propertyName = '',
  blockName = '',
}: ManageUnitsModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header Section */}
          <div className="p-6 border-b border-border">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-text-primary"> Manage Unit </h2>
                <p className="text-sm font-medium text-text-secondary mt-1">{propertyName}</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Building2 className="w-4 h-4" />}
                onClick={onAddUnit}
              >
                Add Unit
              </Button>
            </div>
          </div>

          {/* Content Section */}
          <div className="overflow-y-auto flex-1 p-6">
            <div className="mb-4">
              <p className="text-xl font-medium text-text-primary">{blockName}</p>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-sm text-text-secondary">Loading units...</div>
              </div>
            ) : units.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-base font-medium text-text-primary mb-2">You don't have any units</p>
                <p className="text-sm text-text-secondary">
                  Please add some data to your units list
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {units.map((unit) => (
                  <div
                    key={unit.id}
                    className="w-full bg-white border border-border rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-text-primary mb-2">
                          {unit.name}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                          {unit.land_area !== undefined && unit.land_area !== null && (
                            <span>Land Area: {typeof unit.land_area === 'string' ? parseFloat(unit.land_area).toFixed(0) : unit.land_area} m²</span>
                          )}
                          <span>Status: {unit.status}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onManageUnit?.(unit.id)}
                        >
                          Manage
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          leftIcon={<Trash2 className="w-4 h-4" />}
                          onClick={() => onDeleteUnit?.(unit.id)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Section */}
          <div className="flex items-center justify-between p-6 border-t border-border">
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={onDeleteBlock}
            >
              Delete Block
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}