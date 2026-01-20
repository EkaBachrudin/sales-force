import { pool } from '../config/database';
import { AppError } from '../utils/AppError';
import {
  AnalyticsPeriod,
  AnalyticsCompareWith,
  MetricTrend,
  FunnelStage,
  TrendDataPoint,
  SourceBreakdown,
  AnalyticsMetricsResponse,
  AnalyticsFunnelResponse,
  AnalyticsTrendResponse,
  AnalyticsSourcesResponse,
  AnalyticsDashboardResponse,
  CrmLeadStatus,
} from '../types';

// Color constants for funnel stages
const FUNNEL_COLORS: Record<string, string> = {
  new: '#9CA3AF',
  contacted: '#3B82F6',
  surveyed: '#8B5CF6',
  negotiating: '#F59E0B',
  closed: '#10B981',
  cancelled: '#EF4444',
};

// Color constants for sources
const SOURCE_COLORS: Record<string, string> = {
  Website: '#2563EB',
  Instagram: '#EC4899',
  Facebook: '#3B82F6',
  WhatsApp: '#10B981',
  Referral: '#F59E0B',
  landing_page: '#2563EB',
  whatsapp: '#10B981',
  manual: '#F59E0B',
  visit: '#8B5CF6',
  Other: '#6B7280',
};

// Label constants for funnel stages
const FUNNEL_LABELS: Record<string, string> = {
  new: 'Baru Masuk',
  contacted: 'Dikontak',
  surveyed: 'Survey',
  negotiating: 'Negosiasi',
  closed: 'Closing',
  cancelled: 'Batal',
};

/**
 * Get date range based on period and comparison
 */
function getDateRange(period: AnalyticsPeriod, compareWith?: AnalyticsCompareWith): { current: Date; previous?: Date } {
  const now = new Date();
  let currentStart: Date;
  let previousStart: Date | undefined;

  switch (period) {
    case 'today':
      currentStart = new Date();
      currentStart.setHours(0, 0, 0, 0);
      if (compareWith === 'previous_period') {
        previousStart = new Date(currentStart);
        previousStart.setDate(previousStart.getDate() - 1);
      } else if (compareWith === 'last_year') {
        previousStart = new Date(currentStart);
        previousStart.setFullYear(previousStart.getFullYear() - 1);
      }
      break;
    case 'week':
      currentStart = new Date(now);
      currentStart.setDate(now.getDate() - now.getDay());
      currentStart.setHours(0, 0, 0, 0);
      if (compareWith === 'previous_period') {
        previousStart = new Date(currentStart);
        previousStart.setDate(previousStart.getDate() - 7);
      } else if (compareWith === 'last_year') {
        previousStart = new Date(currentStart);
        previousStart.setFullYear(previousStart.getFullYear() - 1);
      }
      break;
    case 'month':
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      if (compareWith === 'previous_period') {
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      } else if (compareWith === 'last_year') {
        previousStart = new Date(currentStart);
        previousStart.setFullYear(previousStart.getFullYear() - 1);
      }
      break;
    case 'year':
      currentStart = new Date(now.getFullYear(), 0, 1);
      if (compareWith === 'previous_period') {
        previousStart = new Date(now.getFullYear() - 1, 0, 1);
      } else if (compareWith === 'last_year') {
        previousStart = new Date(currentStart);
        previousStart.setFullYear(previousStart.getFullYear() - 1);
      }
      break;
  }

  return { current: currentStart, previous: previousStart };
}

/**
 * Get date range end based on period
 */
function getDateRangeEnd(period: AnalyticsPeriod, startDate: Date): Date {
  const now = new Date();
  switch (period) {
    case 'today':
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      return endOfDay;
    case 'week':
      const weekEnd = new Date(startDate);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      return weekEnd;
    case 'month':
      return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    case 'year':
      return new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    default:
      return now;
  }
}

/**
 * Calculate trend between current and previous values
 */
function calculateTrend(currentValue: number, previousValue: number, label: string): MetricTrend {
  const isPositive = currentValue >= previousValue;
  const value = previousValue > 0 ? Math.abs(Math.round(((currentValue - previousValue) / previousValue) * 100)).toString() : '0';
  return {
    value,
    is_positive: isPositive,
    label,
  };
}

/**
 * Get Analytics Metrics
 */
