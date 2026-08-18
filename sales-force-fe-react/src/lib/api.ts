const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
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
  if (response.status === 401) {
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

      // Redirect ke login jika refresh juga gagal, kecuali untuk public routes
      const publicRoutes = ['/login', '/register', '/features'];
      const isPublicRoute = publicRoutes.some(route => window.location.pathname.startsWith(route));
      if (!isPublicRoute) {
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

  getPropertyDetail: async (id: string) => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/properties/${id}`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to fetch property detail', response.status);
    }

    return data;
  },

  getPropertySiteplan: async (id: string) => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/properties/${id}/siteplan`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to fetch siteplan data', response.status);
    }

    return data;
  },

  createProperty: async (formData: FormData) => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/properties`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to create property', response.status);
    }

    return data;
  },

  updateProperty: async (id: string, formData: FormData, deleteSiteplan?: boolean) => {
    let url = `${API_URL}/api/v1/properties/${id}`;
    if (deleteSiteplan) {
      url += '?delete_siteplan=true';
    }
    const response = await fetchWithInterceptor(url, {
      method: 'PUT',
      credentials: 'include',
      body: formData,
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

  createBlock: async (propertyId: string, blockData: { name: string }) => {
    const getCookie = (name: string): string | undefined => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return undefined;
    };

    const csrfToken = getCookie('csrf_token');

    const response = await fetchWithInterceptor(`${API_URL}/api/v1/properties/${propertyId}/blocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(blockData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.message || 'Failed to create block', response.status);
    }

    return data;
  },

  updateBlock: async (blockId: string, blockData: { name: string }) => {
    const getCookie = (name: string): string | undefined => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return undefined;
    };

    const csrfToken = getCookie('csrf_token');

    const response = await fetchWithInterceptor(`${API_URL}/api/v1/blocks/${blockId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(blockData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.message || 'Failed to update block', response.status);
    }

    return data;
  },

  deleteBlock: async (blockId: string) => {
    const getCookie = (name: string): string | undefined => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return undefined;
    };

    const csrfToken = getCookie('csrf_token');

    const response = await fetchWithInterceptor(`${API_URL}/api/v1/blocks/${blockId}`, {
      method: 'DELETE',
      headers: {
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.message || 'Failed to delete block', response.status);
    }

    return data;
  },

  getUnits: async (blockId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);

    const response = await fetchWithInterceptor(
      `${API_URL}/api/v1/blocks/${blockId}/units${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to fetch units', response.status);
    }

    return data;
  },

  createUnit: async (blockId: string, unitData: { name: string; land_area?: number }) => {
    const getCookie = (name: string): string | undefined => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return undefined;
    };

    const csrfToken = getCookie('csrf_token');

    const response = await fetchWithInterceptor(`${API_URL}/api/v1/blocks/${blockId}/units`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(unitData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.message || 'Failed to create unit', response.status);
    }

    return data;
  },

  updateUnit: async (unitId: string, unitData: { name: string; land_area?: number }) => {
    const getCookie = (name: string): string | undefined => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return undefined;
    };

    const csrfToken = getCookie('csrf_token');

    const response = await fetchWithInterceptor(`${API_URL}/api/v1/units/${unitId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(unitData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.message || 'Failed to update unit', response.status);
    }

    return data;
  },

  deleteUnit: async (unitId: string) => {
    const getCookie = (name: string): string | undefined => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return undefined;
    };

    const csrfToken = getCookie('csrf_token');

    const response = await fetchWithInterceptor(`${API_URL}/api/v1/units/${unitId}`, {
      method: 'DELETE',
      headers: {
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.message || 'Failed to delete unit', response.status);
    }

    return data;
  },

  getUnitDetail: async (unitId: string) => {
    const response = await fetchWithInterceptor(
      `${API_URL}/api/v1/units/${unitId}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to fetch unit detail', response.status);
    }

    return data;
  },

  assignLeadToUnit: async (unitId: string, leadId: string) => {
    const getCookie = (name: string): string | undefined => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return undefined;
    };

    const csrfToken = getCookie('csrf_token');

    const response = await fetchWithInterceptor(`${API_URL}/api/v1/units/${unitId}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ lead_id: leadId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to assign lead to unit', response.status);
    }

    return data;
  },

  // Leads API
  getLeads: async (params?: {
    page?: number;
    pageSize?: number;
    stage?: string;
    statuses?: string;
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
    if (params?.statuses) queryParams.append('statuses', params.statuses);
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

  deleteLead: async (id: string) => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/leads/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to delete lead', response.status);
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
    data_range_months?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.trend_months) queryParams.append('trend_months', params.trend_months.toString());
    if (params?.data_range_months) queryParams.append('data_range_months', params.data_range_months.toString());

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

  // Users API
  getUsers: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
    is_active?: string;
  }) => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('limit', params.pageSize.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role && params.role !== 'all') queryParams.append('role', params.role);
    if (params?.is_active && params.is_active !== 'all') queryParams.append('is_active', params.is_active);

    const response = await fetchWithInterceptor(
      `${API_URL}/api/v1/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to fetch users', response.status);
    }

    return data;
  },

  getUserDetail: async (id: string) => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/users/${id}`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to fetch user detail', response.status);
    }

    return data;
  },

  createUser: async (userData: {
    email: string;
    password: string;
    full_name: string;
    role: string;
    phone?: string;
  }) => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to create user', response.status);
    }

    return data;
  },

  updateUser: async (id: string, userData: {
    email?: string;
    full_name?: string;
    role?: string;
    phone?: string;
    is_active?: boolean;
    password?: string;
  }) => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to update user', response.status);
    }

    return data;
  },

  deleteUser: async (id: string) => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/users/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to delete user', response.status);
    }

    return data;
  },

  // Subscriptions API
  getSubscriptions: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    subscription_type?: string;
  }) => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('limit', params.pageSize.toString());
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params?.subscription_type && params.subscription_type !== 'all') queryParams.append('subscription_type', params.subscription_type);

    const response = await fetchWithInterceptor(
      `${API_URL}/api/v1/subscriptions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to fetch subscriptions', response.status);
    }

    return data;
  },

  createSubscription: async (subscriptionData: {
    user_id: string;
    subscription_type: string;
    amount: number;
    due_date: string;
    notes?: string;
  }) => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(subscriptionData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to create subscription', response.status);
    }

    return data;
  },

  updateSubscription: async (id: string, subscriptionData: {
    subscription_type?: string;
    amount?: number;
    due_date?: string;
    status?: string;
    notes?: string;
  }) => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/subscriptions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(subscriptionData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to update subscription', response.status);
    }

    return data;
  },

  deleteSubscription: async (id: string) => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/subscriptions/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to delete subscription', response.status);
    }

    return data;
  },

  // Pipeline API
  getPipeline: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    const response = await fetchWithInterceptor(
      `${API_URL}/api/v1/pipeline${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to fetch pipeline data', response.status);
    }

    return data;
  },

  getPipelineMetrics: async () => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/pipeline/metrics`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to fetch pipeline metrics', response.status);
    }

    return data;
  },

  updateLeadStatus: async (leadId: string, statusData: {
    status: string;
    reason?: string;
  }) => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/pipeline/leads/${leadId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(statusData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error?.message || data.message || 'Failed to update lead status', response.status);
    }

    return data;
  },

  // Export Leads API
  exportLeads: async (params?: {
    stage?: string;
    search?: string;
    propertyType?: string;
    source?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const queryParams = new URLSearchParams();

    if (params?.stage && params.stage !== 'all') queryParams.append('status', params.stage);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.propertyType && params.propertyType !== 'all') queryParams.append('property_id', params.propertyType);
    if (params?.source && params.source !== 'all') queryParams.append('source', params.source);
    if (params?.dateFrom) queryParams.append('start_date', params.dateFrom);
    if (params?.dateTo) queryParams.append('end_date', params.dateTo);

    const response = await fetchWithInterceptor(
      `${API_URL}/api/v1/leads/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new ApiError(data.error?.message || data.message || 'Failed to export leads', response.status);
    }

    // Return blob for download
    return response.blob();
  },
};
