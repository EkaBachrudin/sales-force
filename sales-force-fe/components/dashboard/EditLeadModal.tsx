'use client';

import React, { useState, useEffect } from 'react';
import { X, Calculator, Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn, formatCurrency } from '@/lib/utils';
import { Lead } from './LeadCard';

export interface EditLeadModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit?: (data: Partial<Lead>) => void;
  lead?: Lead | null;
  isLoading?: boolean;
}

const propertyTypes = [
  { value: 'Cluster A', label: 'Cluster A - Type 36/60' },
  { value: 'Cluster B', label: 'Cluster B - Type 45/72' },
  { value: 'Cluster C', label: 'Cluster C - Type 54/90' },
  { value: 'Cluster D', label: 'Cluster D - Type 70/120' },
];

const stageOptions = [
  { value: 'new', label: 'Baru Masuk' },
  { value: 'contacted', label: 'Dikontak' },
  { value: 'surveyed', label: 'Survey' },
  { value: 'negotiating', label: 'Negosiasi' },
  { value: 'closed', label: 'Closing' },
  { value: 'cancelled', label: 'Batal' },
];

const sourceOptions = [
  { value: 'Website', label: 'Website' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Other', label: 'Other' },
];

export function EditLeadModal({
  isOpen = false,
  onClose,
  onSubmit,
  lead,
  isLoading = false,
}: EditLeadModalProps) {
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [showKprCalculator, setShowKprCalculator] = useState(false);
  const [kprResult, setKprResult] = useState<number | null>(null);

  // Initialize form data when lead changes
  useEffect(() => {
    if (lead) {
      setFormData({ ...lead });
      setShowReminderForm(!!lead.reminder?.scheduledFor);
      setShowKprCalculator(!!lead.kprPrice);
    }
  }, [lead]);

  const handleInputChange = (field: keyof Lead, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  const handleReminderChange = (field: 'scheduledFor' | 'notes', value: string) => {
    setFormData((prev) => ({
      ...prev,
      reminder: {
        ...prev.reminder,
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  const formatCurrencyInput = (value: number) => {
    return new Intl.NumberFormat('id-ID').format(value);
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
          <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Edit Lead
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
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
                  Personal Information
                </h3>
                <div className="space-y-4">
                  <Input
                    label="Name *"
                    placeholder="Enter lead name"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />

                  <Input
                    label="Phone *"
                    placeholder="+62 812-3456-7890"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />

                  <Input
                    label="NIK"
                    type="text"
                    placeholder="16 digit NIK number"
                    value={formData.nik || ''}
                    onChange={(e) => handleInputChange('nik', e.target.value)}
                    maxLength={16}
                  />

                  <Input
                    label="NPWP"
                    type="text"
                    placeholder="15 digit NPWP number"
                    value={formData.npwp || ''}
                    onChange={(e) => handleInputChange('npwp', e.target.value)}
                    maxLength={15}
                  />

                  <Input
                    label="Email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                      Note
                    </label>
                    <textarea
                      placeholder="Add any notes about this lead..."
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] resize-none"
                      rows={4}
                      maxLength={500}
                      value={formData.note || ''}
                      onChange={(e) => handleInputChange('note', e.target.value)}
                    />
                    <p className="text-xs text-[var(--text-secondary)] mt-1 text-right">
                      {formData.note?.length || 0}/500
                    </p>
                  </div>

                  <Select
                    label="Source"
                    options={sourceOptions}
                    value={formData.source || ''}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                  />
                </div>
              </div>

              {/* Property Interest */}
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
                  Property Interest
                </h3>
                <div className="space-y-4">
                  <Select
                    label="Property Type *"
                    options={propertyTypes}
                    value={formData.propertyType || ''}
                    onChange={(e) => handleInputChange('propertyType', e.target.value)}
                    required
                  />

                  <Select
                    label="Stage *"
                    options={stageOptions}
                    value={formData.stage || ''}
                    onChange={(e) => handleInputChange('stage', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Budget Range */}
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3">
                  Budget Range
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                      Min Budget
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        Rp
                      </span>
                      <input
                        type="text"
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                        value={formatCurrencyInput(formData.budgetMin || 0)}
                        onChange={(e) => {
                          const value = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                          handleInputChange('budgetMin', value);
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                      Max Budget
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        Rp
                      </span>
                      <input
                        type="text"
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                        value={formatCurrencyInput(formData.budgetMax || 0)}
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
                  className="flex items-center gap-2 text-[var(--primary)] font-medium mb-3"
                >
                  <Calculator className="w-4 h-4" />
                  {showKprCalculator ? 'Hide' : 'Show'} KPR Calculator (Optional)
                </button>

                {showKprCalculator && (
                  <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                          Property Price
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                            Rp
                          </span>
                          <input
                            type="text"
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
                            value={formatCurrencyInput(formData.kprPrice || 0)}
                            onChange={(e) => {
                              const value = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                              handleInputChange('kprPrice', value);
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                          Down Payment %
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
                          value={formData.kprDownPayment || 20}
                          onChange={(e) => handleInputChange('kprDownPayment', parseFloat(e.target.value))}
                          min="0"
                          max="100"
                          step="5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                          Interest Rate %
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
                          value={formData.kprInterestRate || 5.5}
                          onChange={(e) => handleInputChange('kprInterestRate', parseFloat(e.target.value))}
                          min="0"
                          max="20"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                          Term
                        </label>
                        <Select
                          options={[
                            { value: '5', label: '5 years' },
                            { value: '10', label: '10 years' },
                            { value: '15', label: '15 years' },
                            { value: '20', label: '20 years' },
                            { value: '25', label: '25 years' },
                          ]}
                          value={String(formData.kprTerm || 15)}
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
                      <div className="text-center p-3 bg-[var(--primary)]/10 rounded-lg">
                        <p className="text-sm text-[var(--text-secondary)]">Estimated Monthly Payment</p>
                        <p className="text-2xl font-bold text-[var(--primary)]">
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
                  className="flex items-center gap-2 text-[var(--primary)] font-medium mb-3"
                >
                  <Bell className="w-4 h-4" />
                  {showReminderForm ? 'Hide' : 'Show'} Reminder (Optional)
                </button>

                {showReminderForm && (
                  <div className="p-4 bg-gray-50 rounded-xl space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                        Reminder Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                        value={formData.reminder?.scheduledFor?.substring(0, 16) || ''}
                        onChange={(e) => handleReminderChange('scheduledFor', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                        Reminder Notes
                      </label>
                      <textarea
                        placeholder="Add notes for this reminder..."
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] resize-none"
                        rows={3}
                        maxLength={200}
                        value={formData.reminder?.notes || ''}
                        onChange={(e) => handleReminderChange('notes', e.target.value)}
                      />
                      <p className="text-xs text-[var(--text-secondary)] mt-1 text-right">
                        {formData.reminder?.notes?.length || 0}/200
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--border)]">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={isLoading}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
