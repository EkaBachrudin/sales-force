import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { Phone, MessageCircle, Mail, Calculator, Bell, ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useLeadDetail, useLeadMutations } from '@/hooks/useLeads';
import { useProperties } from '@/hooks/useProperties';
import { propertyService } from '@/services/propertyService';

const stageOptions = [
  { value: 'new', label: 'Baru Masuk' },
  { value: 'contacted', label: 'Dikontak' },
  { value: 'surveyed', label: 'Survey' },
  { value: 'negotiating', label: 'Negosiasi' },
  { value: 'closed', label: 'Closing' },
  { value: 'cancelled', label: 'Batal' },
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
  const { data: properties, isLoading: isLoadingProperties } = useProperties();

  const propertyOptions = [
    { value: '', label: 'No Property Selected' },
    ...(properties ? propertyService.toPropertyOptions(properties) : []),
  ];

  // Form state
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
    reminderId: '',
  });

  const [showReminderForm, setShowReminderForm] = useState(false);
  const [showKprCalculator, setShowKprCalculator] = useState(false);
  const [kprResult, setKprResult] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
        property_id: lead.property_id || '',
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

    if (formData.property_id === '') {
      submitData.property_id = null;
    } else if (formData.property_id) {
      submitData.property_id = formData.property_id;
    }

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
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-sm text-gray-500">Loading lead details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout title="Lead Not Found" subtitle="">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-4">Lead not found</p>
            <Button onClick={() => navigate(fromPath)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
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
        <div className="flex items-center gap-2">
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
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link to={fromPath} className="text-primary hover:underline">
          {fromPath === '/pipeline' ? 'Pipeline' : 'Leads'}
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-700">{lead?.name}</span>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full"></span>
              Personal Information
            </h3>
            <div className="space-y-4 pl-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Notes
                </label>
                <textarea
                  placeholder="Add any notes about this lead..."
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                  rows={4}
                  maxLength={500}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
                <p className="text-xs text-text-secondary mt-1 text-right">
                  {formData.notes.length}/500
                </p>
              </div>
            </div>
          </div>

          {/* Stage - Prominent section with colored background */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full"></span>
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
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
              Property Interest
            </h3>
            <div className="pl-3">
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
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-green-500 rounded-full"></span>
              Budget Range
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-3">
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
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setShowKprCalculator(!showKprCalculator)}
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                <Calculator className="w-4 h-4 text-orange-500" />
                KPR Calculator
                <span className="text-xs font-normal text-gray-500">(Optional)</span>
              </h3>
              <span className="text-xs text-gray-500">
                {showKprCalculator ? '▲ Hide' : '▼ Show'}
              </span>
            </button>

            {showKprCalculator && (
              <div className="p-6 border-t border-border bg-gray-50 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        value={formatCurrencyInput(formData.kprPrice)}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm text-text-secondary">Estimated Monthly Payment</p>
                    <p className="text-2xl font-bold text-primary">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(kprResult)}/mo
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reminder */}
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setShowReminderForm(!showReminderForm)}
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                <Bell className="w-4 h-4 text-purple-500" />
                Reminder
                <span className="text-xs font-normal text-gray-500">(Optional)</span>
              </h3>
              <span className="text-xs text-gray-500">
                {showReminderForm ? '▲ Hide' : '▼ Show'}
              </span>
            </button>

            {showReminderForm && (
              <div className="p-6 border-t border-border bg-gray-50 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Reminder Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    value={formData.reminderScheduledFor}
                    onChange={(e) => handleInputChange('reminderScheduledFor', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Reminder Notes
                  </label>
                  <textarea
                    placeholder="Add notes for this reminder..."
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                    rows={3}
                    maxLength={200}
                    value={formData.reminderNotes}
                    onChange={(e) => handleInputChange('reminderNotes', e.target.value)}
                  />
                  <p className="text-xs text-text-secondary mt-1 text-right">
                    {formData.reminderNotes.length}/200
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full"></span>
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-3">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<MessageCircle className="w-4 h-4 text-emerald-600" />}
                onClick={() => window.open(`https://wa.me/${formData.phone.replace(/\D/g, '')}`, '_blank')}
                className="bg-white hover:bg-emerald-50 hover:border-emerald-300 border-slate-200 shadow-sm transition-all justify-start text-sm"
                disabled={!formData.phone}
              >
                WhatsApp
              </Button>
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Phone className="w-4 h-4 text-blue-600" />}
                onClick={() => (window.location.href = `tel:${formData.phone}`)}
                className="bg-white hover:bg-blue-50 hover:border-blue-300 border-slate-200 shadow-sm transition-all justify-start text-sm"
                disabled={!formData.phone}
              >
                Call
              </Button>
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Mail className="w-4 h-4 text-indigo-600" />}
                onClick={() => formData.email && (window.location.href = `mailto:${formData.email}`)}
                className="bg-white hover:bg-indigo-50 hover:border-indigo-300 border-slate-200 shadow-sm transition-all justify-start text-sm"
                disabled={!formData.email}
              >
                Email
              </Button>
            </div>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}