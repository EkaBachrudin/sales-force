'use client';

import React, { useState, useEffect } from 'react';
import { X, Calculator, Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { useProperties } from '@/hooks/useProperties';
import { propertyService } from '@/services/propertyService';

export interface ReminderData {
  scheduledFor?: string;
  notes?: string;
}

// Internal form state type
export interface LeadFormData {
  name: string;
  phone: string;
  email?: string;
  nik?: string;
  npwp?: string;
  source: string;
  sourceOther?: string;
  property_id: string;
  budgetMin: number;
  budgetMax: number;
  kprPrice?: number;
  kprDownPayment?: number;
  kprInterestRate?: number;
  kprTerm?: number;
  note?: string;
  reminder?: ReminderData;
}

// Type submitted to backend (matches NewLeadData in props)
export interface NewLeadData {
  name: string;
  phone: string;
  email?: string;
  nik?: string;
  npwp?: string;
  source: string;
  sourceOther?: string;
  property_id?: string;
  budget_range: { min: number; max: number };
  kpr_simulation?: {
    property_price: number;
    down_payment_percentage: number;
    interest_rate: number;
    loan_term_years: number;
  };
  note?: string;
  reminder?: ReminderData;
}

export interface NewLeadModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit?: (data: NewLeadData) => void;
  isLoading?: boolean;
}

const termOptions = [
  { value: '5', label: '5 years' },
  { value: '10', label: '10 years' },
  { value: '15', label: '15 years' },
  { value: '20', label: '20 years' },
  { value: '25', label: '25 years' },
];

const sourceOptions = [
  { value: 'visit', label: 'Visit' },
  { value: 'referral', label: 'Referral' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'other', label: 'Other' },
];

