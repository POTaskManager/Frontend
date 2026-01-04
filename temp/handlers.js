"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlers = void 0;
const msw_1 = require("msw");
const data_1 = require("./data");
function toBackendTask(t, projectIdHint) {
    var _a;
    // derive projectId via board mapping to assign sprint if missing
    const board = data_1.mockBoards.find((b) => b.id === t.boardId);
    const projectId = projectIdHint || (board === null || board === void 0 ? void 0 : board.projectId) || 'project-1';
    const sprints = (0, data_1.getSprintsByProjectId)(projectId);
    const defaultSprintId = ((_a = sprints[0]) === null || _a === void 0 ? void 0 : _a.id) || null;
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
function normalizeProjectId(projectId) {
    return /^\d+$/.test(projectId) ? `project-${projectId}` : projectId;
}
exports.handlers = [
    // Existing auth mocks
    msw_1.http.post('/api/auth/login', () => __awaiter(void 0, void 0, void 0, function* () {
        return msw_1.HttpResponse.json({ ok: true });
    })),
    msw_1.http.get('/api/auth/session', () => __awaiter(void 0, void 0, void 0, function* () {
        return msw_1.HttpResponse.json({ user: { email: 'member@example.com', role: 'member' } });
    })),
    msw_1.http.get('/api/auth/me', () => __awaiter(void 0, void 0, void 0, function* () {
        return msw_1.HttpResponse.json({ user: { id: 'user-1', email: 'member@example.com', name: 'Member', role: 'admin' } });
    })),
    msw_1.http.post('/api/auth/logout', () => __awaiter(void 0, void 0, void 0, function* () {
        return msw_1.HttpResponse.json({ ok: true });
    })),
    // New: minimal handlers for proxy-based auth endpoints used by the app
    msw_1.http.post('/api/proxy/api/auth/login', () => __awaiter(void 0, void 0, void 0, function* () {
        return msw_1.HttpResponse.json({ ok: true });
    })),
    msw_1.http.get('/api/proxy/api/auth/me', () => __awaiter(void 0, void 0, void 0, function* () {
        return msw_1.HttpResponse.json({ user: { id: 'user-1', email: 'member@example.com', name: 'Member', role: 'admin' } });
    })),
    msw_1.http.post('/api/proxy/api/auth/logout', () => __awaiter(void 0, void 0, void 0, function* () {
        return msw_1.HttpResponse.json({ ok: true });
    })),
    // Projects (legacy)
    msw_1.http.get('/api/projects', () => __awaiter(void 0, void 0, void 0, function* () {
        return msw_1.HttpResponse.json(data_1.mockProjects);
    })),
    msw_1.http.get('/api/projects/:projectId', (_a) => __awaiter(void 0, [_a], void 0, function* ({ params }) {
        const project = data_1.mockProjects.find((p) => p.id === params.projectId);
        if (!project) {
            return msw_1.HttpResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        return msw_1.HttpResponse.json(project);
    })),
    // New proxy-backed projects endpoint
    msw_1.http.get('/api/proxy/api/projects', () => __awaiter(void 0, void 0, void 0, function* () {
        return msw_1.HttpResponse.json(data_1.mockProjects);
    })),
    msw_1.http.get('/api/proxy/api/projects/:projectId', (_a) => __awaiter(void 0, [_a], void 0, function* ({ params }) {
        const project = data_1.mockProjects.find((p) => p.id === normalizeProjectId(params.projectId));
        if (!project) {
            return msw_1.HttpResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        return msw_1.HttpResponse.json(project);
    })),
    // Legacy board tasks
    msw_1.http.get('/api/projects/:projectId/board/tasks', (_a) => __awaiter(void 0, [_a], void 0, function* ({ params }) {
        let projectId = params.projectId;
        projectId = normalizeProjectId(projectId);
        const tasks = (0, data_1.getTasksByProjectId)(projectId);
        return msw_1.HttpResponse.json(tasks);
    })),
    // New proxy-backed endpoints expected by the Zustand store
    msw_1.http.get('/api/proxy/api/projects/:projectId/tasks', (_a) => __awaiter(void 0, [_a], void 0, function* ({ params }) {
        const projectId = normalizeProjectId(params.projectId);
        const tasks = (0, data_1.getTasksByProjectId)(projectId).map((t) => toBackendTask(t, projectId));
        return msw_1.HttpResponse.json(tasks);
    })),
    msw_1.http.patch('/api/proxy/api/projects/:projectId/tasks/:id', (_a) => __awaiter(void 0, [_a], void 0, function* ({ params, request }) {
        const id = params.id;
        const body = yield request.json();
        const statusId = body === null || body === void 0 ? void 0 : body.status;
        const idx = data_1.mockTasks.findIndex((t) => t.id === id);
        if (idx === -1) {
            return msw_1.HttpResponse.json({ error: 'Task not found' }, { status: 404 });
        }
        if (statusId) {
            data_1.mockTasks[idx] = Object.assign(Object.assign({}, data_1.mockTasks[idx]), { status: statusId });
        }
        const projectId = normalizeProjectId(params.projectId);
        return msw_1.HttpResponse.json(toBackendTask(data_1.mockTasks[idx], projectId));
    })),
    // New: sprints per project
    msw_1.http.get('/api/projects/:projectId/sprints', (_a) => __awaiter(void 0, [_a], void 0, function* ({ params }) {
        const projectId = normalizeProjectId(params.projectId);
        return msw_1.HttpResponse.json((0, data_1.getSprintsByProjectId)(projectId));
    })),
    msw_1.http.get('/api/proxy/api/projects/:projectId/sprints', (_a) => __awaiter(void 0, [_a], void 0, function* ({ params }) {
        const projectId = normalizeProjectId(params.projectId);
        return msw_1.HttpResponse.json((0, data_1.getSprintsByProjectId)(projectId));
    })),
    // New: tasks per sprint
    msw_1.http.get('/api/projects/:projectId/sprints/:sprintId/tasks', (_a) => __awaiter(void 0, [_a], void 0, function* ({ params }) {
        const sprintId = params.sprintId;
        const tasks = (0, data_1.getTasksBySprintId)(sprintId).map((t) => toBackendTask(t));
        return msw_1.HttpResponse.json(tasks);
    })),
    msw_1.http.get('/api/proxy/api/projects/:projectId/sprints/:sprintId/tasks', (_a) => __awaiter(void 0, [_a], void 0, function* ({ params }) {
        const sprintId = params.sprintId;
        const tasks = (0, data_1.getTasksBySprintId)(sprintId).map((t) => toBackendTask(t));
        return msw_1.HttpResponse.json(tasks);
    })),
    // Legacy miscellaneous
    msw_1.http.get('/api/tasks', (_a) => __awaiter(void 0, [_a], void 0, function* ({ request }) {
        const url = new URL(request.url);
        const boardId = url.searchParams.get('boardId');
        const projectId = url.searchParams.get('projectId');
        if (projectId) {
            return msw_1.HttpResponse.json((0, data_1.getTasksByProjectId)(projectId));
        }
        if (boardId) {
            const tasks = data_1.mockTasks.filter((task) => task.boardId === boardId);
            return msw_1.HttpResponse.json(tasks);
        }
        return msw_1.HttpResponse.json(data_1.mockTasks);
    })),
    msw_1.http.patch('/api/tasks/:taskId', (_a) => __awaiter(void 0, [_a], void 0, function* ({ params, request }) {
        const taskId = params.taskId;
        const body = (yield request.json());
        const taskIndex = data_1.mockTasks.findIndex((t) => t.id === taskId);
        if (taskIndex === -1) {
            return msw_1.HttpResponse.json({ error: 'Task not found' }, { status: 404 });
        }
        const updatedTask = Object.assign(Object.assign({}, data_1.mockTasks[taskIndex]), body);
        data_1.mockTasks[taskIndex] = updatedTask;
        return msw_1.HttpResponse.json(updatedTask);
    })),
    msw_1.http.get('/api/notifications', () => __awaiter(void 0, void 0, void 0, function* () { return msw_1.HttpResponse.json([]); })),
    msw_1.http.get('/api/activity', () => __awaiter(void 0, void 0, void 0, function* () { return msw_1.HttpResponse.json([]); })),
    msw_1.http.get('/api/users', () => __awaiter(void 0, void 0, void 0, function* () { return msw_1.HttpResponse.json([]); })),
    msw_1.http.get('/api/roles', () => __awaiter(void 0, void 0, void 0, function* () { return msw_1.HttpResponse.json([{ id: 'r1', name: 'admin' }]); })),
    // Create task endpoint
    msw_1.http.post('/api/projects/:projectId/tasks', (_a) => __awaiter(void 0, [_a], void 0, function* ({ params, request }) {
        let projectId = params.projectId;
        // Handle both '1' and 'project-1' formats
        if (/^\d+$/.test(projectId)) {
            projectId = `project-${projectId}`;
        }
        const body = (yield request.json());
        // Validation
        if (!body.title || body.title.trim().length === 0) {
            return msw_1.HttpResponse.json({ error: 'Title is required' }, { status: 400 });
        }
        if (body.title.length > 255) {
            return msw_1.HttpResponse.json({ error: 'Title cannot exceed 255 characters' }, { status: 400 });
        }
        if (body.due_at) {
            const dueDate = new Date(body.due_at);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            if (dueDate < now) {
                return msw_1.HttpResponse.json({ error: 'Due date cannot be in the past' }, { status: 400 });
            }
        }
        // Get board for project
        const board = data_1.mockBoards.find((b) => b.projectId === projectId) || data_1.mockBoards[0];
        if (!board) {
            return msw_1.HttpResponse.json({ error: 'Board not found for project' }, { status: 404 });
        }
        // Map priority from 1-5 to enum
        const priorityMap = {
            1: 'low',
            2: 'low',
            3: 'medium',
            4: 'high',
            5: 'urgent'
        };
        const newTask = {
            id: `task-${Date.now()}`,
            boardId: board.id,
            title: body.title,
            description: body.description,
            status: 'todo',
            priority: body.priority ? priorityMap[body.priority] || 'medium' : 'medium',
            assigneeId: body.assigned_to,
            dueDate: body.due_at,
            tags: body.label_ids || []
        };
        data_1.mockTasks.push(newTask);
        return msw_1.HttpResponse.json(newTask, { status: 201 });
    })),
    // Create project endpoint
    msw_1.http.post('/api/projects', (_a) => __awaiter(void 0, [_a], void 0, function* ({ request }) {
        const body = (yield request.json());
        // Validation
        if (!body.name || body.name.trim().length === 0) {
            return msw_1.HttpResponse.json({ error: 'Project name is required' }, { status: 400 });
        }
        if (body.name.length > 255) {
            return msw_1.HttpResponse.json({ error: 'Project name cannot exceed 255 characters' }, { status: 400 });
        }
        if (!body.members || body.members.length === 0) {
            return msw_1.HttpResponse.json({ error: 'At least one team member is required' }, { status: 400 });
        }
        if (body.members.length > 50) {
            return msw_1.HttpResponse.json({ error: 'Maximum 50 team members allowed' }, { status: 400 });
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = body.members.filter((m) => !emailRegex.test(m.email));
        if (invalidEmails.length > 0) {
            return msw_1.HttpResponse.json({ error: `Invalid email format: ${invalidEmails.map((m) => m.email).join(', ')}` }, { status: 400 });
        }
        // Check for duplicates
        const emails = body.members.map((m) => m.email.toLowerCase());
        const duplicates = emails.filter((email, index) => emails.indexOf(email) !== index);
        if (duplicates.length > 0) {
            return msw_1.HttpResponse.json({ error: `Duplicate emails: ${Array.from(new Set(duplicates)).join(', ')}` }, { status: 400 });
        }
        // Create project
        const newProject = {
            id: `project-${Date.now()}`,
            name: body.name,
            createdAt: new Date().toISOString()
        };
        data_1.mockProjects.push(newProject);
        // Create board for project
        const newBoard = {
            id: `board-${Date.now()}`,
            projectId: newProject.id,
            name: 'Main Board'
        };
        data_1.mockBoards.push(newBoard);
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
        return msw_1.HttpResponse.json({
            project: newProject,
            invitations
        }, { status });
    }))
];
