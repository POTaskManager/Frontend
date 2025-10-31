import { z } from 'zod';

export const roleSchema = z.object({
  id: z.string(),
  name: z.enum(['admin', 'manager', 'member']),
  permissions: z.array(z.string())
});

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  roleId: z.string(),
  status: z.enum(['active', 'invited', 'disabled']),
  createdAt: z.string()
});

export const projectSchema = z.object({ id: z.string(), name: z.string(), createdAt: z.string() });

export const sprintSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  goal: z.string().optional()
});

export const taskSchema = z.object({
  id: z.string(),
  boardId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  state: z.enum(['todo', 'in_progress', 'review', 'done']),
  assigneeId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().optional(),
  sprintId: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(['task', 'comment', 'system']),
  body: z.string(),
  read: z.boolean(),
  createdAt: z.string()
});

export const activitySchema = z.object({
  id: z.string(),
  actorId: z.string(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  createdAt: z.string()
});


