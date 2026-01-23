const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Debug: log API URL to console
if (typeof window !== 'undefined') {
  console.log('API_URL configured as:', API_URL);
}

// Custom error class that includes status code
class ApiError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// Flag untuk mencegah multiple refresh requests
let isRefreshing = false;
// Queue untuk menahan requests yang pending selama refresh
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Refresh token function
const refreshToken = async (): Promise<void> => {
  const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new ApiError(data.message || 'Failed to refresh token', response.status);
  }

  return response.json();
};

// Interceptor function untuk handle request dengan auto-refresh
const fetchWithInterceptor = async (input: RequestInfo | URL, init?: RequestInit) => {
  let response = await fetch(input, init);

  // Jika 401, coba refresh token
  if (response.status === 401 && typeof window !== 'undefined') {
    // Jika sedang refreshing, queue request ini
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => fetch(input, init))
        .catch((err) => {
          throw err;
        });
    }

    // Mulai proses refresh
    isRefreshing = true;

    try {
      // Coba refresh token
      await refreshToken();

      // Process queue yang pending
      processQueue(null);

      // Retry request original dengan token baru
      response = await fetch(input, init);
    } catch (error) {
      // Refresh gagal, process queue dengan error
      processQueue(error);

      // Redirect ke login jika refresh juga gagal
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }

      throw error;
    } finally {
      isRefreshing = false;
    }
  }

  return response;
};

