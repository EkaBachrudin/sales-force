import React from 'react';
import { cn } from '@/lib/utils';
import './Card.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'card',
          `card--${variant}`,
          padding !== 'none' && `card--${padding}`,
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export { Card };
