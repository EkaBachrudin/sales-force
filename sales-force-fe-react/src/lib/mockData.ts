import type { Reminder, MetricsData, FunnelData, TrendData, SourceData, PipelineStage } from './types';

// Mock Reminders Data
export const mockReminders: Reminder[] = [
  {
    id: 'r1',
    leadId: '1',
    leadName: 'Budi Santoso',
    leadPhone: '081234567890',
    property: 'Cluster A, Type 36/60',
    scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000),
    type: 'follow-up',
    notes: 'Follow up on property inquiry',
  },
  {
    id: 'r2',
    leadId: '2',
    leadName: 'Dewi Lestari',
    leadPhone: '081234567891',
    property: 'Cluster B, Type 45/72',
    scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
    type: 'site-visit',
    notes: 'Schedule site visit',
  },
  {
    id: 'r3',
    leadId: '4',
    leadName: 'Siti Rahayu',
    leadPhone: '081234567893',
    property: 'Cluster A, Type 36/60',
    scheduledFor: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    type: 'meeting',
    notes: 'Discuss payment terms',
  },
];

// Mock Metrics Data
export const mockMetrics: MetricsData = {
  totalLeads: 247,
  thisMonth: 12,
  surveyed: 18,
  closed: 8,
  totalLeadsTrend: '+12',
  thisMonthTrend: '+12%',
  surveyedTrend: '+3',
  closedTrend: '+2',
};

// Mock Funnel Data
export const mockFunnelData: FunnelData[] = [
  { stage: 'new', count: 45 },
  { stage: 'contacted', count: 32 },
  { stage: 'surveyed', count: 18 },
  { stage: 'negotiating', count: 12 },
  { stage: 'closed', count: 8 },
  { stage: 'cancelled', count: 5 },
];

// Mock Trend Data
export const mockTrendData: TrendData[] = [
  { month: 'Aug', closings: 5 },
  { month: 'Sep', closings: 6 },
  { month: 'Oct', closings: 8 },
  { month: 'Nov', closings: 7 },
  { month: 'Dec', closings: 10 },
  { month: 'Jan', closings: 8 },
];

// Mock Source Data
export const mockSourceData: SourceData[] = [
  { source: 'Website', count: 45, color: '#2563EB' },
  { source: 'Instagram', count: 32, color: '#EC4899' },
  { source: 'Facebook', count: 28, color: '#3B82F6' },
  { source: 'WhatsApp', count: 22, color: '#10B981' },
  { source: 'Referral', count: 18, color: '#F59E0B' },
  { source: 'Other', count: 12, color: '#6B7280' },
];

// Stage colors for charts
export const stageColors: Record<PipelineStage, string> = {
  new: '#9CA3AF',
  contacted: '#3B82F6',
  surveyed: '#8B5CF6',
  negotiating: '#F59E0B',
  booked: '#06B6D4',
  closed: '#10B981',
  cancelled: '#EF4444',
};

export const stageLabels: Record<PipelineStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  surveyed: 'Surveyed',
  negotiating: 'Negotiating',
  booked: 'Booked',
  closed: 'Closed',
  cancelled: 'Cancelled',
};
