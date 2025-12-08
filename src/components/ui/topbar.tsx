'use client';

import { useAuthStore } from '@/store/auth-store';
import { clsx } from 'clsx';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function Topbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const role = user?.role;
  const email = user?.email ?? 'user';

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm font-semibold">
            Task Manager
          </Link>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs text-secondary-fg">
              {email[0]?.toUpperCase()}
            </span>
            <span className="hidden sm:inline">{email}</span>
          </button>
          {open ? (
            <div
              role="menu"
              className={clsx(
                'absolute right-0 mt-2 w-48 overflow-hidden rounded-md border bg-card shadow-card'
              )}
            >
              <div className="px-3 py-2 text-xs text-muted-fg">Signed in as {email}</div>
              <div className="border-t" />
              <ul className="py-1 text-sm">
                <li>
                  <Link href="/dashboard" className="block px-3 py-2 hover:bg-muted" onClick={() => setOpen(false)}>
                    Dashboard
                  </Link>
                </li>
                {role === 'admin' ? (
                  <li>
                    <Link href="/admin/users" className="block px-3 py-2 hover:bg-muted" onClick={() => setOpen(false)}>
                      User management
                    </Link>
                  </li>
                ) : null}
                <li>
                  <button className="block w-full px-3 py-2 text-left hover:bg-muted" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}


