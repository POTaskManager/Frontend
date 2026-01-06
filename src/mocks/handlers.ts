import { http, HttpResponse } from 'msw';
import {
  mockTasks,
  getTasksByProjectId,
  getTasksBySprintId,
  toBackendTask,
} from './data';
import type { Task as UITask } from '@/types';

function normalizeProjectId(projectId: string): string {
  return /^\d+$/.test(projectId) ? `project-${projectId}` : projectId;
}

export const handlers = [

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

    const idx = mockTasks.findIndex((t) => t.id === id);
    if (idx === -1) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const { status, title, description, priority, assignedTo, dueDate } = body || {};

    mockTasks[idx] = {
      ...mockTasks[idx],
      ...(status ? { status } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(assignedTo !== undefined ? { assigneeId: assignedTo } : {}),
      ...(dueDate !== undefined ? { dueDate } : {}),
    } as UITask;

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
