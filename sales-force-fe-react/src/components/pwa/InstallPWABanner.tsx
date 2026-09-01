
import { X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useState, useEffect } from 'react';
import './InstallPWABanner.css';

export function InstallPWABanner() {
  const { isShowable, isIOS, promptInstall } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner before
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const daysPassed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Show banner if not permanently dismissed or 7 days have passed
    if (isShowable && (!dismissed || daysPassed > 7)) {
      setIsVisible(true);
    }
  }, [isShowable]);

  const handleInstall = async () => {
    if (isIOS) {
      // For iOS, show inline instructions instead of a blocking dialog
      setShowIosHelp(true);
      return;
    }

    const accepted = await promptInstall();
    if (accepted) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    // Store dismissal time (don't show again for 7 days)
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="install-pwa-banner">
      <button
        onClick={handleDismiss}
        className="install-pwa-banner__dismiss"
        aria-label="Close"
      >
        <X className="install-pwa-banner__dismiss-icon" />
      </button>

      <div className="install-pwa-banner__row">
        <div className="install-pwa-banner__content">
          <h3 className="install-pwa-banner__title">Install Sales Force App</h3>
          <p className="install-pwa-banner__subtitle">
            Add to your home screen for quick access
          </p>
        </div>

        <button onClick={handleInstall} className="install-pwa-banner__install">
          Install
        </button>
      </div>

      {showIosHelp && (
        <ol className="install-pwa-banner__ios-help">
          <li>Tap the Share button in Safari</li>
          <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
          <li>Tap &quot;Add&quot; in the top right</li>
        </ol>
      )}
    </div>
  );
}