export function NewLeadModal({
  isOpen = false,
  onClose,
  onSubmit,
  isLoading = false,
}: NewLeadModalProps) {
  const { data: properties, isLoading: isLoadingProperties } = useProperties();
  const propertyOptions = [
    { value: '', label: 'No Property Selected' },
    ...(properties ? propertyService.toPropertyOptions(properties) : []),
  ];

  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    phone: '',
    email: '',
    nik: '',
    npwp: '',
    source: '',
    sourceOther: '',
    property_id: '',
    budgetMin: 0,
    budgetMax: 0,
    kprPrice: 0,
    kprDownPayment: 0,
    kprInterestRate: 0,
    kprTerm: 0,
    note: '',
  });

  const [showKprCalculator, setShowKprCalculator] = useState(false);
  const [kprResult, setKprResult] = useState<number | null>(null);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        phone: '',
        email: '',
        nik: '',
        npwp: '',
        source: '',
        sourceOther: '',
        property_id: '',
        budgetMin: 0,
        budgetMax: 0,
        kprPrice: 0,
        kprDownPayment: 0,
        kprInterestRate: 0,
        kprTerm: 0,
        note: '',
      });
      setShowKprCalculator(false);
      setKprResult(null);
      setShowReminderForm(false);
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof LeadFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (field === 'name' || field === 'phone') {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleReminderChange = (field: keyof ReminderData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      reminder: {
        ...prev.reminder,
        [field]: value,
      },
    }));
  };

  const calculateKpr = () => {
    const price = formData.kprPrice || 0;
    const downPaymentPercent = formData.kprDownPayment || 20;
    const interestRate = formData.kprInterestRate || 5.5;
    const term = formData.kprTerm || 15;

    const downPayment = price * (downPaymentPercent / 100);
    const loanAmount = price - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = term * 12;

    const monthlyPayment =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    setKprResult(Math.round(monthlyPayment));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate mandatory fields
    const newErrors: { name?: string; phone?: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!phoneDigits) {
      newErrors.phone = 'Phone number is required';
    } else if (phoneDigits.length < 10) {
      newErrors.phone = 'Phone number must be at least 10 digits';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Transform formData to match backend API format
    const submitData: NewLeadData = {
      name: formData.name,
      phone: formData.phone.replace(/\D/g, ''),
      email: formData.email,
      nik: formData.nik,
      npwp: formData.npwp,
      source: formData.source,
      sourceOther: formData.sourceOther,
      budget_range: {
        min: formData.budgetMin,
        max: formData.budgetMax,
      },
      note: formData.note,
      reminder: formData.reminder,
    };

    // Only include property_id if selected
    if (formData.property_id) {
      submitData.property_id = formData.property_id;
    }

    // Only include kpr_simulation if values are present
    if (formData.kprPrice && formData.kprDownPayment && formData.kprInterestRate && formData.kprTerm) {
      submitData.kpr_simulation = {
        property_price: formData.kprPrice,
        down_payment_percentage: formData.kprDownPayment,
        interest_rate: formData.kprInterestRate,
        loan_term_years: formData.kprTerm,
      };
    }

    onSubmit?.(submitData);
  };

  const formatCurrencyInput = (value: number) => {
    return new Intl.NumberFormat('id-ID').format(value);
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 4) return numbers;
    if (numbers.length <= 8) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 4)}-${numbers.slice(4, 8)}-${numbers.slice(8, 12)}`;
    if (numbers.length <= 16) return `${numbers.slice(0, 4)}-${numbers.slice(4, 8)}-${numbers.slice(8, 12)}-${numbers.slice(12, 16)}`;
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 8)}-${numbers.slice(8, 12)}-${numbers.slice(12, 16)}-${numbers.slice(16, 20)}`;
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
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-text-primary">
              Add New Lead
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-base font-semibold text-text-primary mb-3">
                  Personal Information
                </h3>
                <div className="space-y-4">
                  <Input
                    label="Name *"
                    placeholder="Enter lead name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    error={errors.name}
                    required
                  />

                  <Input
                    label="Phone *"
                    placeholder="0812-3456-7890"
                    value={formatPhoneNumber(formData.phone)}
                    onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, ''))}
                    error={errors.phone}
                    required
                  />

                  <Input
                    label="NIK"
                    type="text"
                    placeholder="16 digit NIK number"
                    value={formData.nik}
                    onChange={(e) => handleInputChange('nik', e.target.value)}
                    maxLength={16}
                  />

                  <Input
                    label="NPWP"
                    type="text"
                    placeholder="15 digit NPWP number"
                    value={formData.npwp}
                    onChange={(e) => handleInputChange('npwp', e.target.value)}
                    maxLength={15}
                  />

                  <Input
                    label="Email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Note
                    </label>
                    <textarea
                      placeholder="Add any notes about this lead..."
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-[var(--primary)] resize-none"
                      rows={5}
                      maxLength={500}
                      value={formData.note}
                      onChange={(e) => handleInputChange('note', e.target.value)}
                    />
                    <p className="text-xs text-text-secondary mt-1 text-right">
                      {formData.note?.length || 0}/500
                    </p>
                  </div>

                  <Select
                    label="Source *"
                    options={sourceOptions}
                    value={formData.source}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                    required
                  />

                  {formData.source === 'other' && (
                    <Input
                      label="Other Source"
                      type="text"
                      placeholder="Please specify"
                      value={formData.sourceOther}
                      onChange={(e) => handleInputChange('sourceOther', e.target.value)}
                    />
                  )}
                </div>
              </div>

              {/* Property Interest */}
              <div>
                <h3 className="text-base font-semibold text-text-primary mb-3">
                  Property Interest
                </h3>
                <div className="space-y-4">
                  <Select
                    label="Property Type"
                    options={propertyOptions}
                    value={formData.property_id}
                    onChange={(e) => handleInputChange('property_id', e.target.value)}
                    disabled={isLoadingProperties}
                  />
                </div>
              </div>

              {/* Budget Range */}
              <div>
                <h3 className="text-base font-semibold text-text-primary mb-3">
                  Budget Range
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Min Budget
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        Rp
                      </span>
                      <input
                        type="text"
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-[var(--primary)]"
                        value={formatCurrencyInput(formData.budgetMin)}
                        onChange={(e) => {
                          const value = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                          handleInputChange('budgetMin', value);
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Max Budget
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        Rp
                      </span>
                      <input
                        type="text"
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-[var(--primary)]"
                        value={formatCurrencyInput(formData.budgetMax)}
                        onChange={(e) => {
                          const value = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                          handleInputChange('budgetMax', value);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* KPR Simulation */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowKprCalculator(!showKprCalculator)}
                  className="flex items-center gap-2 text-primary font-medium mb-3"
                >
                  <Calculator className="w-4 h-4" />
                  {showKprCalculator ? 'Hide' : 'Show'} KPR Calculator (Optional)
                </button>

                {showKprCalculator && (
                  <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1.5">
                          Property Price
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                            Rp
                          </span>
                          <input
                            type="text"
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary"
                            value={formatCurrencyInput(formData.kprPrice || 0)}
                            onChange={(e) => {
                              const value = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                              handleInputChange('kprPrice', value);
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1.5">
                          Down Payment %
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary"
                          value={formData.kprDownPayment}
                          onChange={(e) => handleInputChange('kprDownPayment', parseFloat(e.target.value))}
                          min="0"
                          max="100"
                          step="5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1.5">
                          Interest Rate %
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary"
                          value={formData.kprInterestRate}
                          onChange={(e) => handleInputChange('kprInterestRate', parseFloat(e.target.value))}
                          min="0"
                          max="20"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-1.5">
                          Term
                        </label>
                        <Select
                          options={termOptions}
                          value={String(formData.kprTerm)}
                          onChange={(e) => handleInputChange('kprTerm', parseInt(e.target.value))}
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={calculateKpr}
                    >
                      Calculate Monthly Payment →
                    </Button>

                    {kprResult !== null && (
                      <div className="text-center p-3 bg-primary/10 rounded-lg">
                        <p className="text-sm text-text-secondary">Estimated Monthly Payment</p>
                        <p className="text-2xl font-bold text-primary">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(kprResult)}/mo
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Reminder (Optional) */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowReminderForm(!showReminderForm)}
                  className="flex items-center gap-2 text-primary font-medium mb-3"
                >
                  <Bell className="w-4 h-4" />
                  {showReminderForm ? 'Hide' : 'Show'} Reminder (Optional)
                </button>

                {showReminderForm && (
                  <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1.5">
                        Reminder Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-[var(--primary)]"
                        value={formData.reminder?.scheduledFor || ''}
                        onChange={(e) => handleReminderChange('scheduledFor', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1.5">
                        Reminder Notes
                      </label>
                      <textarea
                        placeholder="Add notes for this reminder..."
                        className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-[var(--primary)] resize-none"
                        rows={3}
                        maxLength={200}
                        value={formData.reminder?.notes || ''}
                        onChange={(e) => handleReminderChange('notes', e.target.value)}
                      />
                      <p className="text-xs text-text-secondary mt-1 text-right">
                        {formData.reminder?.notes?.length || 0}/200
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={isLoading}>
              Save Lead
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
