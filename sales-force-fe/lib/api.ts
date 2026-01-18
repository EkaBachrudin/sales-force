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
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.message || 'Login failed', response.status);
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

  refresh: async () => {
    const response = await fetchWithInterceptor(`${API_URL}/api/v1/auth/refresh`, {
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
};
