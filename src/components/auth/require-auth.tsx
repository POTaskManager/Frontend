'use client';

import { useAuthStore } from '@/store/auth-store';
import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const dest = (`/login?callbackUrl=${encodeURIComponent(pathname)}`) as Route;
      router.replace(dest);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-fg">Checking session…</div>;
  }

  if (!isAuthenticated) return undefined;
  return <>{children}</>;
}


