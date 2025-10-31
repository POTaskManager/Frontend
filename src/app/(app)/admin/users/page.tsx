'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from '@tanstack/react-table';

type Row = { id: string; name: string; email: string; role: string; status: string; createdAt: string };

export default function AdminUsersPage() {
  const { data = [] } = useQuery<Row[]>({ queryKey: ['users'], queryFn: async () => [] });
  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'role', header: 'Role' },
      { accessorKey: 'status', header: 'Status' },
      { accessorKey: 'createdAt', header: 'Created' }
    ],
    []
  );
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Users</h1>
      <div className="mt-6 overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900/30">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} className="px-3 py-2 text-left font-medium">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}


