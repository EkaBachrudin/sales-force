import React from 'react';
import { cn } from '@/lib/utils';
import './Badge.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'gray' | 'blue' | 'purple' | 'orange' | 'teal' | 'green' | 'red';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  square?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'gray', size = 'md', dot, square = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'badge',
          `badge--${variant}`,
          `badge--${size}`,
          square ? 'badge--square' : 'badge--rounded',
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'badge__dot',
              `badge__dot--${variant}`,
              square ? 'badge__dot--square' : 'badge__dot--rounded'
            )}
          />
        )}
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
