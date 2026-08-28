import { cn } from '@/lib/utils';
import { useUnitDetail } from '@/hooks/useUnits';
import { UserPlus, UserMinus, X, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AssignLeadModal } from '@/components/properties/AssignLeadModal';
import { UnassignLeadModal } from '@/components/properties/UnassignLeadModal';
import './UnitDetailDrawer.css';

const leadStatusVariantMap: Record<string, 'gray' | 'blue' | 'purple' | 'orange' | 'green' | 'red'> = {
  new: 'gray',
  contacted: 'blue',
  surveyed: 'purple',
  negotiating: 'orange',
  booked: 'orange',
  closed: 'green',
  cancelled: 'red',
};

const getStatusVariant = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'available': return 'unit-detail-drawer__status--available';
    case 'reserved': return 'unit-detail-drawer__status--reserved';
    case 'booked': return 'unit-detail-drawer__status--booked';
    case 'sold': return 'unit-detail-drawer__status--sold';
    default: return 'unit-detail-drawer__status--unknown';
  }
};

interface UnitDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  unitName?: string;
  unitId?: string;
}

export function UnitDetailDrawer({ isOpen, onClose, unitName, unitId }: UnitDetailDrawerProps) {
  const { data, isLoading } = useUnitDetail(unitId || '');
  const { user: currentUser } = useAuth();
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [leadToUnassign, setLeadToUnassign] = useState<{ id: string; name: string } | null>(null);
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      closeButtonRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const unit = data?.data?.unit;
  const leads = data?.data?.leads ?? [];
  const unitSubtitle = [unit?.block_name, unit?.property_name]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <div
        aria-hidden="true"
        className={cn('unit-detail-drawer__backdrop', !isOpen && 'unit-detail-drawer__backdrop--closed')}
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={cn('unit-detail-drawer', !isOpen && 'unit-detail-drawer--closed')}
      >
        <div className="unit-detail-drawer__header">
          <div className="unit-detail-drawer__header-info">
            <h2 className="unit-detail-drawer__title">
              Unit {unitName || (unit?.name ?? 'Unit Detail')}
            </h2>
            <p className="unit-detail-drawer__subtitle">
              {unitSubtitle || 'View your units detail'}
            </p>
          </div>
          <button ref={closeButtonRef} onClick={onClose} className="unit-detail-drawer__close">
            <X className="unit-detail-drawer__close-icon" />
          </button>
        </div>

        <div className="unit-detail-drawer__content">
          {isLoading ? (
            <div className="unit-detail-drawer__loading">
              <div className="unit-detail-drawer__spinner"></div>
            </div>
          ) : unit ? (
            <div className="unit-detail-drawer__body">
              <Card variant="bordered" padding="md">
                <div className="unit-detail-drawer__info">
                  <div>
                    <p className="unit-detail-drawer__field-label">Status</p>
                    <p className={`unit-detail-drawer__status ${getStatusVariant(unit.status)}`}>{unit.status}</p>
                  </div>
                  {unit.land_area && (
                    <div>
                      <p className="unit-detail-drawer__field-label">Land Area</p>
                      <p className="unit-detail-drawer__field-value">{unit.land_area} m²</p>
                    </div>
                  )}
                  {unit.block_name && (
                    <div>
                      <p className="unit-detail-drawer__field-label">Block</p>
                      <p className="unit-detail-drawer__field-value">{unit.block_name}</p>
                    </div>
                  )}
                  {unit.property_name && (
                    <div>
                      <p className="unit-detail-drawer__field-label">Property</p>
                      <p className="unit-detail-drawer__field-value">{unit.property_name}</p>
                    </div>
                  )}
                </div>
              </Card>

              <Button
                fullWidth
                leftIcon={<UserPlus className="unit-detail-drawer__assign-icon" />}
                onClick={() => setIsAssignOpen(true)}
                disabled={unit.status.toLowerCase() === 'sold' || unit.status.toLowerCase() === 'booked'}
              >
                Assign Lead
              </Button>

              <Card variant="bordered" padding="md">
                <h3 className="unit-detail-drawer__leads-title">
                  Manage your interested leads
                </h3>
                {leads.length === 0 ? (
                  <p className="unit-detail-drawer__empty">No leads assigned yet</p>
                ) : (
                  <div className="unit-detail-drawer__leads">
                    {leads.map((lead) => (
                      <div key={lead.id} className="unit-detail-drawer__lead">
                        <button
                          type="button"
                          aria-label={`Unassign ${lead.name}`}
                          title="Unassign lead"
                          onClick={() => setLeadToUnassign({ id: lead.id, name: lead.name })}
                          className={cn(
                            'unit-detail-drawer__unassign',
                            !(currentUser && lead.assigned_to === currentUser.id) && 'unit-detail-drawer__unassign--hidden'
                          )}
                        >
                          <UserMinus className="unit-detail-drawer__unassign-icon" />
                        </button>
                        <div className="unit-detail-drawer__lead-info">
                          <p className="unit-detail-drawer__lead-name">{lead.name}</p>
                          <p className="unit-detail-drawer__lead-contact">{lead.email || lead.phone}</p>
                        </div>
                        <Badge variant={leadStatusVariantMap[lead.status] || 'gray'} size="lg">
                          <span className="unit-detail-drawer__lead-status">{lead.status}</span>
                        </Badge>
                        <ChevronRight
                          className="unit-detail-drawer__lead-chevron"
                          onClick={() => navigate(`/leads/${lead.id}`)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <div className="unit-detail-drawer__unavailable">
              <p className="unit-detail-drawer__unavailable-text">Unit data not available</p>
            </div>
          )}
        </div>
      </div>

      <AssignLeadModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        unitId={unitId}
        unitName={unitName || unit?.name}
        propertyName={unit?.property_name}
      />

      <UnassignLeadModal
        isOpen={!!leadToUnassign}
        onClose={() => setLeadToUnassign(null)}
        unitId={unitId}
        unitName={unitName || unit?.name}
        lead={leadToUnassign}
      />
    </>
  );
}
