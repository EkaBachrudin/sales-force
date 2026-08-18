import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { BlockListItem } from '@/lib/types';

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
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-text-primary">Edit Block</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
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

          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
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