'use client';

import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { Column } from './components/column';
import { canMoveTask } from './drag-rules';
import { useBoardFacade } from './board-facade';
import { Task } from '@/features/projects';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function ProjectBoardPage() {
  const { tasks, sprints, isLoading, error, selectedSprintId, changeSprint, updateTask } =
    useBoardFacade();
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const handleAddTask = () => {
    router.push(`/projects/${projectId}/tasks/create`);
  };

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
        <div className="mt-6 text-red-600">Error loading board: {error.message}</div>
      </main>
    );
  }

  const columns: Task['status'][] = ['todo', 'in_progress', 'review', 'done'];

  const onDragEnd = (e: DragEndEvent) => {
    const taskId = e.active.id as string;
    const targetColumn = e.over?.id as Task['status'] | undefined;

    if (!targetColumn) return;

    const draggedTask = tasks.find((t) => t.id === taskId);
    if (!draggedTask) return;

    if (!canMoveTask(draggedTask.status, targetColumn)) {
      console.warn(`Cannot move task from ${draggedTask.status} to ${targetColumn}`);
      return;
    }
    updateTask(taskId, targetColumn);
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kanban Board</h1>
        <div className="flex items-center gap-4">
          <Button onClick={handleAddTask} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
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
                  changeSprint(sprintId);
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
      </div>
      <DndContext onDragEnd={onDragEnd}>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          {columns.map((state) => (
            <Column
              key={state}
              id={state}
              title={titleFor(state)}
              tasks={tasks.filter((t) => t.status === state)}
              allTasks={tasks}
            />
          ))}
        </div>
      </DndContext>
    </main>
  );
}

function titleFor(s: Task['status']) {
  if (s === 'in_progress') return 'In Progress';
  return s[0]?.toUpperCase() + s.slice(1);
}
