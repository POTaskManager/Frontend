import { z } from 'zod';

export const sprintSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  goal: z.string().optional()
});

export const sprintsSchema = z.array(sprintSchema);

export const taskSchema = z.object({
  id: z.string(),
  sprintId: z.string().optional(),
  createdBy: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().nullable().optional(),
  assignedTo: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const tasksSchema = z.array(taskSchema);
