import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DeleteBlockModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
  isLoading?: boolean;
  blockName?: string;
}

export function DeleteBlockModal({
  isOpen = false,
  onClose,
  onConfirm,
  isLoading = false,
  blockName = '',
}: DeleteBlockModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-text-primary">Delete Block</h2>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-text-secondary">
                Are you sure you want to delete block <span className="font-semibold text-text-primary">{blockName}</span>?
              </p>
              <p className="text-sm text-text-secondary">
                This action will also delete all units within this block. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-gray-50">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
              Delete Block
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}