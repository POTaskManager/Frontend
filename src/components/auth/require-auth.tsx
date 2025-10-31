'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import type { Route } from 'next';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      const dest = (`/login?callbackUrl=${encodeURIComponent(pathname)}`) as Route;
      router.replace(dest);
    }
  }, [status, pathname, router]);

  if (status === 'loading') {
    return <div className="p-4 text-sm text-muted-fg">Checking session…</div>;
  }

  if (status === 'unauthenticated') return undefined;
  return <>{children}</>;
}


