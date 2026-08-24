
import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users as UsersIcon,
  Kanban,
  BarChart2,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  Shield,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User as UserType } from './Header';
import './Sidebar.css';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  badge?: number;
  requiredRoles?: string[]; // Backend role names that can see this item
}

const baseNavItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' },
  { label: 'Leads', icon: UsersIcon, route: '/leads' },
  { label: 'Pipeline', icon: Kanban, route: '/pipeline' },
  { label: 'Analytics', icon: BarChart2, route: '/analytics' },
  { label: 'Properties', icon: Building2, route: '/properties' },
  { label: 'Users', icon: Shield, route: '/users', requiredRoles: ['Admin', 'Supervisor'] },
  { label: 'Subscriptions', icon: Receipt, route: '/subscriptions', requiredRoles: ['Admin'] },
  { label: 'Settings', icon: Settings, route: '/settings' },
];

export interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  user?: UserType | null;
  onLogout?: () => void;
}

export function Sidebar({ collapsed = false, onToggle, mobileOpen = false, onCloseMobile, user, onLogout }: SidebarProps) {
  const { pathname } = useLocation();

  // Filter nav items based on user role
  const navItems = useMemo(() => {
    return baseNavItems.filter(item => {
      // If no roles required, show to everyone
      if (!item.requiredRoles || item.requiredRoles.length === 0) {
        return true;
      }
      // Check if user's role matches any of the required roles
      return item.requiredRoles.includes(user?.role || '');
    });
  }, [user?.role]);

  // Close mobile sidebar when a link is clicked
  const handleLinkClick = () => {
    if (mobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside
      className={cn(
        'sidebar',
        collapsed && 'sidebar--collapsed',
        !mobileOpen && 'sidebar--mobile-closed'
      )}
    >
      {/* Logo Section */}
      <div className="sidebar__logo">
        {!collapsed && (
          <Link to="/" className="sidebar__logo-link">
            <img src="/sforce-logo.webp" alt="Sales CRM Pro" className="sidebar__logo-img" />
          </Link>
        )}
        {collapsed && (
          <Link to="/" className="sidebar__logo-link">
            <img src="/sforce-icon.webp" alt="Sales CRM Pro" className="sidebar__logo-img" />
          </Link>
        )}

        {/* Mobile Close Button */}
        <button onClick={onCloseMobile} className="sidebar__close">
          <X className="sidebar__close-icon" />
        </button>
      </div>

      {/* Navigation */}
      <nav className={cn('sidebar__nav', collapsed && 'sidebar__nav--collapsed')}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.route || (item.route !== '/' && pathname.startsWith(item.route + '/'));

          return (
            <>
              <Link
                key={item.route}
                to={item.route}
                onClick={handleLinkClick}
                className={cn(
                  'sidebar__link',
                  collapsed && 'sidebar__link--collapsed',
                  isActive && 'sidebar__link--active'
                )}
              >
                {isActive && (
                  <div
                    className={cn(
                      'sidebar__link-indicator',
                      collapsed && 'sidebar__link-indicator--collapsed'
                    )}
                  ></div>
                )}

                <Icon className="sidebar__link-icon" />
                {(!collapsed || mobileOpen) && (
                  <>
                    <span className="sidebar__link-label">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="sidebar__link-badge">{item.badge}</span>
                    )}
                  </>
                )}
              </Link>
            </>
          );
        })}
      </nav>

      {/* User Profile Section - Mobile only */}
      {user && mobileOpen && (
        <div className="sidebar__mobile-user">
          <div className="sidebar__mobile-user-inner">
            {/* User Info */}
            <div className="sidebar__user">
              <div className="sidebar__user-avatar">{getInitials(user.full_name)}</div>
              <div className="sidebar__user-info">
                <p className="sidebar__user-name">{user.full_name}</p>
                <p className="sidebar__user-email">{user.email}</p>
              </div>
            </div>

            {/* Role Badge */}
            <div className="sidebar__role">
              <span className="sidebar__role-badge">{user.role}</span>
            </div>

            {/* Profile & Logout Buttons */}
            <div className="sidebar__mobile-actions">
              <button
                onClick={() => {
                  onLogout?.();
                  onCloseMobile?.();
                }}
                className="sidebar__logout"
              >
                <LogOut className="sidebar__logout-icon" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collapse Toggle - Desktop only */}
      <button onClick={onToggle} className="sidebar__toggle">
        {collapsed ? (
          <ChevronRight className="sidebar__toggle-icon" />
        ) : (
          <ChevronLeft className="sidebar__toggle-icon" />
        )}
      </button>
    </aside>
  );
}
