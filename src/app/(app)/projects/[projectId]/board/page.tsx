'use client';

import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Task } from './board.model';
import { Column } from './components/column';
import { canMoveTask } from './drag-rules';



export default function ProjectBoardPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const qc = useQueryClient();
  
  const { data: tasks = [], isLoading, error } = useQuery<Task[]>({
    queryKey: ['board', 'tasks', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/board/tasks`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      console.log('Fetched tasks:', data);
      return data;
    }
  });
  
  const mutation = useMutation({
    mutationFn: async ({ id, state }: { id: string; state: Task['state'] }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ state })
      });
      if (!res.ok) throw new Error('Failed to update task');
      return res.json();
    },
    onSuccess: ({ id, state }) => {
      qc.setQueryData<Task[]>(['board', 'tasks', projectId], (old = []) =>
        old.map((t) => (t.id === id ? { ...t, state } : t))
      );
    }
  });

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-2xl font-semibold">Kanban Board</h1>
        <div className="mt-6">Loading tasks...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-2xl font-semibold">Kanban Board</h1>
        <div className="mt-6 text-red-600">Error loading tasks: {error.message}</div>
      </main>
    );
  }

  const columns: Task['state'][] = ['todo', 'in_progress', 'review', 'done'];
  
  const onDragEnd = (e: DragEndEvent) => {
    const taskId = e.active.id as string;
    const targetColumn = e.over?.id as Task['state'] | undefined;
    
    if (!targetColumn) return;
    
    // Find the task being dragged
    const draggedTask = tasks.find((t) => t.id === taskId);
    if (!draggedTask) return;
    
    // Validate the transition using drag rules
    if (!canMoveTask(draggedTask.state, targetColumn)) {
      console.warn(`Cannot move task from ${draggedTask.state} to ${targetColumn}`);
      return;
    }
    
    // Only mutate if validation passes
    mutation.mutate({ id: taskId, state: targetColumn });
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Kanban Board</h1>
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


