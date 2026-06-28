// Auth types based on backend API
export interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'manager' | 'sales';
}

export interface Session {
  id: string;
  device_info: {
    type: string;
    os: string;
    browser: string;
  };
  expires_at: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    session: Session;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}
