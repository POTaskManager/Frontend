'use client';

import { useDroppable, useDndContext } from '@dnd-kit/core';
import { Task } from '../board.model';
import { Item } from './item';
import { canMoveTask } from '../drag-rules';

interface ColumnProps {
  id: Task['state'];
  title: string;
  tasks: Task[];
  allTasks: Task[]; // All tasks for validation
}

export function Column({ id, title, tasks, allTasks }: ColumnProps) {
  const { active } = useDndContext();
  
  // Get the task being dragged from all tasks
  const draggedTask = active
    ? allTasks.find((t) => t.id === active.id as string)
    : undefined;

  // Check if drop is allowed based on drag rules
  const isDropAllowed = draggedTask ? canMoveTask(draggedTask.state, id) : true;

  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'column',
      state: id
    },
    disabled: draggedTask ? !isDropAllowed : false
  });

  // Visual feedback based on drag state
  const borderColor = isOver
    ? isDropAllowed
      ? 'border-green-500 ring-2 ring-green-500'
      : 'border-red-500 ring-2 ring-red-500'
    : 'border-gray-200 dark:border-gray-800';

  const bgColor = isOver
    ? isDropAllowed
      ? 'bg-green-50 dark:bg-green-950/20'
      : 'bg-red-50 dark:bg-red-950/20'
    : '';

  return (
    <div
      ref={setNodeRef}
      className={`rounded border p-3 transition-colors ${borderColor} ${bgColor}`}
    >

      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-medium">{title}</h2>
        <span className="text-xs text-gray-500">{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.map((t) => (
          <Item key={t.id} task={t} />
        ))}
      </div>
    </div>
  );
}