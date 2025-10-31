'use client';

import { PropsWithChildren } from 'react';
import { clsx } from 'clsx';

export function H1({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <h1 className={clsx('text-4xl font-bold tracking-tight', className)}>{children}</h1>;
}

export function H2({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <h2 className={clsx('text-3xl font-semibold', className)}>{children}</h2>;
}

export function Muted({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <p className={clsx('text-sm text-muted-fg', className)}>{children}</p>;
}


