import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Analytics Types
export type AnalyticsPeriod = 'today' | 'week' | 'month' | 'year';
export type AnalyticsCompareWith = 'previous_period' | 'last_year';

export interface MetricTrend {
  value: string;
  is_positive: boolean;
  label: string;
}

export interface Metric {
  value: number;
  unit: string;
  trend: MetricTrend;
}

export interface AnalyticsMetricsResponse {
  conversion_rate: Metric;
  avg_time_to_close: Metric;
  response_time: Metric;
  follow_up_rate: Metric;
}

export interface FunnelStage {
  stage: string;
  count: number;
  label: string;
  color: string;
}

export interface AnalyticsFunnelResponse {
  funnel: FunnelStage[];
  total: number;
}

export interface TrendDataPoint {
  month: string;
  closings: number;
}

export interface AnalyticsTrendResponse {
  trend: TrendDataPoint[];
}

export interface SourceBreakdown {
  source: string;
  count: number;
  color: string;
}

export interface AnalyticsSourcesResponse {
  sources: SourceBreakdown[];
  total: number;
}

export interface AnalyticsDashboardResponse {
  metrics: AnalyticsMetricsResponse;
  funnel: AnalyticsFunnelResponse;
  trend: AnalyticsTrendResponse;
  sources: AnalyticsSourcesResponse;
}

// Metrics Hook
export function useAnalyticsMetrics(
  params?: {
    period?: AnalyticsPeriod;
    compare_with?: AnalyticsCompareWith;
  },
  enabled = true
) {
  return useQuery<AnalyticsMetricsResponse>({
    queryKey: ['analytics', 'metrics', params],
    queryFn: async () => {
      const response = await api.getAnalyticsMetrics(params);
      return response.data as AnalyticsMetricsResponse;
    },
    staleTime: 1000 * 60 * 5,
    enabled,
  });
}

// Funnel Hook
export function useAnalyticsFunnel(
  params?: {
    period?: AnalyticsPeriod;
  },
  enabled = true
) {
  return useQuery<AnalyticsFunnelResponse>({
    queryKey: ['analytics', 'funnel', params],
    queryFn: async () => {
      const response = await api.getAnalyticsFunnel(params);
      return response.data as AnalyticsFunnelResponse;
    },
    staleTime: 1000 * 60 * 5,
    enabled,
  });
}

// Trend Hook
export function useAnalyticsTrend(
  params?: {
    months?: number;
  },
  enabled = true
) {
  return useQuery<AnalyticsTrendResponse>({
    queryKey: ['analytics', 'trend', params],
    queryFn: async () => {
      const response = await api.getAnalyticsTrend(params);
      return response.data as AnalyticsTrendResponse;
    },
    staleTime: 1000 * 60 * 10,
    enabled,
  });
}

// Sources Hook
export function useAnalyticsSources(
  params?: {
    period?: AnalyticsPeriod;
  },
  enabled = true
) {
  return useQuery<AnalyticsSourcesResponse>({
    queryKey: ['analytics', 'sources', params],
    queryFn: async () => {
      const response = await api.getAnalyticsSources(params);
      return response.data as AnalyticsSourcesResponse;
    },
    staleTime: 1000 * 60 * 5,
    enabled,
  });
}

// Complete Dashboard Hook
export function useAnalyticsDashboard(
  params?: {
    period?: AnalyticsPeriod;
    trend_months?: number;
    data_range_months?: number;
  },
  enabled = true
) {
  return useQuery<AnalyticsDashboardResponse>({
    queryKey: ['analytics', 'dashboard', params],
    queryFn: async () => {
      const response = await api.getAnalyticsDashboard(params);
      return response.data as AnalyticsDashboardResponse;
    },
    staleTime: 1000 * 60 * 5,
    enabled,
  });
}
