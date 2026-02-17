'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ConversionMetricCard } from '@/components/analytics/ConversionMetricCard';
import { FunnelChart } from '@/components/analytics/FunnelChart';
import { TrendChart } from '@/components/analytics/TrendChart';
import { DoughnutChart } from '@/components/analytics/DoughnutChart';
import { useAnalyticsDashboard } from '@/hooks/useAnalytics';

type DataRangeOption = 1 | 3 | 6 | 12 | 24;

const DATA_RANGE_OPTIONS: { value: DataRangeOption; label: string }[] = [
  { value: 1, label: '1 Bulan' },
  { value: 3, label: '3 Bulan' },
  { value: 6, label: '6 Bulan' },
  { value: 12, label: '12 Bulan' },
  { value: 24, label: '24 Bulan' },
];

export default function AnalyticsPage() {
  const [dataRangeMonths, setDataRangeMonths] = useState<DataRangeOption>(6);

  const { data: dashboardData, isLoading, error } = useAnalyticsDashboard(
    {
      data_range_months: dataRangeMonths,
      trend_months: Math.min(dataRangeMonths, 12),
    },
    true
  );

  if (isLoading) {
    return (
      <DashboardLayout
        title="Analytics"
        subtitle="Track your sales performance and metrics"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        title="Analytics"
        subtitle="Track your sales performance and metrics"
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load analytics data. Please try again later.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!dashboardData) {
    return (
      <DashboardLayout
        title="Analytics"
        subtitle="Track your sales performance and metrics"
      >
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-gray-800">No analytics data available.</p>
        </div>
      </DashboardLayout>
    );
  }

  const { metrics, funnel, trend, sources } = dashboardData;

  // Transform funnel data for chart
  const funnelData = funnel.funnel.map((item) => ({
    label: item.label,
    count: item.count,
    color: item.color,
  }));

  // Transform trend data for chart
  const trendData = trend.trend.map((item) => ({
    month: item.month,
    closings: item.closings,
  }));

  // Transform sources data for chart
  const sourceData = sources.sources.map((item) => ({
    source: item.source,
    count: item.count,
    color: item.color,
  }));

  return (
    <DashboardLayout
      title="Analytics"
      subtitle="Track your sales performance and metrics"
    >
      {/* Filter - Data Range Selection */}
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Filter Data:</span>
        <div className="flex gap-2">
          {DATA_RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setDataRangeMonths(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dataRangeMonths === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {/* Conversion Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ConversionMetricCard
          label="Conversion Rate"
          value={metrics.conversion_rate.value.toString()}
          unit={metrics.conversion_rate.unit}
          trend={{
            value: metrics.conversion_rate.trend.value,
            isPositive: metrics.conversion_rate.trend.is_positive,
            label: metrics.conversion_rate.trend.label,
          }}
          tooltip={{
            title: 'Conversion Rate',
            description: 'Persentase lead yang berhasil closing dari total lead yang masuk.',
            meaning: `Dari ${funnel.total} lead, hanya ${Math.round((metrics.conversion_rate.value / 100) * funnel.total)} yang closing (${metrics.conversion_rate.value}%)`,
            benefit: 'Mengukur efektivitas tim sales dalam mengubah lead menjadi customer',
          }}
        />
        <ConversionMetricCard
          label="Avg Time to Close"
          value={metrics.avg_time_to_close.value.toString()}
          unit={metrics.avg_time_to_close.unit}
          trend={{
            value: metrics.avg_time_to_close.trend.value,
            isPositive: metrics.avg_time_to_close.trend.is_positive,
            label: metrics.avg_time_to_close.trend.label,
          }}
          tooltip={{
            title: 'Average Time to Close',
            description: 'Rata-rata waktu yang dibutuhkan dari lead pertama kali masuk sampai closing.',
            meaning: `Butuh ~${metrics.avg_time_to_close.value} hari untuk mengubah lead menjadi customer`,
            benefit: 'Semakin cepat = semakin efisien proses sales. Bisa identifikasi bottleneck di funnel',
          }}
        />
        <ConversionMetricCard
          label="Response Time"
          value={metrics.response_time.value.toString()}
          unit={metrics.response_time.unit}
          trend={{
            value: metrics.response_time.trend.value,
            isPositive: metrics.response_time.trend.is_positive,
            label: metrics.response_time.trend.label,
          }}
          tooltip={{
            title: 'Response Time',
            description: 'Rata-rata waktu respons tim sales setelah lead masuk.',
            meaning: `Berapa jam tim sales merespon lead baru: ${metrics.response_time.value} jam`,
            benefit: 'Respons cepat = peluang closing lebih tinggi. SLA untuk tim sales',
          }}
        />
        <ConversionMetricCard
          label="Follow-up Rate"
          value={metrics.follow_up_rate.value.toString()}
          unit={metrics.follow_up_rate.unit}
          trend={{
            value: metrics.follow_up_rate.trend.value,
            isPositive: metrics.follow_up_rate.trend.is_positive,
            label: metrics.follow_up_rate.trend.label,
          }}
          tooltip={{
            title: 'Follow-up Rate',
            description: 'Persentase lead yang di-follow up oleh tim sales.',
            meaning: `Dari ${funnel.total} lead, ${Math.round((metrics.follow_up_rate.value / 100) * funnel.total)} lead sudah dikontak`,
            benefit: 'Mengukur keaktifan tim sales dalam menghubungi prospek',
          }}
        />
      </div>

      {/* Charts - Full Width */}
      <div className="space-y-6">
        {/* Lead Funnel */}
        <FunnelChart data={funnelData} total={funnel.total} />

        {/* Monthly Closing Trend */}
        <TrendChart data={trendData} title="Monthly Closing Trend" />

        {/* Source Breakdown */}
        <DoughnutChart
          data={sourceData}
          title="Source Breakdown"
          centerText={String(sources.total)}
          centerSubtext="Total Leads"
        />
      </div>
    </DashboardLayout>
  );
}
