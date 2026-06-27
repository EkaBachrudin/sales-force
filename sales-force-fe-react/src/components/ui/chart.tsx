
import * as React from 'react';
import { cn } from '@/lib/utils';

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
      <div
        ref={ref}
        className={cn('w-full h-full', className)}
        style={cssVars}
        {...props}
      >
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
    <div className="rounded-lg border bg-background p-2 shadow-md">
      <div className="grid gap-2">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium">{entry.name}:</span>
            <span className="font-semibold">{entry.value}</span>
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
    <div className="rounded-lg border bg-popover text-popover-foreground shadow-sm">
      {!hideLabel && (
        <div className="border-b px-3 py-2">
          <p className="text-sm font-medium">{label}</p>
        </div>
      )}
      <div className="space-y-1 px-3 py-2">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2">
              {!hideIndicator && (
                <div
                  className={cn(
                    'shrink-0 rounded-[1px]',
                    indicator === 'dot' && 'h-2 w-2 rounded-full',
                    indicator === 'line' && 'h-1 w-8',
                    indicator === 'dashed' && 'h-1 w-8 border-dashed border-b-2'
                  )}
                  style={{ backgroundColor: entry.color }}
                />
              )}
              <span className="text-muted-foreground">
                {nameKey ? entry.payload[nameKey] : entry.name}
              </span>
            </div>
            <span className="font-semibold tabular-nums">{entry.value}</span>
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
    <div className="flex items-center justify-center gap-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-1 text-sm">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
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
    <div className="flex items-center justify-center gap-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-1 text-sm">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
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
