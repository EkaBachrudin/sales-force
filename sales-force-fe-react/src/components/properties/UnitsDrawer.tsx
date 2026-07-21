import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

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
}

const getStatusVariant = (status: string): 'gray' | 'blue' | 'purple' | 'orange' | 'green' | 'red' => {
  switch (status.toLowerCase()) {
    case 'available': return 'green';
    case 'reserved': return 'orange';
    case 'booked': return 'blue';
    case 'sold': return 'red';
    default: return 'gray';
  }
};

export function UnitsDrawer({ isOpen, onClose, property, units }: UnitsDrawerProps) {
  return (
    <>

      <div
        className={cn(
          'fixed top-0 left-0 h-full w-full md:w-[400px] lg:w-[480px] bg-white shadow-2xl z-50 transition-transform duration-300 ease-out flex flex-col',
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
                  View your {property.name} units list
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {units.map((unit) => (
                <Card key={unit.id} variant="bordered" padding="md" className="mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-text-primary">
                        {unit.name}
                      </h3>
                      
                      {unit.land_area && (
                        <p className="text-xs text-text-secondary mt-0.5">
                          {unit.land_area} m²
                        </p>
                      )}
                      
                      <Badge 
                        variant={getStatusVariant(unit.status)} 
                        size="sm"
                        className="mt-2"
                      >
                        {unit.status}
                      </Badge>
                    </div>
                    
                    <button 
                      className="text-sm font-medium text-primary hover:text-primary-hover transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled
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