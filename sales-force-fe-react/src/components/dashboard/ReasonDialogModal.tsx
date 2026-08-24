
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import './ReasonDialogModal.css';

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
    <div className="reason-dialog">
      {/* Backdrop */}
      <div className="reason-dialog__backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="reason-dialog__modal">
        {/* Header */}
        <div className="reason-dialog__header">
          <h3 className="reason-dialog__title">{title}</h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className={cn('reason-dialog__close', isLoading && 'reason-dialog__close--disabled')}
          >
            <X className="reason-dialog__close-icon" />
          </button>
        </div>

        {/* Body */}
        <div className="reason-dialog__body">
          <textarea
            ref={textareaRef}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={4}
            className="reason-dialog__textarea"
          />
          <p className="reason-dialog__hint">Tekan Ctrl/Cmd + Enter untuk konfirmasi</p>
        </div>

        {/* Footer */}
        <div className="reason-dialog__footer">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={cn('reason-dialog__cancel', isLoading && 'reason-dialog__cancel--disabled')}
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim() || isLoading}
            className="reason-dialog__confirm"
          >
            {isLoading && <div className="reason-dialog__spinner" />}
            Konfirmasi
          </button>
        </div>
      </div>
    </div>
  );
}
