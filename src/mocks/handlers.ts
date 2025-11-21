import { http, HttpResponse } from 'msw';
import { mockProjects, mockTasks, getTasksByProjectId } from './data';

export const handlers = [
  http.post('/api/auth/login', async () => {
    return HttpResponse.json({ ok: true });
  }),
  http.get('/api/auth/session', async () => {
    return HttpResponse.json({ user: { email: 'member@example.com', role: 'member' } });
  }),
  http.get('/api/projects', async () => {
    return HttpResponse.json(mockProjects);
  }),
  http.get('/api/projects/:projectId', async ({ params }) => {
    const project = mockProjects.find((p) => p.id === params.projectId);
    if (!project) {
      return HttpResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return HttpResponse.json(project);
  }),
  http.get('/api/projects/:projectId/board/tasks', async ({ params }) => {
    let projectId = params.projectId as string;
    // Handle both '1' and 'project-1' formats
    if (/^\d+$/.test(projectId)) {
      projectId = `project-${projectId}`;
    }
    const tasks = getTasksByProjectId(projectId);
    console.log(`Getting tasks for project ${projectId}, found ${tasks.length} tasks`);
    return HttpResponse.json(tasks);
  }),
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
    const body = (await request.json()) as Partial<typeof mockTasks[0]>;
    
    // Find task and update it (in a real app, this would update a database)
    const taskIndex = mockTasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    const updatedTask = { ...mockTasks[taskIndex], ...body };
    mockTasks[taskIndex] = updatedTask;
    
    return HttpResponse.json(updatedTask);
  }),
  http.get('/api/notifications', async () => HttpResponse.json([])),
  http.get('/api/activity', async () => HttpResponse.json([])),
  http.get('/api/users', async () => HttpResponse.json([])),
  http.get('/api/roles', async () => HttpResponse.json([{ id: 'r1', name: 'admin' }]))
];
