
import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, Shield, Key, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox';
import type { User, CreateUserDto, UpdateUserDto } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import './UserModal.css';

const roleOptions: ComboboxOption[] = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Supervisor', label: 'Supervisor' },
  { value: 'Sales', label: 'Sales' },
];

interface UserModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit?: (data: CreateUserDto | UpdateUserDto) => Promise<void> | void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
  user?: User;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  role: string;
  phone: string;
  is_active: boolean;
}

export function UserModal({
  isOpen = false,
  onClose,
  onSubmit,
  isLoading = false,
  mode,
  user,
}: UserModalProps) {
  const { user: currentUser } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'Sales',
    phone: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && user) {
        setFormData({
          email: user.email || '',
          password: '',
          confirmPassword: '',
          full_name: user.full_name || '',
          role: user.role || 'Sales',
          phone: user.phone || '',
          is_active: user.is_active ?? true,
        });
      } else {
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          full_name: '',
          role: 'Sales',
          phone: '',
          is_active: true,
        });
      }
      setErrors({});
      setSubmitError(null);
      setShowPassword(false);
    }
  }, [isOpen, mode, user]);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Name validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Name is required';
    }

    // Password validation (only for create or when changing password)
    if (mode === 'create' || formData.password) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData: CreateUserDto | UpdateUserDto = {
      email: formData.email.trim(),
      full_name: formData.full_name.trim(),
      role: formData.role,
    };

    // Only include phone if provided
    if (formData.phone.trim()) {
      submitData.phone = formData.phone.trim();
    }

    // Only include password for create or when changing password
    if (mode === 'create' && formData.password) {
      (submitData as CreateUserDto).password = formData.password;
    } else if (mode === 'edit' && formData.password) {
      (submitData as UpdateUserDto).password = formData.password;
    }

    // Only include is_active for edit mode
    if (mode === 'edit') {
      submitData.is_active = formData.is_active;
    }

    setSubmitError(null);
    try {
      await onSubmit?.(submitData);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save user. Please try again.');
    }
  };

  if (!isOpen) return null;

  const isEditingSelf = mode === 'edit' && !!user && currentUser?.id === user?.id;

  return (
    <>
      {/* Backdrop */}
      <div className="user-modal__backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="user-modal__overlay">
        <div className="user-modal__panel">
          {/* Header */}
          <div className="user-modal__header">
            <h2 className="user-modal__title">
              {mode === 'create' ? 'Add New User' : 'Edit User'}
            </h2>
            <button onClick={onClose} className="user-modal__close">
              <X className="user-modal__close-icon" />
            </button>
          </div>

          {/* Content */}
          <div className="user-modal__content">
            <form onSubmit={handleSubmit} className="user-modal__form">
              {/* Personal Information */}
              <div>
                <h3 className="user-modal__section-title">
                  <Shield className="user-modal__section-icon" />
                  User Information
                </h3>
                <div className="user-modal__section-body">
                  <Input
                    label="Full Name *"
                    placeholder="Enter full name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    error={errors.full_name}
                    required
                  />

                  <Input
                    label="Email *"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    error={errors.email}
                    leftIcon={<Mail className="user-modal__input-icon" />}
                    required
                  />

                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="0812-3456-7890"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    leftIcon={<Phone className="user-modal__input-icon" />}
                  />

                  <div>
                    <Combobox
                      options={roleOptions}
                      value={formData.role}
                      onChange={(value) => handleInputChange('role', value as string)}
                      label="Role *"
                      error={errors.role}
                      placeholder="Select role..."
                      searchPlaceholder="Search role..."
                      disabled={isEditingSelf}
                    />
                    {isEditingSelf && (
                      <p className="user-modal__hint">You cannot change your own role</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div>
                <h3 className="user-modal__section-title">
                  <Key className="user-modal__section-icon" />
                  {mode === 'create' ? 'Password' : 'Change Password (Optional)'}
                </h3>
                <div className="user-modal__section-body">
                  <div className="user-modal__password-wrapper">
                    <Input
                      label={mode === 'create' ? 'Password *' : 'New Password'}
                      type={showPassword ? 'text' : 'password'}
                      placeholder={mode === 'create' ? 'Enter password' : 'Leave empty to keep current'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      error={errors.password}
                      required={mode === 'create'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="user-modal__password-toggle"
                    >
                      {showPassword ? (
                        <svg className="user-modal__password-toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="user-modal__password-toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {(mode === 'create' || formData.password) && (
                    <Input
                      label="Confirm Password *"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      error={errors.confirmPassword}
                      required={mode === 'create' || !!formData.password}
                    />
                  )}
                </div>
              </div>

              {/* Status (Edit Mode Only) */}
              {mode === 'edit' && (
                <div>
                  <h3 className="user-modal__section-title">
                    {formData.is_active ? (
                      <UserCheck className="user-modal__status-icon user-modal__status-icon--active" />
                    ) : (
                      <UserX className="user-modal__status-icon user-modal__status-icon--inactive" />
                    )}
                    Account Status
                  </h3>
                  <div className="user-modal__status-options">
                    <label className="user-modal__status-option">
                      <input
                        type="radio"
                        name="status"
                        checked={formData.is_active === true}
                        onChange={() => handleInputChange('is_active', true)}
                        className="user-modal__radio"
                        disabled={isEditingSelf}
                      />
                      <span className="user-modal__status-option-text">Active</span>
                    </label>
                    <label className="user-modal__status-option">
                      <input
                        type="radio"
                        name="status"
                        checked={formData.is_active === false}
                        onChange={() => handleInputChange('is_active', false)}
                        className="user-modal__radio"
                        disabled={isEditingSelf}
                      />
                      <span className="user-modal__status-option-text">Inactive</span>
                    </label>
                  </div>
                  {isEditingSelf && (
                    <p className="user-modal__hint">You cannot deactivate your own account</p>
                  )}
                </div>
              )}

              {submitError && (
                <div className="user-modal__error-box" role="alert">
                  <p className="user-modal__error-text">{submitError}</p>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="user-modal__footer">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={isLoading}>
              {mode === 'create' ? 'Create User' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
