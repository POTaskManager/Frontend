'use client';

import { useDroppable, useDndContext } from '@dnd-kit/core';
import { Item } from './item';
import { Task } from '@/features/projects';

interface ColumnProps {
  id: string; // Column name used as drop target
  title: string;
  tasks: Task[];
  allTasks: Task[];
  statusIds: string[]; // All statusIds that belong to this column
}

export function Column({ id, title, tasks, allTasks, statusIds }: ColumnProps) {
  const { active } = useDndContext();
  
  // Get the task being dragged
  const draggedTask = active
    ? allTasks.find((t) => t.id === active.id as string)
    : undefined;

  // For now, allow all drops. Can add validation later based on workflow rules
  const isDropAllowed = true;

  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'column',
      columnName: id,
      statusIds // Pass statusIds so onDragEnd knows which status to use
    },
    disabled: false
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
