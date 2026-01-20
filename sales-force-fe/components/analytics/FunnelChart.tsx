'use client';

import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Cell, LabelList } from 'recharts';
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
  // Transform data for Recharts - include color as a separate property
  const chartData = data.map((item) => ({
    stage: item.label,
    count: item.count,
    color: item.color,
  }));

  return (
    <div className={cn('bg-white rounded-xl border border-[var(--border)] p-6', className)}>
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-6">
        Lead Funnel
      </h3>

      <div className="h-64 w-full">
        <RechartsBarChart
          width="100%"
          height={256}
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 60, left: 0, bottom: 0 }}
        >
          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            type="number"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            className="text-xs"
          />
          <YAxis
            type="category"
            dataKey="stage"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            className="text-xs"
            width={100}
          />
          <Bar dataKey="count">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList dataKey="count" position="right" className="text-sm font-medium" />
          </Bar>
        </RechartsBarChart>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-[var(--border)]">
        {data.map((stage, index) => {
          const totalPercentage = total ? ((stage.count / total) * 100).toFixed(1) : null;

          return (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              <span className="text-xs text-[var(--text-secondary)]">
                {stage.label}
                {totalPercentage && ` (${totalPercentage}%)`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
