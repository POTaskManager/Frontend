'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

export type SidebarItem = {
  href?: Route;
  label: string;
  icon?: React.ReactNode;
  badgeCount?: number;
  isSubItem?: boolean;
  isHeader?: boolean;
};

export function Sidebar({ items, header }: { items: SidebarItem[]; header?: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card p-4 md:block">
      {header ? <div className="mb-4 px-2 text-sm font-semibold text-muted-fg">{header}</div> : null}
      <nav className="space-y-1">
        {items.map((item, index) => {
          if (item.isHeader) {
            return (
              <div
                key={`header-${index}`}
                className="mt-4 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-fg"
              >
                {item.label}
              </div>
            );
          }
          
          const isActive = item.href && (pathname === item.href || pathname.startsWith(item.href + '/'));
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={clsx(
                'group flex items-center justify-between rounded-md py-2 text-sm transition-colors',
                item.isSubItem ? 'pl-6 pr-3' : 'px-3',
                isActive ? 'bg-primary text-primary-fg' : 'text-foreground hover:bg-muted'
              )}
            >
              <span className="flex items-center gap-2">
                {item.icon ? <span className="text-base opacity-80">{item.icon}</span> : null}
                {item.label}
              </span>
              {typeof item.badgeCount === 'number' && item.badgeCount > 0 ? (
                <span className={clsx('ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-secondary px-1 text-xs text-secondary-fg')}>{item.badgeCount}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}


