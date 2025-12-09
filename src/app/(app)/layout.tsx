'use client';

import { AuthProvider } from '@/components/auth/auth-provider';
import { RequireAuth } from '@/components/auth/require-auth';
import { MswProvider } from '@/components/msw-provider';
import { Sidebar, type SidebarItem } from '@/components/ui/sidebar';
import { Topbar } from '@/components/ui/topbar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Route } from 'next';
import { useState } from 'react';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const items: SidebarItem[] = [
    { href: '/dashboard' as Route, label: 'Dashboard' },
    { href: '/projects/project-1/board' as Route, label: 'Board' },
    { href: '/admin/users' as Route, label: 'Users' },
    { href: '/admin/roles' as Route, label: 'Roles' }
  ];
  return (
    <AuthProvider>
      <MswProvider />
      <QueryClientProvider client={queryClient}>
        <RequireAuth>
          <Toaster position="top-right" />
          <Topbar />
          <div className="min-h-[calc(100vh-3.5rem)] md:flex">
            <Sidebar items={items} header={<span>Navigation</span>} />
            <div className="flex-1 p-4">{children}</div>
          </div>
        </RequireAuth>
      </QueryClientProvider>
     </AuthProvider>
  );
}


