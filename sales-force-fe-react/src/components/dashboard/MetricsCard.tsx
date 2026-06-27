
import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

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
  iconColor = 'var(--primary)',
  className,
}: MetricsCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-border p-4 sm:p-5 hover:shadow-lg transition-all duration-200',
        className
      )}
    >
      {/* Header: Label + Icon */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-sm sm:text-base font-semibold text-text-secondary uppercase tracking-wide">
          {label}
        </p>

        {/* Icon with subtle background */}
        <div
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${iconColor}12` }}
        >
          <span style={{ color: iconColor }}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </span>
        </div>
      </div>

      {/* Main Value */}
      <div className="mb-3">
        <p className="text-2xl sm:text-3xl font-bold text-text-primary leading-tight">
          {value}
        </p>
      </div>

      {/* Footer: Trend + Secondary Info */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
        {/* Trend Indicator */}
        {trend ? (
          <div
            className={cn(
              'flex items-center gap-1.5 text-sm sm:text-base font-semibold',
              trend.isPositive ? 'text-success' : 'text-danger'
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
            <span>{trend.value}</span>
          </div>
        ) : (
          <div />
        )}

        {/* Secondary Info */}
        {secondaryInfo && (
          <p className="text-xs sm:text-sm text-text-secondary text-right line-clamp-1 max-w-[60%]">
            {secondaryInfo}
          </p>
        )}
      </div>
    </div>
  );
}
