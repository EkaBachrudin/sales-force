
import { Cell, Pie, PieChart as RechartsPieChart } from 'recharts';
import { cn } from '@/lib/utils';
import './DoughnutChart.css';

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
    <div className={cn('doughnut-chart', className)}>
      <h3 className="doughnut-chart__title">{title}</h3>

      <div className="doughnut-chart__layout">
        {/* Chart */}
        <div className="doughnut-chart__chart">
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
            <div className="doughnut-chart__center">
              <span className="doughnut-chart__center-text">{centerText}</span>
              {centerSubtext && (
                <span className="doughnut-chart__center-subtext">{centerSubtext}</span>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="doughnut-chart__legend">
          {data.map((segment, index) => {
            const segmentValue = segment.value ?? segment.count ?? 0;
            const percentage = total > 0 ? ((segmentValue / total) * 100).toFixed(1) : '0.0';

            return (
              <div key={index} className="doughnut-chart__legend-item">
                <div className="doughnut-chart__legend-item-label">
                  <div className="doughnut-chart__legend-swatch" style={{ backgroundColor: segment.color }} />
                  <span className="doughnut-chart__legend-label">
                    {segment.label ?? segment.source}
                  </span>
                </div>
                <div className="doughnut-chart__legend-values">
                  <span className="doughnut-chart__legend-value">{segmentValue}</span>
                  <span className="doughnut-chart__legend-percentage">({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
