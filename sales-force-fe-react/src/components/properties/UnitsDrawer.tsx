import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import './UnitsDrawer.css';

interface Unit {
  id: string;
  block_id: string;
  block_name: string;
  name: string;
  land_area?: number;
  status: string;
}

interface Property {
  id: string;
  name: string;
  siteplan_assets?: string;
}

interface UnitsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  units: Unit[];
  onSeeMore?: (unit: Unit) => void;
}

const getStatusVariant = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'available': return 'units-drawer__status--available';
    case 'reserved': return 'units-drawer__status--reserved';
    case 'booked': return 'units-drawer__status--booked';
    case 'sold': return 'units-drawer__status--sold';
    default: return 'units-drawer__status--unknown';
  }
};

export function UnitsDrawer({ isOpen, onClose, property, units, onSeeMore }: UnitsDrawerProps) {
  return (
    <>
      <div className={cn('units-drawer', !isOpen && 'units-drawer--closed')}>
        <div className="units-drawer__inner">
          <div className="units-drawer__header">
            <div className="units-drawer__header-row">
              <div className="units-drawer__header-info">
                <h2 className="units-drawer__title">{property.name}</h2>
                <p className="units-drawer__subtitle">
                  View your <strong>{property.name}</strong> units list
                </p>
              </div>
              <button onClick={onClose} className="units-drawer__close">
                <div className="units-drawer__close-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M0 2.97515C0 1.33202 1.33202 0 2.97515 0H16.8592C18.5023 0 19.8344 1.33202 19.8344 2.97515V16.8592C19.8344 18.5023 18.5023 19.8344 16.8592 19.8344H2.97515C1.33202 19.8344 0 18.5023 0 16.8592V2.97515ZM6.94203 17.8509H16.8592C17.4069 17.8509 17.8509 17.4069 17.8509 16.8592V2.97515C17.8509 2.42744 17.4069 1.98344 16.8592 1.98344H6.94203V17.8509ZM4.95859 1.98344V17.8509H2.97515C2.42744 17.8509 1.98344 17.4069 1.98344 16.8592V2.97515C1.98344 2.42744 2.42744 1.98344 2.97515 1.98344H4.95859Z" fill="currentColor"/>
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <div className="units-drawer__content">
            <div className="units-drawer__list">
              {units.map((unit) => (
                <Card key={unit.id} variant="bordered" padding="md" className="units-drawer__card">
                  <div className="units-drawer__unit-row">
                    <div className="units-drawer__unit-info">
                      <h3 className="units-drawer__unit-name">{unit.name}</h3>

                      {unit.land_area && (
                        <p className="units-drawer__unit-area">
                          Land Area: {unit.land_area} m²
                        </p>
                      )}

                     Status: <span className={`units-drawer__status ${getStatusVariant(unit.status)}`}><strong>{unit.status}</strong></span>
                    </div>

                    <button
                      onClick={() => onSeeMore?.(unit)}
                      className="units-drawer__see-more"
                    >
                      See more
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
