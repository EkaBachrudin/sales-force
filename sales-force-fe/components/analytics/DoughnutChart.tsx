'use client';

import { Cell, Pie, PieChart as RechartsPieChart } from 'recharts';
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

  // Transform data for Recharts
  const chartData = data.map((segment, index) => ({
    name: segment.label ?? segment.source ?? `source-${index}`,
    value: segment.value ?? segment.count ?? 0,
    color: segment.color,
  }));

  return (
    <div className={cn('bg-white rounded-xl border border-border p-6', className)}>
      <h3 className="text-base font-semibold text-text-primary mb-6">
        {title}
      </h3>

      <div className="block sm:flex items-center gap-8">
        {/* Chart */}
        <div className="relative flex-shrink-0 w-48 h-48">
          <RechartsPieChart width={192} height={192} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              cornerRadius={4}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </RechartsPieChart>

          {/* Center text - absolutely positioned */}
          {centerText && (
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <span className="text-xl font-bold text-text-primary">
                {centerText}
              </span>
              {centerSubtext && (
                <span className="text-xs text-text-secondary">
                  {centerSubtext}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {data.map((segment, index) => {
            const segmentValue = segment.value ?? segment.count ?? 0;
            const percentage = total > 0 ? ((segmentValue / total) * 100).toFixed(1) : '0.0';

            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-sm text-text-primary">
                    {segment.label ?? segment.source}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-text-primary">
                    {segmentValue}
                  </span>
                  <span className="text-xs text-text-secondary ml-1">
                    ({percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
