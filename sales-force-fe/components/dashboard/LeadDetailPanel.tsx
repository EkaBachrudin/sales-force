'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Edit2, Phone, Mail, MapPin, Calendar, Calculator, MessageCircle, Clock, Bell, IdCard, FileText, Check, Copy, ChevronDown, ChevronUp, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn, formatCurrency, formatPhone, formatDate } from '@/lib/utils';
import { Lead, PipelineStage } from './KanbanBoard';

export interface LeadDetailPanelProps {
  lead?: Lead | null;
  isOpen?: boolean;
  onClose?: () => void;
  onEdit?: () => void;
}

const stageOptions = [
  { value: 'new', label: 'Baru Masuk' },
  { value: 'contacted', label: 'Dikontak' },
  { value: 'surveyed', label: 'Survey' },
  { value: 'negotiating', label: 'Negosiasi' },
  { value: 'closed', label: 'Closing' },
  { value: 'cancelled', label: 'Batal' },
];

const stageVariantMap: Record<PipelineStage, 'gray' | 'blue' | 'purple' | 'orange' | 'green' | 'red'> = {
  new: 'gray',
  contacted: 'blue',
  surveyed: 'purple',
  negotiating: 'orange',
  closed: 'green',
  cancelled: 'red',
};

const stageGradientMap: Record<PipelineStage, string> = {
  new: 'from-slate-100 to-gray-100',
  contacted: 'from-blue-100 to-indigo-100',
  surveyed: 'from-purple-100 to-violet-100',
  negotiating: 'from-orange-100 to-amber-100',
  closed: 'from-emerald-100 to-green-100',
  cancelled: 'from-red-100 to-rose-100',
};

const stageColorMap: Record<PipelineStage, string> = {
  new: 'text-slate-600',
  contacted: 'text-blue-600',
  surveyed: 'text-purple-600',
  negotiating: 'text-orange-600',
  closed: 'text-emerald-600',
  cancelled: 'text-red-600',
};

const sourceConfig: Record<string, { icon: string; color: string; bgGradient: string; label: string }> = {
  'Website': { icon: '🌐', color: 'text-blue-600', bgGradient: 'from-blue-50 to-cyan-50', label: 'Website' },
  'Instagram': { icon: '📸', color: 'text-pink-600', bgGradient: 'from-pink-50 to-rose-50', label: 'Instagram' },
  'Facebook': { icon: '👥', color: 'text-blue-700', bgGradient: 'from-blue-50 to-indigo-50', label: 'Facebook' },
  'WhatsApp': { icon: '💬', color: 'text-green-600', bgGradient: 'from-green-50 to-emerald-50', label: 'WhatsApp' },
  'Referral': { icon: '🤝', color: 'text-purple-600', bgGradient: 'from-purple-50 to-violet-50', label: 'Referral' },
  'Other': { icon: '📌', color: 'text-slate-600', bgGradient: 'from-slate-50 to-gray-50', label: 'Lainnya' },
};

