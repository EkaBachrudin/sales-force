'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TrendDataPoint {
  month: string;
  value?: number;
  closings?: number;
}

export interface TrendChartProps {
  data: TrendDataPoint[];
  title?: string;
  color?: string;
  className?: string;
}

export function TrendChart({
  data,
  title = 'Monthly Closing Trend',
  color = '#2563EB',
  className,
}: TrendChartProps) {
  const getValue = (d: TrendDataPoint) => d.value ?? d.closings ?? 0;
  const maxValue = Math.max(...data.map((d) => getValue(d)));
  const minValue = Math.min(...data.map((d) => getValue(d)));
  const range = maxValue - minValue || 1;

  // Calculate points for the SVG path
  const width = 100;
  const height = 100;
  const padding = 5;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * (width - 2 * padding) + padding;
    const normalizedValue = (getValue(point) - minValue) / range;
    const y = height - padding - normalizedValue * (height - 2 * padding);
    return { x, y, value: getValue(point), month: point.month };
  });

  // Create SVG path string
  const pathD = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      return `L ${point.x} ${point.y}`;
    })
    .join(' ');

  return (
    <div className={cn('bg-white rounded-xl border border-[var(--border)] p-6', className)}>
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-6">
        {title}
      </h3>

      <div className="relative">
        {/* SVG Chart */}
        <svg viewBox="0 0 100 100" className="w-full h-64 overflow-visible">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent) => (
            <line
              key={percent}
              x1="0"
              y1={percent}
              x2="100"
              y2={percent}
              stroke="#E5E7EB"
              strokeWidth="0.5"
              strokeDasharray="2"
            />
          ))}

          {/* Area under the line */}
          <path
            d={`${pathD} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`}
            fill={color}
            fillOpacity="0.1"
          />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="2.5"
                fill={color}
                className="hover:r-3 transition-all cursor-pointer"
              />
              {/* Tooltip on hover would be implemented here */}
            </g>
          ))}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2">
          {data.map((point, index) => (
            <span
              key={index}
              className="text-xs text-[var(--text-secondary)]"
            >
              {point.month}
            </span>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-secondary)]">Total Closings</span>
          <span className="text-lg font-semibold text-[var(--text-primary)]">
            {data.reduce((sum, point) => sum + getValue(point), 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
