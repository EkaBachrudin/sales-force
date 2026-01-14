'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header, HeaderProps } from './Header';
import { cn } from '@/lib/utils';

export interface DashboardLayoutProps extends HeaderProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children, ...headerProps }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      <main
        className={cn(
          'transition-all duration-300 min-h-screen',
          // Desktop margins
          'lg:ml-64',
          sidebarCollapsed && 'lg:ml-20',
          // Mobile - no margin since sidebar is overlay
          'ml-0'
        )}
      >
        <Header
          {...headerProps}
          onMenuClick={() => setSidebarOpen(true)}
          showMenuButton={isMobile}
        />

        <div className="p-3 sm:p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
