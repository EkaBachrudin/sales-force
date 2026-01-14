import React, { useId } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharacterCount?: boolean;
  maxLength?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      showCharacterCount = false,
      maxLength,
      id,
      value,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || `textarea-${generatedId}`;
    const hasError = !!error;
    const characterCount = typeof value === 'string' ? value.length : 0;

    const baseStyles = 'w-full px-3 py-2 rounded-[8px] border bg-white text-sm transition-all duration-200 placeholder:text-gray-400 resize-y';

    const stateStyles = hasError
      ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)] bg-red-50/50'
      : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-[var(--text-primary)] mb-1.5"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            baseStyles,
            stateStyles,
            'focus:outline-none focus-visible:outline-none min-h-[80px]',
            className
          )}
          maxLength={maxLength}
          value={value}
          {...props}
        />

        <div className="flex items-center justify-between mt-1.5">
          <div className="flex-1">
            {error && (
              <p className="text-xs text-[var(--danger)]">{error}</p>
            )}
            {helperText && !error && (
              <p className="text-xs text-[var(--text-secondary)]">{helperText}</p>
            )}
          </div>

          {showCharacterCount && maxLength && (
            <p className="text-xs text-[var(--text-secondary)] ml-2">
              {characterCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
