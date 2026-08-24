import React, { useId } from 'react';
import { cn } from '@/lib/utils';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightAction?: React.ReactNode;
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
      rightAction,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;
    const hasError = !!error;

    return (
      <div className="input__wrapper">
        {label && (
          <label htmlFor={inputId} className="input__label">
            {label}
          </label>
        )}

        <div className="input__field-wrapper">
          {leftIcon && <div className="input__left-icon">{leftIcon}</div>}

          <input
            ref={ref}
            type={type}
            id={inputId}
            className={cn(
              'input__field',
              hasError && 'input__field--error',
              leftIcon
                ? 'input__field--with-left-icon'
                : rightIcon || rightAction
                  ? 'input__field--with-right-icon'
                  : '',
              className
            )}
            {...props}
          />

          {rightIcon && <div className="input__right-icon">{rightIcon}</div>}

          {rightAction && <div className="input__right-action">{rightAction}</div>}
        </div>

        {error && <p className="input__error">{error}</p>}

        {helperText && !error && <p className="input__helper">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
