import { taskSchema } from '@/features/projects/schemas';
import { z } from 'zod';

export type BackendTask = z.infer<typeof taskSchema>;

export type TaskState = BackendTask['statusId'];

// UI Task model - directly use backend model
export type Task = BackendTask;

export function mapFromBackend(t: BackendTask): Task {
  return t;
}
