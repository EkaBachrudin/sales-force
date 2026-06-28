
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';

export interface ConversionMetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: string | number;
    isPositive: boolean;
    label?: string;
  };
  tooltip?: {
    title: string;
    description: string;
    meaning?: string;
    benefit?: string;
  };
  className?: string;
}

export function ConversionMetricCard({
  label,
  value,
  unit,
  trend,
  tooltip,
  className,
}: ConversionMetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState<'left' | 'right'>('left');
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (showTooltip && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const tooltipWidth = 288; // w-72 = 18rem = 288px

      // Check if tooltip would go off screen on the left
      if (buttonRect.left < tooltipWidth + 16) {
        setPosition('left');
      } else {
        setPosition('right');
      }
    }
  }, [showTooltip]);

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-border p-5 relative',
        className
      )}
    >
      <div className="flex items-center gap-1 mb-1">
        <p className="text-sm text-text-secondary">{label}</p>
        {tooltip && (
          <div className="relative">
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setShowTooltip(!showTooltip)}
              className="text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Show info"
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            {showTooltip && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowTooltip(false)}
                  aria-hidden="true"
                />
                <div
                  ref={tooltipRef}
                  className={cn(
                    'absolute top-6 z-50 w-72 max-w-[calc(100vw-2rem)] bg-gray-900 text-white rounded-lg p-4 shadow-xl',
                    position === 'left' ? 'left-0' : 'right-0'
                  )}
                >
                  <h4 className="font-semibold text-sm mb-2">{tooltip.title}</h4>
                  <p className="text-xs text-gray-300 mb-3">{tooltip.description}</p>

                  {tooltip.meaning && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-gray-400 mb-1">Artinya:</p>
                      <p className="text-xs text-gray-300">{tooltip.meaning}</p>
                    </div>
                  )}

                  {tooltip.benefit && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-1">Gunanya:</p>
                      <p className="text-xs text-gray-300">{tooltip.benefit}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-text-primary">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-text-secondary">{unit}</span>
        )}
      </div>

      {trend && (
        <div
          className={cn(
            'flex items-center gap-1 mt-2 text-xs font-medium',
            trend.isPositive ? 'text-success' : 'text-danger'
          )}
        >
          {trend.isPositive ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
          <span>
            {trend.isPositive ? '+' : ''}
            {trend.value}
            {trend.label && ` ${trend.label}`}
          </span>
        </div>
      )}
    </div>
  );
}
