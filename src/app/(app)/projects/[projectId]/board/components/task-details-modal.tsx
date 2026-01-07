'use client';

import { Task } from '@/features/projects';
import { UpdateTaskInput } from '@/features/projects/mutations/use-update-task-mutation';
import { useProjectMembersQuery } from '@/features/projects/queries/use-project-members-query';
import { useState } from 'react';

interface TaskDetailsModalProps {
  task: Task;
  statuses: Array<{ id: string; name: string; columnName: string }>;
  projectId: string;
  onClose: () => void;
  onUpdate: (input: UpdateTaskInput) => Promise<void>;
}

// Priority mapping: UI string <-> Backend number
const PRIORITY_MAP = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
  urgent: 5,
} as const;

const PRIORITY_REVERSE_MAP = {
  1: 'low',
  2: 'medium',
  3: 'high',
  4: 'critical',
  5: 'urgent',
} as const;

type PriorityString = keyof typeof PRIORITY_MAP;

export function TaskDetailsModal({ task, statuses, projectId, onClose, onUpdate }: TaskDetailsModalProps) {
  const { data: projectMembers = [] } = useProjectMembersQuery(projectId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  const [editedPriority, setEditedPriority] = useState<PriorityString>(
    PRIORITY_REVERSE_MAP[task.priority as keyof typeof PRIORITY_REVERSE_MAP] || 'medium'
  );
  const [editedStatusId, setEditedStatusId] = useState(task.statusId);
  const [editedAssignedTo, setEditedAssignedTo] = useState(task.assignedTo || '');
  const [editedDueAt, setEditedDueAt] = useState(
    task.dueAt ? new Date(task.dueAt).toISOString().split('T')[0] : ''
  );

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsUpdating(true);
    try {
      await onUpdate({
        taskId: task.id,
        title: editedTitle,
        description: editedDescription || undefined,
        priority: PRIORITY_MAP[editedPriority],
        statusId: editedStatusId,
        assignedTo: editedAssignedTo, // Send empty string for unassigned
        dueAt: editedDueAt || undefined,
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
    setEditedPriority(
      PRIORITY_REVERSE_MAP[task.priority as keyof typeof PRIORITY_REVERSE_MAP] || 'medium'
    );
    setEditedStatusId(task.statusId);
    setEditedAssignedTo(task.assignedTo || '');
    setEditedDueAt(task.dueAt ? new Date(task.dueAt).toISOString().split('T')[0] : '');
    setIsEditing(false);
  };

  // Find current status details
  const currentStatus = statuses.find(s => s.id === task.statusId);
  const priorityDisplay = PRIORITY_REVERSE_MAP[task.priority as keyof typeof PRIORITY_REVERSE_MAP] || 'unknown';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-gray-800 flex flex-col max-h-[90vh] overflow-y-auto"
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
                <div className="text-sm whitespace-pre-wrap">{task.description}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Priority
                </label>
                <div className="text-sm capitalize">{priorityDisplay}</div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Status
                </label>
                <div className="text-sm">
                  {currentStatus ? `${currentStatus.name} (${currentStatus.columnName})` : 'Unknown'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Assigned To
                </label>
                <div className="text-sm">
                  {task.assignedTo 
                    ? projectMembers.find(m => m.userId === task.assignedTo)?.userName || task.assignedTo
                    : 'Unassigned'}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Due Date
                </label>
                <div className="text-sm">
                  {task.dueAt ? new Date(task.dueAt).toLocaleDateString() : 'Not set'}
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
            <form onSubmit={handleSave} className="flex flex-col space-y-4">
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
                placeholder="Add task description..."
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
                  onChange={(e) => setEditedPriority(e.target.value as PriorityString)}
                  className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label htmlFor="editStatus" className="mb-1 block text-sm font-medium">
                  Status
                </label>
                <select
                  id="editStatus"
                  value={editedStatusId}
                  onChange={(e) => setEditedStatusId(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                >
                  {statuses
                    .filter(s => ['To Do', 'In Progress', 'Review', 'Done'].includes(s.columnName))
                    .reduce((acc, status) => {
                      // Only one status per column - prefer where name matches columnName
                      if (!acc.find(s => s.columnName === status.columnName)) {
                        acc.push(status);
                      }
                      return acc;
                    }, [] as typeof statuses)
                    .sort((a, b) => a.columnOrder - b.columnOrder)
                    .map(status => (
                    <option key={status.id} value={status.id}>
                      {status.name} ({status.columnName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="editAssignedTo" className="mb-1 block text-sm font-medium">
                  Assigned To
                </label>
                <select
                  id="editAssignedTo"
                  value={editedAssignedTo}
                  onChange={(e) => setEditedAssignedTo(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                >
                  <option value="">Unassigned</option>
                  {projectMembers.map(member => (
                    <option key={member.userId} value={member.userId}>
                      {member.userName} ({member.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="editDueAt" className="mb-1 block text-sm font-medium">
                  Due Date
                </label>
                <input
                  id="editDueAt"
                  type="date"
                  value={editedDueAt}
                  onChange={(e) => setEditedDueAt(e.target.value)}
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
