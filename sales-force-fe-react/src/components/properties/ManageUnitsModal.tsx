import { Building2, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { UnitListItem } from '@/lib/types';
import './ManageUnitsModal.css';

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
      <div className="manage-units-modal__backdrop" onClick={onClose} />
      <div className="manage-units-modal__overlay">
        <div className="manage-units-modal__panel">
          {/* Header Section */}
          <div className="manage-units-modal__header">
            <div className="manage-units-modal__header-row">
              <div>
                <h2 className="manage-units-modal__title"> Manage Unit </h2>
                <p className="manage-units-modal__property">{propertyName}</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Building2 className="manage-units-modal__add-icon" />}
                onClick={onAddUnit}
              >
                Add Unit
              </Button>
            </div>
          </div>

          {/* Content Section */}
          <div className="manage-units-modal__content">
            <div className="manage-units-modal__block">
              <p className="manage-units-modal__block-name">{blockName}</p>
            </div>
            {isLoading ? (
              <div className="manage-units-modal__loading">
                <div className="manage-units-modal__loading-text">Loading units...</div>
              </div>
            ) : units.length === 0 ? (
              <div className="manage-units-modal__empty">
                <p className="manage-units-modal__empty-title">You don't have any units</p>
                <p className="manage-units-modal__empty-text">
                  Please add some data to your units list
                </p>
              </div>
            ) : (
              <div className="manage-units-modal__list">
                {units.map((unit) => (
                  <div key={unit.id} className="manage-units-modal__unit">
                    <div className="manage-units-modal__unit-row">
                      <div className="manage-units-modal__unit-info">
                        <h4 className="manage-units-modal__unit-name">{unit.name}</h4>
                        <div className="manage-units-modal__unit-meta">
                          {unit.land_area !== undefined && unit.land_area !== null && (
                            <span>Land Area: {typeof unit.land_area === 'string' ? parseFloat(unit.land_area).toFixed(0) : unit.land_area} m²</span>
                          )}
                          <span>Status: {unit.status}</span>
                        </div>
                      </div>
                      <div className="manage-units-modal__unit-actions">
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Edit2 className="manage-units-modal__unit-action-icon" />}
                          onClick={() => onManageUnit?.(unit.id)}
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          leftIcon={<Trash2 className="manage-units-modal__unit-action-icon" />}
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
          <div className="manage-units-modal__footer">
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="manage-units-modal__delete-icon" />}
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
