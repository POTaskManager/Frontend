'use client';

import { useProjectStore } from '@/store/project-store';
import type { Route } from 'next';

import Link from 'next/link';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { projects, projectsLoading, fetchProjects } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]); // eslint-disable-line react-hooks/exhaustive-deps
  // Placeholder for future features
  const myTasks: never[] = [];
  const notifications: never[] = [];
  const activity: never[] = [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>Create Project</Button>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded border p-4">
          <h2 className="font-medium">Projects</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {projectsLoading ? (
              <li className="text-muted-fg">Loading projects...</li>
            ) : projects.length === 0 ? (
              <li className="text-muted-fg">No projects</li>
            ) : (
              projects.map((p) => (
                <li key={p.id}>
                  <Link href={`/projects/${p.id}/board` as Route} className="text-primary hover:underline">
                    {p.name}
                  </Link>
                </li>
              ))
            )}
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
      <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </main>
  );
}