export const api = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.message || 'Invalid email or password', response.status);
    }

    return data;
  },

  getMe: async () => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/auth/me`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.message || 'Failed to fetch user', response.status);
    }

    return data;
  },

  logout: async () => {
    // Get CSRF token from cookie
    const getCookie = (name: string): string | undefined => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return undefined;
    };

    const csrfToken = getCookie('csrf_token');

    const response = await fetchWithInterceptor(`${API_URL}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: csrfToken ? {
        'x-csrf-token': csrfToken,
      } : {},
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.message || 'Logout failed', response.status);
    }

    return data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    // Get CSRF token from cookie
    const getCookie = (name: string): string | undefined => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return undefined;
    };

    const csrfToken = getCookie('csrf_token');

    const response = await fetchWithInterceptor(`${API_URL}/api/v1/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.message || 'Failed to change password', response.status);
    }

    return data;
  },

  refresh: async () => {
    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.message || 'Failed to refresh token', response.status);
    }

    return data;
  },

  // Properties API
  getProperties: async (search?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const response = await fetchWithInterceptor(`${API_URL}/api/v1/properties${params.toString() ? `?${params.toString()}` : ''}`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to fetch properties', response.status);
    }

    return data;
  },

  createProperty: async (propertyData: { name: string; property_type: string }) => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(propertyData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to create property', response.status);
    }

    return data;
  },

  updateProperty: async (id: string, propertyData: { name?: string; property_type?: string }) => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/properties/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(propertyData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to update property', response.status);
    }

    return data;
  },

  deleteProperty: async (id: string) => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/properties/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to delete property', response.status);
    }

    return data;
  },

  // Leads API
  getLeads: async (params?: {
    page?: number;
    pageSize?: number;
    stage?: string;
    search?: string;
    propertyType?: string;
    source?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('limit', params.pageSize.toString());
    if (params?.stage && params.stage !== 'all') queryParams.append('status', params.stage);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.propertyType && params.propertyType !== 'all') queryParams.append('property_id', params.propertyType);
    if (params?.source && params.source !== 'all') queryParams.append('source', params.source);
    if (params?.dateFrom) queryParams.append('start_date', params.dateFrom);
    if (params?.dateTo) queryParams.append('end_date', params.dateTo);

    const response = await fetchWithInterceptor(
      `${API_URL}/api/v1/leads${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to fetch leads', response.status);
    }

    return data;
  },

  getLeadDetail: async (id: string) => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/leads/${id}`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to fetch lead detail', response.status);
    }

    return data;
  },

  createLead: async (leadData: {
    name: string;
    phone: string;
    email?: string;
    nik?: string;
    npwp?: string;
    property_id?: string;
    source?: string;
    sourceOther?: string;
    budget_range?: { min: number; max: number };
    kpr_simulation?: {
      property_price: number;
      down_payment_percentage: number;
      interest_rate: number;
      loan_term_years: number;
    };
    note?: string;
    reminder?: {
      scheduledFor: string;
      notes?: string;
    };
  }) => {
    // Transform frontend payload to backend format
    const payload: Record<string, any> = {
      name: leadData.name,
      phone: leadData.phone,
    };

    if (leadData.email) payload.email = leadData.email;
    if (leadData.nik) payload.nik = leadData.nik;
    if (leadData.npwp) payload.npwp = leadData.npwp;
    if (leadData.property_id) payload.property_id = leadData.property_id;
    if (leadData.source) payload.source = leadData.source;
    if (leadData.budget_range) payload.budget_range = leadData.budget_range;
    if (leadData.note) payload.notes = leadData.note;
    if (leadData.kpr_simulation) {
      payload.kpr_simulation = {
        property_price: leadData.kpr_simulation.property_price,
        down_payment_percentage: leadData.kpr_simulation.down_payment_percentage,
        interest_rate: leadData.kpr_simulation.interest_rate,
        loan_term_years: leadData.kpr_simulation.loan_term_years,
      };
    }
    if (leadData.reminder) {
      payload.reminder = {
        remind_at: leadData.reminder.scheduledFor,
        message: leadData.reminder.notes,
      };
    }

    const response = await fetchWithInterceptor(`${API_URL}/api/v1/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to create lead', response.status);
    }

    return data;
  },

  updateLead: async (id: string, leadData: {
    name?: string;
    phone?: string;
    email?: string;
    nik?: string;
    npwp?: string;
    property_id?: string;
    budget_range?: { min: number; max: number };
    status?: string;
    notes?: string;
    kprPrice?: number;
    interest_rate?: number;
    loan_term_years?: number;
    reminders?: Array<{
      id?: string;
      remind_at: string;
      message: string;
      is_completed: string;
      lead_id: string;
      user_id: string;
      created_at: string;
      notes?: string;
    }>;
  }) => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/leads/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(leadData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to update lead', response.status);
    }

    return data;
  },

  addLeadActivity: async (id: string, activityData: {
    type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'other';
    notes: string;
  }) => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/leads/${id}/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(activityData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to add activity', response.status);
    }

    return data;
  },

  // Dashboard API
  getDashboardOverview: async () => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/dashboard/overview`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to fetch dashboard overview', response.status);
    }

    return data;
  },

  // Reminders API
  getUpcomingReminders: async (params?: { limit?: number; hours_ahead?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.hours_ahead) queryParams.append('hours_ahead', params.hours_ahead.toString());

    const response = await fetchWithInterceptor(
      `${API_URL}/api/v1/reminders/upcoming${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to fetch reminders', response.status);
    }

    return data;
  },

  createReminder: async (reminderData: {
    lead_id: string;
    remind_at: string;
    message?: string;
  }) => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(reminderData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to create reminder', response.status);
    }

    return data;
  },

  updateReminder: async (reminderId: string, reminderData: {
    is_completed?: boolean;
    remind_at?: string;
    message?: string;
  }) => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/reminders/${reminderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(reminderData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to update reminder', response.status);
    }

    return data;
  },

  deleteReminder: async (reminderId: string) => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/reminders/${reminderId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to delete reminder', response.status);
    }

    return data;
  },

  // Analytics API
  getAnalyticsMetrics: async (params?: {
    period?: 'today' | 'week' | 'month' | 'year';
    compare_with?: 'previous_period' | 'last_year';
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.compare_with) queryParams.append('compare_with', params.compare_with);

    const response = await fetchWithInterceptor(
      `${API_URL}/api/v1/analytics/metrics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error || data.message || 'Failed to fetch analytics metrics', response.status);
    }

    return data;
  },

  getAnalyticsFunnel: async (params?: {
    period?: 'today' | 'week' | 'month' | 'year';
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);

    const response = await fetchWithInterceptor(
      `${API_URL}/api/v1/analytics/funnel${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error || data.message || 'Failed to fetch analytics funnel', response.status);
    }

    return data;
  },

  getAnalyticsTrend: async (params?: {
    months?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.months) queryParams.append('months', params.months.toString());

    const response = await fetchWithInterceptor(
      `${API_URL}/api/v1/analytics/trend${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error || data.message || 'Failed to fetch analytics trend', response.status);
    }

    return data;
  },

  getAnalyticsSources: async (params?: {
    period?: 'today' | 'week' | 'month' | 'year';
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);

    const response = await fetchWithInterceptor(
      `${API_URL}/api/v1/analytics/sources${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error || data.message || 'Failed to fetch analytics sources', response.status);
    }

    return data;
  },

  getAnalyticsDashboard: async (params?: {
    period?: 'today' | 'week' | 'month' | 'year';
    trend_months?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.trend_months) queryParams.append('trend_months', params.trend_months.toString());

    const response = await fetchWithInterceptor(
      `${API_URL}/api/v1/analytics/dashboard${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error || data.message || 'Failed to fetch analytics dashboard', response.status);
    }

    return data;
  },
};
