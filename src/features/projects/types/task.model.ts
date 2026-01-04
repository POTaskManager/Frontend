import { taskSchema } from '@/features/projects/schemas';
import { z } from 'zod';

export type BackendTask = z.infer<typeof taskSchema>;

export type TaskState = BackendTask['status'];

// UI Task model extends backend fields and adds a derived `state` for board logic.
export type Task = BackendTask;

export function mapFromBackend(t: BackendTask): Task {
  const state = (t.status as Task['status']) ?? 'todo';
  return {
    ...t,
    state,
  } as unknown as Task;
}
