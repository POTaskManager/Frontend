'use client';

import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type Task = { id: string; title: string; state: 'todo' | 'in_progress' | 'review' | 'done' };

export default function ProjectBoardPage() {
  const qc = useQueryClient();
  const { data: tasks = [] } = useQuery<Task[]>({ queryKey: ['board', 'tasks'], queryFn: async () => [] });
  const mutation = useMutation({
    mutationFn: async ({ id, state }: { id: string; state: Task['state'] }) => ({ id, state }),
    onSuccess: ({ id, state }) => {
      qc.setQueryData<Task[]>(['board', 'tasks'], (old = []) => old.map((t) => (t.id === id ? { ...t, state } : t)));
    }
  });

  const onDragEnd = (e: DragEndEvent) => {
    const taskId = e.active.id as string;
    const column = e.over?.id as Task['state'] | undefined;
    if (!column) return;
    mutation.mutate({ id: taskId, state: column });
  };

  const columns: Task['state'][] = ['todo', 'in_progress', 'review', 'done'];
  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Kanban Board</h1>
      <DndContext onDragEnd={onDragEnd}>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          {columns.map((state) => (
            <Column key={state} id={state} title={titleFor(state)} tasks={tasks.filter((t) => t.state === state)} />
          ))}
        </div>
      </DndContext>
    </main>
  );
}

function titleFor(s: Task['state']) {
  if (s === 'in_progress') return 'In Progress';
  return s[0]?.toUpperCase() + s.slice(1);
}

function Column({ id, title, tasks }: { id: Task['state']; title: string; tasks: Task[] }) {
  return (
    <div id={id} className="rounded border p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-medium">{title}</h2>
        <span className="text-xs text-gray-500">{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.map((t) => (
          <div key={t.id} id={t.id} className="cursor-move rounded border bg-white p-2 shadow-sm dark:bg-gray-950">
            <div className="text-sm font-medium">{t.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


