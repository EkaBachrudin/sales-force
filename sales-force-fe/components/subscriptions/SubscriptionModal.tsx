'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreateSubscriptionDto, Subscription, SubscriptionType, SubscriptionStatus, UpdateSubscriptionDto, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useUsers } from '@/hooks/useUsers';

const subscriptionTypeOptions = [
  { value: SubscriptionType.MONTHLY, label: 'Monthly' },
  { value: SubscriptionType.QUARTERLY, label: 'Quarterly' },
  { value: SubscriptionType.ANNUAL, label: 'Annual' },
];

const statusOptions = [
  { value: SubscriptionStatus.PENDING, label: 'Pending' },
  { value: SubscriptionStatus.ACTIVE, label: 'Active' },
  { value: SubscriptionStatus.OVERDUE, label: 'Overdue' },
  { value: SubscriptionStatus.CANCELLED, label: 'Cancelled' },
];

interface SubscriptionModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit?: (data: CreateSubscriptionDto | UpdateSubscriptionDto) => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
  subscription?: Subscription;
}

interface FormData {
  user_id: string;
  subscription_type: SubscriptionType;
  amount: string;
  due_date: string;
  status?: SubscriptionStatus;
  notes: string;
}

export function SubscriptionModal({
  isOpen = false,
  onClose,
  onSubmit,
  isLoading = false,
  mode,
  subscription,
}: SubscriptionModalProps) {
  // Fetch users for the dropdown
  const { data: usersData } = useUsers(1, 1000, { search: '', role: 'all', status: 'all' }, isOpen);

  const [formData, setFormData] = useState<FormData>({
    user_id: '',
    subscription_type: SubscriptionType.MONTHLY,
    amount: '',
    due_date: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && subscription) {
        setFormData({
          user_id: subscription.user_id || '',
          subscription_type: subscription.subscription_type || SubscriptionType.MONTHLY,
          amount: subscription.amount?.toString() || '',
          due_date: subscription.due_date ? new Date(subscription.due_date).toISOString().split('T')[0] : '',
          status: subscription.status || SubscriptionStatus.PENDING,
          notes: subscription.notes || '',
        });
      } else {
        setFormData({
          user_id: '',
          subscription_type: SubscriptionType.MONTHLY,
          amount: '',
          due_date: '',
          notes: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, subscription]);

  const handleInputChange = (field: keyof FormData, value: string | SubscriptionType) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // User validation
    if (!formData.user_id.trim()) {
      newErrors.user_id = 'User is required';
    }

    // Subscription type validation
    if (!formData.subscription_type) {
      newErrors.subscription_type = 'Subscription type is required';
    }

    // Amount validation
    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    // Due date validation
    if (!formData.due_date.trim()) {
      newErrors.due_date = 'Due date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData: CreateSubscriptionDto | UpdateSubscriptionDto = mode === 'edit'
      ? {
          subscription_type: formData.subscription_type,
          amount: parseFloat(formData.amount),
          due_date: formData.due_date,
          ...(formData.status && { status: formData.status }),
          ...(formData.notes.trim() && { notes: formData.notes.trim() }),
        }
      : {
          user_id: formData.user_id.trim(),
          subscription_type: formData.subscription_type,
          amount: parseFloat(formData.amount),
          due_date: formData.due_date,
          ...(formData.notes.trim() && { notes: formData.notes.trim() }),
        };

    onSubmit?.(submitData);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-text-primary">
              {mode === 'create' ? 'Add New Subscription' : 'Edit Subscription'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* User Selection */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  User *
                </label>
                <select
                  value={formData.user_id}
                  onChange={(e) => handleInputChange('user_id', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-[var(--primary)]',
                    errors.user_id ? 'border-red-500' : 'border-border'
                  )}
                  required
                  disabled={mode === 'edit'}
                >
                  <option value="">Select a user</option>
                  {usersData?.data?.map((user: User) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </option>
                  ))}
                </select>
                {errors.user_id && (
                  <p className="text-xs text-red-500 mt-1">{errors.user_id}</p>
                )}
              </div>

              {/* Subscription Type */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Subscription Type *
                </label>
                <select
                  value={formData.subscription_type}
                  onChange={(e) => handleInputChange('subscription_type', e.target.value as SubscriptionType)}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-[var(--primary)]',
                    errors.subscription_type ? 'border-red-500' : 'border-border'
                  )}
                  required
                >
                  {subscriptionTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.subscription_type && (
                  <p className="text-xs text-red-500 mt-1">{errors.subscription_type}</p>
                )}
              </div>

              {/* Amount */}
              <Input
                label="Amount *"
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                error={errors.amount}
                leftIcon={<DollarSign className="w-4 h-4" />}
                step="0.01"
                min="0"
                required
              />

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-[var(--primary)]',
                    errors.due_date ? 'border-red-500' : 'border-border'
                  )}
                  required
                />
                {errors.due_date && (
                  <p className="text-xs text-red-500 mt-1">{errors.due_date}</p>
                )}
              </div>

              {/* Status (Edit Mode Only) */}
              {mode === 'edit' && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value as SubscriptionStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-[var(--primary)]"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Notes
                </label>
                <textarea
                  placeholder="Add notes..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-[var(--primary)] resize-none"
                />
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={isLoading}>
              {mode === 'create' ? 'Create Subscription' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
