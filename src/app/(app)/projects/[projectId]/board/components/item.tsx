'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/features/projects';

interface ItemProps {
  task: Task;
  onClick?: (task: Task) => void;
}

export function Item({ task, onClick }: ItemProps) {
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
      className={`rounded border bg-white shadow-sm transition-opacity hover:shadow-md dark:bg-gray-950 flex items-start gap-2 ${
        isDragging ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div
        {...listeners}
        {...attributes}
        className="flex-1 min-w-0 p-2 cursor-grab active:cursor-grabbing"
      >
        <div className="text-sm font-medium whitespace-normal break-words">{task.title}</div>
      </div>

      {onClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick(task);
          }}
          className="m-1 mt-2 flex h-8 w-8 flex-shrink-0 items-center justify-center self-start rounded-md border border-gray-200 bg-gray-50 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          title="Show details"
          type="button"
        >
          ℹ️
        </button>
      )}
    </div>
  );
}
