
import React, { useState, useEffect } from 'react';
import { X, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SubscriptionType, SubscriptionStatus } from '@/lib/types';
import type { CreateSubscriptionDto, Subscription, UpdateSubscriptionDto, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useUsers } from '@/hooks/useUsers';
import './SubscriptionModal.css';

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
}: Readonly<SubscriptionModalProps>) {
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
    } else if (Number.parseFloat(formData.amount) <= 0) {
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
          amount: Number.parseFloat(formData.amount),
          due_date: formData.due_date,
          ...(formData.status && { status: formData.status }),
          ...(formData.notes.trim() && { notes: formData.notes.trim() }),
        }
      : {
          user_id: formData.user_id.trim(),
          subscription_type: formData.subscription_type,
          amount: Number.parseFloat(formData.amount),
          due_date: formData.due_date,
          ...(formData.notes.trim() && { notes: formData.notes.trim() }),
        };

    onSubmit?.(submitData);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="subscription-modal__backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="subscription-modal__overlay">
        <div className="subscription-modal__panel">
          {/* Header */}
          <div className="subscription-modal__header">
            <h2 className="subscription-modal__title">
              {mode === 'create' ? 'Add New Subscription' : 'Edit Subscription'}
            </h2>
            <button onClick={onClose} className="subscription-modal__close">
              <X className="subscription-modal__close-icon" />
            </button>
          </div>

          {/* Content */}
          <div className="subscription-modal__content">
            <form onSubmit={handleSubmit} className="subscription-modal__form">
              {/* User Selection */}
              <div>
                <label className="subscription-modal__field-label">User *</label>
                <select
                  value={formData.user_id}
                  onChange={(e) => handleInputChange('user_id', e.target.value)}
                  className={cn('subscription-modal__select', errors.user_id && 'subscription-modal__select--error')}
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
                  <p className="subscription-modal__error">{errors.user_id}</p>
                )}
              </div>

              {/* Subscription Type */}
              <div>
                <label className="subscription-modal__field-label">Subscription Type *</label>
                <select
                  value={formData.subscription_type}
                  onChange={(e) => handleInputChange('subscription_type', e.target.value as SubscriptionType)}
                  className={cn('subscription-modal__select', errors.subscription_type && 'subscription-modal__select--error')}
                  required
                >
                  {subscriptionTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.subscription_type && (
                  <p className="subscription-modal__error">{errors.subscription_type}</p>
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
                leftIcon={<DollarSign className="subscription-modal__amount-icon" />}
                step="0.01"
                min="0"
                required
              />

              {/* Due Date */}
              <div>
                <label className="subscription-modal__field-label">Due Date *</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  className={cn('subscription-modal__select', errors.due_date && 'subscription-modal__select--error')}
                  required
                />
                {errors.due_date && (
                  <p className="subscription-modal__error">{errors.due_date}</p>
                )}
              </div>

              {/* Status (Edit Mode Only) */}
              {mode === 'edit' && (
                <div>
                  <label className="subscription-modal__field-label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value as SubscriptionStatus)}
                    className="subscription-modal__select"
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
                <label className="subscription-modal__field-label">Notes</label>
                <textarea
                  placeholder="Add notes..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="subscription-modal__textarea"
                />
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="subscription-modal__footer">
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
