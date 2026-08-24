
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import './ConversionMetricCard.css';

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
    <div className={cn('conversion-metric-card', className)}>
      <div className="conversion-metric-card__header">
        <p className="conversion-metric-card__label">{label}</p>
        {tooltip && (
          <div className="conversion-metric-card__tooltip">
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setShowTooltip(!showTooltip)}
              className="conversion-metric-card__tooltip-trigger"
              aria-label="Show info"
            >
              <Info className="conversion-metric-card__tooltip-icon" />
            </button>

            {showTooltip && (
              <>
                <div
                  className="conversion-metric-card__tooltip-overlay"
                  onClick={() => setShowTooltip(false)}
                  aria-hidden="true"
                />
                <div
                  ref={tooltipRef}
                  className={cn(
                    'conversion-metric-card__tooltip-content',
                    position === 'left'
                      ? 'conversion-metric-card__tooltip-content--left'
                      : 'conversion-metric-card__tooltip-content--right'
                  )}
                >
                  <h4 className="conversion-metric-card__tooltip-title">{tooltip.title}</h4>
                  <p className="conversion-metric-card__tooltip-description">{tooltip.description}</p>

                  {tooltip.meaning && (
                    <div className="conversion-metric-card__tooltip-section">
                      <p className="conversion-metric-card__tooltip-section-label">Artinya:</p>
                      <p className="conversion-metric-card__tooltip-section-text">{tooltip.meaning}</p>
                    </div>
                  )}

                  {tooltip.benefit && (
                    <div>
                      <p className="conversion-metric-card__tooltip-section-label">Gunanya:</p>
                      <p className="conversion-metric-card__tooltip-section-text">{tooltip.benefit}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="conversion-metric-card__value-row">
        <span className="conversion-metric-card__value">{value}</span>
        {unit && <span className="conversion-metric-card__unit">{unit}</span>}
      </div>

      {trend && (
        <div
          className={cn(
            'conversion-metric-card__trend',
            trend.isPositive ? 'conversion-metric-card__trend--up' : 'conversion-metric-card__trend--down'
          )}
        >
          {trend.isPositive ? (
            <TrendingUp className="conversion-metric-card__trend-icon" />
          ) : (
            <TrendingDown className="conversion-metric-card__trend-icon" />
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
