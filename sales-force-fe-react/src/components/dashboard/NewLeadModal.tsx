
import React, { useState, useEffect } from 'react';
import { X, Calculator, Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  UnitAssignmentFields,
  type UnitAssignmentValue,
} from '@/components/leads/UnitAssignmentFields';
import './NewLeadModal.css';

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
  unit_id?: string;
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
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    phone: '',
    email: '',
    nik: '',
    npwp: '',
    source: '',
    sourceOther: '',
    budgetMin: 0,
    budgetMax: 0,
    kprPrice: 0,
    kprDownPayment: 0,
    kprInterestRate: 0,
    kprTerm: 0,
    note: '',
  });

  const [unitAssignment, setUnitAssignment] = useState<UnitAssignmentValue>({
    propertyId: '',
    blockId: '',
    unitId: '',
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
        budgetMin: 0,
        budgetMax: 0,
        kprPrice: 0,
        kprDownPayment: 0,
        kprInterestRate: 0,
        kprTerm: 0,
        note: '',
      });
      setUnitAssignment({ propertyId: '', blockId: '', unitId: '' });
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

    // Only include unit_id if selected
    if (unitAssignment.unitId) {
      submitData.unit_id = unitAssignment.unitId;
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
      <div className="new-lead-modal__backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="new-lead-modal__overlay">
        <div className="new-lead-modal__panel">
          {/* Header */}
          <div className="new-lead-modal__header">
            <h2 className="new-lead-modal__title">Add New Lead</h2>
            <button onClick={onClose} className="new-lead-modal__close">
              <X className="new-lead-modal__close-icon" />
            </button>
          </div>

          {/* Content */}
          <div className="new-lead-modal__content">
            <form onSubmit={handleSubmit} className="new-lead-modal__form">
              {/* Personal Information */}
              <div>
                <h3 className="new-lead-modal__section-title">
                  <span className="new-lead-modal__section-accent new-lead-modal__section-accent--primary"></span>
                  Personal Information
                </h3>
                <div className="new-lead-modal__section-body">
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
                    <label className="new-lead-modal__field-label">Note</label>
                    <textarea
                      placeholder="Add any notes about this lead..."
                      className="new-lead-modal__textarea"
                      rows={4}
                      maxLength={500}
                      value={formData.note}
                      onChange={(e) => handleInputChange('note', e.target.value)}
                    />
                    <p className="new-lead-modal__char-count">
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

              {/* Unit Assignment */}
              <div>
                <h3 className="new-lead-modal__section-title">
                  <span className="new-lead-modal__section-accent new-lead-modal__section-accent--primary"></span>
                  Unit Assignment
                </h3>
                <div className="new-lead-modal__section-body">
                  <UnitAssignmentFields
                    value={unitAssignment}
                    onChange={setUnitAssignment}
                  />
                </div>
              </div>

              {/* Budget Range */}
              <div>
                <h3 className="new-lead-modal__section-title">
                  <span className="new-lead-modal__section-accent new-lead-modal__section-accent--success"></span>
                  Budget Range
                </h3>
                <div className="new-lead-modal__budget-grid">
                  <div>
                    <label className="new-lead-modal__field-label">Min Budget</label>
                    <div className="new-lead-modal__currency-wrapper">
                      <span className="new-lead-modal__currency-prefix">Rp</span>
                      <input
                        type="text"
                        className="new-lead-modal__currency-input"
                        value={formatCurrencyInput(formData.budgetMin)}
                        onChange={(e) => {
                          const value = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                          handleInputChange('budgetMin', value);
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="new-lead-modal__field-label">Max Budget</label>
                    <div className="new-lead-modal__currency-wrapper">
                      <span className="new-lead-modal__currency-prefix">Rp</span>
                      <input
                        type="text"
                        className="new-lead-modal__currency-input"
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
              <div className="new-lead-modal__collapsible">
                <button
                  type="button"
                  onClick={() => setShowKprCalculator(!showKprCalculator)}
                  className="new-lead-modal__toggle"
                >
                  <h3 className="new-lead-modal__toggle-title">
                    <span className="new-lead-modal__section-accent new-lead-modal__section-accent--warning"></span>
                    <Calculator className="new-lead-modal__toggle-icon" />
                    KPR Calculator
                    <span className="new-lead-modal__optional">(Optional)</span>
                  </h3>
                  <span className="new-lead-modal__toggle-state">
                    {showKprCalculator ? '▲ Hide' : '▼ Show'}
                  </span>
                </button>

                {showKprCalculator && (
                  <div className="new-lead-modal__collapsible-body">
                    <div className="new-lead-modal__grid">
                      <div>
                        <label className="new-lead-modal__field-label">Property Price</label>
                        <div className="new-lead-modal__currency-wrapper">
                          <span className="new-lead-modal__currency-prefix">Rp</span>
                          <input
                            type="text"
                            className="new-lead-modal__input-with-prefix"
                            value={formatCurrencyInput(formData.kprPrice || 0)}
                            onChange={(e) => {
                              const value = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                              handleInputChange('kprPrice', value);
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="new-lead-modal__field-label">Down Payment %</label>
                        <input
                          type="number"
                          className="new-lead-modal__input"
                          value={formData.kprDownPayment}
                          onChange={(e) => handleInputChange('kprDownPayment', parseFloat(e.target.value))}
                          min="0"
                          max="100"
                          step="5"
                        />
                      </div>
                    </div>

                    <div className="new-lead-modal__grid">
                      <div>
                        <label className="new-lead-modal__field-label">Interest Rate %</label>
                        <input
                          type="number"
                          className="new-lead-modal__input"
                          value={formData.kprInterestRate}
                          onChange={(e) => handleInputChange('kprInterestRate', parseFloat(e.target.value))}
                          min="0"
                          max="20"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="new-lead-modal__field-label">Term</label>
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
                      <div className="new-lead-modal__result">
                        <p className="new-lead-modal__result-label">Estimated Monthly Payment</p>
                        <p className="new-lead-modal__result-value">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(kprResult)}/mo
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Reminder (Optional) */}
              <div className="new-lead-modal__collapsible">
                <button
                  type="button"
                  onClick={() => setShowReminderForm(!showReminderForm)}
                  className="new-lead-modal__toggle"
                >
                  <h3 className="new-lead-modal__toggle-title">
                    <span className="new-lead-modal__section-accent new-lead-modal__section-accent--reserved"></span>
                    <Bell className="new-lead-modal__toggle-icon new-lead-modal__toggle-icon--reserved" />
                    Reminder
                    <span className="new-lead-modal__optional">(Optional)</span>
                  </h3>
                  <span className="new-lead-modal__toggle-state">
                    {showReminderForm ? '▲ Hide' : '▼ Show'}
                  </span>
                </button>

                {showReminderForm && (
                  <div className="new-lead-modal__collapsible-body">
                    <div>
                      <label className="new-lead-modal__field-label">Reminder Date & Time</label>
                      <input
                        type="datetime-local"
                        className="new-lead-modal__input"
                        value={formData.reminder?.scheduledFor || ''}
                        onChange={(e) => handleReminderChange('scheduledFor', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="new-lead-modal__field-label">Reminder Notes</label>
                      <textarea
                        placeholder="Add notes for this reminder..."
                        className="new-lead-modal__textarea"
                        rows={3}
                        maxLength={200}
                        value={formData.reminder?.notes || ''}
                        onChange={(e) => handleReminderChange('notes', e.target.value)}
                      />
                      <p className="new-lead-modal__char-count">
                        {formData.reminder?.notes?.length || 0}/200
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="new-lead-modal__footer">
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
