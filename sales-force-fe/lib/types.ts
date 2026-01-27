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
  role: string; // Backend role name (Admin, Supervisor, Sales) as string
  phone?: string;
}

export interface UpdateUserDto {
  email?: string;
  full_name?: string;
  role?: string; // Backend role name as string
  phone?: string;
  is_active?: boolean;
  password?: string;
}

export interface UsersFilters {
  search: string;
  role: string;
  status: string;
}
