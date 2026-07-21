import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface AddUnitModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit?: (unitName: string, landArea?: number) => void;
  isLoading?: boolean;
}

export function AddUnitModal({
  isOpen = false,
  onClose,
  onSubmit,
  isLoading = false,
}: AddUnitModalProps) {
  const [unitName, setUnitName] = useState('');
  const [landArea, setLandArea] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setUnitName('');
      setLandArea('');
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (value: string) => {
    setUnitName(value);
    if (errors.name) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.name;
        return newErrors;
      });
    }
  };

  const handleLandAreaChange = (value: string) => {
    setLandArea(value);
    if (errors.land_area) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.land_area;
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!unitName.trim()) {
      newErrors.name = 'Unit name is required';
    } else if (unitName.length > 100) {
      newErrors.name = 'Unit name must be less than 100 characters';
    }

    if (landArea && landArea.trim()) {
      const area = parseFloat(landArea);
      if (isNaN(area) || area <= 0) {
        newErrors.land_area = 'Land area must be a positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const landAreaValue = landArea.trim() ? parseFloat(landArea) : undefined;
    onSubmit?.(unitName.trim(), landAreaValue);
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
            <h2 className="text-xl font-semibold text-text-primary">Add New Unit</h2>
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
                label="Unit Name"
                placeholder="e.g., Unit A-101"
                value={unitName}
                onChange={(e) => handleInputChange(e.target.value)}
                maxLength={100}
                required
                error={errors.name}
                helperText="Max 100 characters"
              />
              <Input
                label="Land Area"
                type="number"
                placeholder="e.g., 100"
                value={landArea}
                onChange={(e) => handleLandAreaChange(e.target.value)}
                min="0"
                step="0.01"
                error={errors.land_area}
                helperText="Enter land area in square meters (optional)"
              />
            </form>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
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