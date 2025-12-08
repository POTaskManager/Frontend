'use client';

import { useAuthStore } from '@/store/auth-store';
import { useEffect } from 'react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    // Fetch user on mount using cookies
    fetchUser();
  }, [fetchUser]);

  return <>{children}</>;
}

