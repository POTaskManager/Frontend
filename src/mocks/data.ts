import type { Task, Project, Board, User } from '@/types';

/**
 * Mock users for assignees
 */
export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    roleId: 'role-1',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'user-2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    roleId: 'role-2',
    status: 'active',
    createdAt: '2024-01-16T10:00:00Z'
  },
  {
    id: 'user-3',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    roleId: 'role-2',
    status: 'active',
    createdAt: '2024-01-17T10:00:00Z'
  }
];

/**
 * Mock projects
 */
export const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: 'E-Commerce Platform',
    createdAt: '2024-01-20T09:00:00Z'
  },
  {
    id: 'project-2',
    name: 'Mobile App Redesign',
    createdAt: '2024-01-22T09:00:00Z'
  },
  {
    id: 'project-3',
    name: 'API Integration',
    createdAt: '2024-01-25T09:00:00Z'
  }
];

/**
 * Mock boards
 */
export const mockBoards: Board[] = [
  {
    id: 'board-1',
    projectId: 'project-1',
    name: 'Main Board'
  },
  {
    id: 'board-2',
    projectId: 'project-2',
    name: 'Design Board'
  },
  {
    id: 'board-3',
    projectId: 'project-3',
    name: 'Development Board'
  }
];

/**
 * Mock tasks with various states for drag and drop development
 */
export const mockTasks: Task[] = [
  // Todo tasks
  {
    id: 'task-1',
    boardId: 'board-1',
    title: 'Design user authentication flow',
    description: 'Create wireframes and user flows for login/signup pages',
    state: 'todo',
    priority: 'high',
    assigneeId: 'user-1',
    dueDate: '2024-02-15T17:00:00Z',
    tags: ['design', 'auth']
  },
  {
    id: 'task-2',
    boardId: 'board-1',
    title: 'Set up CI/CD pipeline',
    description: 'Configure GitHub Actions for automated testing and deployment',
    state: 'todo',
    priority: 'medium',
    assigneeId: 'user-2',
    tags: ['devops', 'ci-cd']
  },
  {
    id: 'task-3',
    boardId: 'board-1',
    title: 'Write API documentation',
    description: 'Document all REST endpoints with examples and schemas',
    state: 'todo',
    priority: 'low',
    tags: ['documentation']
  },
  {
    id: 'task-4',
    boardId: 'board-2',
    title: 'Research color palette',
    description: 'Explore modern color schemes for mobile application',
    state: 'todo',
    priority: 'medium',
    assigneeId: 'user-1',
    tags: ['design', 'research']
  },
  // In Progress tasks
  {
    id: 'task-5',
    boardId: 'board-1',
    title: 'Implement payment gateway',
    description: 'Integrate Stripe API for processing payments',
    state: 'in_progress',
    priority: 'urgent',
    assigneeId: 'user-2',
    dueDate: '2024-02-10T17:00:00Z',
    tags: ['payment', 'integration']
  },
  {
    id: 'task-6',
    boardId: 'board-1',
    title: 'Build dashboard component',
    description: 'Create reusable dashboard component with charts and metrics',
    state: 'in_progress',
    priority: 'high',
    assigneeId: 'user-1',
    tags: ['frontend', 'components']
  },
  {
    id: 'task-7',
    boardId: 'board-2',
    title: 'Design mobile navigation',
    description: 'Create navigation patterns for mobile responsive design',
    state: 'in_progress',
    priority: 'high',
    assigneeId: 'user-3',
    tags: ['design', 'mobile']
  },
  // Review tasks
  {
    id: 'task-8',
    boardId: 'board-1',
    title: 'Code review: User management module',
    description: 'Review PR #123 for user management features',
    state: 'review',
    priority: 'high',
    assigneeId: 'user-1',
    tags: ['code-review']
  },
  {
    id: 'task-9',
    boardId: 'board-1',
    title: 'QA: Test checkout flow',
    description: 'Perform end-to-end testing of the checkout process',
    state: 'review',
    priority: 'medium',
    assigneeId: 'user-3',
    tags: ['qa', 'testing']
  },
  {
    id: 'task-10',
    boardId: 'board-3',
    title: 'Review API security',
    description: 'Audit API endpoints for security vulnerabilities',
    state: 'review',
    priority: 'urgent',
    assigneeId: 'user-2',
    tags: ['security', 'api']
  },
  // Done tasks
  {
    id: 'task-11',
    boardId: 'board-1',
    title: 'Setup project repository',
    description: 'Initialize Git repo and configure project structure',
    state: 'done',
    priority: 'low',
    assigneeId: 'user-2',
    tags: ['setup']
  },
  {
    id: 'task-12',
    boardId: 'board-1',
    title: 'Create database schema',
    description: 'Design and implement initial database schema',
    state: 'done',
    priority: 'high',
    assigneeId: 'user-1',
    tags: ['database', 'backend']
  },
  {
    id: 'task-13',
    boardId: 'board-2',
    title: 'Create logo variations',
    description: 'Design multiple logo variations for brand identity',
    state: 'done',
    priority: 'medium',
    assigneeId: 'user-3',
    tags: ['design', 'branding']
  },
  {
    id: 'task-14',
    boardId: 'board-1',
    title: 'Configure development environment',
    description: 'Set up local development environment with all dependencies',
    state: 'done',
    priority: 'medium',
    assigneeId: 'user-1',
    tags: ['setup', 'devops']
  }
];

