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
