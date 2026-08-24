
import React, { useState, useEffect } from 'react';
import { X, Calculator, Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { Lead } from '@/lib/types';
import { useProperties } from '@/hooks/useProperties';
import { propertyService } from '@/services/propertyService';
import './EditLeadModal.css';

export interface EditLeadModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit?: (data: Partial<Lead>) => void;
  lead?: Lead | null;
  isLoading?: boolean;
}

const stageOptions = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'surveyed', label: 'Surveyed' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'booked', label: 'Booked' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const sourceOptions = [
  { value: 'visit', label: 'Visit' },
  { value: 'referral', label: 'Referral' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'other', label: 'Other' },
];

const termOptions = [
  { value: '5', label: '5 years' },
  { value: '10', label: '10 years' },
  { value: '15', label: '15 years' },
  { value: '20', label: '20 years' },
  { value: '25', label: '25 years' },
];

export function EditLeadModal({
  isOpen = false,
  onClose,
  onSubmit,
  lead,
  isLoading = false,
}: EditLeadModalProps) {
  const { data: properties, isLoading: isLoadingProperties } = useProperties();
  const propertyOptions = [
    { value: '', label: 'No Property Selected' },
    ...(properties ? propertyService.toPropertyOptions(properties) : []),
  ];

  // Form state with proper initialization from API data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    nik: '',
    npwp: '',
    source: '',
    property_id: '',
    budgetMin: 0,
    budgetMax: 0,
    kprPrice: 0,
    kprDownPayment: 20,
    kprInterestRate: 5.5,
    kprTerm: 15,
    notes: '',
    stage: '',
    reminderScheduledFor: '',
    reminderNotes: '',
  });
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [showKprCalculator, setShowKprCalculator] = useState(false);
  const [kprResult, setKprResult] = useState<number | null>(null);

  // Initialize form data when lead changes - map API fields to form fields
  useEffect(() => {
    if (lead) {
      const hasKprData = (lead.kpr_simulation?.property_price ?? 0) > 0 ||
                         (lead.kpr_simulation?.interest_rate ?? 0) > 0 ||
                         (lead.kpr_simulation?.loan_term_years ?? 0) > 0;
      const hasReminder = lead.reminders && lead.reminders.length > 0;

      setFormData({
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        nik: lead.nik || '',
        npwp: lead.npwp || '',
        source: lead.source || '',
        property_id: lead.property_id || '',
        budgetMin: lead.budget_range?.min || 0,
        budgetMax: lead.budget_range?.max || 0,
        kprPrice: lead.kpr_simulation?.property_price || 0,
        kprDownPayment: lead.kpr_simulation?.down_payment_percentage || 0, // Default value, API doesn't provide this separately
        kprInterestRate: lead.kpr_simulation?.interest_rate || 0,
        kprTerm: lead.kpr_simulation?.loan_term_years || 15,
        notes: lead.notes || '',
        stage: lead.status || '',
        reminderScheduledFor: hasReminder && lead.reminders?.[0]?.remind_at
          ? new Date(lead.reminders[0].remind_at).toISOString().slice(0, 16)
          : '',
        reminderNotes: hasReminder ? (lead.reminders?.[0]?.message || '') : '',
      });
      setShowReminderForm(!!hasReminder);
      setShowKprCalculator(hasKprData);
    }
  }, [lead]);

  const handleInputChange = (field: string, value: string | number) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Transform form data back to API format - use 'any' to bypass Lead interface limitations
    // The actual API supports more fields than the Lead interface defines
    const submitData: any = {
      name: formData.name,
      phone: formData.phone.replace(/\D/g, ''),
      email: formData.email || undefined,
      nik: formData.nik || undefined,
      npwp: formData.npwp || undefined,
      source: formData.source,
      budget_range: {
        min: formData.budgetMin,
        max: formData.budgetMax,
      },
      notes: formData.notes || undefined,
      status: formData.stage
    };

    // Handle property_id - send null if empty string to clear the property, otherwise send the value
    // This allows users to select "No Property Selected" to remove the property association
    if (formData.property_id === '') {
      submitData.property_id = null;
    } else if (formData.property_id) {
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

    // Include reminder if set
    if (showReminderForm && formData.reminderScheduledFor) {
      submitData.reminder = {
        id: lead?.reminders?.[0]?.id || '',
        remind_at: new Date(formData.reminderScheduledFor).toISOString(),
        message: formData.reminderNotes,
        is_completed: lead?.reminders?.[0]?.is_completed || 'false',
        lead_id: lead?.id || '',
        user_id: '',
        created_at: '',
        notes: formData.reminderNotes,
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
      <div className="edit-lead-modal__backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="edit-lead-modal__overlay">
        <div className="edit-lead-modal__panel">
          {/* Header */}
          <div className="edit-lead-modal__header">
            <h2 className="edit-lead-modal__title">Edit Lead</h2>
            <button onClick={onClose} className="edit-lead-modal__close">
              <X className="edit-lead-modal__close-icon" />
            </button>
          </div>

          {/* Content */}
          <div className="edit-lead-modal__content">
            <form onSubmit={handleSubmit} className="edit-lead-modal__form">
              {/* Personal Information */}
              <div>
                <h3 className="edit-lead-modal__section-title">
                  <span className="edit-lead-modal__section-accent edit-lead-modal__section-accent--primary"></span>
                  Personal Information
                </h3>
                <div className="edit-lead-modal__section-body">
                  <Input
                    label="Name *"
                    placeholder="Enter lead name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />

                  <Input
                    label="Phone *"
                    placeholder="0812-3456-7890"
                    value={formatPhoneNumber(formData.phone)}
                    onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, ''))}
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
                    <label className="edit-lead-modal__field-label">Notes</label>
                    <textarea
                      placeholder="Add any notes about this lead..."
                      className="edit-lead-modal__textarea"
                      rows={4}
                      maxLength={500}
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                    />
                    <p className="edit-lead-modal__char-count">
                      {formData.notes.length}/500
                    </p>
                  </div>

                  <Select
                    label="Source"
                    options={sourceOptions}
                    value={formData.source}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                  />
                </div>
              </div>

              {/* Stage - Prominent section with colored background */}
              <div className="edit-lead-modal__stage">
                <h3 className="edit-lead-modal__section-title">
                  <span className="edit-lead-modal__section-accent edit-lead-modal__section-accent--primary"></span>
                  Lead Stage *
                </h3>
                <Select
                  label=""
                  options={stageOptions}
                  value={formData.stage}
                  onChange={(e) => handleInputChange('stage', e.target.value)}
                  required
                />
              </div>

              {/* Property Interest */}
              <div>
                <h3 className="edit-lead-modal__section-title">
                  <span className="edit-lead-modal__section-accent edit-lead-modal__section-accent--primary"></span>
                  Property Interest
                </h3>
                <div className="edit-lead-modal__section-body">
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
                <h3 className="edit-lead-modal__section-title">
                  <span className="edit-lead-modal__section-accent edit-lead-modal__section-accent--success"></span>
                  Budget Range
                </h3>
                <div className="edit-lead-modal__budget-grid">
                  <div>
                    <label className="edit-lead-modal__field-label">Min Budget</label>
                    <div className="edit-lead-modal__currency-wrapper">
                      <span className="edit-lead-modal__currency-prefix">Rp</span>
                      <input
                        type="text"
                        className="edit-lead-modal__currency-input"
                        value={formatCurrencyInput(formData.budgetMin)}
                        onChange={(e) => {
                          const value = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                          handleInputChange('budgetMin', value);
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="edit-lead-modal__field-label">Max Budget</label>
                    <div className="edit-lead-modal__currency-wrapper">
                      <span className="edit-lead-modal__currency-prefix">Rp</span>
                      <input
                        type="text"
                        className="edit-lead-modal__currency-input"
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
              <div className="edit-lead-modal__collapsible">
                <button
                  type="button"
                  onClick={() => setShowKprCalculator(!showKprCalculator)}
                  className="edit-lead-modal__toggle"
                >
                  <h3 className="edit-lead-modal__toggle-title">
                    <span className="edit-lead-modal__section-accent edit-lead-modal__section-accent--warning"></span>
                    <Calculator className="edit-lead-modal__toggle-icon" />
                    KPR Calculator
                    <span className="edit-lead-modal__optional">(Optional)</span>
                  </h3>
                  <span className="edit-lead-modal__toggle-state">
                    {showKprCalculator ? '▲ Hide' : '▼ Show'}
                  </span>
                </button>

                {showKprCalculator && (
                  <div className="edit-lead-modal__collapsible-body">
                    <div className="edit-lead-modal__grid">
                      <div>
                        <label className="edit-lead-modal__field-label">Property Price</label>
                        <div className="edit-lead-modal__currency-wrapper">
                          <span className="edit-lead-modal__currency-prefix">Rp</span>
                          <input
                            type="text"
                            className="edit-lead-modal__input-with-prefix"
                            value={formatCurrencyInput(formData.kprPrice)}
                            onChange={(e) => {
                              const value = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                              handleInputChange('kprPrice', value);
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="edit-lead-modal__field-label">Down Payment %</label>
                        <input
                          type="number"
                          className="edit-lead-modal__input"
                          value={formData.kprDownPayment}
                          onChange={(e) => handleInputChange('kprDownPayment', parseFloat(e.target.value))}
                          min="0"
                          max="100"
                          step="5"
                        />
                      </div>
                    </div>

                    <div className="edit-lead-modal__grid">
                      <div>
                        <label className="edit-lead-modal__field-label">Interest Rate %</label>
                        <input
                          type="number"
                          className="edit-lead-modal__input"
                          value={formData.kprInterestRate}
                          onChange={(e) => handleInputChange('kprInterestRate', parseFloat(e.target.value))}
                          min="0"
                          max="20"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="edit-lead-modal__field-label">Term</label>
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
                      <div className="edit-lead-modal__result">
                        <p className="edit-lead-modal__result-label">Estimated Monthly Payment</p>
                        <p className="edit-lead-modal__result-value">
                          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(kprResult)}/mo
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Reminder (Optional) */}
              <div className="edit-lead-modal__collapsible">
                <button
                  type="button"
                  onClick={() => setShowReminderForm(!showReminderForm)}
                  className="edit-lead-modal__toggle"
                >
                  <h3 className="edit-lead-modal__toggle-title">
                    <span className="edit-lead-modal__section-accent edit-lead-modal__section-accent--reserved"></span>
                    <Bell className="edit-lead-modal__toggle-icon edit-lead-modal__toggle-icon--reserved" />
                    Reminder
                    <span className="edit-lead-modal__optional">(Optional)</span>
                  </h3>
                  <span className="edit-lead-modal__toggle-state">
                    {showReminderForm ? '▲ Hide' : '▼ Show'}
                  </span>
                </button>

                {showReminderForm && (
                  <div className="edit-lead-modal__collapsible-body">
                    <div>
                      <label className="edit-lead-modal__field-label">Reminder Date & Time</label>
                      <input
                        type="datetime-local"
                        className="edit-lead-modal__input"
                        value={formData.reminderScheduledFor}
                        onChange={(e) => handleInputChange('reminderScheduledFor', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="edit-lead-modal__field-label">Reminder Notes</label>
                      <textarea
                        placeholder="Add notes for this reminder..."
                        className="edit-lead-modal__textarea"
                        rows={3}
                        maxLength={200}
                        value={formData.reminderNotes}
                        onChange={(e) => handleInputChange('reminderNotes', e.target.value)}
                      />
                      <p className="edit-lead-modal__char-count">
                        {formData.reminderNotes.length}/200
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="edit-lead-modal__footer">
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
