'use client';

import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Palette } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { ChangePasswordModal } from '@/components/settings/ChangePasswordModal';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const handleChangePasswordSuccess = () => {
    // Redirect to login page after successful password change
    router.push('/login');
  };
  return (
    <DashboardLayout
      title="Settings"
      subtitle="Manage your account and preferences"
    >
      <div className="w-full space-y-6">
        {/* Profile Settings */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Profile Information
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Your personal information
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Name</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {isLoading ? 'Loading...' : user?.full_name || '-'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Email</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {isLoading ? 'Loading...' : user?.email || '-'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Role</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {isLoading ? 'Loading...' : user?.role || '-'}
                </p>
              </div>
            </div>
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
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setIsChangePasswordModalOpen(true)}
          >
            Change Password
          </Button>
        </Card>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        onSuccess={handleChangePasswordSuccess}
      />
    </DashboardLayout>
  );
}
