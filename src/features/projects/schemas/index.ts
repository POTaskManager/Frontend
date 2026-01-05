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
  sprintId: z.string().optional(),
  createdBy: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const tasksSchema = z.array(taskSchema);
