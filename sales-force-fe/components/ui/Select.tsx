import React, { useId } from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || `select-${generatedId}`;
    const hasError = !!error;

    const baseStyles = 'w-full px-3 py-2 rounded-[8px] border bg-white text-sm transition-all duration-200 appearance-none cursor-pointer';

    const stateStyles = hasError
      ? 'border-[var(--danger)] focus:border-[var(--danger)] bg-red-50/50'
      : 'border-[var(--border)] focus:border-[var(--primary)]';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-[var(--text-primary)] mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              baseStyles,
              stateStyles,
              'focus:outline-none focus-visible:outline-none pr-10',
              className
            )}
            {...props}
          >
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
            <svg
              className="w-4 h-4"
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

        {error && (
          <p className="mt-1.5 text-xs text-[var(--danger)]">{error}</p>
        )}

        {helperText && !error && (
          <p className="mt-1.5 text-xs text-[var(--text-secondary)]">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
