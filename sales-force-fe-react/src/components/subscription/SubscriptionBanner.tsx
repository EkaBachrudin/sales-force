
import { AlertCircle, Clock, Info, Copy, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionStatus } from '@/lib/types';
import { useState } from 'react';
import './SubscriptionBanner.css';

// Payment information (amount will be taken from subscription data)
const PAYMENT_INFO = {
  accountName: 'Eka Bachrudin',
  bankName: 'BCA',
  accountNumber: '5775724517',
};

type SubscriptionTone = 'blue' | 'orange' | 'red';

const subscriptionConfig = {
  [SubscriptionStatus.PENDING]: {
    icon: Info,
    tone: 'blue' as SubscriptionTone,
    message: 'Anda berada di masa trial aplikasi',
    type: 'banner' as const,
    hasPaymentPopup: false,
    canDismiss: false,
  },
  [SubscriptionStatus.ACTIVE]: {
    type: 'none' as const,
  },
  [SubscriptionStatus.OVERDUE]: {
    icon: Clock,
    tone: 'orange' as SubscriptionTone,
    message: 'Anda melewati masa aktif akun, silahkan lakukan pembayaran. Anda masih dapat melakukan aktivitas.',
    type: 'banner' as const,
    hasPaymentPopup: true,
    canDismiss: false,
  },
  [SubscriptionStatus.CANCELLED]: {
    icon: AlertCircle,
    tone: 'red' as SubscriptionTone,
    message: 'Anda melewati masa aktif akun, silahkan lakukan pembayaran.',
    type: 'popup' as const,
    canDismiss: false,
  },
};