export function LeadDetailPanel({
  lead,
  isOpen = false,
  onClose,
  onEdit,
}: LeadDetailPanelProps) {
  const [showKprCalculator, setShowKprCalculator] = useState(true);
  const [copiedField, setCopiedField] = useState<'nik' | 'npwp' | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Disable body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleCopy = async (value: string, field: 'nik' | 'npwp') => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    const focusableElements = panelRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements?.[0] as HTMLElement;
    const lastElement = focusableElements?.[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    closeButtonRef.current?.focus();
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
    };
  }, [isOpen, onClose]);

  if (!lead) return null;

  // Calculate KPR simulation
  const propertyPrice = parseFloat(lead.kpr_simulation?.property_price || '0');
  const downPayment = lead.kpr_simulation?.down_payment || 0;
  const loanAmount = propertyPrice - downPayment;
  const interestRate = lead.kpr_simulation ? lead.kpr_simulation?.interest_rate : 0;
  const termYears = lead.kpr_simulation?.loan_term_years || 0;
  const monthlyPayment = loanAmount > 0 && interestRate > 0 && termYears > 0
    ? (loanAmount * (interestRate / 100 / 12) * Math.pow(1 + interestRate / 100 / 12, termYears * 12)) /
      (Math.pow(1 + interestRate / 100 / 12, termYears * 12) - 1)
    : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 z-40',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-detail-title"
        className={cn(
          'fixed top-0 right-0 h-full w-full md:w-[500px] lg:w-[540px] bg-white shadow-2xl z-50 transition-transform duration-300 ease-out flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Tutup panel detail"
          >
            <X className="w-5 h-5" />
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">Tutup</span>
          </button>
          <h1 id="lead-detail-title" className="text-base sm:text-lg font-semibold text-slate-800">
            Detail Lead
          </h1>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Edit2 className="w-4 h-4" />}
            onClick={onEdit}
            className="shadow-sm hover:shadow text-xs sm:text-sm"
            aria-label="Edit data lead"
          >
            <span className="hidden sm:inline">Edit</span>
          </Button>
        </header>

        {/* Content */}
        <div className="overflow-y-auto flex-1 scroll-smooth">
          {/* Lead Info Card */}
          <section aria-labelledby="lead-info-heading" className="p-4 sm:p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-b border-slate-200">
            <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
              <div className="flex-1 min-w-0">
                <h2 id="lead-info-heading" className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
                  {lead.name}
                </h2>
                <a
                  href={`tel:${lead.phone}`}
                  className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1"
                >
                  <Phone className="w-4 h-4" aria-hidden="true" />
                  <span className="font-medium text-sm">{formatPhone(lead.phone)}</span>
                </a>
              </div>
              <Badge variant={stageVariantMap[lead.status as PipelineStage]} size="lg" className="shadow-sm">
                {stageOptions.find((s) => s.value === lead.status)?.label}
              </Badge>
            </div>

            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors mb-3 sm:mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm truncate">{lead.email}</span>
              </a>
            )}

            {/* ID Cards Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
              {lead.nik && (
                <button
                  onClick={() => handleCopy(lead.nik!, 'nik')}
                  className="flex items-center justify-between gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-white/70 backdrop-blur rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-white hover:shadow-md transition-all group focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label={`Salin NIK: ${lead.nik}`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <IdCard className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
                    <div className="text-left min-w-0">
                      <span className="block text-xs font-medium text-slate-500">NIK</span>
                      <span className="block text-xs sm:text-sm text-slate-700 truncate">{lead.nik}</span>
                    </div>
                  </div>
                  {copiedField === 'nik' ? (
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 flex-shrink-0 transition-colors" aria-hidden="true" />
                  )}
                </button>
              )}

              {lead.npwp && (
                <button
                  onClick={() => handleCopy(lead.npwp!, 'npwp')}
                  className="flex items-center justify-between gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 bg-white/70 backdrop-blur rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-white hover:shadow-md transition-all group focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label={`Salin NPWP: ${lead.npwp}`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
                    <div className="text-left min-w-0">
                      <span className="block text-xs font-medium text-slate-500">NPWP</span>
                      <span className="block text-xs sm:text-sm text-slate-700 truncate">{lead.npwp}</span>
                    </div>
                  </div>
                  {copiedField === 'npwp' ? (
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 flex-shrink-0 transition-colors" aria-hidden="true" />
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
              <span className="text-xs">Dibuat sejak {formatDate(lead.created_at)}</span>
            </div>
          </section>

          {/* Property Interest */}
          {lead.property && (
            <section aria-labelledby="property-heading" className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50">
              <h3 id="property-heading" className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 sm:mb-4">
                Property Interest
              </h3>
              <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm sm:text-base font-semibold text-slate-800 truncate block">
                      {lead.property.name}
                    </span>
                    <span className="text-xs text-slate-500 truncate block">
                      {lead.property.property_type}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Budget Range */}
          {((lead.budget_range?.min ?? 0) > 0 || (lead.budget_range?.max ?? 0) > 0) && (
            <section aria-labelledby="budget-heading" className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50">
              <h3 id="budget-heading" className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 sm:mb-4">
                Budget Range
              </h3>
              <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <span className="block text-xs text-slate-500 mb-1">Minimum</span>
                        <span className="block text-sm sm:text-base font-bold text-blue-600">
                          {formatCurrency(lead.budget_range?.min ?? 0)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500 mb-1">Maksimum</span>
                        <span className="block text-sm sm:text-base font-bold text-blue-600">
                          {formatCurrency(lead.budget_range?.max ?? 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Source & Pipeline Stage */}
          <section className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-gray-50">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Source */}
              {lead.source && (
                <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br ${sourceConfig[lead.source]?.bgGradient || 'from-slate-100 to-gray-100'} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-lg sm:text-xl">{sourceConfig[lead.source]?.icon || '📌'}</span>
                    </div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sumber</span>
                  </div>
                  <span className={`text-lg sm:text-base font-bold ${sourceConfig[lead.source]?.color || 'text-slate-700'}`}>
                    {sourceConfig[lead.source]?.label || lead.source}
                  </span>
                </div>
              )}

              {/* Pipeline Stage */}
              <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br ${stageGradientMap[lead.status as PipelineStage]} flex items-center justify-center flex-shrink-0`}>
                    <User className={`w-4 h-4 sm:w-5 sm:h-5 ${stageColorMap[lead.status as PipelineStage]}`} />
                  </div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tahap</span>
                </div>
                <Badge variant={stageVariantMap[lead.status as PipelineStage]} size="lg" className="shadow-sm">
                  {stageOptions.find((s) => s.value === lead.status)?.label}
                </Badge>
              </div>
            </div>
          </section>

          {/* KPR Simulation */}
          {((lead.kpr_simulation?.interest_rate ?? 0) > 0 || (lead.kpr_simulation?.loan_term_years ?? 0) > 0) && (
            <section aria-labelledby="kpr-heading" className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50">
              <button
              onClick={() => setShowKprCalculator(!showKprCalculator)}
              className="flex items-center justify-between w-full mb-3 sm:mb-4 group focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg"
              aria-expanded={showKprCalculator}
              aria-controls="kpr-content"
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
                </div>
                <h3 id="kpr-heading" className="text-sm sm:text-base font-semibold text-slate-800">
                  Simulasi KPR
                </h3>
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full group-hover:bg-indigo-100 transition-colors">
                {showKprCalculator ? (
                  <>
                    <span className="hidden xs:inline">Tutup</span>
                    <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                  </>
                ) : (
                  <>
                    <span className="hidden xs:inline">Lihat</span>
                    <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                  </>
                )}
              </span>
            </button>

            {showKprCalculator && (
              <div id="kpr-content" className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-in slide-in-from-top-2 duration-300">
                <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                    <span className="text-slate-600">Harga Properti:</span>
                    <span className="font-semibold text-slate-900 text-xs sm:text-sm">{formatCurrency(propertyPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                    <span className="text-slate-600">Uang Muka ({lead.kpr_simulation?.down_payment_percentage}%):</span>
                    <span className="font-semibold text-slate-900 text-xs sm:text-sm">{formatCurrency(downPayment)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100">
                    <span className="text-slate-600">Plafon Pinjaman:</span>
                    <span className="font-semibold text-slate-900 text-xs sm:text-sm">{formatCurrency(loanAmount)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 py-1.5 sm:py-2 border-b border-slate-100">
                    <div>
                      <span className="text-slate-600">Bunga:</span>
                      <span className="ml-1 sm:ml-2 font-semibold text-slate-900 text-xs sm:text-sm">{interestRate}% p.a.</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Tenor:</span>
                      <span className="ml-1 sm:ml-2 font-semibold text-slate-900 text-xs sm:text-sm">{termYears} tahun</span>
                    </div>
                  </div>
                  <div className="pt-2 sm:pt-3 mt-1 sm:mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium text-xs sm:text-sm">Angsuran per bulan:</span>
                      <span className="font-bold text-base sm:text-xl text-indigo-600">
                        {formatCurrency(Math.round(monthlyPayment))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
          )}

          {/* Quick Actions */}
          <section aria-labelledby="actions-heading" className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50">
            <h3 id="actions-heading" className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 sm:mb-4">
              Aksi Cepat
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<MessageCircle className="w-4 h-4 text-emerald-600" />}
                onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank')}
                className="bg-white hover:bg-emerald-50 hover:border-emerald-300 border-slate-200 shadow-sm transition-all justify-start text-xs sm:text-sm"
                aria-label="Hubungi via WhatsApp"
              >
                WhatsApp
              </Button>
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Phone className="w-4 h-4 text-blue-600" />}
                onClick={() => (window.location.href = `tel:${lead.phone}`)}
                className="bg-white hover:bg-blue-50 hover:border-blue-300 border-slate-200 shadow-sm transition-all justify-start text-xs sm:text-sm"
                aria-label="Telepon lead"
              >
                Telepon
              </Button>
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Mail className="w-4 h-4 text-indigo-600" />}
                onClick={() => lead.email && (window.location.href = `mailto:${lead.email}`)}
                className="bg-white hover:bg-indigo-50 hover:border-indigo-300 border-slate-200 shadow-sm transition-all justify-start text-xs sm:text-sm"
                aria-label="Kirim email"
                disabled={!lead.email}
              >
                Email
              </Button>
            </div>
          </section>

          {/* Notes Section */}
          {lead.notes && (
            <section aria-labelledby="notes-heading" className="p-4 sm:p-6 bg-white">
              <h3 id="notes-heading" className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 sm:mb-4">
                Catatan
              </h3>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 sm:p-5 border border-slate-200">
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{lead.notes}</p>
              </div>
            </section>
          )}

           {/* Reminder */}
          {lead.reminders && lead.reminders.length > 0 && (
            <section aria-labelledby="reminder-heading" className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50 mb-10">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                </div>
                <h3 id="reminder-heading" className="text-sm sm:text-base font-semibold text-amber-900">
                  Reminder
                </h3>
              </div>
              <div className="space-y-3">
                {lead.reminders.map((reminder, index) => (
                  <div key={reminder.id || index} className="bg-white/80 backdrop-blur rounded-xl p-3 sm:p-4 border border-amber-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <span className="text-xs sm:text-sm text-slate-600">Dijadwalkan:</span>
                      <time
                        className="text-xs sm:text-sm font-semibold text-slate-900 bg-amber-100 px-2 sm:px-3 py-1 rounded-full"
                        dateTime={reminder.remind_at}
                      >
                        {new Date(reminder.remind_at).toLocaleString('id-ID', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                    {reminder.message && (
                      <div className="pt-2 sm:pt-3 border-t border-amber-200">
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{reminder.message}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
