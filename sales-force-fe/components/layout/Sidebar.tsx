'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Kanban,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' },
  { label: 'Leads', icon: Users, route: '/leads' },
  { label: 'Pipeline', icon: Kanban, route: '/pipeline' },
  { label: 'Analytics', icon: BarChart2, route: '/analytics' },
  { label: 'Settings', icon: Settings, route: '/settings' },
];

export interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ collapsed = false, onToggle, mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  // Close mobile sidebar when a link is clicked
  const handleLinkClick = () => {
    if (mobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside
      className={cn(
        'fixed top-0 h-screen bg-white border-r border-[var(--border)] transition-all duration-300 z-40 lg:z-20',
        // Desktop behavior
        'lg:translate-x-0',
        collapsed ? 'lg:w-20' : 'lg:w-64',
        // Mobile behavior - overlay drawer
        'w-64',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border)]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
              <Kanban className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg text-[var(--text-primary)]">
              Sales CRM
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center mx-auto">
            <Kanban className="w-5 h-5 text-white" />
          </div>
        )}

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.route || pathname.startsWith(item.route + '/');

          return (
            <Link
              key={item.route}
              href={item.route}
              onClick={handleLinkClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative',
                isActive
                  ? 'bg-[rgba(37,99,235,0.1)] text-[var(--primary)] border-l-4 border-[var(--primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-gray-50 border-l-4 border-transparent'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {(!collapsed || mobileOpen) && (
                <>
                  <span className="font-medium">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto bg-[var(--danger)] text-white text-xs font-medium px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle - Desktop only */}
      <button
        onClick={onToggle}
        className="hidden lg:flex absolute bottom-4 right-4 w-8 h-8 items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        )}
      </button>
    </aside>
  );
}