function Banner({
  config,
  onOpenPaymentPopup
}: Readonly<{
  config: typeof subscriptionConfig[SubscriptionStatus.PENDING] | typeof subscriptionConfig[SubscriptionStatus.OVERDUE];
  onOpenPaymentPopup: () => void;
}>) {
  const hasPaymentPopup = 'hasPaymentPopup' in config ? config.hasPaymentPopup : false;

  const Icon = config.icon;

  return (
    <div className={`subscription-banner__box subscription-banner__box--${config.tone}`}>
      <div className="subscription-banner__row">
        <div className={`subscription-banner__icon subscription-banner__icon--${config.tone}`}>
          <Icon className="subscription-banner__icon-svg" />
        </div>
        <div className={`subscription-banner__content subscription-banner__content--${config.tone}`}>
          <p>{config.message}</p>
          {hasPaymentPopup && (
            <button
              onClick={onOpenPaymentPopup}
              className={`subscription-banner__cta subscription-banner__cta--${config.tone}`}
            >
              Lihat Info Pembayaran
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentInfo({ amount }: Readonly<{ amount: number }>) {
  const [copied, setCopied] = useState<'accountNumber' | 'amount' | null>(null);

  // Format amount to Indonesian format (e.g., 60000 -> "60.000", 40000.00 -> "40.000")
  const roundedAmount = Math.round(amount);
  const formattedAmount = roundedAmount.toLocaleString('id-ID');

  const copyToClipboard = (text: string, type: 'accountNumber' | 'amount') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="subscription-payment-info">
      <p className="subscription-payment-info__title">Informasi Pembayaran:</p>

      <div className="subscription-payment-info__list">
        <div className="subscription-payment-info__row">
          <div>
            <p className="subscription-payment-info__label">Bank</p>
            <p className="subscription-payment-info__value">{PAYMENT_INFO.bankName}</p>
          </div>
        </div>

        <div className="subscription-payment-info__row">
          <div>
            <p className="subscription-payment-info__label">No. Rekening</p>
            <p className="subscription-payment-info__value subscription-payment-info__value--mono">
              {PAYMENT_INFO.accountNumber}
            </p>
          </div>
          <button
            onClick={() => copyToClipboard(PAYMENT_INFO.accountNumber, 'accountNumber')}
            className="subscription-payment-info__copy"
            title="Salin nomor rekening"
          >
            <Copy className="subscription-payment-info__copy-icon" />
          </button>
        </div>

        <div className="subscription-payment-info__row">
          <div>
            <p className="subscription-payment-info__label">Atas Nama</p>
            <p className="subscription-payment-info__value">{PAYMENT_INFO.accountName}</p>
          </div>
        </div>

        <div className="subscription-payment-info__row">
          <div>
            <p className="subscription-payment-info__label">Nominal</p>
            <p className="subscription-payment-info__value">Rp {formattedAmount}</p>
          </div>
          <button
            onClick={() => copyToClipboard(formattedAmount, 'amount')}
            className="subscription-payment-info__copy"
            title="Salin nominal"
          >
            <Copy className="subscription-payment-info__copy-icon" />
          </button>
        </div>
      </div>

      {copied && (
        <p className="subscription-payment-info__copied">
          <span className="subscription-payment-info__copied-text">Berhasil disalin!</span>
        </p>
      )}
    </div>
  );
}

function PaymentPopup({ config, onClose, amount }: Readonly<{
  config: typeof subscriptionConfig[SubscriptionStatus.OVERDUE];
  onClose: () => void;
  amount: number;
}>) {
  const Icon = config.icon;

  return (
    <div className="subscription-payment-popup">
      {/* Backdrop */}
      <button
        className="subscription-payment-popup__backdrop"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="subscription-payment-popup__modal">
        {/* Header */}
        <div className={`subscription-payment-popup__header subscription-payment-popup__header--${config.tone}`}>
          <div className={`subscription-payment-popup__icon subscription-payment-popup__icon--${config.tone}`}>
            <Icon className={`subscription-payment-popup__icon-svg subscription-payment-popup__icon-svg--${config.tone}`} />
          </div>
          <h3 className="subscription-payment-popup__title">Informasi Pembayaran</h3>
          <button onClick={onClose} className="subscription-payment-popup__close">
            <X className="subscription-payment-popup__close-icon" />
          </button>
        </div>

        {/* Body */}
        <div className="subscription-payment-popup__body">
          <p className={`subscription-payment-popup__message subscription-payment-popup__message--${config.tone}`}>
            {config.message}
          </p>

          {/* Payment Information */}
          <PaymentInfo amount={amount} />
        </div>

        {/* Footer */}
        <div className={`subscription-payment-popup__footer subscription-payment-popup__footer--${config.tone}`}>
          <button onClick={onClose} className="subscription-payment-popup__footer-button">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function CancelledPopup({ config, amount }: Readonly<{
  config: typeof subscriptionConfig[SubscriptionStatus.CANCELLED];
  amount: number;
}>) {
  const { logout } = useAuth();
  const Icon = config.icon;

  return (
    <div className="subscription-cancelled-popup">
      {/* Backdrop - tidak bisa di-close */}
      <div className="subscription-cancelled-popup__backdrop" />

      {/* Modal */}
      <div className="subscription-cancelled-popup__modal">
        {/* Header - tidak ada tombol close */}
        <div className={`subscription-cancelled-popup__header subscription-cancelled-popup__header--${config.tone}`}>
          <div className={`subscription-cancelled-popup__icon subscription-cancelled-popup__icon--${config.tone}`}>
            <Icon className={`subscription-cancelled-popup__icon-svg subscription-cancelled-popup__icon-svg--${config.tone}`} />
          </div>
          <h3 className="subscription-cancelled-popup__title">Status Subscription</h3>
        </div>

        {/* Body */}
        <div className="subscription-cancelled-popup__body">
          <p className={`subscription-cancelled-popup__message subscription-cancelled-popup__message--${config.tone}`}>
            {config.message}
          </p>

          {/* Payment Information */}
          <PaymentInfo amount={amount} />
        </div>

        {/* Footer */}
        <div className={`subscription-cancelled-popup__footer subscription-cancelled-popup__footer--${config.tone}`}>
          <p className="subscription-cancelled-popup__note">
            Akun akan segera aktif setelah pembayaran dikonfirmasi
          </p>
          <button onClick={logout} className="subscription-cancelled-popup__logout">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export function SubscriptionBanner() {
  const { user } = useAuth();
  const subscriptionStatus = user?.subscription?.status;
  const subscriptionAmount = user?.subscription?.amount ?? 60000; // Default fallback to 60000
  const [isPaymentPopupOpen, setIsPaymentPopupOpen] = useState(false);

  // Don't show banner if no subscription or status is active
  if (!subscriptionStatus || subscriptionStatus === SubscriptionStatus.ACTIVE) {
    return null;
  }

  const config = subscriptionConfig[subscriptionStatus];

  if (!config) {
    return null;
  }

  // Render cancelled popup (no banner)
  if (subscriptionStatus === SubscriptionStatus.CANCELLED && config.type === 'popup') {
    return <CancelledPopup config={config} amount={subscriptionAmount} />;
  }

  // Render banner for pending and overdue
  if (config.type === 'banner') {
    return (
      <>
        <Banner
          config={config}
          onOpenPaymentPopup={() => setIsPaymentPopupOpen(true)}
        />
        {/* Payment popup triggered by overdue banner CTA */}
        {isPaymentPopupOpen && subscriptionStatus === SubscriptionStatus.OVERDUE && (
          <PaymentPopup
            config={subscriptionConfig[SubscriptionStatus.OVERDUE]}
            onClose={() => setIsPaymentPopupOpen(false)}
            amount={subscriptionAmount}
          />
        )}
      </>
    );
  }

  return null;
}
