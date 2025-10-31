'use client';

import { useQuery } from '@tanstack/react-query';

export default function DashboardPage() {
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: async () => [] });
  const { data: myTasks } = useQuery({ queryKey: ['tasks', 'mine'], queryFn: async () => [] });
  const { data: notifications } = useQuery({ queryKey: ['notifications'], queryFn: async () => [] });
  const { data: activity } = useQuery({ queryKey: ['activity'], queryFn: async () => [] });

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded border p-4">
          <h2 className="font-medium">Projects</h2>
          <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {(projects ?? []).length === 0 && <li>No projects</li>}
          </ul>
        </section>
        <section className="rounded border p-4">
          <h2 className="font-medium">My Tasks</h2>
          <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {(myTasks ?? []).length === 0 && <li>No tasks</li>}
          </ul>
        </section>
        <section className="rounded border p-4">
          <h2 className="font-medium">Notifications</h2>
          <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {(notifications ?? []).length === 0 && <li>All caught up</li>}
          </ul>
        </section>
        <section className="rounded border p-4">
          <h2 className="font-medium">Recent Activity</h2>
          <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {(activity ?? []).length === 0 && <li>No activity</li>}
          </ul>
        </section>
      </div>
    </main>
  );
}


