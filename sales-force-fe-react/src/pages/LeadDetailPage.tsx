import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { Phone, MessageCircle, Mail, Calculator, Bell, ArrowLeft, Building2, MapPin, UserMinus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useLeadDetail, useLeadMutations } from '@/hooks/useLeads';
import { UnitPickerModal } from '@/components/leads/UnitPickerModal';
import { UnassignLeadModal } from '@/components/properties/UnassignLeadModal';
import './LeadDetailPage.css';

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

export default function LeadDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const fromPath = location.state?.from || '/leads';
  const { data: lead, isLoading: isLoadingLead } = useLeadDetail(id || '', true);
  const { updateLead, isUpdating } = useLeadMutations({
    onUpdateSuccess: () => {
      // Optionally show success message or navigate
    },
  });
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    nik: '',
    npwp: '',
    source: '',
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
    reminderId: '',
  });

  const [showReminderForm, setShowReminderForm] = useState(false);
  const [showKprCalculator, setShowKprCalculator] = useState(false);
  const [kprResult, setKprResult] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isUnitPickerOpen, setIsUnitPickerOpen] = useState(false);
  const [unassignTarget, setUnassignTarget] = useState<{ id: string; name: string } | null>(null);

  // Initialize form data when lead changes
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
        budgetMin: lead.budget_range?.min || 0,
        budgetMax: lead.budget_range?.max || 0,
        kprPrice: lead.kpr_simulation?.property_price || 0,
        kprDownPayment: lead.kpr_simulation?.down_payment_percentage || 0,
        kprInterestRate: lead.kpr_simulation?.interest_rate || 0,
        kprTerm: lead.kpr_simulation?.loan_term_years || 15,
        notes: lead.notes || '',
        stage: lead.status || '',
        reminderScheduledFor: hasReminder && lead.reminders?.[0]?.remind_at
          ? new Date(lead.reminders[0].remind_at).toISOString().slice(0, 16)
          : '',
        reminderNotes: hasReminder ? (lead.reminders?.[0]?.message || '') : '',
        reminderId: hasReminder ? (lead.reminders?.[0]?.id || '') : '',
      });
      setShowReminderForm(!!hasReminder);
      setShowKprCalculator(hasKprData);
      setHasUnsavedChanges(false);
    }
  }, [lead]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

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

    if (formData.kprPrice && formData.kprDownPayment && formData.kprInterestRate && formData.kprTerm) {
      submitData.kpr_simulation = {
        property_price: formData.kprPrice,
        down_payment_percentage: formData.kprDownPayment,
        interest_rate: formData.kprInterestRate,
        loan_term_years: formData.kprTerm,
      };
    }

    if (showReminderForm && formData.reminderScheduledFor) {
      submitData.reminder = {
        id: formData.reminderId,
        remind_at: new Date(formData.reminderScheduledFor).toISOString(),
        message: formData.reminderNotes,
        is_completed: lead?.reminders?.[0]?.is_completed || 'false',
        lead_id: id,
        user_id: '',
        created_at: '',
        notes: formData.reminderNotes,
      };
    }

    await updateLead({ id, data: submitData });
    setHasUnsavedChanges(false);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate(fromPath);
      }
    } else {
      navigate(fromPath);
    }
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

  if (isLoadingLead) {
    return (
      <DashboardLayout title="Loading..." subtitle="">
        <div className="lead-detail-page__loading">
          <div className="lead-detail-page__loading-inner">
            <div className="lead-detail-page__spinner"></div>
            <p className="lead-detail-page__loading-text">Loading lead details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout title="Lead Not Found" subtitle="">
        <div className="lead-detail-page__loading">
          <div className="lead-detail-page__not-found-inner">
            <p className="lead-detail-page__not-found-text">Lead not found</p>
            <Button onClick={() => navigate(fromPath)}>
              <ArrowLeft className="lead-detail-page__back-icon" />
              {fromPath === '/pipeline' ? 'Back to Pipeline' : 'Back to Leads'}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Lead Detail"
      subtitle={lead?.name || 'Loading...'}
      action={
        <div className="lead-detail-page__action">
          <Button variant="secondary" onClick={handleCancel} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isUpdating}>
            Save Changes
          </Button>
        </div>
      }
    >
      {/* Breadcrumb */}
      <div className="lead-detail-page__breadcrumb">
        <Link to={fromPath} className="lead-detail-page__breadcrumb-link">
          {fromPath === '/pipeline' ? 'Pipeline' : 'Leads'}
        </Link>
        <span className="lead-detail-page__breadcrumb-separator">/</span>
        <span className="lead-detail-page__breadcrumb-current">{lead?.name}</span>
      </div>

      <form onSubmit={handleSubmit} className="lead-detail-page__form">
        <div className="lead-detail-page__sections">
          {/* Personal Information */}
          <div className="lead-detail-page__card">
            <h3 className="lead-detail-page__section-title">
              <span className="lead-detail-page__section-accent lead-detail-page__section-accent--primary"></span>
              Personal Information
            </h3>
            <div className="lead-detail-page__section-body">
              <div className="lead-detail-page__grid">
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
              </div>

              <div className="lead-detail-page__grid">
                <Input
                  label="Email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
                <Select
                  label="Source"
                  options={sourceOptions}
                  value={formData.source}
                  onChange={(e) => handleInputChange('source', e.target.value)}
                />
              </div>

              <div className="lead-detail-page__grid">
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
              </div>

              <div>
                <label className="lead-detail-page__field-label">Notes</label>
                <textarea
                  placeholder="Add any notes about this lead..."
                  className="lead-detail-page__textarea"
                  rows={4}
                  maxLength={500}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
                <p className="lead-detail-page__char-count">{formData.notes.length}/500</p>
              </div>
            </div>
          </div>

          {/* Stage - Prominent section with colored background */}
          <div className="lead-detail-page__stage">
            <h3 className="lead-detail-page__section-title">
              <span className="lead-detail-page__section-accent lead-detail-page__section-accent--primary"></span>
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

          {/* Unit Assignment */}
          <div className="lead-detail-page__card">
            <h3 className="lead-detail-page__section-title">
              <span className="lead-detail-page__section-accent lead-detail-page__section-accent--primary"></span>
              Unit Assignment
            </h3>
            <div className="lead-detail-page__section-body">
              {lead.unit ? (
                <div className="lead-detail-page__unit-row">
                  <div className="lead-detail-page__unit-main">
                    <div className="lead-detail-page__unit-icon">
                      <Building2 className="lead-detail-page__unit-icon-svg" />
                    </div>
                    <div className="lead-detail-page__unit-info">
                      <div className="lead-detail-page__unit-name-row">
                        <p className="lead-detail-page__unit-name">Unit {lead.unit.name}</p>
                        <Badge
                          variant={
                            lead.unit.status === 'available' ? 'green'
                              : lead.unit.status === 'reserved' ? 'purple'
                              : lead.unit.status === 'booked' ? 'orange'
                              : 'gray'
                          }
                          size="sm"
                        >
                          {lead.unit.status}
                        </Badge>
                      </div>
                      <p className="lead-detail-page__unit-meta">
                        <MapPin className="lead-detail-page__unit-map-icon" />
                        {lead.unit.block.name} · {lead.unit.property.name} ({lead.unit.property.city})
                      </p>
                      {lead.unit.land_area && (
                        <p className="lead-detail-page__unit-area">{lead.unit.land_area} m²</p>
                      )}
                    </div>
                  </div>
                  <div className="lead-detail-page__unit-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="lead-detail-page__unit-button"
                      onClick={() => setIsUnitPickerOpen(true)}
                    >
                      Change Unit
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setUnassignTarget({ id: id || '', name: lead.name })}
                      leftIcon={<UserMinus className="lead-detail-page__unassign-icon" />}
                      className="lead-detail-page__unassign-button"
                    >
                      Unassign
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="lead-detail-page__unit-row">
                  <div className="lead-detail-page__unit-empty">
                    <div className="lead-detail-page__unit-icon lead-detail-page__unit-icon--empty">
                      <Building2 className="lead-detail-page__unit-icon-svg lead-detail-page__unit-icon-svg--empty" />
                    </div>
                    <p className="lead-detail-page__unit-empty-text">No unit assigned yet</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="lead-detail-page__unit-button"
                    onClick={() => setIsUnitPickerOpen(true)}
                  >
                    Assign to Unit
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Budget Range */}
          <div className="lead-detail-page__card">
            <h3 className="lead-detail-page__section-title">
              <span className="lead-detail-page__section-accent lead-detail-page__section-accent--success"></span>
              Budget Range
            </h3>
            <div className="lead-detail-page__budget-grid">
              <div>
                <label className="lead-detail-page__field-label">Min Budget</label>
                <div className="lead-detail-page__currency-wrapper">
                  <span className="lead-detail-page__currency-prefix">Rp</span>
                  <input
                    type="text"
                    className="lead-detail-page__currency-input"
                    value={formatCurrencyInput(formData.budgetMin)}
                    onChange={(e) => {
                      const value = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                      handleInputChange('budgetMin', value);
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="lead-detail-page__field-label">Max Budget</label>
                <div className="lead-detail-page__currency-wrapper">
                  <span className="lead-detail-page__currency-prefix">Rp</span>
                  <input
                    type="text"
                    className="lead-detail-page__currency-input"
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
          <div className="lead-detail-page__collapsible">
            <button
              type="button"
              onClick={() => setShowKprCalculator(!showKprCalculator)}
              className="lead-detail-page__toggle"
            >
              <h3 className="lead-detail-page__toggle-title">
                <span className="lead-detail-page__section-accent lead-detail-page__section-accent--warning"></span>
                <Calculator className="lead-detail-page__toggle-icon" />
                KPR Calculator
                <span className="lead-detail-page__optional">(Optional)</span>
              </h3>
              <span className="lead-detail-page__toggle-state">
                {showKprCalculator ? '▲ Hide' : '▼ Show'}
              </span>
            </button>

            {showKprCalculator && (
              <div className="lead-detail-page__collapsible-body">
                <div className="lead-detail-page__grid">
                  <div>
                    <label className="lead-detail-page__field-label">Property Price</label>
                    <div className="lead-detail-page__currency-wrapper">
                      <span className="lead-detail-page__currency-prefix">Rp</span>
                      <input
                        type="text"
                        className="lead-detail-page__currency-input"
                        value={formatCurrencyInput(formData.kprPrice)}
                        onChange={(e) => {
                          const value = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                          handleInputChange('kprPrice', value);
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="lead-detail-page__field-label">Down Payment %</label>
                    <input
                      type="number"
                      className="lead-detail-page__input"
                      value={formData.kprDownPayment}
                      onChange={(e) => handleInputChange('kprDownPayment', parseFloat(e.target.value))}
                      min="0"
                      max="100"
                      step="5"
                    />
                  </div>
                </div>

                <div className="lead-detail-page__grid">
                  <div>
                    <label className="lead-detail-page__field-label">Interest Rate %</label>
                    <input
                      type="number"
                      className="lead-detail-page__input"
                      value={formData.kprInterestRate}
                      onChange={(e) => handleInputChange('kprInterestRate', parseFloat(e.target.value))}
                      min="0"
                      max="20"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="lead-detail-page__field-label">Term</label>
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
                  className="lead-detail-page__calculate-button"
                  onClick={calculateKpr}
                >
                  Calculate Monthly Payment →
                </Button>

                {kprResult !== null && (
                  <div className="lead-detail-page__result">
                    <p className="lead-detail-page__result-label">Estimated Monthly Payment</p>
                    <p className="lead-detail-page__result-value">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(kprResult)}/mo
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reminder */}
          <div className="lead-detail-page__collapsible">
            <button
              type="button"
              onClick={() => setShowReminderForm(!showReminderForm)}
              className="lead-detail-page__toggle"
            >
              <h3 className="lead-detail-page__toggle-title">
                <span className="lead-detail-page__section-accent lead-detail-page__section-accent--reserved"></span>
                <Bell className="lead-detail-page__toggle-icon lead-detail-page__toggle-icon--reserved" />
                Reminder
                <span className="lead-detail-page__optional">(Optional)</span>
              </h3>
              <span className="lead-detail-page__toggle-state">
                {showReminderForm ? '▲ Hide' : '▼ Show'}
              </span>
            </button>

            {showReminderForm && (
              <div className="lead-detail-page__collapsible-body">
                <div>
                  <label className="lead-detail-page__field-label">Reminder Date & Time</label>
                  <input
                    type="datetime-local"
                    className="lead-detail-page__datetime"
                    value={formData.reminderScheduledFor}
                    onChange={(e) => handleInputChange('reminderScheduledFor', e.target.value)}
                  />
                </div>

                <div>
                  <label className="lead-detail-page__field-label">Reminder Notes</label>
                  <textarea
                    placeholder="Add notes for this reminder..."
                    className="lead-detail-page__textarea"
                    rows={3}
                    maxLength={200}
                    value={formData.reminderNotes}
                    onChange={(e) => handleInputChange('reminderNotes', e.target.value)}
                  />
                  <p className="lead-detail-page__char-count">{formData.reminderNotes.length}/200</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="lead-detail-page__card">
            <h3 className="lead-detail-page__section-title">
              <span className="lead-detail-page__section-accent lead-detail-page__section-accent--primary"></span>
              Quick Actions
            </h3>
            <div className="lead-detail-page__quick-actions">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<MessageCircle className="lead-detail-page__action-icon lead-detail-page__action-icon--whatsapp" />}
                onClick={() => window.open(`https://wa.me/${formData.phone.replace(/\D/g, '')}`, '_blank')}
                className="lead-detail-page__action-button lead-detail-page__action-button--whatsapp"
                disabled={!formData.phone}
              >
                WhatsApp
              </Button>
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Phone className="lead-detail-page__action-icon lead-detail-page__action-icon--call" />}
                onClick={() => (window.location.href = `tel:${formData.phone}`)}
                className="lead-detail-page__action-button lead-detail-page__action-button--call"
                disabled={!formData.phone}
              >
                Call
              </Button>
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Mail className="lead-detail-page__action-icon lead-detail-page__action-icon--email" />}
                onClick={() => formData.email && (window.location.href = `mailto:${formData.email}`)}
                className="lead-detail-page__action-button lead-detail-page__action-button--email"
                disabled={!formData.email}
              >
                Email
              </Button>
            </div>
          </div>
        </div>
      </form>

      <UnitPickerModal
        isOpen={isUnitPickerOpen}
        onClose={() => setIsUnitPickerOpen(false)}
        leadId={id || ''}
        currentUnit={lead?.unit}
        onAssigned={() => setHasUnsavedChanges(false)}
      />

      <UnassignLeadModal
        isOpen={!!unassignTarget}
        onClose={() => setUnassignTarget(null)}
        unitId={lead?.unit?.id}
        unitName={lead?.unit?.name}
        lead={unassignTarget}
      />
    </DashboardLayout>
  );
}
