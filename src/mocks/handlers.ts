import { http, HttpResponse } from 'msw';
import { mockProjects, mockTasks, getTasksByProjectId, mockLabels, mockProjectMembers, getBoardByProjectId, mockBoards } from './data';
import type { Task, Project } from '@/types';

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
    const body = (await request.json()) as Partial<Task>;
    
    // Find task and update it (in a real app, this would update a database)
    const taskIndex = mockTasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      return HttpResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    const updatedTask = { ...mockTasks[taskIndex], ...body } as Task;
    mockTasks[taskIndex] = updatedTask;

    return HttpResponse.json(updatedTask);
  }),
  http.get('/api/notifications', async () => HttpResponse.json([])),
  http.get('/api/activity', async () => HttpResponse.json([])),
  http.get('/api/users', async () => HttpResponse.json([])),
  http.get('/api/roles', async () => HttpResponse.json([{ id: 'r1', name: 'admin' }])),
  // Labels endpoint
  http.get('/api/projects/:projectId/labels', async ({ params }) => {
    const projectId = params.projectId as string;
    const labels = mockLabels.filter((label) => label.project_id === projectId);
    return HttpResponse.json({ labels });
  }),
  // Members endpoint
  http.get('/api/projects/:projectId/members', async ({ params }) => {
    let projectId = params.projectId as string;
    // Handle both '1' and 'project-1' formats
    if (/^\d+$/.test(projectId)) {
      projectId = `project-${projectId}`;
    }
    const members = mockProjectMembers[projectId] || [];
    return HttpResponse.json({ members });
  }),
  // Create task endpoint
  http.post('/api/projects/:projectId/tasks', async ({ params, request }) => {
    let projectId = params.projectId as string;
    // Handle both '1' and 'project-1' formats
    if (/^\d+$/.test(projectId)) {
      projectId = `project-${projectId}`;
    }
    
    const body = (await request.json()) as {
      title: string;
      description?: string;
      priority?: number;
      due_at?: string;
      assigned_to?: string;
      label_ids?: string[];
      estimate?: number;
    };

    // Validation
    if (!body.title || body.title.trim().length === 0) {
      return HttpResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (body.title.length > 255) {
      return HttpResponse.json({ error: 'Title cannot exceed 255 characters' }, { status: 400 });
    }

    if (body.due_at) {
      const dueDate = new Date(body.due_at);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (dueDate < now) {
        return HttpResponse.json({ error: 'Due date cannot be in the past' }, { status: 400 });
      }
    }

    // Get board for project
    const board = getBoardByProjectId(projectId);
    if (!board) {
      return HttpResponse.json({ error: 'Board not found for project' }, { status: 404 });
    }

    // Map priority from 1-5 to enum
    const priorityMap: Record<number, Task['priority']> = {
      1: 'low',
      2: 'low',
      3: 'medium',
      4: 'high',
      5: 'urgent'
    };

    const newTask: Task = {
      id: `task-${Date.now()}`,
      boardId: board.id,
      title: body.title,
      description: body.description,
      state: 'todo',
      priority: body.priority ? priorityMap[body.priority] || 'medium' : 'medium',
      assigneeId: body.assigned_to,
      dueDate: body.due_at,
      tags: body.label_ids || []
    };

    mockTasks.push(newTask);

    return HttpResponse.json(newTask, { status: 201 });
  }),
];
