import { http, HttpResponse } from 'msw';
import {
  mockProjects,
  mockTasks,
  getTasksByProjectId,
  mockBoards,
  getSprintsByProjectId,
  getTasksBySprintId,
  mockLabels,
  mockProjectMembers,
  mockSprints,
  mockUserCredentials,
} from './data';
import type { Task as UITask, Task, Project } from '@/types';

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
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    
    const userCredential = mockUserCredentials.find(
      cred => cred.email === body.email && cred.password === body.password
    );
    
    if (!userCredential) {
      return HttpResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    
    return HttpResponse.json({ ok: true });
  }),
  http.get('/api/auth/session', async () => {
    return HttpResponse.json({ user: { email: 'member@example.com', role: 'member' } });
  }),
  http.get('/api/auth/me', async () => {
    return HttpResponse.json({ user: { id: 'user-1', email: 'member@example.com', name: 'Member', role: 'admin' } });
  }),
  http.post('/api/auth/logout', async () => {
    return HttpResponse.json({ ok: true });
  }),

  // New: minimal handlers for proxy-based auth endpoints used by the app
  http.post('/api/proxy/api/auth/login', async () => {
    return HttpResponse.json({ ok: true });
  }),
  http.get('/api/proxy/api/auth/me', async () => {
    return HttpResponse.json({ user: { id: 'user-1', email: 'member@example.com', name: 'Member', role: 'admin' } });
  }),
  http.post('/api/proxy/api/auth/logout', async () => {
    return HttpResponse.json({ ok: true });
  }),

  // Projects (legacy)
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

  // New proxy-backed projects endpoint
  http.get('/api/proxy/api/projects', async () => {
    return HttpResponse.json(mockProjects);
  }),
  http.get('/api/proxy/api/projects/:projectId', async ({ params }) => {
    const project = mockProjects.find((p) => p.id === normalizeProjectId(params.projectId as string));
    if (!project) {
      return HttpResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return HttpResponse.json(project);
  }),

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
  http.patch('/api/projects/:projectId/tasks/:id', async ({ params, request }) => {
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
  http.get('/api/projects/:projectId/sprints', async ({ params }) => {
    const projectId = normalizeProjectId(params.projectId as string);
    return HttpResponse.json(getSprintsByProjectId(projectId));
  }),
  http.get('/api/proxy/api/projects/:projectId/sprints', async ({ params }) => {
    const projectId = normalizeProjectId(params.projectId as string);
    return HttpResponse.json(getSprintsByProjectId(projectId));
  }),

  // New: tasks per sprint
  http.get('/api/projects/:projectId/sprints/:sprintId/tasks', async ({ params }) => {
    const sprintId = params.sprintId as string;
    const tasks = getTasksBySprintId(sprintId).map((t) => toBackendTask(t));
    return HttpResponse.json(tasks);
  }),
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
      sprint_id?: string;
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
    const board = mockBoards.find((b) => b.projectId === projectId) || mockBoards[0];
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
      status: 'todo',
      priority: body.priority ? priorityMap[body.priority] || 'medium' : 'medium',
      assigneeId: body.assigned_to,
      dueDate: body.due_at,
      sprintId: body.sprint_id,
      tags: body.label_ids || []
    };

    mockTasks.push(newTask);

    return HttpResponse.json(newTask, { status: 201 });
  }),
  // Create project endpoint
  http.post('/api/projects', async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      description?: string;
      members: Array<{ email: string; role: 'member' | 'tester' | 'client' }>;
    };

    // Validation
    if (!body.name || body.name.trim().length === 0) {
      return HttpResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    if (body.name.length > 255) {
      return HttpResponse.json({ error: 'Project name cannot exceed 255 characters' }, { status: 400 });
    }

    if (!body.members || body.members.length === 0) {
      return HttpResponse.json({ error: 'At least one team member is required' }, { status: 400 });
    }

    if (body.members.length > 50) {
      return HttpResponse.json({ error: 'Maximum 50 team members allowed' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = body.members.filter((m) => !emailRegex.test(m.email));
    if (invalidEmails.length > 0) {
      return HttpResponse.json(
        { error: `Invalid email format: ${invalidEmails.map((m) => m.email).join(', ')}` },
        { status: 400 }
      );
    }

    // Check for duplicates
    const emails = body.members.map((m) => m.email.toLowerCase());
    const duplicates = emails.filter((email, index) => emails.indexOf(email) !== index);
    if (duplicates.length > 0) {
      return HttpResponse.json({ error: `Duplicate emails: ${Array.from(new Set(duplicates)).join(', ')}` }, { status: 400 });
    }

    // Create project
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: body.name,
      createdAt: new Date().toISOString()
    };

    mockProjects.push(newProject);

    // Create board for project
    const newBoard = {
      id: `board-${Date.now()}`,
      projectId: newProject.id,
      name: 'Main Board'
    };
    mockBoards.push(newBoard);

    // Create default sprint for project
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1); // Monday of current week
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 13); // Two weeks later (Friday)

    const newSprint = {
      id: `sprint-${Date.now()}`,
      projectId: newProject.id,
      name: 'Sprint 1',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      goal: 'Initial sprint'
    };
    mockSprints.push(newSprint);

    // Simulate invitation sending (some may fail)
    const invitations = body.members.map((member) => {
      // Simulate some failures (e.g., invalid domain, user already exists)
      const shouldFail = Math.random() < 0.2; // 20% failure rate for demo
      const failReasons = [
        'User already exists in project',
        'Invalid email domain',
        'User account not found',
        'Invitation limit exceeded'
      ];

      if (shouldFail) {
        return {
          email: member.email,
          success: false,
          error: failReasons[Math.floor(Math.random() * failReasons.length)]
        };
      }

      return {
        email: member.email,
        success: true
      };
    });

    const failureCount = invitations.filter((inv) => !inv.success).length;

    // Return 207 if there are any failures, 201 if all succeeded
    const status = failureCount > 0 ? 207 : 201;

    return HttpResponse.json(
      {
        project: newProject,
        invitations
      },
      { status }
    );
  })
];
