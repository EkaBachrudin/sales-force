'use client';

import React from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Palette } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  return (
    <DashboardLayout
      title="Settings"
      subtitle="Manage your account and preferences"
    >
      <div className="max-w-2xl space-y-6">
        {/* Profile Settings */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Profile Settings
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Update your personal information
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Name</p>
                <p className="text-sm text-[var(--text-secondary)]">John Doe</p>
              </div>
              <Button variant="ghost" size="sm">Edit</Button>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Email</p>
                <p className="text-sm text-[var(--text-secondary)]">john.doe@example.com</p>
              </div>
              <Button variant="ghost" size="sm">Edit</Button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Phone</p>
                <p className="text-sm text-[var(--text-secondary)]">+62 812-3456-7890</p>
              </div>
              <Button variant="ghost" size="sm">Edit</Button>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Notifications
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Manage your notification preferences
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Email notifications', checked: true },
              { label: 'Push notifications', checked: true },
              { label: 'SMS notifications', checked: false },
              { label: 'WhatsApp reminders', checked: true },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <span className="text-sm text-[var(--text-primary)]">{item.label}</span>
                <button
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    item.checked ? 'bg-[var(--primary)]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      item.checked ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Appearance */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Appearance
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Customize the look and feel
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[var(--text-primary)]">Dark mode</span>
            <button
              className="relative w-11 h-6 rounded-full bg-gray-300 transition-colors"
            >
              <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform" />
            </button>
          </div>
        </Card>

        {/* Security */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Security
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Password and authentication settings
              </p>
            </div>
          </div>
          <Button variant="secondary" className="w-full">
            Change Password
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  );
}
