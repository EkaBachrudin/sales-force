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
  { source: 'Website', count: 45, color: '#3B6FE0' },
  { source: 'Instagram', count: 32, color: '#A8C0F2' },
  { source: 'Facebook', count: 28, color: '#2F5CC4' },
  { source: 'WhatsApp', count: 22, color: '#7C9DE8' },
  { source: 'Referral', count: 18, color: '#5479C8' },
  { source: 'Other', count: 12, color: '#9CA3AF' },
];

// Stage colors for charts
export const stageColors: Record<PipelineStage, string> = {
  new: '#9CA3AF',
  contacted: '#A8C0F2',
  surveyed: '#7C9DE8',
  negotiating: '#5479C8',
  booked: '#3B6FE0',
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
