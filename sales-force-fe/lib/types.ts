import { Lead } from '@/components/dashboard/LeadCard';
import { Reminder } from '@/components/dashboard/RemindersSection';
import { PipelineStage } from '@/components/dashboard/KanbanBoard';

// Re-export types from components
export type { Lead, Reminder, PipelineStage };

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
  property_type: string;
  created_at: string;
}

export interface CreatePropertyDto {
  name: string;
  property_type: string;
}

export interface UpdatePropertyDto {
  name?: string;
  property_type?: string;
}
