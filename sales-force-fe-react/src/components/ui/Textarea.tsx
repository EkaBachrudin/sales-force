import React, { useId } from 'react';
import { cn } from '@/lib/utils';
import './Textarea.css';

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

    return (
      <div className="textarea__wrapper">
        {label && (
          <label htmlFor={textareaId} className="textarea__label">
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          className={cn('textarea__field', hasError && 'textarea__field--error', className)}
          maxLength={maxLength}
          value={value}
          {...props}
        />

        <div className="textarea__footer">
          <div className="textarea__footer-messages">
            {error && <p className="textarea__error">{error}</p>}
            {helperText && !error && <p className="textarea__helper">{helperText}</p>}
          </div>

          {showCharacterCount && maxLength && (
            <p className="textarea__counter">
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
