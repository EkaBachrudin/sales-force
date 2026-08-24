import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { BlockListItem } from '@/lib/types';
import './EditBlockModal.css';

interface EditBlockModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit?: (blockName: string) => void;
  isLoading?: boolean;
  block?: BlockListItem;
}

export function EditBlockModal({
  isOpen = false,
  onClose,
  onSubmit,
  isLoading = false,
  block,
}: EditBlockModalProps) {
  const [blockName, setBlockName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && block) {
      setBlockName(block.name);
      setErrors({});
    } else if (isOpen) {
      setBlockName('');
      setErrors({});
    }
  }, [isOpen, block]);

  const handleInputChange = (value: string) => {
    setBlockName(value);
    if (errors.name) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.name;
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!blockName.trim()) {
      newErrors.name = 'Block name is required';
    } else if (blockName.length > 100) {
      newErrors.name = 'Block name must be less than 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit?.(blockName.trim());
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="edit-block-modal__backdrop" onClick={onClose} />
      <div className="edit-block-modal__overlay">
        <div className="edit-block-modal__panel">
          <div className="edit-block-modal__header">
            <h2 className="edit-block-modal__title">Edit Block</h2>
            <button onClick={onClose} className="edit-block-modal__close">
              <X className="edit-block-modal__close-icon" />
            </button>
          </div>

          <div className="edit-block-modal__content">
            <form onSubmit={handleSubmit} className="edit-block-modal__form">
              <Input
                label="Block Name"
                placeholder="e.g., Block A"
                value={blockName}
                onChange={(e) => handleInputChange(e.target.value)}
                maxLength={100}
                required
                error={errors.name}
                helperText="Max 100 characters"
              />
            </form>
          </div>

          <div className="edit-block-modal__footer">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={isLoading}>
              Update
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
