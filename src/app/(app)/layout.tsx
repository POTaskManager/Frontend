'use client';

import { AuthProvider } from '@/components/auth/auth-provider';
import { RequireAuth } from '@/components/auth/require-auth';
import { Sidebar, type SidebarItem } from '@/components/ui/sidebar';
import { Topbar } from '@/components/ui/topbar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Route } from 'next';
import { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/project-store';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const { projects, fetchProjects } = useProjectStore();

  useEffect(() => {
    if (!projects.length) {
      fetchProjects();
    }
  }, [fetchProjects]); // eslint-disable-line react-hooks/exhaustive-deps

  const items: SidebarItem[] = [
    { href: '/dashboard' as Route, label: 'Dashboard' },
    ...(projects.length > 0 ? [{ label: 'Projects', isHeader: true }] : []),
    ...projects.map((project) => ({
      href: `/projects/${project.id}/board` as Route,
      label: project.name,
      isSubItem: true,
    })),
    { href: '/admin/users' as Route, label: 'Users' },
    { href: '/admin/roles' as Route, label: 'Roles' },
  ];

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RequireAuth>
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
