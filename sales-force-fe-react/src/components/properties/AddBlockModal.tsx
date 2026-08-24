import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import './AddBlockModal.css';

interface AddBlockModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit?: (blockName: string) => void;
  isLoading?: boolean;
}

export function AddBlockModal({
  isOpen = false,
  onClose,
  onSubmit,
  isLoading = false,
}: AddBlockModalProps) {
  const [blockName, setBlockName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setBlockName('');
      setErrors({});
    }
  }, [isOpen]);

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
      <div className="add-block-modal__backdrop" onClick={onClose} />
      <div className="add-block-modal__overlay">
        <div className="add-block-modal__panel">
          <div className="add-block-modal__header">
            <h2 className="add-block-modal__title">Add New Block</h2>
            <button onClick={onClose} className="add-block-modal__close">
              <X className="add-block-modal__close-icon" />
            </button>
          </div>

          <div className="add-block-modal__content">
            <form onSubmit={handleSubmit} className="add-block-modal__form">
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

          <div className="add-block-modal__footer">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={isLoading}>
              Create
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
