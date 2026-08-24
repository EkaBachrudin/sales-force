
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import './ChangePasswordModal.css';

export interface ChangePasswordModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function ChangePasswordModal({
  isOpen = false,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await api.changePassword(formData.currentPassword, formData.newPassword);
      setShowSuccess(true);

      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Close modal after success message
      setTimeout(() => {
        setShowSuccess(false);
        onClose?.();
        onSuccess?.();
      }, 2000);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Current password')) {
          setErrors({ currentPassword: error.message });
        } else {
          setErrors({ general: error.message });
        }
      } else {
        setErrors({ general: 'Failed to change password. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="change-password-modal__backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="change-password-modal__overlay">
        <div className="change-password-modal__panel">
          {/* Header */}
          <div className="change-password-modal__header">
            <h2 className="change-password-modal__title">Change Password</h2>
            <button
              onClick={onClose}
              className="change-password-modal__close"
              disabled={isLoading}
            >
              <X className="change-password-modal__close-icon" />
            </button>
          </div>

          {/* Content */}
          <div className="change-password-modal__content">
            {showSuccess ? (
              <div className="change-password-modal__success">
                <div className="change-password-modal__success-icon">
                  <svg className="change-password-modal__success-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="change-password-modal__success-title">
                  Password Changed Successfully
                </h3>
                <p className="change-password-modal__success-text">
                  Please login again with your new password.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="change-password-modal__form">
                {errors.general && (
                  <div className="change-password-modal__error-box">
                    <p className="change-password-modal__error-text">{errors.general}</p>
                  </div>
                )}

                <Input
                  label="Current Password"
                  type="password"
                  placeholder="Enter your current password"
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  error={errors.currentPassword}
                  disabled={isLoading}
                  required
                />

                <Input
                  label="New Password"
                  type="password"
                  placeholder="Enter your new password"
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  error={errors.newPassword}
                  disabled={isLoading}
                  required
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="Confirm your new password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  error={errors.confirmPassword}
                  disabled={isLoading}
                  required
                />

                <p className="change-password-modal__hint">
                  Password must be at least 6 characters long.
                </p>
              </form>
            )}
          </div>

          {/* Footer */}
          {!showSuccess && (
            <div className="change-password-modal__footer">
              <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} isLoading={isLoading}>
                Change Password
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
