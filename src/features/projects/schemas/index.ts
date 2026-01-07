import { z } from 'zod';

export const sprintSchema = z.object({
  id: z.string(),
  name: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  statusId: z.string().optional()
});

export const sprintsSchema = z.array(sprintSchema);

export const taskSchema = z.object({
  id: z.string(),
  sprintId: z.string().nullable(),
  createdBy: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  statusId: z.string(),
  priority: z.number(),
  dueAt: z.string().nullable(),
  assignedTo: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const tasksSchema = z.array(taskSchema);