export const getAnalyticsMetrics = async (
  userId: string,
  period: AnalyticsPeriod = 'month',
  compareWith: AnalyticsCompareWith = 'previous_period'
): Promise<AnalyticsMetricsResponse> => {
  // Validate user exists
  const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
  if (userCheck.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const { current: currentStart, previous: previousStart } = getDateRange(period, compareWith);
  const currentEnd = getDateRangeEnd(period, currentStart);
  const previousEnd = previousStart ? getDateRangeEnd(period, previousStart) : undefined;

  // Conversion Rate = (Closed Leads / Total Leads) * 100
  const currentConversionResult = await pool.query(
    `SELECT
      COUNT(*) FILTER (WHERE status = 'closed') * 100.0 / NULLIF(COUNT(*), 0) as conversion_rate
    FROM leads
    WHERE assigned_to = $1
      AND created_at >= $2
      AND created_at <= $3`,
    [userId, currentStart, currentEnd]
  );
  const currentConversion = parseFloat(currentConversionResult.rows[0].conversion_rate || '0');

  let previousConversion = 0;
  if (previousStart && previousEnd) {
    const previousConversionResult = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'closed') * 100.0 / NULLIF(COUNT(*), 0) as conversion_rate
      FROM leads
      WHERE assigned_to = $1
        AND created_at >= $2
        AND created_at <= $3`,
      [userId, previousStart, previousEnd]
    );
    previousConversion = parseFloat(previousConversionResult.rows[0].conversion_rate || '0');
  }

  // Avg Time to Close (in days)
  const currentAvgTimeResult = await pool.query(
    `SELECT
      AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400) as avg_days
    FROM leads
    WHERE status = 'closed'
      AND assigned_to = $1
      AND created_at >= $2
      AND created_at <= $3`,
    [userId, currentStart, currentEnd]
  );
  const currentAvgTime = parseFloat(currentAvgTimeResult.rows[0].avg_days || '0');

  let previousAvgTime = 0;
  if (previousStart && previousEnd) {
    const previousAvgTimeResult = await pool.query(
      `SELECT
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400) as avg_days
      FROM leads
      WHERE status = 'closed'
        AND assigned_to = $1
        AND created_at >= $2
        AND created_at <= $3`,
      [userId, previousStart, previousEnd]
    );
    previousAvgTime = parseFloat(previousAvgTimeResult.rows[0].avg_days || '0');
  }

  // Response Time (avg hours from lead created to first activity)
  const currentResponseTimeResult = await pool.query(
    `SELECT
      AVG(EXTRACT(EPOCH FROM (la.created_at - l.created_at)) / 3600) as avg_hours
    FROM lead_activities la
    JOIN leads l ON la.lead_id = l.id
    WHERE l.assigned_to = $1
      AND l.created_at >= $2
      AND l.created_at <= $3
      AND la.activity_type = 'status_change'
      AND la.old_status = 'new'
    LIMIT 1`,
    [userId, currentStart, currentEnd]
  );
  const currentResponseTime = parseFloat(currentResponseTimeResult.rows[0].avg_hours || '0');

  let previousResponseTime = 0;
  if (previousStart && previousEnd) {
    const previousResponseTimeResult = await pool.query(
      `SELECT
        AVG(EXTRACT(EPOCH FROM (la.created_at - l.created_at)) / 3600) as avg_hours
      FROM lead_activities la
      JOIN leads l ON la.lead_id = l.id
      WHERE l.assigned_to = $1
        AND l.created_at >= $2
        AND l.created_at <= $3
        AND la.activity_type = 'status_change'
        AND la.old_status = 'new'
      LIMIT 1`,
      [userId, previousStart, previousEnd]
    );
    previousResponseTime = parseFloat(previousResponseTimeResult.rows[0].avg_hours || '0');
  }

  // Follow-up Rate = (Leads with follow-up activity / Total Leads) * 100
  const currentFollowUpResult = await pool.query(
    `SELECT
      COUNT(*) FILTER (WHERE last_followed_up_at IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0) as follow_up_rate
    FROM leads
    WHERE assigned_to = $1
      AND created_at >= $2
      AND created_at <= $3`,
    [userId, currentStart, currentEnd]
  );
  const currentFollowUp = parseFloat(currentFollowUpResult.rows[0].follow_up_rate || '0');

  let previousFollowUp = 0;
  if (previousStart && previousEnd) {
    const previousFollowUpResult = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE last_followed_up_at IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0) as follow_up_rate
      FROM leads
      WHERE assigned_to = $1
        AND created_at >= $2
        AND created_at <= $3`,
      [userId, previousStart, previousEnd]
    );
    previousFollowUp = parseFloat(previousFollowUpResult.rows[0].follow_up_rate || '0');
  }

  // Get trend label based on period
  const trendLabels: Record<AnalyticsPeriod, string> = {
    today: 'vs yesterday',
    week: 'vs last week',
    month: 'vs last month',
    year: 'vs last year',
  };

  return {
    conversion_rate: {
      value: Math.round(currentConversion * 10) / 10,
      unit: '%',
      trend: calculateTrend(currentConversion, previousConversion, trendLabels[period]),
    },
    avg_time_to_close: {
      value: Math.round(currentAvgTime),
      unit: 'days',
      trend: {
        value: Math.round(Math.abs(currentAvgTime - previousAvgTime)).toString(),
        is_positive: currentAvgTime <= previousAvgTime,
        label: `${Math.round(Math.abs(currentAvgTime - previousAvgTime))} days faster`,
      },
    },
    response_time: {
      value: Math.round(currentResponseTime * 10) / 10,
      unit: 'hrs',
      trend: {
        value: (Math.round(Math.abs(currentResponseTime - previousResponseTime) * 10) / 10).toString(),
        is_positive: currentResponseTime <= previousResponseTime,
        label: `${Math.round(Math.abs(currentResponseTime - previousResponseTime) * 10) / 10} hrs faster`,
      },
    },
    follow_up_rate: {
      value: Math.round(currentFollowUp),
      unit: '%',
      trend: calculateTrend(currentFollowUp, previousFollowUp, '% increase'),
    },
  };
};

