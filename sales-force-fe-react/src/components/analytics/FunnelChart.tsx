
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Cell, LabelList } from 'recharts';
import { cn } from '@/lib/utils';
import './FunnelChart.css';

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
    <div className={cn('funnel-chart', className)}>
      <h3 className="funnel-chart__title">Lead Funnel</h3>

      <div className="funnel-chart__container">
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
            className="funnel-chart__axis"
          />
          <YAxis
            type="category"
            dataKey="stage"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            className="funnel-chart__axis"
            width={100}
          />
          <Bar dataKey="count">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList dataKey="count" position="right" className="funnel-chart__bar-label" />
          </Bar>
        </RechartsBarChart>
      </div>

      {/* Legend */}
      <div className="funnel-chart__legend">
        {data.map((stage, index) => {
          const totalPercentage = total ? ((stage.count / total) * 100).toFixed(1) : null;

          return (
            <div key={index} className="funnel-chart__legend-item">
              <div className="funnel-chart__legend-swatch" style={{ backgroundColor: stage.color }} />
              <span className="funnel-chart__legend-label">
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
