'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ConversionMetricCard } from '@/components/analytics/ConversionMetricCard';
import { FunnelChart } from '@/components/analytics/FunnelChart';
import { TrendChart } from '@/components/analytics/TrendChart';
import { DoughnutChart } from '@/components/analytics/DoughnutChart';
import {
  mockMetrics,
  mockFunnelData,
  mockTrendData,
  mockSourceData,
  stageColors,
  stageLabels,
} from '@/lib/mockData';

export default function AnalyticsPage() {
  // Calculate funnel data with colors
  const funnelData = mockFunnelData.map((item) => ({
    label: stageLabels[item.stage],
    count: item.count,
    color: stageColors[item.stage],
  }));

  // Calculate total conversions
  const totalLeads = funnelData.reduce((sum, item) => sum + item.count, 0);
  const conversionRate = ((funnelData[4].count / totalLeads) * 100).toFixed(1);

  return (
    <DashboardLayout
      title="Analytics"
      subtitle="Track your sales performance and metrics"
    >
      {/* Conversion Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ConversionMetricCard
          label="Conversion Rate"
          value={conversionRate}
          unit="%"
          trend={{ value: '2.3', isPositive: true, label: 'vs last month' }}
        />
        <ConversionMetricCard
          label="Avg Time to Close"
          value="18"
          unit="days"
          trend={{ value: '3', isPositive: true, label: 'days faster' }}
        />
        <ConversionMetricCard
          label="Response Time"
          value="4.2"
          unit="hrs"
          trend={{ value: '1.1', isPositive: true, label: 'hrs faster' }}
        />
        <ConversionMetricCard
          label="Follow-up Rate"
          value="82"
          unit="%"
          trend={{ value: '5', isPositive: true, label: '% increase' }}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Funnel */}
        <FunnelChart data={funnelData} total={totalLeads} />

        {/* Monthly Closing Trend */}
        <TrendChart
          data={mockTrendData}
          title="Monthly Closing Trend"
        />

        {/* Source Breakdown */}
        <DoughnutChart
          data={mockSourceData}
          title="Source Breakdown"
          centerText={String(totalLeads)}
          centerSubtext="Total Leads"
        />
      </div>
    </DashboardLayout>
  );
}
