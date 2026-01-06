'use client';

import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { Column } from './components/column';
import { canMoveTask } from './drag-rules';
import { useBoardFacade } from './board-facade';
import { Task } from '@/features/projects';
import { useState } from 'react';
import Link from 'next/link';
import { Route } from 'next';

export default function ProjectBoardPage() {
  const {
    tasks,
    sprints,
    isLoading,
    error,
    selectedSprintId,
    projectId,
    boardId,
    changeSprint,
    updateTask,
    createTask,
  } = useBoardFacade();

  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'critical'>(
    'medium',
  );
  const [newTaskState, setNewTaskState] = useState<string>('todo');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<string>('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Create task handler
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedSprintId) return;

    setIsCreatingTask(true);
    try {
      await createTask({
        title: newTaskTitle,
        description: newTaskDescription || undefined,
        priority: newTaskPriority,
        state: newTaskState,
        sprintId: selectedSprintId,
        boardId: boardId,
        assigneeId: newTaskAssigneeId || undefined,
        dueDate: newTaskDueDate || undefined,
      });

      setShowCreateTask(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
      setNewTaskState('todo');
      setNewTaskAssigneeId('');
      setNewTaskDueDate('');
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    } finally {
      setIsCreatingTask(false);
    }
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
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectId}/settings` as Route}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            ⚙️ Settings
          </Link>
          <button
            onClick={() => setShowCreateTask(true)}
            disabled={!selectedSprintId}
            className="rounded bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            + New Task
          </button>
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

      {/* Create Task Modal */}
      {showCreateTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowCreateTask(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-xl font-semibold">Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="mb-4">
                <label htmlFor="taskTitle" className="mb-1 block text-sm font-medium">
                  Title *
                </label>
                <input
                  id="taskTitle"
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  placeholder="Enter task title"
                  required
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label htmlFor="taskDescription" className="mb-1 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="taskDescription"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  placeholder="Enter task description (optional)"
                  rows={3}
                />
              </div>
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="taskPriority" className="mb-1 block text-sm font-medium">
                    Priority
                  </label>
                  <select
                    id="taskPriority"
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="taskState" className="mb-1 block text-sm font-medium">
                    Status
                  </label>
                  <select
                    id="taskState"
                    value={newTaskState}
                    onChange={(e) => setNewTaskState(e.target.value)}
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
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="taskAssignee" className="mb-1 block text-sm font-medium">
                    Assignee
                  </label>
                  <select
                    id="taskAssignee"
                    value={newTaskAssigneeId}
                    onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  >
                    <option value="">Unassigned</option>
                    <option value="user-1">Alice Johnson</option>
                    <option value="user-2">Bob Smith</option>
                    <option value="user-3">Charlie Brown</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="taskDueDate" className="mb-1 block text-sm font-medium">
                    Due Date
                  </label>
                  <input
                    id="taskDueDate"
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTask(false)}
                  className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                  disabled={isCreatingTask}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                  disabled={isCreatingTask}
                >
                  {isCreatingTask ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
