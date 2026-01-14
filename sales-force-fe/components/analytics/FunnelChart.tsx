'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface FunnelStage {
  label: string;
  count: number;
  color: string;
}

export interface FunnelChartProps {
  data: FunnelStage[];
  total?: number;
  className?: string;
}

export function FunnelChart({ data, total, className }: FunnelChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className={cn('bg-white rounded-xl border border-[var(--border)] p-6', className)}>
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-6">
        Lead Funnel
      </h3>

      <div className="space-y-4">
        {data.map((stage, index) => {
          const percentage = ((stage.count / maxCount) * 100).toFixed(0);
          const totalPercentage = total ? ((stage.count / total) * 100).toFixed(1) : null;

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[var(--text-primary)]">{stage.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--text-primary)]">{stage.count}</span>
                  {totalPercentage && (
                    <span className="text-xs text-[var(--text-secondary)]">
                      ({totalPercentage}%)
                    </span>
                  )}
                </div>
              </div>

              <div className="h-8 rounded-lg relative overflow-hidden" style={{ backgroundColor: `${stage.color}15` }}>
                <div
                  className="h-full absolute left-0 top-0 transition-all duration-500 rounded-lg"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: stage.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-[var(--border)]">
        {data.map((stage, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: stage.color }}
            />
            <span className="text-xs text-[var(--text-secondary)]">{stage.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
