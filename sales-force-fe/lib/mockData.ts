import { Lead, Reminder, MetricsData, FunnelData, TrendData, SourceData, PipelineStage } from './types';

// Mock Leads Data
export const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'Budi Santoso',
    phone: '081234567890',
    email: 'budi.santoso@email.com',
    nik: "3201010101800001",
    npwp: "01.234.567.8-901.000",
    propertyType: 'Cluster A',
    budgetMin: 500000000,
    budgetMax: 800000000,
    stage: 'new',
    followUpDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    source: 'Instagram',
    note: 'Customer mengincar Free PPN Awal tahun ini',
    reminder: {
      scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      notes: 'Follow up on property inquiry - customer interested in Cluster A',
    },
  },
  {
    id: '2',
    name: 'Dewi Lestari',
    phone: '081234567891',
    email: 'dewi.lestari@email.com',
    propertyType: 'Cluster B',
    budgetMin: 700000000,
    budgetMax: 1000000000,
    stage: 'contacted',
    followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    source: 'Website',
    reminder: {
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Schedule site visit for Cluster B Type 45/72',
    },
  },
  {
    id: '3',
    name: 'Ahmad Wijaya',
    phone: '081234567892',
    propertyType: 'Cluster C',
    budgetMin: 900000000,
    budgetMax: 1500000000,
    stage: 'surveyed',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    source: 'Referral',
  },
  {
    id: '4',
    name: 'Siti Rahayu',
    phone: '081234567893',
    email: 'siti.rahayu@email.com',
    propertyType: 'Cluster A',
    budgetMin: 450000000,
    budgetMax: 650000000,
    stage: 'negotiating',
    followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    source: 'Facebook',
    reminder: {
      scheduledFor: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Discuss payment terms and down payment options',
    },
  },
  {
    id: '5',
    name: 'Robertus Tan',
    phone: '081234567894',
    email: 'robertus.tan@email.com',
    propertyType: 'Cluster D',
    budgetMin: 1200000000,
    budgetMax: 2000000000,
    stage: 'closed',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    source: 'Website',
  },
  {
    id: '6',
    name: 'Maria Kusuma',
    phone: '081234567895',
    email: 'maria.kusuma@email.com',
    propertyType: 'Cluster B',
    budgetMin: 600000000,
    budgetMax: 900000000,
    stage: 'new',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    source: 'Instagram',
  },
  {
    id: '7',
    name: ' Hendra Gunawan',
    phone: '081234567896',
    propertyType: 'Cluster A',
    budgetMin: 500000000,
    budgetMax: 700000000,
    stage: 'contacted',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    source: 'WhatsApp',
    reminder: {
      scheduledFor: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      notes: 'Follow up call regarding Cluster A availability',
    },
  },
  {
    id: '8',
    name: 'Ratna Sari',
    phone: '081234567897',
    email: 'ratna.sari@email.com',
    propertyType: 'Cluster C',
    budgetMin: 850000000,
    budgetMax: 1200000000,
    stage: 'surveyed',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    source: 'Referral',
  },
  {
    id: '9',
    name: 'Feri Pratama',
    phone: '081234567898',
    propertyType: 'Cluster D',
    budgetMin: 1500000000,
    budgetMax: 2500000000,
    stage: 'negotiating',
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
    source: 'Website',
    reminder: {
      scheduledFor: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      notes: 'Final discussion before closing deal',
    },
  },
  {
    id: '10',
    name: 'Linda Wijaya',
    phone: '081234567899',
    email: 'linda.wijaya@email.com',
    propertyType: 'Cluster B',
    budgetMin: 700000000,
    budgetMax: 950000000,
    stage: 'closed',
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // 18 days ago
    source: 'Facebook',
  },
  {
    id: '11',
    name: 'Dedi Kurniawan',
    phone: '081234567800',
    propertyType: 'Cluster A',
    budgetMin: 480000000,
    budgetMax: 620000000,
    stage: 'cancelled',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
    source: 'Website',
  },
];

// Mock Reminders Data
export const mockReminders: Reminder[] = [
  {
    id: 'r1',
    leadId: '1',
    leadName: 'Budi Santoso',
    leadPhone: '081234567890',
    property: 'Cluster A, Type 36/60',
    scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000), // Today, 2 PM
    type: 'follow-up',
    notes: 'Follow up on property inquiry',
  },
  {
    id: 'r2',
    leadId: '2',
    leadName: 'Dewi Lestari',
    leadPhone: '081234567891',
    property: 'Cluster B, Type 45/72',
    scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow, 10 AM
    type: 'site-visit',
    notes: 'Schedule site visit',
  },
  {
    id: 'r3',
    leadId: '4',
    leadName: 'Siti Rahayu',
    leadPhone: '081234567893',
    property: 'Cluster A, Type 36/60',
    scheduledFor: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // In 3 days
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
  closed: '#10B981',
  cancelled: '#EF4444',
};

export const stageLabels: Record<PipelineStage, string> = {
  new: 'Baru Masuk',
  contacted: 'Dikontak',
  surveyed: 'Survey',
  negotiating: 'Negosiasi',
  closed: 'Closing',
  cancelled: 'Batal',
};
