
import { AlertCircle, Clock, Info, Copy, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SubscriptionStatus } from '@/lib/types';
import { useState } from 'react';

// Payment information (amount will be taken from subscription data)
const PAYMENT_INFO = {
  accountName: 'Eka Bachrudin',
  bankName: 'BCA',
  accountNumber: '5775724517',
};

const subscriptionConfig = {
  [SubscriptionStatus.PENDING]: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    textColor: 'text-blue-800',
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
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    iconColor: 'text-orange-600',
    textColor: 'text-orange-800',
    message: 'Anda melewati masa aktif akun, silahkan lakukan pembayaran. Anda masih dapat melakukan aktivitas.',
    type: 'banner' as const,
    hasPaymentPopup: true,
    canDismiss: false,
  },
  [SubscriptionStatus.CANCELLED]: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    textColor: 'text-red-800',
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
    <div className={`border ${config.borderColor} ${config.bgColor} rounded-lg p-3 mb-4`}>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 ${config.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={`flex-1 text-sm ${config.textColor}`}>
          <p>{config.message}</p>
          {hasPaymentPopup && (
            <button
              onClick={onOpenPaymentPopup}
              className={`mt-2 px-3 py-1.5 text-xs font-semibold rounded-lg
                bg-white border-2 ${config.borderColor} ${config.textColor}
                hover:bg-gray-50 transition-colors`}
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
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-sm font-medium text-gray-700 mb-3">Informasi Pembayaran:</p>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Bank</p>
            <p className="text-sm font-semibold text-gray-900">{PAYMENT_INFO.bankName}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">No. Rekening</p>
            <p className="text-sm font-mono font-semibold text-gray-900">{PAYMENT_INFO.accountNumber}</p>
          </div>
          <button
            onClick={() => copyToClipboard(PAYMENT_INFO.accountNumber, 'accountNumber')}
            className="p-1.5 hover:bg-gray-200 rounded transition-colors"
            title="Salin nomor rekening"
          >
            <Copy className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Atas Nama</p>
            <p className="text-sm font-semibold text-gray-900">{PAYMENT_INFO.accountName}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Nominal</p>
            <p className="text-sm font-semibold text-gray-900">Rp {formattedAmount}</p>
          </div>
          <button
            onClick={() => copyToClipboard(formattedAmount, 'amount')}
            className="p-1.5 hover:bg-gray-200 rounded transition-colors"
            title="Salin nominal"
          >
            <Copy className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {copied && (
        <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
          <span className="font-medium">Berhasil disalin!</span>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className={`flex items-center gap-3 p-4 border-b ${config.borderColor}`}>
          <div className={`shrink-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Informasi Pembayaran
          </h3>
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className={`text-sm ${config.textColor} mb-4`}>
            {config.message}
          </p>

          {/* Payment Information */}
          <PaymentInfo amount={amount} />
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-2 p-4 border-t ${config.borderColor} bg-gray-50`}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-gray-700 hover:bg-gray-200"
          >
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - tidak bisa di-close */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header - tidak ada tombol close */}
        <div className={`flex items-center gap-3 p-4 border-b ${config.borderColor}`}>
          <div className={`shrink-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Status Subscription
          </h3>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className={`text-sm ${config.textColor} mb-4`}>
            {config.message}
          </p>

          {/* Payment Information */}
          <PaymentInfo amount={amount} />
        </div>

        {/* Footer */}
        <div className={`flex flex-col items-center gap-3 p-4 border-t ${config.borderColor} bg-gray-50`}>
          <p className="text-xs text-gray-500">
            Akun akan segera aktif setelah pembayaran dikonfirmasi
          </p>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-red-600 hover:bg-red-50 border border-red-200"
          >
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
