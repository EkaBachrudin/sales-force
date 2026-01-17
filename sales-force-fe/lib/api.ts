const API_URL = 'http://localhost:4000'; // Hardcode for now

// Debug: log API URL to console
if (typeof window !== 'undefined') {
  console.log('API_URL configured as:', API_URL);
}

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
      throw new Error(data.message || 'Login failed');
    }

    return data;
  },

  getMe: async () => {
    const response = await fetch(`${API_URL}/api/v1/auth/me`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user');
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

    const response = await fetch(`${API_URL}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: csrfToken ? {
        'x-csrf-token': csrfToken,
      } : {},
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Logout failed');
    }

    return data;
  },
};
