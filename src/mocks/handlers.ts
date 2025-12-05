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
      return HttpResponse.json({ error: `Duplicate emails: ${[...new Set(duplicates)].join(', ')}` }, { status: 400 });
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

      // Add to mockProjectMembers
      if (!mockProjectMembers[newProject.id]) {
        mockProjectMembers[newProject.id] = [];
      }

      const roleMap: Record<'member' | 'tester' | 'client', string> = {
        member: 'member',
        tester: 'member', // Map tester to member for now
        client: 'member' // Map client to member for now
      };

      const emailParts = member.email.split('@');
      const displayName = emailParts[0] || member.email;
      const mappedRole = roleMap[member.role] || 'member';

      const membersArray = mockProjectMembers[newProject.id];
      if (membersArray) {
        membersArray.push({
          user_id: `user-${Date.now()}-${Math.random()}`,
          display_name: displayName,
          email: member.email,
          role: mappedRole
        });
      }

      return {
        email: member.email,
        success: true
      };
    });

    const successCount = invitations.filter((inv) => inv.success).length;
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