/**
 * Get Funnel Data
 */
export const getAnalyticsFunnel = async (
  userId: string,
  period: AnalyticsPeriod = 'month'
): Promise<AnalyticsFunnelResponse> => {
  // Validate user exists
  const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
  if (userCheck.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const { current: startDate } = getDateRange(period);
  const endDate = getDateRangeEnd(period, startDate);

  const funnelResult = await pool.query(
    `SELECT
      status as stage,
      COUNT(*) as count
    FROM leads
    WHERE assigned_to = $1
      AND created_at >= $2
      AND created_at <= $3
    GROUP BY status
    ORDER BY
      CASE status
        WHEN 'new' THEN 1
        WHEN 'contacted' THEN 2
        WHEN 'surveyed' THEN 3
        WHEN 'negotiating' THEN 4
        WHEN 'closed' THEN 5
        WHEN 'cancelled' THEN 6
      END`,
    [userId, startDate, endDate]
  );

  const funnel: FunnelStage[] = funnelResult.rows.map((row) => ({
    stage: row.stage,
    count: parseInt(row.count, 10),
    label: FUNNEL_LABELS[row.stage] || row.stage,
    color: FUNNEL_COLORS[row.stage] || '#6B7280',
  }));

  // Ensure all stages are included even if count is 0
  const allStages: CrmLeadStatus[] = [
    CrmLeadStatus.NEW,
    CrmLeadStatus.CONTACTED,
    CrmLeadStatus.SURVEYED,
    CrmLeadStatus.NEGOTIATING,
    CrmLeadStatus.CLOSED,
    CrmLeadStatus.CANCELLED,
  ];
  const completeFunnel: FunnelStage[] = allStages.map((stage) => {
    const existing = funnel.find((f) => f.stage === stage);
    return (
      existing || {
        stage,
        count: 0,
        label: FUNNEL_LABELS[stage] || stage,
        color: FUNNEL_COLORS[stage] || '#6B7280',
      }
    );
  });

  const total = completeFunnel.reduce((sum, stage) => sum + stage.count, 0);

  return { funnel: completeFunnel, total };
};

/**
 * Get Monthly Closing Trend
 */
export const getAnalyticsTrend = async (userId: string, months: number = 6): Promise<AnalyticsTrendResponse> => {
  // Validate months parameter
  if (months < 1 || months > 12) {
    throw new AppError('Months parameter must be between 1 and 12', 400);
  }

  // Validate user exists
  const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
  if (userCheck.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const trendResult = await pool.query(
    `SELECT
      TO_CHAR(created_at, 'Mon') as month,
      EXTRACT(MONTH FROM created_at) as month_num,
      COUNT(*) as closings
    FROM leads
    WHERE assigned_to = $1
      AND status = 'closed'
      AND created_at >= NOW() - INTERVAL '${months} months'
    GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
    ORDER BY EXTRACT(MONTH FROM created_at) DESC
    LIMIT $2`,
    [userId, months]
  );

  // Reverse to get chronological order
  const trend: TrendDataPoint[] = trendResult.rows.reverse().map((row) => ({
    month: row.month,
    closings: parseInt(row.closings, 10),
  }));

  return { trend };
};

/**
 * Get Source Breakdown
 */
export const getAnalyticsSources = async (
  userId: string,
  period: AnalyticsPeriod = 'month'
): Promise<AnalyticsSourcesResponse> => {
  // Validate user exists
  const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
  if (userCheck.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const { current: startDate } = getDateRange(period);
  const endDate = getDateRangeEnd(period, startDate);

  const sourcesResult = await pool.query(
    `SELECT
      COALESCE(source, 'Other') as source,
      COUNT(*) as count
    FROM leads
    WHERE assigned_to = $1
      AND created_at >= $2
      AND created_at <= $3
    GROUP BY source
    ORDER BY count DESC`,
    [userId, startDate, endDate]
  );

  const sources: SourceBreakdown[] = sourcesResult.rows.map((row) => ({
    source: row.source.charAt(0).toUpperCase() + row.source.slice(1).toLowerCase(),
    count: parseInt(row.count, 10),
    color: SOURCE_COLORS[row.source.toLowerCase()] || SOURCE_COLORS['Other'] || '#6B7280',
  }));

  const total = sources.reduce((sum, source) => sum + source.count, 0);

  return { sources, total };
};

/**
 * Get Complete Analytics Dashboard
 */
export const getAnalyticsDashboard = async (
  userId: string,
  period: AnalyticsPeriod = 'month',
  trendMonths: number = 6
): Promise<AnalyticsDashboardResponse> => {
  const [metrics, funnel, trend, sources] = await Promise.all([
    getAnalyticsMetrics(userId, period),
    getAnalyticsFunnel(userId, period),
    getAnalyticsTrend(userId, trendMonths),
    getAnalyticsSources(userId, period),
  ]);

  return {
    metrics,
    funnel,
    trend,
    sources,
  };
};
