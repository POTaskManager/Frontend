export type TaskState = 'todo' | 'in_progress' | 'review' | 'done';

// UI Task model extends backend fields and adds a derived `state` for board logic.
export type Task = {
  id: string;
  sprintId: string | null;
  createdBy: string;
  title: string;
  description: string | null;
  statusId: string; // backend representation of state
  priority: string | null;
  dueAt: string | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  // Derived/duplicated for UI convenience
  state: TaskState;
};
