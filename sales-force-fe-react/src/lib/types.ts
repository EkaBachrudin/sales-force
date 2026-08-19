// Type definitions for S-Force CRM
// Core domain types defined here to avoid circular dependencies with components

// Pipeline Stage
export type PipelineStage = 'new' | 'contacted' | 'surveyed' | 'negotiating' | 'booked' | 'closed' | 'cancelled';

// Reminder Data (backend format, used in Lead)
export interface ReminderData {
  id: string;
  user_id: string;
  lead_id: string;
  remind_at: string;
  message: string;
  is_completed: string;
  created_at: string;
  notes?: string;
}

// KPR Simulation
export interface KprSimulation {
  property_price: number;
  down_payment_percentage: number;
  down_payment: number;
  interest_rate: number;
  loan_term_years: number;
  estimated_monthly_payment: string;
}

// Lead
export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  nik?: string;
  npwp?: string;
  property: {
    name: string;
    property_type: string;
  };
  budget_range: {
    max: number;
    min: number;
  };
  kpr_simulation?: KprSimulation;
  status: string;
  followUpDate?: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
  source?: string;
  notes?: string;
  reminders?: ReminderData[];
  kprPrice?: number;
  kprDownPayment?: number;
  interest_rate?: number;
  loan_term_years?: number;
  property_id?: string;
  unit_id?: string;
  unit?: {
    id: string;
    name: string;
    land_area: string;
    status: string;
    block: {
      id: string;
      name: string;
    };
    property: {
      id: string;
      name: string;
      city: string;
    };
  };
}

// Reminder (dashboard display type)
export interface Reminder {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  property: string;
  scheduledFor: Date | string;
  type: 'follow-up' | 'call' | 'site-visit' | 'meeting';
  notes?: string;
}

// Analytics Types
export interface MetricsData {
  totalLeads: number;
  thisMonth: number;
  surveyed: number;
  closed: number;
  totalLeadsTrend: string;
  thisMonthTrend: string;
  surveyedTrend: string;
  closedTrend: string;
}

export interface FunnelData {
  stage: PipelineStage;
  count: number;
}

export interface TrendData {
  month: string;
  closings: number;
}

export interface SourceData {
  source: string;
  count: number;
  color: string;
}

// Dashboard State
export interface DashboardState {
  leads: Lead[];
  reminders: Reminder[];
  selectedLead: Lead | null;
  isNewLeadModalOpen: boolean;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Property Types
export interface Property {
  id: string;
  name: string;
  city: string;
  land_area: number;
  address?: string;
  description?: string;
  siteplan_assets?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyDetail {
  property: Property;
  blocks: BlockListItem[];
}

export interface BlockListItem {
  id: string;
  name: string;
  is_active: boolean;
  total_units: number;
  created_at: string;
  updated_at: string;
}

export interface UnitListItem {
  id: string;
  name: string;
  land_area?: number | string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePropertyDto {
  name: string;
  city: string;
  land_area?: number;
  address?: string;
  description?: string;
}

export interface UpdatePropertyDto {
  name?: string;
  city?: string;
  land_area?: number;
  address?: string;
  description?: string;
}

// User Types
export enum UserRole {
  ADMIN = 'Admin',
  MANAGER = 'Supervisor',
  SALES = 'Sales',
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  full_name: string;
  role: string;
  phone?: string;
}

export interface UpdateUserDto {
  email?: string;
  full_name?: string;
  role?: string;
  phone?: string;
  is_active?: boolean;
  password?: string;
}

export interface UsersFilters {
  search: string;
  role: string;
  status: string;
}

// Subscription Types
export enum SubscriptionType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
}

export enum SubscriptionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export interface Subscription {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  subscription_type: SubscriptionType;
  amount: number;
  period_start?: string;
  period_end?: string;
  due_date: string;
  status: SubscriptionStatus;
  notes?: string;
  created_at: string;
}

export interface CreateSubscriptionDto {
  user_id: string;
  subscription_type: SubscriptionType;
  amount: number;
  due_date: string;
  notes?: string;
}

export interface UpdateSubscriptionDto {
  subscription_type?: SubscriptionType;
  amount?: number;
  due_date?: string;
  status?: SubscriptionStatus;
  notes?: string;
}

export interface SubscriptionFilters {
  search: string;
  status: string;
  subscriptionType: string;
}

// Pipeline Types
export interface PipelineStageApi {
  id: string;
  name: string;
  name_en: string;
  order: number;
  color: string;
  lead_count: number;
  leads: PipelineLeadItem[];
}

export interface PipelineLeadItem {
  id: string;
  name: string;
  property_name?: string;
  next_follow_up_at?: string;
  updated_at: string;
}

export interface PipelineStagesSummary {
  new: number;
  contacted: number;
  surveyed: number;
  negotiating: number;
  closed: number;
  cancelled: number;
}

export interface PipelineData {
  stages: PipelineStageApi[];
  meta: {
    total_leads: number;
    stages_summary: PipelineStagesSummary;
  };
}

export interface PipelineMetrics {
  total_leads: number;
  this_month: number;
  surveyed: number;
  closed: number;
  conversion_rate: number;
  avg_time_to_close: number;
}

export interface UpdateLeadStatusDto {
  status: string;
  reason?: string;
}
