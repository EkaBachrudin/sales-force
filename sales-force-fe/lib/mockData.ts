import { Reminder, MetricsData, FunnelData, TrendData, SourceData, PipelineStage } from './types';

// Import Lead type from LeadCard
import type { Lead } from '@/components/dashboard/LeadCard';

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

// Mock Pipeline Leads Data
export const mockPipelineLeads: Lead[] = [
  // NEW LEADS (Baru Masuk)
  {
    id: 'lead-001',
    name: 'Budi Santoso',
    phone: '081234567890',
    email: 'budi.santoso@email.com',
    nik: '3201234567890001',
    npwp: '01.234.567.8-901.000',
    property: {
      name: 'Cluster A, Type 36/60',
      property_type: 'Rumah Tapak',
    },
    property_id: 'prop-001',
    budget_range: {
      min: 300000000,
      max: 400000000,
    },
    status: 'new',
    source: 'Instagram',
    notes: 'Tertarik dengan tipe 36/60, ingin info lebih lanjut tentang promo cash bertahap.',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lead-002',
    name: 'Dewi Lestari',
    phone: '081234567891',
    email: 'dewi.lestari@email.com',
    property: {
      name: 'Cluster B, Type 45/72',
      property_type: 'Rumah Tapak',
    },
    property_id: 'prop-002',
    budget_range: {
      min: 450000000,
      max: 550000000,
    },
    status: 'new',
    source: 'WhatsApp',
    notes: 'Ingin survey lokasi akhir pekan ini.',
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lead-003',
    name: 'Ahmad Fauzi',
    phone: '081234567892',
    email: 'ahmad.fauzi@email.com',
    property: {
      name: 'Cluster C, Type 54/90',
      property_type: 'Rumah Tapak',
    },
    property_id: 'prop-003',
    budget_range: {
      min: 600000000,
      max: 750000000,
    },
    status: 'new',
    source: 'visit',
    notes: 'Datang ke marketing office, minta brosur lengkap.',
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    followUpDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  },

  // CONTACTED LEADS (Dikontak)
  {
    id: 'lead-004',
    name: 'Siti Rahayu',
    phone: '081234567893',
    email: 'siti.rahayu@email.com',
    property: {
      name: 'Cluster A, Type 36/60',
      property_type: 'Rumah Tapak',
    },
    property_id: 'prop-001',
    budget_range: {
      min: 300000000,
      max: 400000000,
    },
    status: 'contacted',
    source: 'referral',
    notes: 'Sudah dihubungi via telepon, tertarik dengan cluster A. Perlu info KPR.',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    followUpDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lead-005',
    name: 'Rudi Hartono',
    phone: '081234567894',
    email: 'rudi.hartono@email.com',
    property: {
      name: 'Cluster D, Type 70/105',
      property_type: 'Rumah Tapak 2 Lantai',
    },
    property_id: 'prop-004',
    budget_range: {
      min: 900000000,
      max: 1200000000,
    },
    status: 'contacted',
    source: 'Facebook',
    notes: 'Telah dikirimkan proposal via email. Menunggu respons.',
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lead-006',
    name: 'Maya Sari',
    phone: '081234567895',
    email: 'maya.sari@email.com',
    property: {
      name: 'Cluster B, Type 45/72',
      property_type: 'Rumah Tapak',
    },
    property_id: 'prop-002',
    budget_range: {
      min: 450000000,
      max: 550000000,
    },
    status: 'contacted',
    source: 'Instagram',
    notes: 'Follow up done, customer ingin simulasi KPR.',
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    followUpDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
  },

  // SURVEYED LEADS (Survey)
  {
    id: 'lead-007',
    name: 'Doni Prasetyo',
    phone: '081234567896',
    email: 'doni.prasetyo@email.com',
    property: {
      name: 'Cluster C, Type 54/90',
      property_type: 'Rumah Tapak',
    },
    property_id: 'prop-003',
    budget_range: {
      min: 600000000,
      max: 750000000,
    },
    kpr_simulation: {
      property_price: 650000000,
      down_payment_percentage: 20,
      down_payment: 130000000,
      interest_rate: 8.5,
      loan_term_years: 15,
      estimated_monthly_payment: '5,800,000',
    },
    status: 'surveyed',
    source: 'visit',
    notes: 'Survey lokasi dilakukan, customer puas dengan lokasi dan kualitas bangunan.',
    created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lead-008',
    name: 'Rina Wati',
    phone: '081234567897',
    email: 'rina.wati@email.com',
    property: {
      name: 'Cluster A, Type 36/60',
      property_type: 'Rumah Tapak',
    },
    property_id: 'prop-001',
    budget_range: {
      min: 300000000,
      max: 400000000,
    },
    status: 'surveyed',
    source: 'WhatsApp',
    notes: 'Survey kedua, sedang pertimbangkan antara cluster A dan B.',
    created_at: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lead-009',
    name: 'Fajar Nugraha',
    phone: '081234567898',
    email: 'fajar.nugraha@email.com',
    property: {
      name: 'Cluster E, Type 30/60',
      property_type: 'Rumah Tapak',
    },
    property_id: 'prop-005',
    budget_range: {
      min: 250000000,
      max: 350000000,
    },
    status: 'surveyed',
    source: 'tiktok',
    notes: 'Survey selesai, customer ingin diskon tambahan.',
    created_at: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
    followUpDate: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  },

  // NEGOTIATING LEADS (Negosiasi)
  {
    id: 'lead-010',
    name: 'Putri Ayu',
    phone: '081234567899',
    email: 'putri.ayu@email.com',
    nik: '3201234567890002',
    npwp: '01.234.567.8-902.000',
    property: {
      name: 'Cluster D, Type 70/105',
      property_type: 'Rumah Tapak 2 Lantai',
    },
    property_id: 'prop-004',
    budget_range: {
      min: 900000000,
      max: 1200000000,
    },
    kpr_simulation: {
      property_price: 1050000000,
      down_payment_percentage: 20,
      down_payment: 210000000,
      interest_rate: 7.5,
      loan_term_years: 20,
      estimated_monthly_payment: '7,200,000',
    },
    status: 'negotiating',
    source: 'referral',
    notes: 'Negosiasi harga, customer minta diskon 5%. Sedang dikomunikasikan ke manajemen.',
    created_at: new Date(Date.now() - 144 * 60 * 60 * 1000).toISOString(),
    followUpDate: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lead-011',
    name: 'Hendra Wijaya',
    phone: '081234567900',
    email: 'hendra.wijaya@email.com',
    property: {
      name: 'Cluster C, Type 54/90',
      property_type: 'Rumah Tapak',
    },
    property_id: 'prop-003',
    budget_range: {
      min: 600000000,
      max: 750000000,
    },
    kpr_simulation: {
      property_price: 680000000,
      down_payment_percentage: 20,
      down_payment: 136000000,
      interest_rate: 8.25,
      loan_term_years: 15,
      estimated_monthly_payment: '6,100,000',
    },
    status: 'negotiating',
    source: 'Instagram',
    notes: 'Negosiasi DP bertahap, customer ingin tenor 24 bulan.',
    created_at: new Date(Date.now() - 168 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lead-012',
    name: 'Linda Kusuma',
    phone: '081234567901',
    email: 'linda.kusuma@email.com',
    property: {
      name: 'Cluster B, Type 45/72',
      property_type: 'Rumah Tapak',
    },
    property_id: 'prop-002',
    budget_range: {
      min: 450000000,
      max: 550000000,
    },
    status: 'negotiating',
    source: 'visit',
    notes: 'Sedang pertimbangkan KPR atau cash bertahap. Butuh simulasi lebih detail.',
    created_at: new Date(Date.now() - 192 * 60 * 60 * 1000).toISOString(),
  },

  // CLOSED LEADS (Closing)
  {
    id: 'lead-013',
    name: 'Irwan Kusuma',
    phone: '081234567902',
    email: 'irwan.kusuma@email.com',
    nik: '3201234567890003',
    npwp: '01.234.567.8-903.000',
    property: {
      name: 'Cluster A, Type 36/60',
      property_type: 'Rumah Tapak',
    },
    property_id: 'prop-001',
    budget_range: {
      min: 300000000,
      max: 400000000,
    },
    kpr_simulation: {
      property_price: 385000000,
      down_payment_percentage: 20,
      down_payment: 77000000,
      interest_rate: 8.0,
      loan_term_years: 10,
      estimated_monthly_payment: '4,200,000',
    },
    status: 'closed',
    source: 'WhatsApp',
    notes: 'Booking fee sudah dibayar. Sedang proses KPR.',
    created_at: new Date(Date.now() - 240 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lead-014',
    name: 'Dian Permata',
    phone: '081234567903',
    email: 'dian.permata@email.com',
    property: {
      name: 'Cluster D, Type 70/105',
      property_type: 'Rumah Tapak 2 Lantai',
    },
    property_id: 'prop-004',
    budget_range: {
      min: 900000000,
      max: 1200000000,
    },
    kpr_simulation: {
      property_price: 1120000000,
      down_payment_percentage: 30,
      down_payment: 336000000,
      interest_rate: 7.75,
      loan_term_years: 15,
      estimated_monthly_payment: '7,800,000',
    },
    status: 'closed',
    source: 'Facebook',
    notes: 'Cash bertahap 12 bulan. DP pertama sudah lunas.',
    created_at: new Date(Date.now() - 288 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lead-015',
    name: 'Bayu Pratama',
    phone: '081234567904',
    email: 'bayu.pratama@email.com',
    property: {
      name: 'Cluster C, Type 54/90',
      property_type: 'Rumah Tapak',
    },
    property_id: 'prop-003',
    budget_range: {
      min: 600000000,
      max: 750000000,
    },
    kpr_simulation: {
      property_price: 695000000,
      down_payment_percentage: 20,
      down_payment: 139000000,
      interest_rate: 8.5,
      loan_term_years: 12,
      estimated_monthly_payment: '6,700,000',
    },
    status: 'closed',
    source: 'referral',
    notes: 'SPK sudah ditandatangani. Akad credit rencana bulan depan.',
    created_at: new Date(Date.now() - 336 * 60 * 60 * 1000).toISOString(),
  },

  // CANCELLED LEADS (Batal)
  {
    id: 'lead-016',
    name: 'Tono Suhendar',
    phone: '081234567905',
    email: 'tono.suhendar@email.com',
    property: {
      name: 'Cluster B, Type 45/72',
      property_type: 'Rumah Tapak',
    },
    property_id: 'prop-002',
    budget_range: {
      min: 450000000,
      max: 550000000,
    },
    status: 'cancelled',
    source: 'Instagram',
    notes: 'Batal karena lokasi terlalu jauh dari tempat kerja.',
    created_at: new Date(Date.now() - 360 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lead-017',
    name: 'Yuni Astuti',
    phone: '081234567906',
    email: 'yuni.astuti@email.com',
    property: {
      name: 'Cluster A, Type 36/60',
      property_type: 'Rumah Tapak',
    },
    property_id: 'prop-001',
    budget_range: {
      min: 300000000,
      max: 400000000,
    },
    status: 'cancelled',
    source: 'WhatsApp',
    notes: 'Batal karena mendapat penawaran lebih baik dari developer lain.',
    created_at: new Date(Date.now() - 408 * 60 * 60 * 1000).toISOString(),
  },
];
