'use client';

import { useQuery } from '@tanstack/react-query';

export default function AdminRolesPage() {
  const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: async () => [] });
  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Roles</h1>
      <ul className="mt-6 space-y-2">
        {roles.map((r: any) => (
          <li key={r.id} className="rounded border p-3">
            <div className="font-medium">{r.name}</div>
            <div className="text-xs text-gray-500">{(r.permissions || []).join(', ')}</div>
          </li>
        ))}
        {roles.length === 0 && <li className="text-sm text-gray-500">No roles</li>}
      </ul>
    </main>
  );
}


