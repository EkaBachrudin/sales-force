
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ReasonDialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title?: string;
  placeholder?: string;
  isLoading?: boolean;
}

export function ReasonDialogModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Alasan Pembatalan',
  placeholder = 'Masukkan alasan kenapa lead ini dibatalkan...',
  isLoading = false,
}: ReasonDialogModalProps) {
  const [reason, setReason] = React.useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset reason when modal opens
  useEffect(() => {
    if (isOpen) {
      setReason('');
      // Focus textarea after modal opens
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason.trim());
      setReason('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={cn(
              "p-1 rounded-lg hover:bg-gray-100 transition-colors",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <textarea
            ref={textareaRef}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={4}
            className={cn(
              "w-full px-3 py-2 border border-gray-300 rounded-lg resize-none",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "text-sm text-gray-900 placeholder-gray-400"
            )}
          />
          <p className="mt-2 text-xs text-gray-500">
            Tekan Ctrl/Cmd + Enter untuk konfirmasi
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              "text-gray-700 hover:bg-gray-200",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim() || isLoading}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              "bg-blue-600 text-white hover:bg-blue-700",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center gap-2"
            )}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Konfirmasi
          </button>
        </div>
      </div>
    </div>
  );
}
