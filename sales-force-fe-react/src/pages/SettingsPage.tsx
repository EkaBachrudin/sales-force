import { useState } from 'react';
import { User, Palette, Shield } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { ChangePasswordModal } from '@/components/settings/ChangePasswordModal';
import { useNavigate } from 'react-router-dom';
import './SettingsPage.css';

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const handleChangePasswordSuccess = () => {
    navigate('/login');
  };

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account and preferences">
      <div className="settings-page">
        {/* Profile Settings */}
        <Card>
          <div className="settings-page__card-header">
            <div className="settings-page__icon settings-page__icon--primary">
              <User className="settings-page__icon-svg settings-page__icon-svg--primary" />
            </div>
            <div>
              <h3 className="settings-page__card-title">Profile Information</h3>
              <p className="settings-page__card-subtitle">Your personal information</p>
            </div>
          </div>
          <div className="settings-page__info">
            <div className="settings-page__info-row">
              <div>
                <p className="settings-page__info-label">Name</p>
                <p className="settings-page__info-value">
                  {isLoading ? 'Loading...' : user?.full_name || '-'}
                </p>
              </div>
            </div>
            <div className="settings-page__info-row">
              <div>
                <p className="settings-page__info-label">Email</p>
                <p className="settings-page__info-value">
                  {isLoading ? 'Loading...' : user?.email || '-'}
                </p>
              </div>
            </div>
            <div className="settings-page__info-row settings-page__info-row--last">
              <div>
                <p className="settings-page__info-label">Role</p>
                <p className="settings-page__info-value">
                  {isLoading ? 'Loading...' : user?.role || '-'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Appearance */}
        <Card>
          <div className="settings-page__card-header">
            <div className="settings-page__icon settings-page__icon--reserved">
              <Palette className="settings-page__icon-svg settings-page__icon-svg--reserved" />
            </div>
            <div>
              <h3 className="settings-page__card-title">Appearance</h3>
              <p className="settings-page__card-subtitle">Customize the look and feel</p>
            </div>
          </div>
          <div className="settings-page__appearance-row">
            <span className="settings-page__appearance-label">Dark mode</span>
            <button className="settings-page__toggle">
              <span className="settings-page__toggle-knob" />
            </button>
          </div>
        </Card>

        {/* Security */}
        <Card>
          <div className="settings-page__card-header">
            <div className="settings-page__icon settings-page__icon--success">
              <Shield className="settings-page__icon-svg settings-page__icon-svg--success" />
            </div>
            <div>
              <h3 className="settings-page__card-title">Security</h3>
              <p className="settings-page__card-subtitle">Password and authentication settings</p>
            </div>
          </div>
          <Button
            variant="secondary"
            className="settings-page__button"
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
