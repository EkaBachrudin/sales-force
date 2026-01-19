import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Dashboard Types
export interface DashboardMetrics {
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
  remind_at: string;
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

// Dashboard Hook
export function useDashboardOverview(enabled = true) {
  return useQuery<DashboardMetrics>({
    queryKey: ['dashboard', 'overview'],
    queryFn: async () => {
      const response = await api.getDashboardOverview();
      return response.data as DashboardMetrics;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled,
  });
}

// Reminders Hook
export function useUpcomingReminders(params?: { limit?: number; hours_ahead?: number }, enabled = true) {
  return useQuery<UpcomingRemindersResponse>({
    queryKey: ['reminders', 'upcoming', params],
    queryFn: async () => {
      const response = await api.getUpcomingReminders(params);
      return response.data as UpcomingRemindersResponse;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled,
  });
}
