
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { X, Edit2, Phone, Mail, MapPin, Calendar, Calculator, MessageCircle, Bell, IdCard, FileText, Check, Copy, ChevronDown, ChevronUp, User, Globe, Camera, Users, Handshake, Pin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn, formatCurrency, formatPhone, formatDate } from '@/lib/utils';
import type { Lead, PipelineStage } from '@/lib/types';
import './LeadDetailPanel.css';

export interface LeadDetailPanelProps {
  lead?: Lead | null;
  isOpen?: boolean;
  onClose?: () => void;
  onEdit?: () => void;
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

const stageVariantMap: Record<PipelineStage, 'gray' | 'blue' | 'purple' | 'orange' | 'teal' | 'green' | 'red'> = {
  new: 'gray',
  contacted: 'blue',
  surveyed: 'purple',
  negotiating: 'orange',
  booked: 'teal',
  closed: 'green',
  cancelled: 'red',
};

const stageGradientMap: Record<PipelineStage, string> = {
  new: 'lead-detail-panel__stage-icon--new',
  contacted: 'lead-detail-panel__stage-icon--contacted',
  surveyed: 'lead-detail-panel__stage-icon--surveyed',
  negotiating: 'lead-detail-panel__stage-icon--negotiating',
  booked: 'lead-detail-panel__stage-icon--booked',
  closed: 'lead-detail-panel__stage-icon--closed',
  cancelled: 'lead-detail-panel__stage-icon--cancelled',
};

const stageColorMap: Record<PipelineStage, string> = {
  new: 'lead-detail-panel__stage-icon-svg--new',
  contacted: 'lead-detail-panel__stage-icon-svg--contacted',
  surveyed: 'lead-detail-panel__stage-icon-svg--surveyed',
  negotiating: 'lead-detail-panel__stage-icon-svg--negotiating',
  booked: 'lead-detail-panel__stage-icon-svg--booked',
  closed: 'lead-detail-panel__stage-icon-svg--closed',
  cancelled: 'lead-detail-panel__stage-icon-svg--cancelled',
};

const sourceConfig: Record<string, { icon: ReactNode; iconBoxClass: string; valueClass: string; label: string }> = {
  'Website': { icon: <Globe className="lead-detail-panel__source-icon-svg" />, iconBoxClass: 'lead-detail-panel__source-icon--website', valueClass: 'lead-detail-panel__source-value--website', label: 'Website' },
  'Instagram': { icon: <Camera className="lead-detail-panel__source-icon-svg" />, iconBoxClass: 'lead-detail-panel__source-icon--instagram', valueClass: 'lead-detail-panel__source-value--instagram', label: 'Instagram' },
  'Facebook': { icon: <Users className="lead-detail-panel__source-icon-svg" />, iconBoxClass: 'lead-detail-panel__source-icon--facebook', valueClass: 'lead-detail-panel__source-value--facebook', label: 'Facebook' },
  'WhatsApp': { icon: <MessageCircle className="lead-detail-panel__source-icon-svg" />, iconBoxClass: 'lead-detail-panel__source-icon--whatsapp', valueClass: 'lead-detail-panel__source-value--whatsapp', label: 'WhatsApp' },
  'Referral': { icon: <Handshake className="lead-detail-panel__source-icon-svg" />, iconBoxClass: 'lead-detail-panel__source-icon--referral', valueClass: 'lead-detail-panel__source-value--referral', label: 'Referral' },
  'Other': { icon: <Pin className="lead-detail-panel__source-icon-svg" />, iconBoxClass: 'lead-detail-panel__source-icon--other', valueClass: 'lead-detail-panel__source-value--other', label: 'Lainnya' },
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
  const propertyPrice = lead.kpr_simulation?.property_price || 0;
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
        className={cn('lead-detail-panel__backdrop', !isOpen && 'lead-detail-panel__backdrop--closed')}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-detail-title"
        className={cn('lead-detail-panel', !isOpen && 'lead-detail-panel--closed')}
      >
        {/* Header */}
        <header className="lead-detail-panel__header">
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="lead-detail-panel__close"
            aria-label="Tutup panel detail"
          >
            <X className="lead-detail-panel__close-icon" />
            <span className="lead-detail-panel__close-text">Tutup</span>
          </button>
          <h1 id="lead-detail-title" className="lead-detail-panel__title">
            Detail Lead
          </h1>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Edit2 className="lead-detail-panel__edit-icon" />}
            onClick={onEdit}
            className="lead-detail-panel__edit-button"
            aria-label="Edit data lead"
          >
            <span className="lead-detail-panel__edit-text">Edit</span>
          </Button>
        </header>

