'use client';

import { Line, LineChart as RechartsLineChart, CartesianGrid, XAxis, YAxis, LabelList } from 'recharts';
import { cn } from '@/lib/utils';

export interface TrendDataPoint {
  month: string;
  value?: number;
  closings?: number;
}

export interface TrendChartProps {
  data: TrendDataPoint[];
  title?: string;
  className?: string;
}

export function TrendChart(
  {
    data,
    title = 'Monthly Closing Trend',
    className,
  }: TrendChartProps) {
  // Transform data to ensure proper format
  const chartData = data.map((item) => ({
    month: item.month,
    closings: item.value ?? item.closings ?? 0,
  }));

  if (chartData.length === 0) {
    return (
      <div className={cn('bg-white rounded-xl border border-[var(--border)] p-6', className)}>
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-6">
          {title}
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">No data available</p>
      </div>
    );
  }

  const totalClosings = chartData.reduce((sum, point) => sum + point.closings, 0);

  return (
    <div className={cn('bg-white rounded-xl border border-[var(--border)] p-6', className)}>
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-6">
        {title}
      </h3>

      <div className="h-64 w-full overflow-x-auto">
        <RechartsLineChart
          width={800}
          height={256}
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value.slice(0, 3)}
            className="text-xs"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toString()}
            className="text-xs"
          />
          <Line
            dataKey="closings"
            type="monotone"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{
              fill: '#3b82f6',
              r: 4,
            }}
          >
            <LabelList dataKey="closings" position="top" className="text-xs" />
          </Line>
        </RechartsLineChart>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-secondary)]">Total Closings</span>
          <span className="text-lg font-semibold text-[var(--text-primary)]">
            {totalClosings}
          </span>
        </div>
      </div>
    </div>
  );
}
