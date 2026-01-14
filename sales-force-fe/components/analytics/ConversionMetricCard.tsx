'use client';

import React from 'react';
import { cn, formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface ConversionMetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: string | number;
    isPositive: boolean;
    label?: string;
  };
  className?: string;
}

export function ConversionMetricCard({
  label,
  value,
  unit,
  trend,
  className,
}: ConversionMetricCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-[var(--border)] p-5',
        className
      )}
    >
      <p className="text-sm text-[var(--text-secondary)] mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-[var(--text-primary)]">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-[var(--text-secondary)]">{unit}</span>
        )}
      </div>

      {trend && (
        <div
          className={cn(
            'flex items-center gap-1 mt-2 text-xs font-medium',
            trend.isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'
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
