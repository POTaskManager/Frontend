'use client';

import { MswProvider } from '@/components/msw-provider';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MswProvider />
      {children}
    </>
  );
}


