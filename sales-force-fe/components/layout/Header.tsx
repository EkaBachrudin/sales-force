'use client';

import React from 'react';
import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function Header({ title, subtitle, action, onMenuClick, showMenuButton = false }: HeaderProps) {
  return (
    <header className="bg-white border-b border-[var(--border)] sticky top-0 z-30">
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
              <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--text-primary)] truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--danger)] rounded-full" />
          </button>

          {/* Custom Action */}
          {action && (
            <div className="hidden sm:block ml-0 sm:ml-2">
              {action}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
