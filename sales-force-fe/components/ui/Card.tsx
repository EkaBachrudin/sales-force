import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', ...props }, ref) => {
    const baseStyles = 'rounded-[12px] bg-[var(--surface)] transition-shadow duration-200';

    const variantStyles = {
      default: 'border border-[var(--border)]',
      bordered: 'border-2 border-[var(--border)]',
      elevated: 'border border-[var(--border)] shadow-md hover:shadow-lg',
    };

    const paddingStyles = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          paddingStyles[padding],
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export { Card };
