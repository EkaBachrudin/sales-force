
import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { HeaderProps } from './Header';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionBanner } from '@/components/subscription/SubscriptionBanner';
import './DashboardLayout.css';

export interface DashboardLayoutProps extends Omit<HeaderProps, 'user' | 'onLogout'> {
  children: React.ReactNode;
}

export function DashboardLayout({ children, ...headerProps }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isLoading } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Don't render layout while loading auth state
  if (isLoading) {
    return (
      <div className="dashboard-layout__loading">
        <div className="dashboard-layout__spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div className="dashboard-layout__overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
        user={user}
        onLogout={logout}
      />

      <main
        className={cn(
          'dashboard-layout__main',
          sidebarCollapsed && 'dashboard-layout__main--collapsed'
        )}
      >
        <Header
          {...headerProps}
          user={user}
          onLogout={logout}
          onMenuClick={() => setSidebarOpen(true)}
          showMenuButton={isMobile}
        />

        <div className="dashboard-layout__content">
          <SubscriptionBanner />
          {children}
        </div>
      </main>
    </div>
  );
}
