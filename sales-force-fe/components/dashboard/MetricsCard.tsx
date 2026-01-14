'use client';

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
        'bg-white rounded-xl border border-[var(--border)] p-3 sm:p-4 md:p-5 hover:shadow-md transition-shadow duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Icon Container */}
        <div
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <span style={{ color: iconColor }}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </span>
        </div>

        {/* Trend Indicator */}
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium flex-shrink-0',
              trend.isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            ) : (
              <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            )}
            <span className="hidden xs:inline">{trend.value}</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mt-3 sm:mt-4">
        <p className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
          {value}
        </p>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          {label}
        </p>
      </div>

      {/* Secondary Info */}
      {secondaryInfo && (
        <p className="text-xs text-[var(--text-secondary)] mt-2 line-clamp-1">
          {secondaryInfo}
        </p>
      )}
    </div>
  );
}
