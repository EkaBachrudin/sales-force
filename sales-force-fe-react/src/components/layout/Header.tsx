
import React, { useState, useRef, useEffect } from 'react';
import { Menu, LogOut, User, ChevronDown } from 'lucide-react';

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
    <header className="bg-white sticky top-0 z-30">
      <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 md:px-6">
        {/* Left Section - Title */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          {/* Mobile Menu Button */}
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden flex-shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {title && (
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-text-primary truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-text-secondary mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
       
          {/* User Menu - Desktop only (hidden on mobile since profile is in sidebar) */}
          {user && (
            <div className="relative hidden md:block" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {/* User Avatar */}
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
                  {getInitials(user.full_name)}
                </div>

                {/* User Info - Desktop only */}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-text-primary truncate max-w-[120px]">
                    {user.full_name}
                  </p>
                  <p className="text-xs text-text-secondary truncate max-w-[120px]">
                    {user.email}
                  </p>
                </div>

                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu - Desktop only */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-border py-1 z-50">
                  {/* Menu Items */}
                  <div className="py-1">

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Action */}
          {action && (
            <div className=" ml-0 sm:ml-2">
              {action}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
