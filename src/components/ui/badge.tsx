'use client';

import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

type Variant = 'default' | 'secondary' | 'danger' | 'outline';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  default: 'bg-primary text-primary-fg',
  secondary: 'bg-secondary text-secondary-fg',
  danger: 'bg-danger text-danger-fg',
  outline: 'border border-border text-foreground'
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}


