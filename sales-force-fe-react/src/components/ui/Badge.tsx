import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'gray' | 'blue' | 'purple' | 'orange' | 'green' | 'red';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'gray', size = 'md', dot, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center gap-1.5 rounded-full font-medium';

    const variantStyles = {
      gray: 'bg-gray-100 text-gray-700',
      blue: 'bg-blue-50 text-blue-700',
      purple: 'bg-purple-50 text-purple-700',
      orange: 'bg-orange-50 text-orange-700',
      green: 'bg-green-50 text-green-700',
      red: 'bg-red-50 text-red-700',
    };

    const sizeStyles = {
      sm: 'px-2 py-0.5 text-[10px] uppercase tracking-wide',
      md: 'px-2.5 py-1 text-xs',
      lg: 'px-3 py-1.5 text-sm',
    };

    const dotStyles = {
      gray: 'bg-gray-500',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotStyles[variant])} />}
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
