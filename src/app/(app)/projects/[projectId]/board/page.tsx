'use client';

import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { Column } from './components/column';
import { canMoveTask } from './drag-rules';
import { useBoardFacade } from './board-facade';
import { Task } from '@/features/projects';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Route } from 'next';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatPopup } from '@/components/chat/ChatPopup';

export default function ProjectBoardPage() {
  const {
    tasks,
    sprints,
    statuses,
    isLoading,
    error,
    selectedSprintId,
    projectId,
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
  // Use first "To Do" status as default, or first status if none found
  const defaultStatus = statuses.find(s => s.columnName === 'To Do') || statuses[0];
  const [newTaskState, setNewTaskState] = useState<string>(defaultStatus?.id || '');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Update state when statuses load
  useEffect(() => {
    if (statuses.length > 0 && !newTaskState) {
      const todoStatus = statuses.find(s => s.columnName === 'To Do') || statuses[0];
      if (todoStatus) setNewTaskState(todoStatus.id);
    }
  }, [statuses, newTaskState]);

  // Chat state
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Create task handler
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsCreatingTask(true);
    try {
      await createTask({
        title: newTaskTitle,
        description: newTaskDescription || undefined,
        priority: newTaskPriority,
        state: newTaskState,
        sprintId: selectedSprintId || undefined,
      });

      setShowCreateTask(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
      const todoStatus = statuses.find(s => s.columnName === 'To Do') || statuses[0];
      setNewTaskState(todoStatus?.id || '');
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

  // Group statuses by columnName to get unique columns
  const columnNames = Array.from(new Set(statuses.map(s => s.columnName)));
  const columns = columnNames.map(columnName => ({
    name: columnName,
    statuses: statuses.filter(s => s.columnName === columnName)
  }));

  const onDragEnd = (e: DragEndEvent) => {
    const taskId = e.active.id as string;
    const targetStatusId = e.over?.id as string | undefined;

    console.log('DragEnd event:', {
      taskId,
      targetStatusId,
      overData: e.over?.data?.current
    });

    if (!targetStatusId) {
      console.warn('No target status ID');
      return;
    }

    const draggedTask = tasks.find((t) => t.id === taskId);
    if (!draggedTask) {
      console.warn('Task not found:', taskId);
      return;
    }

    // Don't update if dropping on the same status
    if (draggedTask.statusId === targetStatusId) {
      console.log('Task already in this status');
      return;
    }

    console.log('Updating task:', taskId, 'from', draggedTask.statusId, 'to', targetStatusId);
    updateTask(taskId, targetStatusId);
  };

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  const handleCloseChat = () => {
    setSelectedChatId(null);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main Board Area */}
      <main className="flex-1 overflow-auto px-6 py-8">
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
            className="rounded bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
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
                changeSprint(sprintId || null);
              }}
            >
              <option value="">All Tasks</option>
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
                    {statuses.map(status => (
                      <option key={status.id} value={status.id}>
                        {status.name} ({status.columnName})
                      </option>
                    ))}
                  </select>
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
            {columns.map((column) => {
              // Get all statusIds for this column
              const columnStatusIds = column.statuses.map(s => s.id);
              // Filter tasks that have any of these statusIds
              const columnTasks = tasks.filter(t => columnStatusIds.includes(t.statusId));
              
              // Use first statusId as the drop target ID
              const dropTargetId = columnStatusIds[0] || column.name;
              
              return (
                <Column
                  key={column.name}
                  id={dropTargetId}
                  title={column.name}
                  tasks={columnTasks}
                  allTasks={tasks}
                  statusIds={columnStatusIds}
                />
              );
            })}
          </div>
        </DndContext>
      </main>

      {/* Chat Sidebar */}
      <ChatSidebar projectId={projectId} onChatSelect={handleChatSelect} />

      {/* Chat Popup */}
      {selectedChatId && (
        <ChatPopup
          projectId={projectId}
          chatId={selectedChatId}
          onClose={handleCloseChat}
        />
      )}
    </div>
  );
}