/**
 * Get tasks by board ID
 */
export function getTasksByBoardId(boardId: string): Task[] {
  return mockTasks.filter((task) => task.boardId === boardId);
}

/**
 * Get tasks by project ID
 */
export function getTasksByProjectId(projectId: string): Task[] {
  const boardIds = mockBoards.filter((board) => board.projectId === projectId).map((b) => b.id);
  return mockTasks.filter((task) => boardIds.includes(task.boardId));
}

/**
 * Get board by project ID (returns first board or a default)
 */
export function getBoardByProjectId(projectId: string): Board | undefined {
  return mockBoards.find((board) => board.projectId === projectId) || mockBoards[0];
}

/**
 * Mock labels
 */
export interface Label {
  label_id: string;
  name: string;
  color?: string;
  project_id: string;
}

export const mockLabels: Label[] = [
  { label_id: 'label-1', name: 'Bug', color: '#ef4444', project_id: 'project-1' },
  { label_id: 'label-2', name: 'Feature', color: '#3b82f6', project_id: 'project-1' },
  { label_id: 'label-3', name: 'Documentation', color: '#10b981', project_id: 'project-1' },
  { label_id: 'label-4', name: 'Design', color: '#8b5cf6', project_id: 'project-1' },
  { label_id: 'label-5', name: 'Urgent', color: '#f59e0b', project_id: 'project-1' }
];

/**
 * Mock project members
 */
export interface ProjectMember {
  user_id: string;
  display_name: string;
  email: string;
  role: string;
}

export const mockProjectMembers: Record<string, ProjectMember[]> = {
  'project-1': [
    { user_id: 'user-1', display_name: 'Alice Johnson', email: 'alice@example.com', role: 'manager' },
    { user_id: 'user-2', display_name: 'Bob Smith', email: 'bob@example.com', role: 'member' },
    { user_id: 'user-3', display_name: 'Charlie Brown', email: 'charlie@example.com', role: 'member' }
  ],
  'project-2': [
    { user_id: 'user-1', display_name: 'Alice Johnson', email: 'alice@example.com', role: 'manager' },
    { user_id: 'user-3', display_name: 'Charlie Brown', email: 'charlie@example.com', role: 'member' }
  ],
  'project-3': [
    { user_id: 'user-2', display_name: 'Bob Smith', email: 'bob@example.com', role: 'manager' }
  ]
};