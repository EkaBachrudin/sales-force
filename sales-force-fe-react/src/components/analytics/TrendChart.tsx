
import { Line, LineChart as RechartsLineChart, CartesianGrid, XAxis, YAxis, LabelList } from 'recharts';
import { cn } from '@/lib/utils';
import './TrendChart.css';

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
      <div className={cn('trend-chart', className)}>
        <h3 className="trend-chart__title">{title}</h3>
        <p className="trend-chart__empty">No data available</p>
      </div>
    );
  }

  const totalClosings = chartData.reduce((sum, point) => sum + point.closings, 0);

  return (
    <div className={cn('trend-chart', className)}>
      <h3 className="trend-chart__title">{title}</h3>

      <div className="trend-chart__container">
        <RechartsLineChart
          width="100%"
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
            className="trend-chart__axis"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toString()}
            className="trend-chart__axis"
          />
          <Line
            dataKey="closings"
            type="monotone"
            stroke="#3B6FE0"
            strokeWidth={2}
            dot={{
              fill: '#3B6FE0',
              r: 4,
            }}
          >
            <LabelList dataKey="closings" position="top" className="trend-chart__axis" />
          </Line>
        </RechartsLineChart>
      </div>

      {/* Summary */}
      <div className="trend-chart__summary">
        <div className="trend-chart__summary-row">
          <span className="trend-chart__summary-label">Total Closings</span>
          <span className="trend-chart__summary-value">{totalClosings}</span>
        </div>
      </div>
    </div>
  );
}