        {/* Content */}
        <div className="lead-detail-panel__content">
          {/* Lead Info Card */}
          <section aria-labelledby="lead-info-heading" className="lead-detail-panel__info">
            <div className="lead-detail-panel__info-header">
              <div className="lead-detail-panel__info-main">
                <h2 id="lead-info-heading" className="lead-detail-panel__name">
                  {lead.name}
                </h2>
                <a href={`tel:${lead.phone}`} className="lead-detail-panel__phone">
                  <Phone className="lead-detail-panel__phone-icon" aria-hidden="true" />
                  <span className="lead-detail-panel__phone-text">{formatPhone(lead.phone)}</span>
                </a>
              </div>
              <Badge variant={stageVariantMap[lead.status as PipelineStage]} size="lg" className="shadow-sm">
                {stageOptions.find((s) => s.value === lead.status)?.label}
              </Badge>
            </div>

            {lead.email && (
              <a href={`mailto:${lead.email}`} className="lead-detail-panel__email">
                <Mail className="lead-detail-panel__email-icon" aria-hidden="true" />
                <span className="lead-detail-panel__email-text">{lead.email}</span>
              </a>
            )}

            {/* ID Cards Grid */}
            <div className="lead-detail-panel__id-cards">
              {lead.nik && (
                <button
                  onClick={() => handleCopy(lead.nik!, 'nik')}
                  className="lead-detail-panel__id-card"
                  aria-label={`Salin NIK: ${lead.nik}`}
                >
                  <div className="lead-detail-panel__id-card-content">
                    <IdCard className="lead-detail-panel__id-card-icon" aria-hidden="true" />
                    <div className="lead-detail-panel__id-card-text">
                      <span className="lead-detail-panel__id-card-label">NIK</span>
                      <span className="lead-detail-panel__id-card-value">{lead.nik}</span>
                    </div>
                  </div>
                  {copiedField === 'nik' ? (
                    <Check className="lead-detail-panel__id-card-copy lead-detail-panel__id-card-copy--check" aria-hidden="true" />
                  ) : (
                    <Copy className="lead-detail-panel__id-card-copy" aria-hidden="true" />
                  )}
                </button>
              )}

              {lead.npwp && (
                <button
                  onClick={() => handleCopy(lead.npwp!, 'npwp')}
                  className="lead-detail-panel__id-card"
                  aria-label={`Salin NPWP: ${lead.npwp}`}
                >
                  <div className="lead-detail-panel__id-card-content">
                    <FileText className="lead-detail-panel__id-card-icon" aria-hidden="true" />
                    <div className="lead-detail-panel__id-card-text">
                      <span className="lead-detail-panel__id-card-label">NPWP</span>
                      <span className="lead-detail-panel__id-card-value">{lead.npwp}</span>
                    </div>
                  </div>
                  {copiedField === 'npwp' ? (
                    <Check className="lead-detail-panel__id-card-copy lead-detail-panel__id-card-copy--check" aria-hidden="true" />
                  ) : (
                    <Copy className="lead-detail-panel__id-card-copy" aria-hidden="true" />
                  )}
                </button>
              )}
            </div>

            <div className="lead-detail-panel__created">
              <Calendar className="lead-detail-panel__created-icon" aria-hidden="true" />
              <span className="lead-detail-panel__created-text">Dibuat sejak {formatDate(lead.created_at)}</span>
            </div>
          </section>

