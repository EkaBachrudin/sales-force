const API_URL = 'http://localhost:4000'; // Hardcode for now

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

// Interceptor function untuk handle request
const fetchWithInterceptor = async (input: RequestInfo | URL, init?: RequestInit) => {
  const response = await fetch(input, init);

  // Auto redirect ke login jika 401 Unauthorized
  if (response.status === 401 && typeof window !== 'undefined') {
    // Hapus user state dan redirect ke login
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
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
};
