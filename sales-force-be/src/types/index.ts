// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// User Types
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  SALES = 'sales',
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
  password_hash?: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

// Lead Types
export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  WON = 'won',
  LOST = 'lost',
}

export enum LeadPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface Lead {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  status: LeadStatus;
  priority: LeadPriority;
  estimated_value?: number;
  source?: string;
  notes?: string;
  assigned_to?: string;
  expected_close_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateLeadDto {
  company_name: string;
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  status?: LeadStatus;
  priority?: LeadPriority;
  estimated_value?: number;
  source?: string;
  notes?: string;
  assigned_to?: string;
  expected_close_date?: Date;
}

// Interaction Types
export interface Interaction {
  id: string;
  lead_id: string;
  user_id: string;
  type: string;
  subject?: string;
  description?: string;
  outcome?: string;
  next_follow_up_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateInteractionDto {
  lead_id: string;
  type: string;
  subject?: string;
  description?: string;
  outcome?: string;
  next_follow_up_date?: Date;
}

// Task Types
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: Date;
  assigned_to?: string;
  lead_id?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: Date;
  assigned_to?: string;
  lead_id?: string;
}

// JWT Payload
export interface JwtPayload {
  jti: string;
  sub: string;
  email: string;
  role: UserRole;
  session_id: string; // Session ID from user_sessions table for secure session validation
  iat: number;
  exp: number;
}

// Auth Types
export interface DeviceInfo {
  type: string;
  os: string;
  browser: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  device_info: DeviceInfo;
  ip_address: string;
  user_agent: string;
  is_active: boolean;
  expires_at: Date;
  last_activity_at: Date;
  created_at: Date;
}

export interface LoginResponse {
  user: {
    id: string;
    full_name: string;
    email: string;
    role: UserRole;
  };
  session: {
    id: string;
    device_info: DeviceInfo;
    expires_at: string;
  };
}

export interface RefreshTokenResponse {
  csrf_token: string;
}

export interface AuthResponse extends ApiResponse<LoginResponse | RefreshTokenResponse> {}

// Auth DTOs
export interface RegisterDto {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface LoginResponseDto {
  success: boolean;
  message: string;
  data: LoginResponse;
}

// Lead Management Types (Sales Force CRM)
export enum CrmLeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  SURVEYED = 'surveyed',
  NEGOTIATING = 'negotiating',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export enum CrmLeadSource {
  LANDING_PAGE = 'landing_page',
  WHATSAPP = 'whatsapp',
  MANUAL = 'manual',
  VISIT = 'visit'
}

export enum CrmActivityType {
  STATUS_CHANGE = 'status_change',
  NOTE_ADDED = 'note_added',
  CALL = 'call',
  WHATSAPP = 'whatsapp',
  LEAD_CREATED = 'lead_created',
}

export interface BudgetRange {
  min: number;
  max: number;
}

export interface KPRSimulation {
  property_price: number;
  down_payment_percentage: number;
  down_payment?: number;
  interest_rate: number;
  loan_term_years: number;
  estimated_monthly_payment?: number;
}

export interface Reminder {
  id?: string;
  remind_at: Date;
  message?: string;
  is_completed?: boolean;
}

export interface CrmLead {
  id: string;
  name: string;
  nik?: string;
  npwp?: string;
  phone: string;
  email?: string;
  status: CrmLeadStatus;
  source: CrmLeadSource;
  property_id?: string;
  property_url?: string;
  property?: {
    id: string;
    name: string;
    property_type: string;
    price: number;
    city: string;
    province?: string;
  };
  property_price?: number;
  budget_range?: BudgetRange;
  kpr_simulation?: KPRSimulation;
  down_payment_percentage?: number;
  interest_rate?: number;
  loan_term_years?: number;
  estimated_monthly_payment?: number;
  assigned_to?: string;
  assigned_to_name?: string;
  notes?: string;
  next_follow_up_at?: Date;
  last_followed_up_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CrmLeadActivity {
  id: string;
  lead_id: string;
  user_id: string;
  user_name?: string;
  activity_type: CrmActivityType;
  old_status?: CrmLeadStatus;
  new_status?: CrmLeadStatus;
  notes?: string;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface CrmWhatsAppMessage {
  id: string;
  lead_id: string;
  message_type: 'incoming' | 'outgoing';
  content: string;
  sent_at: Date;
  created_at: Date;
}

export interface CrmReminderSchedule {
  id: string;
  user_id: string;
  lead_id: string;
  remind_at: Date;
  message?: string;
  is_completed: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CrmProperty {
  id: string;
  name: string;
  property_type: string;
  price: number;
  city: string;
  province?: string;
}

// List Leads Query Parameters
export interface GetLeadsQuery {
  page?: number;
  limit?: number;
  status?: CrmLeadStatus;
  search?: string;
  start_date?: string;
  end_date?: string;
  property_id?: string;
  source?: CrmLeadSource;
  sort_by?: 'created_at' | 'name' | 'status' | 'next_follow_up_at';
  sort_order?: 'asc' | 'desc';
}

// Simplified Lead for list view
export interface CrmLeadListItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: CrmLeadStatus;
  source: CrmLeadSource;
  property?: {
    id: string;
    name: string;
  };
  created_at: Date;
}

export interface GetLeadsResponse {
  leads: CrmLeadListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Get Lead Detail Response
export interface CrmLeadDetailResponse {
  lead: CrmLead;
  activities: CrmLeadActivity[];
  whatsapp_messages: CrmWhatsAppMessage[];
  reminders: CrmReminderSchedule[];
}

// Create Lead DTO
export interface CrmCreateLeadDto {
  name: string;
  phone: string;
  email?: string;
  nik?: string;
  npwp?: string;
  source?: CrmLeadSource;
  property_id?: string;
  property_url?: string;
  budget_range?: BudgetRange;
  status?: CrmLeadStatus;
  notes?: string;
  kpr_simulation?: KPRSimulation;
  reminder?: Omit<Reminder, 'id'>;
}

// Update Lead DTO
export interface CrmUpdateLeadDto {
  name?: string;
  phone?: string;
  email?: string;
  nik?: string;
  npwp?: string;
  source?: CrmLeadSource;
  property_id?: string;
  property_url?: string;
  budget_range?: BudgetRange;
  status?: CrmLeadStatus;
  notes?: string;
  last_followed_up_at?: Date;
  next_follow_up_at?: Date;
  kpr_simulation?: KPRSimulation;
  reminder?: Reminder;
}

// Add Activity DTO
export interface CrmAddActivityDto {
  activity_type: CrmActivityType;
  old_status?: CrmLeadStatus;
  new_status?: CrmLeadStatus;
  notes?: string;
  metadata?: Record<string, any>;
}

// Get Properties Query
export interface GetPropertiesQuery {
  assigned_to?: string;
}

// Properties Module Types
export interface Property {
  id: string;
  name: string;
  property_type: string;
  created_at: Date;
}

export interface GetPropertiesQueryV2 {
  search?: string;
}

export interface CreatePropertyDto {
  name: string;
  property_type: string;
}

export interface UpdatePropertyDto {
  name?: string;
  property_type?: string;
}

// Dashboard Types
export interface DashboardOverviewMetrics {
  total_leads: {
    value: number;
    trend_value: number;
    trend_label: string;
    trend_period: string;
  };
  new_leads_this_month: {
    value: number;
    trend_value: number;
    trend_label: string;
    trend_percentage: boolean;
  };
  surveyed: {
    value: number;
    trend_value: number;
    trend_label: string;
  };
  closed: {
    value: number;
    trend_value: number;
    trend_label: string;
  };
}

// Reminder Types
export interface ReminderLeadInfo {
  id: string;
  name: string;
  phone: string;
  email?: string;
  property?: {
    id: string;
    name: string;
    property_type: string;
    price: number;
  };
}

export interface ReminderItem {
  id: string;
  remind_at: Date;
  remind_at_formatted: string;
  message?: string;
  is_completed: boolean;
  lead: ReminderLeadInfo;
}

export interface UpcomingRemindersResponse {
  reminders: ReminderItem[];
  meta: {
    total: number;
    limit: number;
    hours_ahead: number;
  };
}

export interface CreateReminderDto {
  lead_id: string;
  remind_at: Date;
  message?: string;
}

export interface UpdateReminderDto {
  is_completed?: boolean;
  remind_at?: Date;
  message?: string;
}

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