          {/* Property Interest */}
          {lead.property && (
            <section aria-labelledby="property-heading" className="lead-detail-panel__section">
              <h3 id="property-heading" className="lead-detail-panel__section-title">
                Property Interest
              </h3>
              <div className="lead-detail-panel__card">
                <div className="lead-detail-panel__card-row">
                  <div className="lead-detail-panel__property-icon">
                    <MapPin className="lead-detail-panel__property-icon-svg" />
                  </div>
                  <div className="lead-detail-panel__property-info">
                    <span className="lead-detail-panel__property-name">{lead.property.name}</span>
                    <span className="lead-detail-panel__property-type">{lead.property.property_type}</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Budget Range */}
          {((lead.budget_range?.min ?? 0) > 0 || (lead.budget_range?.max ?? 0) > 0) && (
            <section aria-labelledby="budget-heading" className="lead-detail-panel__section">
              <h3 id="budget-heading" className="lead-detail-panel__section-title">
                Budget Range
              </h3>
              <div className="lead-detail-panel__card">
                <div className="lead-detail-panel__card-row">
                  <div className="lead-detail-panel__budget-icon">
                    <Calculator className="lead-detail-panel__budget-icon-svg" />
                  </div>
                  <div className="lead-detail-panel__budget-content">
                    <div className="lead-detail-panel__budget-grid">
                      <div>
                        <span className="lead-detail-panel__budget-label">Minimum</span>
                        <span className="lead-detail-panel__budget-value">
                          {formatCurrency(lead.budget_range?.min ?? 0)}
                        </span>
                      </div>
                      <div>
                        <span className="lead-detail-panel__budget-label">Maksimum</span>
                        <span className="lead-detail-panel__budget-value">
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
          <section className="lead-detail-panel__meta-section">
            <div className="lead-detail-panel__meta-grid">
              {/* Source */}
              {lead.source && (
                <div className="lead-detail-panel__meta-card">
                  <div className="lead-detail-panel__meta-card-header">
                    <div className={`lead-detail-panel__source-icon ${sourceConfig[lead.source]?.iconBoxClass || 'lead-detail-panel__source-icon--other'}`}>
                      {sourceConfig[lead.source]?.icon || <Pin className="lead-detail-panel__source-icon-svg" />}
                    </div>
                    <span className="lead-detail-panel__meta-card-label">Sumber</span>
                  </div>
                  <span className={`lead-detail-panel__source-value ${sourceConfig[lead.source]?.valueClass || 'lead-detail-panel__source-value--other'}`}>
                    {sourceConfig[lead.source]?.label || lead.source}
                  </span>
                </div>
              )}

              {/* Pipeline Stage */}
              <div className="lead-detail-panel__meta-card">
                <div className="lead-detail-panel__meta-card-header">
                  <div className={`lead-detail-panel__stage-icon ${stageGradientMap[lead.status as PipelineStage]}`}>
                    <User className={`lead-detail-panel__stage-icon-svg ${stageColorMap[lead.status as PipelineStage]}`} />
                  </div>
                  <span className="lead-detail-panel__meta-card-label">Tahap</span>
                </div>
                <Badge variant={stageVariantMap[lead.status as PipelineStage]} size="lg" className="shadow-sm">
                  {stageOptions.find((s) => s.value === lead.status)?.label}
                </Badge>
              </div>
            </div>
          </section>

          {/* KPR Simulation */}
          {((lead.kpr_simulation?.interest_rate ?? 0) > 0 || (lead.kpr_simulation?.loan_term_years ?? 0) > 0) && (
            <section aria-labelledby="kpr-heading" className="lead-detail-panel__section">
              <button
              onClick={() => setShowKprCalculator(!showKprCalculator)}
              className="lead-detail-panel__kpr-toggle"
              aria-expanded={showKprCalculator}
              aria-controls="kpr-content"
            >
              <div className="lead-detail-panel__kpr-toggle-inner">
                <div className="lead-detail-panel__kpr-icon">
                  <Calculator className="lead-detail-panel__kpr-icon-svg" />
                </div>
                <h3 id="kpr-heading" className="lead-detail-panel__kpr-heading">
                  Simulasi KPR
                </h3>
              </div>
              <span className="lead-detail-panel__kpr-toggle-badge">
                {showKprCalculator ? (
                  <>
                    <span className="lead-detail-panel__kpr-toggle-label">Tutup</span>
                    <ChevronUp className="lead-detail-panel__kpr-toggle-chevron" aria-hidden="true" />
                  </>
                ) : (
                  <>
                    <span className="lead-detail-panel__kpr-toggle-label">Lihat</span>
                    <ChevronDown className="lead-detail-panel__kpr-toggle-chevron" aria-hidden="true" />
                  </>
                )}
              </span>
            </button>

            {showKprCalculator && (
              <div id="kpr-content" className="lead-detail-panel__kpr-content">
                <div className="lead-detail-panel__kpr-body">
                  <div className="lead-detail-panel__kpr-row">
                    <span className="lead-detail-panel__kpr-row-label">Harga Properti:</span>
                    <span className="lead-detail-panel__kpr-row-value">{formatCurrency(propertyPrice)}</span>
                  </div>
                  <div className="lead-detail-panel__kpr-row">
                    <span className="lead-detail-panel__kpr-row-label">Uang Muka ({lead.kpr_simulation?.down_payment_percentage}%):</span>
                    <span className="lead-detail-panel__kpr-row-value">{formatCurrency(downPayment)}</span>
                  </div>
                  <div className="lead-detail-panel__kpr-row">
                    <span className="lead-detail-panel__kpr-row-label">Plafon Pinjaman:</span>
                    <span className="lead-detail-panel__kpr-row-value">{formatCurrency(loanAmount)}</span>
                  </div>
                  <div className="lead-detail-panel__kpr-grid">
                    <div>
                      <span className="lead-detail-panel__kpr-row-label">Bunga:</span>
                      <span className="lead-detail-panel__kpr-cell-value">{interestRate}% p.a.</span>
                    </div>
                    <div>
                      <span className="lead-detail-panel__kpr-row-label">Tenor:</span>
                      <span className="lead-detail-panel__kpr-cell-value">{termYears} tahun</span>
                    </div>
                  </div>
                  <div className="lead-detail-panel__kpr-monthly">
                    <div className="lead-detail-panel__kpr-monthly-row">
                      <span className="lead-detail-panel__kpr-monthly-label">Angsuran per bulan:</span>
                      <span className="lead-detail-panel__kpr-monthly-value">
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
          <section aria-labelledby="actions-heading" className="lead-detail-panel__section">
            <h3 id="actions-heading" className="lead-detail-panel__section-title">
              Aksi Cepat
            </h3>
            <div className="lead-detail-panel__actions-grid">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<MessageCircle className="lead-detail-panel__action-icon lead-detail-panel__action-icon--whatsapp" />}
                onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank')}
                className="lead-detail-panel__action-button lead-detail-panel__action-button--whatsapp"
                aria-label="Hubungi via WhatsApp"
              >
                WhatsApp
              </Button>
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Phone className="lead-detail-panel__action-icon lead-detail-panel__action-icon--telepon" />}
                onClick={() => (window.location.href = `tel:${lead.phone}`)}
                className="lead-detail-panel__action-button lead-detail-panel__action-button--telepon"
                aria-label="Telepon lead"
              >
                Telepon
              </Button>
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Mail className="lead-detail-panel__action-icon lead-detail-panel__action-icon--email" />}
                onClick={() => lead.email && (window.location.href = `mailto:${lead.email}`)}
                className="lead-detail-panel__action-button lead-detail-panel__action-button--email"
                aria-label="Kirim email"
                disabled={!lead.email}
              >
                Email
              </Button>
            </div>
          </section>

          {/* Notes Section */}
          {lead.notes && (
            <section aria-labelledby="notes-heading" className="lead-detail-panel__notes">
              <h3 id="notes-heading" className="lead-detail-panel__section-title">
                Catatan
              </h3>
              <div className="lead-detail-panel__notes-box">
                <p className="lead-detail-panel__notes-text">{lead.notes}</p>
              </div>
            </section>
          )}

           {/* Reminder */}
          {lead.reminders && lead.reminders.length > 0 && (
            <section aria-labelledby="reminder-heading" className="lead-detail-panel__reminder">
              <div className="lead-detail-panel__reminder-header">
                <div className="lead-detail-panel__reminder-icon">
                  <Bell className="lead-detail-panel__reminder-icon-svg" />
                </div>
                <h3 id="reminder-heading" className="lead-detail-panel__reminder-heading">
                  Reminder
                </h3>
              </div>
              <div className="lead-detail-panel__reminder-list">
                {lead.reminders.map((reminder, index) => (
                  <div key={reminder.id || index} className="lead-detail-panel__reminder-item">
                    <div className="lead-detail-panel__reminder-item-row">
                      <span className="lead-detail-panel__reminder-label">Dijadwalkan:</span>
                      <time
                        className="lead-detail-panel__reminder-time"
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
                      <div className="lead-detail-panel__reminder-message">
                        <p className="lead-detail-panel__reminder-message-text">{reminder.message}</p>
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
