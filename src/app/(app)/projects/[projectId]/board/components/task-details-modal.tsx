'use client';

import { Task } from '@/features/projects';
import { UpdateTaskInput } from '@/features/projects/mutations/use-update-task-mutation';
import { useState } from 'react';

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: (input: UpdateTaskInput) => Promise<void>;
}

export function TaskDetailsModal({ task, onClose, onUpdate }: TaskDetailsModalProps) {
  const assigneeLabels: Record<string, string> = {
    'user-1': 'Alice Johnson',
    'user-2': 'Bob Smith',
    'user-3': 'Charlie Brown',
  };

  const assigneeDisplay = task.assignedTo
    ? assigneeLabels[task.assignedTo] || task.assignedTo
    : 'Unassigned';

  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  const [editedPriority, setEditedPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>(
    task.priority as any || 'medium'
  );
  const [editedState, setEditedState] = useState(task.status);
  const [editedAssignedTo, setEditedAssignedTo] = useState(task.assignedTo || '');
  const [editedDueDate, setEditedDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  );

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsUpdating(true);
    try {
      await onUpdate({
        taskId: task.id,
        title: editedTitle,
        description: editedDescription || undefined,
        priority: editedPriority,
        state: editedState,
        assignedTo: editedAssignedTo || undefined,
        dueDate: editedDueDate || undefined,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setEditedTitle(task.title);
    setEditedDescription(task.description || '');
    setEditedPriority(task.priority as any || 'medium');
    setEditedState(task.status);
    setEditedAssignedTo(task.assignedTo || '');
    setEditedDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setIsEditing(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-gray-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Task Details</h2>
        </div>

        {!isEditing ? (
          // View mode
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400">
                Title
              </label>
              <div className="text-lg font-medium">{task.title}</div>
            </div>

            {task.description && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Description
                </label>
                <div className="text-sm">{task.description}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Priority
                </label>
                <div className="text-sm capitalize">{task.priority || 'Not set'}</div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Status
                </label>
                <div className="text-sm capitalize">{task.status.replace('_', ' ')}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Assigned To
                </label>
                <div className="text-sm">{assigneeDisplay}</div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Due Date
                </label>
                <div className="text-sm">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                <span className="font-medium">Created:</span>{' '}
                {task.createdAt ? new Date(task.createdAt).toLocaleString() : 'N/A'}
              </div>
              <div>
                <span className="font-medium">Updated:</span>{' '}
                {task.updatedAt ? new Date(task.updatedAt).toLocaleString() : 'N/A'}
              </div>
            </div>

            {/* View Mode Buttons */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Edit
              </button>
              <button
                onClick={onClose}
                className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          // Edit mode
          <div className="space-y-4 flex-1">
            <form onSubmit={handleSave} className="flex flex-col">
            <div>
              <label htmlFor="editTitle" className="mb-1 block text-sm font-medium">
                Title *
              </label>
              <input
                id="editTitle"
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                required
              />
            </div>

            <div>
              <label htmlFor="editDescription" className="mb-1 block text-sm font-medium">
                Description
              </label>
              <textarea
                id="editDescription"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="editPriority" className="mb-1 block text-sm font-medium">
                  Priority
                </label>
                <select
                  id="editPriority"
                  value={editedPriority}
                  onChange={(e) => setEditedPriority(e.target.value as any)}
                  className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label htmlFor="editState" className="mb-1 block text-sm font-medium">
                  Status
                </label>
                <select
                  id="editState"
                  value={editedState}
                  onChange={(e) => setEditedState(e.target.value as Task['status'])}
                  className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="editAssignee" className="mb-1 block text-sm font-medium">
                  Assignee
                </label>
                <select
                  id="editAssignee"
                  value={editedAssignedTo}
                  onChange={(e) => setEditedAssignedTo(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="">Unassigned</option>
                  <option value="user-1">Alice Johnson</option>
                  <option value="user-2">Bob Smith</option>
                  <option value="user-3">Charlie Brown</option>
                </select>
              </div>
              <div>
                <label htmlFor="editDueDate" className="mb-1 block text-sm font-medium">
                  Due Date
                </label>
                <input
                  id="editDueDate"
                  type="date"
                  value={editedDueDate}
                  onChange={(e) => setEditedDueDate(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
            </div>

            {/* Edit Mode Buttons */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
            </div>
            </form>
                  </div>
        )}
      </div>
    </div>
  );
}
