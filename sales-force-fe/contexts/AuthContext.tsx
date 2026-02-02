'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes yang tidak perlu auth check
const PUBLIC_ROUTES = ['/login', '/register', '/features'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const fetchUser = async () => {
    try {
      const response = await api.getMe();
      console.log(response.data)
      setUser(response.data.user);
      // Invalidate all queries to refetch with new user context
      queryClient.invalidateQueries();
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
      // 401 is handled by API interceptor (auto-redirect to login)
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear user state regardless of API call success
      setUser(null);
      router.push('/login');
    }
  };

  useEffect(() => {
    // Skip fetching user untuk public routes
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
    if (isPublicRoute) {
      setIsLoading(false);
      return;
    }

    fetchUser();
  }, [pathname]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    fetchUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
