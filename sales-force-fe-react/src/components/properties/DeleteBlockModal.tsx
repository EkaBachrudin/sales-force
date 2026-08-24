import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import './DeleteBlockModal.css';

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
      <div className="delete-block-modal__backdrop" onClick={onClose} />
      <div className="delete-block-modal__overlay">
        <div className="delete-block-modal__panel">
          <div className="delete-block-modal__body">
            <div className="delete-block-modal__heading">
              <div className="delete-block-modal__icon">
                <AlertTriangle className="delete-block-modal__icon-svg" />
              </div>
              <h2 className="delete-block-modal__title">Delete Block</h2>
            </div>

            <div className="delete-block-modal__text">
              <p className="delete-block-modal__paragraph">
                Are you sure you want to delete block{' '}
                <span className="delete-block-modal__highlight">{blockName}</span>?
              </p>
              <p className="delete-block-modal__paragraph">
                This action will also delete all units within this block. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="delete-block-modal__footer">
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
