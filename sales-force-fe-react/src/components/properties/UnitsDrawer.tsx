import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';

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
    case 'available': return 'text-[#168600]';
    case 'reserved': return 'text-[#007886]';
    case 'booked': return 'text-[#860000]';
    case 'sold': return 'text-[#DE0000]';
    default: return 'text-gray-500';
  }
};

export function UnitsDrawer({ isOpen, onClose, property, units, onSeeMore }: UnitsDrawerProps) {
  return (
    <>

      <div
        className={cn(
          'fixed top-0 left-0 h-full w-full md:w-[300px] lg:w-[400px] bg-white shadow-2xl z-50 transition-transform duration-300 ease-out flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-text-primary">
                  {property.name}
                </h2>
                <p className="text-sm text-text-secondary mt-0.5">
                  View your <strong>{property.name}</strong> units list
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-5 h-5 text-gray-600">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M0 2.97515C0 1.33202 1.33202 0 2.97515 0H16.8592C18.5023 0 19.8344 1.33202 19.8344 2.97515V16.8592C19.8344 18.5023 18.5023 19.8344 16.8592 19.8344H2.97515C1.33202 19.8344 0 18.5023 0 16.8592V2.97515ZM6.94203 17.8509H16.8592C17.4069 17.8509 17.8509 17.4069 17.8509 16.8592V2.97515C17.8509 2.42744 17.4069 1.98344 16.8592 1.98344H6.94203V17.8509ZM4.95859 1.98344V17.8509H2.97515C2.42744 17.8509 1.98344 17.4069 1.98344 16.8592V2.97515C1.98344 2.42744 2.42744 1.98344 2.97515 1.98344H4.95859Z" fill="black"/>
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {units.map((unit) => (
                <Card key={unit.id} variant="bordered" padding="md" className="mb-3 shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-text-primary">
                        {unit.name}
                      </h3>
                      
                      {unit.land_area && (
                        <p className="text-xs mt-0.5 mb-1">
                          Land Area: {unit.land_area} m²
                        </p>
                      )}

                     Status: <span className={`${getStatusVariant(unit.status)}`}><strong>{unit.status}</strong></span>
                      
                    </div>
                    
                    <button
                      onClick={() => onSeeMore?.(unit)}
                      className="text-sm font-medium text-white hover:font-bold transition-colors px-3 py-1.5 rounded-lg hover:bg-[#043398] bg-[#2563EB] cursor-pointer"
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