'use client';

import { X, Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useState, useEffect } from 'react';

export function InstallPWABanner() {
  const { isShowable, isIOS, promptInstall } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

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
      // For iOS, show instructions
      alert(
        'To install this app:\n\n1. Tap the Share button\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" in the top right'
      );
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
    <div className="mb-4 bg-gradient-to-r from-[var(--primary)] to-blue-600 rounded-xl shadow-lg p-4 relative animate-in slide-in-from-top duration-300">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors p-1"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3 pr-6">
        <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <Download className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm">
            Install Sales Force App
          </h3>
          <p className="text-white/80 text-xs mt-0.5">
           
          </p>
        </div>

        <button
          onClick={handleInstall}
          className="flex-shrink-0 bg-white text-primary px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors"
        >
          Install
        </button>
      </div>
    </div>
  );
}
