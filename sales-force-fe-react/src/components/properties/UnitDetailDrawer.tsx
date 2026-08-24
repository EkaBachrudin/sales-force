import { cn } from '@/lib/utils';
import { useUnitDetail } from '@/hooks/useUnits';
import { UserPlus, UserMinus, X, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AssignLeadModal } from '@/components/properties/AssignLeadModal';
import { UnassignLeadModal } from '@/components/properties/UnassignLeadModal';

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
    case 'available': return 'text-[var(--status-available)]';
    case 'reserved': return 'text-[var(--status-reserved)]';
    case 'booked': return 'text-[var(--status-booked)]';
    case 'sold': return 'text-[var(--status-sold)]';
    default: return 'text-gray-500';
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
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 z-40',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed top-0 left-0 h-full w-full md:w-[350px] lg:w-[450px] bg-white shadow-2xl z-50 transition-transform duration-300 ease-out flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-text-primary">
              Unit {unitName || (unit?.name ?? 'Unit Detail')}
            </h2>
            <p className="text-sm text-text-secondary mt-0.5">
              {unitSubtitle || 'View your units detail'}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : unit ? (
            <div className="space-y-4">
              <Card variant="bordered" padding="md">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-text-secondary">Status</p>
                    <p className={`${getStatusVariant(unit.status)} text-sm font-semibold`}>{unit.status}</p>
                  </div>
                  {unit.land_area && (
                    <div>
                      <p className="text-xs text-text-secondary">Land Area</p>
                      <p className="text-sm font-medium text-text-primary">{unit.land_area} m²</p>
                    </div>
                  )}
                  {unit.block_name && (
                    <div>
                      <p className="text-xs text-text-secondary">Block</p>
                      <p className="text-sm font-medium text-text-primary">{unit.block_name}</p>
                    </div>
                  )}
                  {unit.property_name && (
                    <div>
                      <p className="text-xs text-text-secondary">Property</p>
                      <p className="text-sm font-medium text-text-primary">{unit.property_name}</p>
                    </div>
                  )}
                </div>
              </Card>

              <Button
                fullWidth
                leftIcon={<UserPlus className="w-4 h-4" />}
                onClick={() => setIsAssignOpen(true)}
                disabled={unit.status.toLowerCase() === 'sold' || unit.status.toLowerCase() === 'booked'}
              >
                Assign Lead
              </Button>

              <Card variant="bordered" padding="md">
                <h3 className="text-sm font-semibold text-text-primary mb-3">
                  Manage your interested leads
                </h3>
                {leads.length === 0 ? (
                  <p className="text-sm text-text-secondary">No leads assigned yet</p>
                ) : (
                  <div className="space-y-1">
                    {leads.map((lead) => (
                      <div
                        key={lead.id}
                        className="w-full flex items-center gap-2 rounded-lg px-2 py-2 -mx-2 hover:bg-gray-50 transition-colors"
                      >
                        <button
                          type="button"
                          aria-label={`Unassign ${lead.name}`}
                          title="Unassign lead"
                          onClick={() => setLeadToUnassign({ id: lead.id, name: lead.name })}
                          className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          className="flex-1 min-w-0 flex items-center gap-3 text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{lead.name}</p>
                            <p className="text-xs text-text-secondary truncate">{lead.email || lead.phone}</p>
                          </div>
                          <Badge variant={leadStatusVariantMap[lead.status] || 'gray'} size="lg">
                            <span className='font-bold'>{lead.status}</span>
                          </Badge>
                          <ChevronRight className="w-6 h-6 text-gray-400 flex-shrink-0" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-text-secondary">Unit data not available</p>
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
