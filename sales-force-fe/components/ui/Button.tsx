import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-[8px] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

    const variantStyles = {
      primary: 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] focus-visible:outline-[var(--primary)] shadow-sm hover:shadow-md',
      secondary: 'bg-white text-[var(--text-primary)] border border-[var(--border)] hover:bg-gray-50 focus-visible:outline-[var(--border)]',
      danger: 'bg-[var(--danger)] text-white hover:bg-red-600 focus-visible:outline-[var(--danger)] shadow-sm',
      ghost: 'bg-transparent text-[var(--text-primary)] hover:bg-gray-100 focus-visible:outline-gray-300',
      success: 'bg-[var(--success)] text-white hover:bg-emerald-600 focus-visible:outline-[var(--success)] shadow-sm',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs h-8',
      md: 'px-4 py-2 text-sm h-10',
      lg: 'px-6 py-3 text-base h-12',
    };

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          widthStyle,
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
