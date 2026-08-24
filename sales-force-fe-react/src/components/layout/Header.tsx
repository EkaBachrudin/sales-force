
import React, { useState, useRef, useEffect } from 'react';
import { Menu, LogOut, User, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import './Header.css';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  user?: User | null;
  onLogout?: () => void;
}

export function Header({
  title,
  subtitle,
  action,
  onMenuClick,
  showMenuButton = false,
  user,
  onLogout
}: HeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleLogout = () => {
    setUserMenuOpen(false);
    onLogout?.();
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
    <header className="header">
      <div className="header__inner">
        {/* Left Section - Title */}
        <div className="header__left">
          {/* Mobile Menu Button */}
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="header__menu-button"
              aria-label="Open menu"
            >
              <Menu className="header__menu-icon" />
            </button>
          )}

          {title && (
            <div className="header__title">
              <h1 className="header__title-text">{title}</h1>
              {subtitle && <p className="header__subtitle">{subtitle}</p>}
            </div>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="header__right">
          {/* User Menu - Desktop only (hidden on mobile since profile is in sidebar) */}
          {user && (
            <div className="header__user" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="header__user-button"
              >
                {/* User Avatar */}
                <div className="header__avatar">{getInitials(user.full_name)}</div>

                {/* User Info - Desktop only */}
                <div className="header__user-info">
                  <p className="header__user-name">{user.full_name}</p>
                  <p className="header__user-email">{user.email}</p>
                </div>

                <ChevronDown
                  className={cn('header__chevron', userMenuOpen && 'header__chevron--open')}
                />
              </button>

              {/* Dropdown Menu - Desktop only */}
              {userMenuOpen && (
                <div className="header__dropdown">
                  {/* Menu Items */}
                  <div className="header__dropdown-items">
                    <button onClick={handleLogout} className="header__logout">
                      <LogOut className="header__logout-icon" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Action */}
          {action && <div className="header__action">{action}</div>}
        </div>
      </div>
    </header>
  );
}
