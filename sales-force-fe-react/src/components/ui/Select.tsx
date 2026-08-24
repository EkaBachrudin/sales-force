import React, { useId } from 'react';
import { cn } from '@/lib/utils';
import './Select.css';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, id, disabled, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || `select-${generatedId}`;
    const hasError = !!error;
    const isDisabled = !!disabled;

    return (
      <div className="select__wrapper">
        {label && (
          <label htmlFor={selectId} className="select__label">
            {label}
          </label>
        )}

        <div className="select__field-wrapper">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={cn(
              'select__field',
              hasError && 'select__field--error',
              isDisabled && 'select__field--disabled',
              className
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>

          <div
            className={cn(
              'select__chevron',
              isDisabled && 'select__chevron--disabled'
            )}
          >
            <svg
              className="select__chevron-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {error && <p className="select__error">{error}</p>}

        {helperText && !error && <p className="select__helper">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
