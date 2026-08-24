
import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import './MetricsCard.css';

export interface MetricsCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  secondaryInfo?: string;
  iconColor?: string;
  className?: string;
}

export function MetricsCard({
  label,
  value,
  icon: Icon,
  trend,
  secondaryInfo,
  iconColor = 'var(--primary)',  className,
}: MetricsCardProps) {
  return (
    <div className={cn('metrics-card', className)}>
      {/* Header: Label + Icon */}
      <div className="metrics-card__header">
        <p className="metrics-card__label">{label}</p>

        {/* Icon with subtle background */}
        <div
          className="metrics-card__icon"
          style={{ backgroundColor: `color-mix(in srgb, ${iconColor} 12%, transparent)` }}
        >
          <span style={{ color: iconColor }}>
            <Icon className="metrics-card__icon-svg" />
          </span>
        </div>
      </div>

      {/* Main Value */}
      <div className="metrics-card__body">
        <p className="metrics-card__value">{value}</p>
      </div>

      {/* Footer: Trend + Secondary Info */}
      <div className="metrics-card__footer">
        {/* Trend Indicator */}
        {trend ? (
          <div
            className={cn(
              'metrics-card__trend',
              trend.isPositive ? 'metrics-card__trend--up' : 'metrics-card__trend--down'
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="metrics-card__trend-icon" />
            ) : (
              <TrendingDown className="metrics-card__trend-icon" />
            )}
            <span>{trend.value}</span>
          </div>
        ) : (
          <div />
        )}

        {/* Secondary Info */}
        {secondaryInfo && (
          <p className="metrics-card__secondary">{secondaryInfo}</p>
        )}
      </div>
    </div>
  );
}
