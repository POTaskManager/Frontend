'use client';

import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task } from './board.model';
import { Column } from './components/column';
import { canMoveTask } from './drag-rules';
import type { Sprint } from '@/types';

type BackendTask = {
  id: string;
  sprintId: string | null;
  createdBy: string;
  title: string;
  description: string | null;
  statusId: string;
  priority: string | null;
  dueAt: string | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapFromBackend(t: BackendTask): Task {
  const state = (t.statusId as Task['state']) ?? 'todo';
  return {
    ...t,
    state,
  } as unknown as Task;
}

export default function ProjectBoardPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Read sprint ID from URL query param
  const selectedSprintId = searchParams.get('sprint');

  // Fetch sprints for the project
  const {
    data: sprints = [],
    isLoading: sprintsLoading,
    error: sprintsError,
  } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/proxy/api/projects/${projectId}/sprints`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch sprints');
      return res.json() as Promise<Sprint[]>;
    },
    enabled: !!projectId,
  });

  // Auto-select first sprint and update URL if no sprint is selected
  useEffect(() => {
    if (!selectedSprintId && sprints.length > 0) {
      const firstSprintId = sprints[0].id;
      router.replace(`/projects/${projectId}/board?sprint=${firstSprintId}`);
    }
  }, [sprints, selectedSprintId, router, projectId]);

  // Fetch tasks for selected sprint
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    error: tasksError,
  } = useQuery({
    queryKey: ['tasks', projectId, selectedSprintId],
    queryFn: async () => {
      if (!selectedSprintId) return [];
      const res = await fetch(
        `/api/proxy/api/projects/${projectId}/sprints/${selectedSprintId}/tasks`,
        { credentials: 'include' },
      );
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data: BackendTask[] = await res.json();
      return data.map(mapFromBackend);
    },
    enabled: !!projectId && !!selectedSprintId,
  });

  // Mutation for updating task state
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, state }: { taskId: string; state: Task['state'] }) => {
      const res = await fetch(`/api/proxy/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ statusId: state }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      const updated: BackendTask = await res.json();
      return mapFromBackend(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId, selectedSprintId] });
    },
  });

  const isLoading = sprintsLoading || tasksLoading;
  const error = sprintsError || tasksError;

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-2xl font-semibold">Kanban Board</h1>
        <div className="mt-6">Loading...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-2xl font-semibold">Kanban Board</h1>
        <div className="mt-6 text-red-600">
          Error loading board: {error instanceof Error ? error.message : String(error)}
        </div>
      </main>
    );
  }

  const columns: Task['state'][] = ['todo', 'in_progress', 'review', 'done'];

  const onDragEnd = (e: DragEndEvent) => {
    const taskId = e.active.id as string;
    const targetColumn = e.over?.id as Task['state'] | undefined;

    if (!targetColumn) return;

    const draggedTask = tasks.find((t) => t.id === taskId);
    if (!draggedTask) return;

    if (!canMoveTask(draggedTask.state, targetColumn)) {
      console.warn(`Cannot move task from ${draggedTask.state} to ${targetColumn}`);
      return;
    }

    updateTaskMutation.mutate({ taskId, state: targetColumn });
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kanban Board</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="sprint" className="text-sm text-gray-600">
            Sprint
          </label>
          <select
            id="sprint"
            className="rounded border px-2 py-1 text-sm"
            value={selectedSprintId || ''}
            onChange={(e) => {
              const sprintId = e.target.value;
              if (sprintId) {
                router.push(`/projects/${projectId}/board?sprint=${sprintId}`);
              }
            }}
          >
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <DndContext onDragEnd={onDragEnd}>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          {columns.map((state) => (
            <Column
              key={state}
              id={state}
              title={titleFor(state)}
              tasks={tasks.filter((t) => t.state === state)}
              allTasks={tasks}
            />
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
