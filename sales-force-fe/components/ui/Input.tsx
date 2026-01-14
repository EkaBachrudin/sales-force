import React, { useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;
    const hasError = !!error;

    const baseStyles = 'w-full px-3 py-2 rounded-[8px] border bg-white text-sm transition-all duration-200 placeholder:text-gray-400';

    const stateStyles = hasError
      ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)] bg-red-50/50'
      : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]';

    const paddingStyles = leftIcon
      ? 'pl-10'
      : rightIcon
      ? 'pr-10'
      : '';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--text-primary)] mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            type={type}
            id={inputId}
            className={cn(
              baseStyles,
              stateStyles,
              paddingStyles,
              'focus:outline-none focus-visible:outline-none',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {rightIcon}
            </div>
          )}
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

Input.displayName = 'Input';

export { Input };
