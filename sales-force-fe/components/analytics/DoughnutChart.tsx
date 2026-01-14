'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface DoughnutSegment {
  label?: string;
  source?: string;
  value?: number;
  count?: number;
  color: string;
}

export interface DoughnutChartProps {
  data: DoughnutSegment[];
  title?: string;
  centerText?: string;
  centerSubtext?: string;
  className?: string;
}

export function DoughnutChart({
  data,
  title = 'Source Breakdown',
  centerText,
  centerSubtext,
  className,
}: DoughnutChartProps) {
  const total = data.reduce((sum, segment) => sum + (segment.value ?? segment.count ?? 0), 0);

  // Calculate SVG segments
  let currentAngle = 0;
  const segments = data.map((segment) => {
    const segmentValue = segment.value ?? segment.count ?? 0;
    const percentage = segmentValue / total;
    const angle = percentage * 360;

    // Convert to radians and calculate coordinates
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    const startX = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
    const startY = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
    const endX = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
    const endY = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = `
      M 50 50
      L ${startX} ${startY}
      A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY}
      Z
    `;

    currentAngle += angle;

    return {
      ...segment,
      pathData,
      percentage: (percentage * 100).toFixed(1),
    };
  });

  return (
    <div className={cn('bg-white rounded-xl border border-[var(--border)] p-6', className)}>
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-6">
        {title}
      </h3>

      <div className="flex items-center gap-8">
        {/* Chart */}
        <div className="relative flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-48 h-48">
            {segments.map((segment, index) => (
              <path
                key={index}
                d={segment.pathData}
                fill={segment.color}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            ))}
            {/* Center cutout */}
            <circle cx="50" cy="50" r="25" fill="white" />
          </svg>

          {/* Center text */}
          {centerText && (
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-xl font-bold text-[var(--text-primary)]">
                {centerText}
              </span>
              {centerSubtext && (
                <span className="text-xs text-[var(--text-secondary)]">
                  {centerSubtext}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-sm text-[var(--text-primary)]">
                  {segment.label ?? segment.source}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {segment.value ?? segment.count}
                </span>
                <span className="text-xs text-[var(--text-secondary)] ml-1">
                  ({segment.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
