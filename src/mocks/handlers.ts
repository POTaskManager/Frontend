import { http, HttpResponse } from 'msw';
import {
  mockProjects,
  mockTasks,
  getTasksByProjectId,
  mockBoards,
  getSprintsByProjectId,
  getTasksBySprintId,
} from './data';
import type { Task as UITask } from '@/types';

// Backend-like Task shape expected by the proxy-backed frontend
interface BackendTask {
  id: string;
  sprintId: string | null;
  createdBy: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: string | null;
  dueAt: string | null;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

function toBackendTask(t: UITask, projectIdHint?: string): BackendTask {
  // derive projectId via board mapping to assign sprint if missing
  const board = mockBoards.find((b) => b.id === t.boardId);
  const projectId = projectIdHint || board?.projectId || 'project-1';
  const sprints = getSprintsByProjectId(projectId);
  const defaultSprintId = sprints[0]?.id || null;
  const createdAt = '2024-02-01T00:00:00Z';
  const updatedAt = '2024-02-05T00:00:00Z';
  return {
    id: t.id,
    sprintId: t.sprintId || defaultSprintId,
    createdBy: 'user-1',
    title: t.title,
    description: t.description || null,
    status: t.status,
    priority: t.priority || null,
    dueAt: t.dueDate || null,
    assignedTo: t.assigneeId,
    createdAt,
    updatedAt,
  };
}

function normalizeProjectId(projectId: string): string {
  return /^\d+$/.test(projectId) ? `project-${projectId}` : projectId;
}

export const handlers = [
  // Existing auth mocks
  // http.post('/api/auth/login', async () => {
  //   return HttpResponse.json({ ok: true });
  // }),
  // http.get('/api/auth/session', async () => {
  //   return HttpResponse.json({ user: { email: 'member@example.com', role: 'member' } });
  // }),
  //
  // // New: minimal handlers for proxy-based auth endpoints used by the app
  // http.get('/api/proxy/api/auth/me', async () => {
  //   return HttpResponse.json({ user: { id: 'user-1', email: 'member@example.com', name: 'Member', role: 'admin' } });
  // }),
  // http.post('/api/proxy/api/auth/logout', async () => {
  //   return HttpResponse.json({ ok: true });
  // }),

  // Projects (legacy)
  // http.get('/api/projects', async () => {
  //   return HttpResponse.json(mockProjects);
  // }),
  // http.get('/api/projects/:projectId', async ({ params }) => {
  //   const project = mockProjects.find((p) => p.id === params.projectId);
  //   if (!project) {
  //     return HttpResponse.json({ error: 'Project not found' }, { status: 404 });
  //   }
  //   return HttpResponse.json(project);
  // }),

  // New proxy-backed projects endpoint
  // http.get('/api/proxy/api/projects', async () => {
  //   return HttpResponse.json(mockProjects);
  // }),
  // http.get('/api/proxy/api/projects/:projectId', async ({ params }) => {
  //   const project = mockProjects.find((p) => p.id === normalizeProjectId(params.projectId as string));
  //   if (!project) {
  //     return HttpResponse.json({ error: 'Project not found' }, { status: 404 });
  //   }
  //   return HttpResponse.json(project);
  // }),

  // Legacy board tasks
  http.get('/api/projects/:projectId/board/tasks', async ({ params }) => {
    let projectId = params.projectId as string;
    projectId = normalizeProjectId(projectId);
    const tasks = getTasksByProjectId(projectId);
    return HttpResponse.json(tasks);
  }),

  // New proxy-backed endpoints expected by the Zustand store
  http.get('/api/proxy/api/projects/:projectId/tasks', async ({ params }) => {
    const projectId = normalizeProjectId(params.projectId as string);
    const tasks = getTasksByProjectId(projectId).map((t) => toBackendTask(t, projectId));
    return HttpResponse.json(tasks);
  }),

  http.patch('/api/proxy/api/projects/:projectId/tasks/:id', async ({ params, request }) => {
    const id = params.id as string;
    const body = await request.json() as any;
    const statusId = body?.status as UITask['status'] | undefined;

    const idx = mockTasks.findIndex((t) => t.id === id);
    if (idx === -1) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    if (statusId) {
      mockTasks[idx] = { ...mockTasks[idx], status: statusId } as UITask;
    }
    const projectId = normalizeProjectId(params.projectId as string);
    return HttpResponse.json(toBackendTask(mockTasks[idx]!, projectId));
  }),

  // New: sprints per project
  // http.get('/api/proxy/api/projects/:projectId/sprints', async ({ params }) => {
  //   const projectId = normalizeProjectId(params.projectId as string);
  //   return HttpResponse.json(getSprintsByProjectId(projectId));
  // }),

  // New: tasks per sprint
  http.get('/api/proxy/api/projects/:projectId/sprints/:sprintId/tasks', async ({ params }) => {
    const sprintId = params.sprintId as string;
    const tasks = getTasksBySprintId(sprintId).map((t) => toBackendTask(t));
    return HttpResponse.json(tasks);
  }),

  // Legacy miscellaneous
  http.get('/api/tasks', async ({ request }) => {
    const url = new URL(request.url);
    const boardId = url.searchParams.get('boardId');
    const projectId = url.searchParams.get('projectId');

    if (projectId) {
      return HttpResponse.json(getTasksByProjectId(projectId));
    }

    if (boardId) {
      const tasks = mockTasks.filter((task) => task.boardId === boardId);
      return HttpResponse.json(tasks);
    }

    return HttpResponse.json(mockTasks);
  }),
  http.patch('/api/tasks/:taskId', async ({ params, request }) => {
    const taskId = params.taskId as string;
    const body = (await request.json()) as Partial<UITask>;

    const taskIndex = mockTasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updatedTask = { ...mockTasks[taskIndex], ...body } as UITask;
    mockTasks[taskIndex] = updatedTask;

    return HttpResponse.json(updatedTask);
  }),
  http.get('/api/notifications', async () => HttpResponse.json([])),
  http.get('/api/activity', async () => HttpResponse.json([])),
  http.get('/api/users', async () => HttpResponse.json([])),
  http.get('/api/roles', async () => HttpResponse.json([{ id: 'r1', name: 'admin' }]))
];
