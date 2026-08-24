
import * as React from 'react';
import { cn } from '@/lib/utils';
import './chart.css';

// ============= CHART CONFIG =============

export interface ChartConfig {
  [key: string]: {
    label?: string;
    icon?: React.ComponentType;
    color?: string;
    theme?: {
      light?: string;
      dark?: string;
    };
  };
}

// ============= CHART CONTAINER =============
// Simplified container without ResponsiveContainer

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
  children: React.ReactNode;
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ config, className, children, ...props }, ref) => {
    // Inject CSS variables from config
    const cssVars = React.useMemo(() => {
      const vars: Record<string, string> = {};
      Object.entries(config).forEach(([key, value]) => {
        if (value.color) {
          vars[`--color-${key}`] = value.color;
        } else if (value.theme?.light) {
          vars[`--color-${key}`] = value.theme.light;
        }
      });
      return vars;
    }, [config]);

    return (
      <div ref={ref} className={cn('chart', className)} style={cssVars} {...props}>
        {children}
      </div>
    );
  }
);
ChartContainer.displayName = 'ChartContainer';

// ============= CHART TOOLTIP =============

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  content?: React.ReactNode;
}

const ChartTooltip = ({ active, payload, content }: ChartTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  if (content) {
    return <>{content}</>;
  }

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__grid">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="chart-tooltip__item">
            <div className="chart-tooltip__swatch" style={{ backgroundColor: entry.color }} />
            <span className="chart-tooltip__name">{entry.name}:</span>
            <span className="chart-tooltip__value">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  labelKey?: string;
  nameKey?: string;
  indicator?: 'dot' | 'line' | 'dashed';
  hideLabel?: boolean;
  hideIndicator?: boolean;
}

const ChartTooltipContent = ({
  active,
  payload,
  label,
  nameKey,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
}: ChartTooltipContentProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="chart-tooltip-content">
      {!hideLabel && (
        <div className="chart-tooltip-content__header">
          <p className="chart-tooltip-content__label">{label}</p>
        </div>
      )}
      <div className="chart-tooltip-content__body">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="chart-tooltip-content__item">
            <div className="chart-tooltip-content__item-label">
              {!hideIndicator && (
                <div
                  className={cn('chart-tooltip-content__indicator', `chart-tooltip-content__indicator--${indicator}`)}
                  style={{ backgroundColor: entry.color }}
                />
              )}
              <span className="chart-tooltip-content__name">
                {nameKey ? entry.payload[nameKey] : entry.name}
              </span>
            </div>
            <span className="chart-tooltip-content__value">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============= CHART LEGEND =============

interface ChartLegendProps {
  payload?: any[];
  content?: React.ReactNode;
}

const ChartLegend = ({ payload, content }: ChartLegendProps) => {
  if (!payload?.length) {
    return null;
  }

  if (content) {
    return <>{content}</>;
  }

  return (
    <div className="chart-legend">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="chart-legend__item">
          <div className="chart-legend__swatch" style={{ backgroundColor: entry.color }} />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

interface ChartLegendContentProps {
  payload?: any[];
  nameKey?: string;
}

const ChartLegendContent = ({ payload, nameKey }: ChartLegendContentProps) => {
  if (!payload?.length) {
    return null;
  }

  return (
    <div className="chart-legend-content">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="chart-legend-content__item">
          <div className="chart-legend-content__swatch" style={{ backgroundColor: entry.color }} />
          <span>{nameKey ? entry.payload[nameKey] : entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
};
