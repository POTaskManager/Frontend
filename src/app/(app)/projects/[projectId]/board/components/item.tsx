'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../board.model';

export function Item({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: {
      type: 'task',
      task
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing rounded border bg-white p-2 shadow-sm transition-opacity dark:bg-gray-950 ${
        isDragging ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="text-sm font-medium">{task.title}</div>
    </div>
  );
}
